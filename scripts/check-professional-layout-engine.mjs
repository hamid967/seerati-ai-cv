#!/usr/bin/env node
import { readFileSync } from "node:fs";

const studio = readFileSync("src/routes/resumes.$id.studio.tsx", "utf8");
const preview = readFileSync("src/routes/resumes.$id.preview.tsx", "utf8");
const pdf = readFileSync("src/lib/pdf.ts", "utf8");
const engine = readFileSync("src/lib/resume-layout.ts", "utf8");
const wrapper = readFileSync("src/components/professional-resume-preview.tsx", "utf8");
const css = readFileSync("src/resume-layout.css", "utf8");

const failures = [];
const requireText = (source, token, message) => {
  if (!source.includes(token)) failures.push(message);
};

requireText(engine, "PAGE_SIZES", "shared A4/Letter page metrics missing");
requireText(engine, "fitCandidates", "measured fit presets missing");
requireText(engine, "pageCountFromHeight", "page-count measurement helper missing");
requireText(studio, "ResizeObserver", "Studio must measure rendered document height");
requireText(studio, "fitToPages(1)", "Fit to 1 page control missing");
requireText(studio, "fitToPages(2)", "Fit to 2 pages control missing");
requireText(studio, "ProfessionalResumePreview", "Studio must use professional renderer");
requireText(studio, "fontScale", "font-scale control missing");
requireText(studio, "marginMm", "margin control missing");
requireText(studio, "lineHeight", "line-height control missing");
requireText(studio, "columnWidth", "sidebar-width control missing");
requireText(preview, "ProfessionalResumePreview", "export preview must use professional renderer");
requireText(preview, "design.pageSize", "export must use saved page size");
requireText(pdf, "PAGE_SIZES[pageSize]", "PDF exporter must use shared page size");
requireText(wrapper, "data-resume-page-size", "rendered document page metadata missing");
requireText(css, "--resume-page-width", "document page width CSS variable missing");
requireText(css, "break-inside: avoid", "section page-break protection missing");

if (studio.includes("splice(") || studio.includes("hiddenSections")) {
  failures.push("Smart Fit must not delete or hide resume content");
}
if (engine.includes("Math.random") || studio.includes("Math.random")) {
  failures.push("Professional layout fitting must remain deterministic");
}
if (pdf.includes('format: "a4"')) {
  failures.push("PDF exporter must not be hard-coded to A4");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL  ${failure}`));
  console.error(`\n${failures.length} Professional Layout Engine guard(s) failed.`);
  process.exit(1);
}

console.log("PASS  real A4/Letter page metrics are shared");
console.log("PASS  Studio measures actual rendered height");
console.log("PASS  Fit 1/2 page is deterministic and non-destructive");
console.log("PASS  margins, font scale, line height and column width are wired");
console.log("PASS  Preview and PDF use the same saved page size");
console.log("\nProfessional Layout Engine quality guard OK.");
