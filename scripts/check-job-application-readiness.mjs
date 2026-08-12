import fs from "node:fs";

const engine = fs.readFileSync("src/lib/application-readiness.ts", "utf8");
const panel = fs.readFileSync("src/components/application-readiness-panel.tsx", "utf8");
const workspace = fs.readFileSync("src/routes/jobs.$id.tsx", "utf8");

const requiredEngine = [
  "buildApplicationReadiness",
  '"matched"',
  '"partial"',
  '"missing"',
  '"unverified"',
  "parseJobDescription",
  "FactGraph",
  "defaultTemplates",
  "bestResumeId",
  "not a hiring probability",
];
for (const marker of requiredEngine) {
  if (!engine.includes(marker)) throw new Error(`Stage 6B engine guard missing: ${marker}`);
}

if (!panel.includes("ApplicationReadinessPanel")) {
  throw new Error("Stage 6B application readiness panel is missing");
}
if (!workspace.includes("<ApplicationReadinessPanel")) {
  throw new Error("Stage 6B panel is not wired into the job workspace");
}
if (!workspace.includes("resumes={resumes}") || !workspace.includes("graph={graph}")) {
  throw new Error("Stage 6B must compare saved resumes with the evidence graph");
}

const forbiddenMutations = ["updateResume(", "createResume(", "deleteResume(", "saveCareerTwin("];
for (const marker of forbiddenMutations) {
  if (engine.includes(marker) || panel.includes(marker)) {
    throw new Error(`Stage 6B readiness must remain read-only: found ${marker}`);
  }
}

const forbiddenClaims = ["chance of getting hired", "hiring probability:", "guaranteed interview"];
const combined = `${engine}\n${panel}`.toLowerCase();
for (const claim of forbiddenClaims) {
  if (combined.includes(claim))
    throw new Error(`Unsupported application-readiness claim: ${claim}`);
}

console.log("Stage 6B Job Match & Application Readiness guard passed");
