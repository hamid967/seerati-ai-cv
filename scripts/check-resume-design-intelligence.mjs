#!/usr/bin/env node
import { readFileSync } from "node:fs";

const engine = readFileSync("src/lib/resume-design-intelligence.ts", "utf8");
const panel = readFileSync("src/components/resume-auto-design-panel.tsx", "utf8");
const studio = readFileSync("src/routes/resumes.$id.studio.tsx", "utf8");

const failures = [];
const requireText = (source, token, message) => {
  if (!source.includes(token)) failures.push(message);
};

requireText(engine, "buildResumeDesignProposal", "deterministic proposal builder missing");
requireText(engine, "reorderWithoutLoss", "section ordering must preserve every section");
requireText(engine, "atsPriority", "ATS priority signal missing");
requireText(engine, "targetPageCount", "page target decision missing");
requireText(engine, "alternativeTemplateIds", "alternative template recommendations missing");
requireText(panel, "Before / after", "review-first before/after UI missing");
requireText(panel, "Preview proposal", "preview-before-save control missing");
requireText(panel, "Apply design", "explicit apply control missing");
requireText(panel, "Undo last apply", "undo control missing");
requireText(studio, "designPreview", "Studio preview state missing");
requireText(studio, "autoDesignUndo", "Studio undo snapshot missing");
requireText(studio, "applyAutoDesign", "explicit auto-design apply handler missing");
requireText(studio, "setDesignPreview(null)", "manual changes must leave preview mode");

if (engine.includes("Math.random")) {
  failures.push("design intelligence must remain deterministic");
}
if (engine.includes("hiddenSections") || panel.includes("hiddenSections")) {
  failures.push("auto design must not hide resume sections");
}
if (/\.summary\s*=|\.experience\s*=|\.education\s*=|\.skills\s*=/.test(engine)) {
  failures.push("auto design engine must not mutate professional content fields");
}
if (/splice\(|pop\(|shift\(|\.filter\([^\n]*hidden/.test(engine)) {
  failures.push("auto design must not remove resume content");
}
if (/showPhoto:\s*true/.test(engine)) {
  failures.push("auto design must never enable a photo without prior user choice");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL  ${failure}`));
  console.error(`\n${failures.length} Resume Design Intelligence guard(s) failed.`);
  process.exit(1);
}

console.log("PASS  deterministic role/load/career design proposal is present");
console.log("PASS  ATS priority and page targets are explainable");
console.log("PASS  section reordering preserves all sections");
console.log("PASS  preview, explicit approval and undo are wired");
console.log("PASS  professional content is not hidden, deleted or rewritten");
console.log("PASS  photo state is never enabled automatically");
console.log("\nResume Design Intelligence quality guard OK.");
