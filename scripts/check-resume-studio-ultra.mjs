#!/usr/bin/env node
import { readFileSync } from "node:fs";

const route = readFileSync("src/routes/resumes.$id.studio.tsx", "utf8");
const advisor = readFileSync("src/lib/resume-studio.ts", "utf8");
const preview = readFileSync("src/routes/resumes.$id.preview.tsx", "utf8");
const layoutEngine = readFileSync("src/lib/resume-layout.ts", "utf8");

const failures = [];
const requireText = (source, token, message) => {
  if (!source.includes(token)) failures.push(message);
};

if (!route.includes("Resume Studio Ultra") && !route.includes("Professional Layout Engine")) {
  failures.push("studio route title missing");
}
requireText(route, "Smart Fit", "Smart Fit control missing");
requireText(route, "pageSize", "A4/US Letter preview target missing");
requireText(route, "setZoom", "zoom controls missing");
requireText(route, "setFullscreen", "focus/fullscreen control missing");

const hasLegacyDensityFit = route.includes("applyDensity");
const hasMeasuredLayoutFit = route.includes("fitToPages") && layoutEngine.includes("fitCandidates");
if (!hasLegacyDensityFit && !hasMeasuredLayoutFit) {
  failures.push("Smart Fit must remain deterministic and non-destructive");
}

requireText(advisor, "contentUnits", "deterministic content-load analysis missing");
requireText(advisor, "recommendedTemplateIds", "template recommendations missing");
requireText(
  advisor,
  "without deleting information",
  "advisor must state non-destructive behavior in English",
);
requireText(advisor, "بدون حذف أي معلومة", "advisor must state non-destructive behavior in Arabic");
requireText(preview, 'to="/resumes/$id/studio"', "export preview must link to the Studio route");

if (route.includes("Math.random")) failures.push("Studio route must not use random design metrics");
if (advisor.includes("Math.random")) failures.push("Design advisor must remain deterministic");
if (layoutEngine.includes("Math.random")) failures.push("Layout fitting must remain deterministic");
if (route.includes("splice(") || route.includes("hiddenSections")) {
  failures.push("Smart Fit must not delete or hide resume content");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL  ${failure}`));
  console.error(`\n${failures.length} Resume Studio guard(s) failed.`);
  process.exit(1);
}

console.log("PASS  Resume Studio route is wired");
console.log("PASS  Smart Fit is deterministic and non-destructive");
console.log("PASS  zoom, page target, focus mode and template advisor are present");
console.log("PASS  export preview links to the design studio");
console.log("PASS  Stage 5E invariants remain valid after layout-engine evolution");
console.log("\nResume Studio Ultra quality guard OK.");
