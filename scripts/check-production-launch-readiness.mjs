#!/usr/bin/env node

import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const landing = read("src/routes/index.tsx");
const dashboard = read("src/routes/dashboard.tsx");
const preview = read("src/routes/resumes.$id.preview.tsx");
const robots = read("public/robots.txt");
const sitemap = read("src/routes/sitemap[.]xml.ts");
const migration = read("supabase/migrations/20260811034000_stage6f_private_career_content.sql");
const privacy = read("src/routes/privacy.tsx");
const terms = read("src/routes/terms.tsx");
const routeQa = read("scripts/qa-routes.mjs");

const failures = [];

function requireCheck(condition, label) {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures.push(label);
    console.error(`FAIL  ${label}`);
  }
}

requireCheck(
  !landing.includes("خمسة من القوالب الستة") && !landing.includes("Five of the six templates"),
  "landing has no stale six-template claim",
);
requireCheck(
  landing.includes("defaultTemplates.filter") &&
    landing.includes("atsFriendly") &&
    landing.includes("templateCount"),
  "landing derives template counts from template metadata",
);

const forbiddenDemoMarkers = [
  "seed: true",
  "Try with demo data",
  "جرّب ببيانات تجريبية",
  "Demo resume added",
  "أضفنا سيرة تجريبية",
];
requireCheck(
  forbiddenDemoMarkers.every((marker) => !dashboard.includes(marker)),
  "authenticated dashboard cannot seed demo resume data",
);

requireCheck(
  preview.includes("PDF نصي للتقديم وATS") && preview.includes("Text PDF for applications"),
  "preview identifies the text PDF as the application-oriented option",
);
requireCheck(
  preview.includes("PDF بصري (صورة)") && preview.includes("Visual image PDF"),
  "preview identifies the high-resolution export as image-based",
);
requireCheck(
  preview.includes("قد لا يُقرأ جيداً في أنظمة الفرز") &&
    preview.includes("may not parse reliably in screening systems"),
  "preview explains the ATS limitation of the image PDF",
);

const privatePrefixes = [
  "/auth",
  "/dashboard",
  "/admin",
  "/account",
  "/onboarding",
  "/resumes",
  "/career-twin",
  "/career-evidence",
  "/career-passport",
  "/arabic-intelligence",
  "/privacy-center",
  "/import",
  "/jobs",
];
requireCheck(
  privatePrefixes.every((path) => robots.includes(`Disallow: ${path}`)),
  "robots.txt blocks authenticated and private route prefixes",
);

const privateSitemapPaths = [
  "/auth",
  "/dashboard",
  "/admin",
  "/account",
  "/onboarding",
  "/resumes",
  "/career-twin",
  "/career-evidence",
  "/career-passport",
  "/arabic-intelligence",
  "/privacy-center",
  "/import",
  "/jobs",
];
requireCheck(
  sitemap.includes('{ path: "/career-guides"') &&
    privateSitemapPaths.every((path) => !sitemap.includes(`{ path: "${path}"`)),
  "sitemap includes public guide hub and excludes private surfaces",
);

for (const marker of [
  'create policy "owner reads career facts"',
  'create policy "owner reads career evidence"',
  'create policy "owner reads agent activity"',
  'create policy "owner reads resume versions"',
  "admin_career_privacy_metrics",
]) {
  requireCheck(migration.includes(marker), `Stage 6F migration retains: ${marker}`);
}

requireCheck(
  privacy.includes("ليست صياغة قانونية نهائية") && privacy.includes("not final legal drafting"),
  "privacy page keeps explicit legal-review warning",
);
requireCheck(
  terms.includes("ليست صياغة قانونية نهائية") && terms.includes("not final legal drafting"),
  "terms page keeps explicit legal-review warning",
);

for (const route of [
  "/career-passport",
  "/arabic-intelligence",
  "/career-guides",
  "/privacy-center",
  "/features",
]) {
  requireCheck(routeQa.includes(`"${route}"`), `runtime route QA includes ${route}`);
}

if (failures.length) {
  console.error(`\nStage 7 production readiness guard failed (${failures.length} check(s)).`);
  process.exit(1);
}

console.log("\nStage 7 production readiness static guard passed.");
console.log(
  "NOTE: This does not prove production migrations, runtime QA, legal review, WCAG conformance, or launch approval.",
);
