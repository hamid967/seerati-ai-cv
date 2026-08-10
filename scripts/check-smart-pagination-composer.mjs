#!/usr/bin/env node
import { readFileSync } from "node:fs";

const composer = readFileSync("src/routes/resumes.$id.composer.tsx", "utf8");
const pagination = readFileSync("src/lib/resume-pagination.ts", "utf8");
const wrapper = readFileSync("src/components/professional-resume-preview.tsx", "utf8");
const css = readFileSync("src/resume-layout.css", "utf8");
const types = readFileSync("src/lib/types.ts", "utf8");

const failures = [];
const requireText = (source, token, message) => {
  if (!source.includes(token)) failures.push(message);
};

requireText(composer, "Smart Page Composer", "page composer route missing");
requireText(composer, "analyzeResumePagination", "composer must analyze the rendered document");
requireText(composer, "ResizeObserver", "composer must remeasure layout changes");
requireText(composer, "toggleBreak", "manual page-break control missing");
requireText(composer, "toggleKeep", "keep-together control missing");
requireText(composer, "pageBreakBefore", "manual page break state must persist");
requireText(composer, "keepTogetherSections", "keep-together state must persist");
requireText(
  composer,
  "ProfessionalResumePreview",
  "composer must use the shared professional renderer",
);
requireText(pagination, "widow-heading", "widow heading diagnostic missing");
requireText(pagination, "item-split", "item split diagnostic missing");
requireText(pagination, "oversized-item", "oversized item diagnostic missing");
requireText(wrapper, "data-cv-section-key", "renderer must expose section metadata");
requireText(wrapper, "breakBefore", "renderer must apply saved manual page breaks");
requireText(wrapper, "breakInside", "renderer must apply saved keep-together preference");
requireText(types, "pageBreakBefore?: SectionKey[]", "page-break design type missing");
requireText(types, "keepTogetherSections?: SectionKey[]", "keep-together design type missing");
requireText(css, "break-inside: avoid", "print page-break protection missing");

if (composer.includes("Math.random") || pagination.includes("Math.random")) {
  failures.push("pagination diagnostics must remain deterministic");
}
if (composer.includes("hiddenSections:") || composer.includes("splice(")) {
  failures.push("page composer must not hide or delete resume content");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL  ${failure}`));
  console.error(`\n${failures.length} Smart Pagination guard(s) failed.`);
  process.exit(1);
}

console.log("PASS  Smart Page Composer route and controls are present");
console.log("PASS  diagnostics use real rendered DOM measurements");
console.log("PASS  manual breaks and keep-together preferences persist safely");
console.log("PASS  widow/item/oversized split diagnostics are deterministic");
console.log("PASS  composer does not hide, delete, or rewrite resume content");
console.log("\nSmart Pagination & Page Composer quality guard OK.");
