#!/usr/bin/env node
/**
 * Template Quality Engine — static smoke checks.
 *
 * HONEST SCOPE: this project has no headless-browser screenshot infrastructure,
 * so this script does NOT claim pixel-perfect or overflow detection. It verifies
 * only what can be verified statically:
 *
 *  1. every template in the registry is complete and uses design values the
 *     shared renderer actually implements;
 *  2. the renderer handles each layout / header / sectionStyle / bullet variant
 *     used by the registry;
 *  3. every section key referenced by the fixtures is rendered somewhere;
 *  4. the fixtures cover short / normal / long-stress in Arabic and English and
 *     stay structurally valid (required props present, no undefined arrays);
 *  5. RTL metadata is coherent (templates flagged supportsRTL exist and the
 *     renderer receives a direction flag).
 */
import { readFileSync } from "node:fs";
import { fixtures } from "./fixtures/resume-fixtures.mjs";

const registrySrc = readFileSync("src/lib/templates.ts", "utf8");
const rendererSrc = readFileSync("src/components/resume-preview.tsx", "utf8");
const typesSrc = readFileSync("src/lib/types.ts", "utf8");

let failed = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => {
  failed++;
  console.log(`FAIL  ${m}`);
};
const note = (m) => console.log(`NOTE  ${m}`);

/* ------------------------- 1. registry completeness ------------------------ */

// Templates spread `...baseDesign`, so unspecified design keys are inherited.
const baseBlock = registrySrc.match(/baseDesign:\s*TemplateDesign\s*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? "";
const baseGrab = (k) => baseBlock.match(new RegExp(`${k}:\\s*("?)([\\w-]+)\\1`))?.[2] ?? null;
const baseDesign = {
  spacing: baseGrab("spacing"),
  sectionStyle: baseGrab("sectionStyle"),
  layout: baseGrab("layout"),
  header: baseGrab("header"),
  bullet: baseGrab("bullet"),
};

const blocks = registrySrc.split(/\n\s*\{\s*\n\s*id:\s*"/).slice(1);
const templates = blocks.map((b) => {
  const id = b.slice(0, b.indexOf('"'));
  const grab = (k) => b.match(new RegExp(`${k}:\\s*("?)([\\w-]+)\\1`))?.[2] ?? null;
  return {
    id,
    category: grab("category"),
    atsFriendly: grab("atsFriendly") === "true",
    supportsRTL: grab("supportsRTL") === "true",
    active: grab("active") === "true",
    layout: grab("layout") ?? baseDesign.layout,
    header: grab("header") ?? baseDesign.header,
    sectionStyle: grab("sectionStyle") ?? baseDesign.sectionStyle,
    bullet: grab("bullet") ?? baseDesign.bullet,
    spacing: grab("spacing") ?? baseDesign.spacing,
    accent: b.match(/accent:\s*"([^"]+)"/)?.[1] ?? null,
    hasNameAr: /name:\s*\{[^}]*ar:/.test(b),
    hasDescAr: /description:\s*\{[^}]*ar:/.test(b),
  };
});

if (templates.length < 6) fail(`registry has only ${templates.length} templates (expected 6+)`);
else pass(`registry lists ${templates.length} templates`);

const unions = {
  category: typesSrc.match(/TemplateCategory\s*=\s*([^;]+);/)?.[1] ?? "",
  layout: typesSrc.match(/layout:\s*([^;]+);/)?.[1] ?? "",
  header: typesSrc.match(/header:\s*([^;]+);/)?.[1] ?? "",
  sectionStyle: typesSrc.match(/sectionStyle:\s*([^;]+);/)?.[1] ?? "",
  bullet: typesSrc.match(/bullet:\s*([^;]+);/)?.[1] ?? "",
  spacing: typesSrc.match(/spacing:\s*([^;]+);/)?.[1] ?? "",
};

for (const t of templates) {
  const problems = [];
  if (!t.hasNameAr) problems.push("missing Arabic name");
  if (!t.hasDescAr) problems.push("missing Arabic description");
  if (!/^#[0-9a-fA-F]{6}$/.test(t.accent ?? "")) problems.push(`invalid accent ${t.accent}`);
  for (const key of ["category", "layout", "header", "sectionStyle", "bullet", "spacing"]) {
    if (!t[key]) problems.push(`missing ${key}`);
    else if (!unions[key].includes(`"${t[key]}"`)) problems.push(`${key}="${t[key]}" not in type union`);
  }
  if (problems.length) fail(`template ${t.id}: ${problems.join("; ")}`);
  else pass(`template ${t.id} metadata valid (${t.layout}/${t.header}/${t.sectionStyle})`);
}

/* --------------------- 2. renderer covers design variants ------------------ */

// The renderer is config-driven: some variants are the fall-through branch
// rather than an explicit comparison, so those count as covered.
const RENDERER_DEFAULTS = { layout: "single", header: "stack", sectionStyle: "plain", bullet: "disc" };

for (const key of ["layout", "header", "sectionStyle", "bullet", "spacing"]) {
  const used = [...new Set(templates.map((t) => t[key]).filter(Boolean))];
  for (const value of used) {
    if (rendererSrc.includes(`"${value}"`) || new RegExp(`\\b${value}:`).test(rendererSrc))
      pass(`renderer handles ${key}="${value}"`);
    else if (RENDERER_DEFAULTS[key] === value) pass(`renderer handles ${key}="${value}" (default branch)`);
    else fail(`renderer never references ${key}="${value}"`);
  }
}

/* ------------------------ 3. section coverage in DOM ----------------------- */

const sectionKeys = [
  ...new Set(fixtures.flatMap((f) => f.data.sectionOrder)),
];
for (const key of sectionKeys) {
  if (rendererSrc.includes(`"${key}"`) || new RegExp(`\\b${key}:`).test(rendererSrc))
    pass(`renderer renders section "${key}"`);
  else fail(`renderer has no branch for section "${key}"`);
}

/* --------------------------- 4. fixture integrity -------------------------- */

const REQUIRED_ARRAYS = [
  "experience",
  "education",
  "skills",
  "languages",
  "certificates",
  "projects",
  "achievements",
  "volunteering",
  "links",
  "references",
  "custom",
  "sectionOrder",
];

const combos = new Set(fixtures.map((f) => `${f.lang}:${f.level}`));
for (const lang of ["ar", "en"]) {
  for (const level of ["short", "normal", "long-stress"]) {
    if (combos.has(`${lang}:${level}`)) pass(`fixture present ${lang}/${level}`);
    else fail(`missing fixture ${lang}/${level}`);
  }
}

for (const f of fixtures) {
  const d = f.data;
  const problems = [];
  if (!d.personal?.fullName) problems.push("personal.fullName empty");
  if (typeof d.summary !== "string") problems.push("summary must be a string");
  for (const k of REQUIRED_ARRAYS) if (!Array.isArray(d[k])) problems.push(`${k} is not an array`);
  for (const e of d.experience) {
    if (!e.id || !e.role || !e.company) problems.push(`experience ${e.id ?? "?"} incomplete`);
    if (!Array.isArray(e.bullets)) problems.push(`experience ${e.id} bullets missing`);
  }
  for (const e of d.education) if (!e.id || !e.degree || !e.school) problems.push(`education ${e.id ?? "?"} incomplete`);
  for (const s of d.skills) if (!s.id || !s.name) problems.push("skill entry incomplete");
  for (const key of d.sectionOrder)
    if (!(key in d) && key !== "custom") problems.push(`sectionOrder references unknown "${key}"`);
  if (problems.length) fail(`fixture ${f.id}: ${problems.join("; ")}`);
  else pass(`fixture ${f.id} structurally valid`);
}

const stress = fixtures.filter((f) => f.level === "long-stress");
for (const f of stress) {
  const bullets = f.data.experience.reduce((n, e) => n + e.bullets.length, 0);
  const longName = f.data.personal.fullName.length >= 28;
  const mixed = /[\u0600-\u06FF]/.test(JSON.stringify(f.data)) && /[A-Za-z]/.test(JSON.stringify(f.data));
  if (bullets >= 30 && longName && mixed && f.data.skills.length >= 20)
    pass(`stress fixture ${f.id}: ${bullets} bullets, ${f.data.skills.length} skills, long name, mixed RTL/LTR`);
  else fail(`stress fixture ${f.id} is not stressful enough (bullets=${bullets}, skills=${f.data.skills.length})`);
}

/* ---------------------------- 5. RTL metadata ------------------------------ */

const rtlTemplates = templates.filter((t) => t.supportsRTL);
if (!rtlTemplates.length) fail("no template declares supportsRTL");
else pass(`${rtlTemplates.length}/${templates.length} templates declare RTL support`);

if (/rtl/.test(rendererSrc)) pass("renderer receives a direction flag (rtl)");
else fail("renderer has no direction handling");

if (/dir=|direction/.test(rendererSrc)) pass("renderer sets an explicit dir/direction on the page");
else fail("renderer never sets dir/direction");

const atsCount = templates.filter((t) => t.atsFriendly).length;
note(`${atsCount} template(s) declare an ATS-friendly configuration (single column, no decorative-only text).`);
note("Pixel/overflow rendering is NOT checked here: no headless screenshot infrastructure in this project.");

console.log(failed ? `\n${failed} template check(s) failed.` : "\nTemplate smoke checks OK.");
process.exit(failed ? 1 : 0);
