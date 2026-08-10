#!/usr/bin/env node
/**
 * RTL hygiene check for Seerati app UI.
 *
 * Arabic is the primary language, so app chrome must use logical properties
 * (ms-/me-/ps-/pe-/start-/end-/text-start/text-end) instead of physical ones
 * (ml-/mr-/pl-/pr-/left-/right-/text-left/text-right). Physical utilities are
 * only acceptable when they are intentionally mirrored in code (a `rtl ? ... :`
 * expression) or listed in scripts/rtl-allowlist.json with a reason.
 *
 * Scope: src/routes and src/components, excluding src/components/ui (vendored
 * shadcn primitives) and the print/PDF resume renderer paths that mirror
 * explicitly.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/routes", "src/components", "src/lib"];
const SKIP_DIRS = new Set(["ui", "node_modules"]);

const allowlist = existsSync("scripts/rtl-allowlist.json")
  ? JSON.parse(readFileSync("scripts/rtl-allowlist.json", "utf8"))
  : { entries: [] };
const allowed = new Map(allowlist.entries.map((e) => [e.file, e]));

const PATTERNS = [
  { re: /\bm[lr]-[a-z0-9.[\]/-]+/g, fix: "ms-/me-" },
  { re: /\bp[lr]-[a-z0-9.[\]/-]+/g, fix: "ps-/pe-" },
  { re: /\btext-(left|right)\b/g, fix: "text-start/text-end" },
  { re: /(?<![\w-])(left|right)-[0-9.[\]/-]+/g, fix: "start-/end-" },
  { re: /\bborder-[lr]\b/g, fix: "border-s/border-e" },
  { re: /\brounded-[lr]-[a-z0-9]+/g, fix: "rounded-s-/rounded-e-" },
];

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p);
    } else if (/\.(tsx|ts)$/.test(name)) files.push(p);
  }
};
for (const r of ROOTS) if (existsSync(r)) walk(r);

let violations = 0;
let allowedHits = 0;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const entry = allowed.get(file);

  lines.forEach((line, i) => {
    // Mirrored on purpose: `rtl ? "text-left" : "text-right"` and friends.
    const mirrored = /rtl\s*\?|isRtl\s*\?|dir\s*===/.test(line);
    for (const { re, fix } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        // Tailwind logical/variant-prefixed forms are fine.
        const before = line.slice(Math.max(0, m.index - 6), m.index);
        if (/(rtl:|ltr:)$/.test(before)) continue;
        if (mirrored || entry) {
          allowedHits++;
          continue;
        }
        violations++;
        console.log(`FAIL  ${file}:${i + 1}  "${m[0]}" → use ${fix}`);
      }
    }
  });
}

console.log(`\nScanned ${files.length} file(s).`);
if (allowedHits)
  console.log(`${allowedHits} occurrence(s) allowed (explicitly mirrored or allowlisted).`);
for (const e of allowlist.entries) console.log(`ALLOW ${e.file} — ${e.reason}`);
console.log(
  violations
    ? `\n${violations} RTL violation(s).`
    : "\nRTL check OK: no unmirrored physical direction utilities.",
);
process.exit(violations ? 1 : 0);
