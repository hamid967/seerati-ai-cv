import fs from "node:fs";

const path = "src/routes/jobs.$id.tsx";
let source = fs.readFileSync(path, "utf8");

const importMarker = 'import { InterviewEvidenceAnswer } from "@/components/interview-evidence-answer";';
const importReplacement = `${importMarker}\nimport { ApplicationReadinessPanel } from "@/components/application-readiness-panel";`;
if (!source.includes(importMarker)) throw new Error("Stage 6B import marker not found");
if (!source.includes("ApplicationReadinessPanel")) {
  source = source.replace(importMarker, importReplacement);
}

const cardMarker = `            <Card>\n              <CardHeader>\n                <CardTitle className="text-base">{ar ? "حزمة طلبك" : "Application pack"}</CardTitle>`;
const cardReplacement = `            <ApplicationReadinessPanel\n              jobTitle={form.jobTitle}\n              jobDescription={form.jobDescription}\n              resumes={resumes}\n              graph={graph}\n              lang={lang}\n            />\n\n${cardMarker}`;
if (!source.includes(cardMarker)) throw new Error("Stage 6B application-pack marker not found");
if (!source.includes("jobDescription={form.jobDescription}")) {
  source = source.replace(cardMarker, cardReplacement);
}

fs.writeFileSync(path, source);
