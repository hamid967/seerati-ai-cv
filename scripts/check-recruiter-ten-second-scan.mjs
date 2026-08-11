import fs from "node:fs";

const engine = fs.readFileSync("src/lib/recruiter-ten-second-scan.ts", "utf8");
const route = fs.readFileSync("src/routes/resumes.$id.recruiter-scan.tsx", "utf8");
const panel = fs.readFileSync("src/components/recruiter-ten-second-panel.tsx", "utf8");

const requiredEngine = [
  "buildRecruiterTenSecondScan",
  'window: "0–2s"',
  'window: "2–5s"',
  'window: "5–10s"',
  "attentionMap",
  "strongestSignals",
  "blindSpots",
  "actions",
  "not real eye tracking",
  "not a hiring prediction",
];

for (const marker of requiredEngine) {
  if (!engine.includes(marker)) throw new Error(`Stage 5I engine guard missing: ${marker}`);
}

if (!route.includes('createFileRoute("/resumes/$id/recruiter-scan")')) {
  throw new Error("Stage 5I recruiter scan route is missing");
}
if (!route.includes("loadFactGraph")) throw new Error("Stage 5I must load the user evidence graph");
if (!panel.includes("RecruiterTenSecondPanel")) throw new Error("Stage 5I panel is missing");

const forbiddenMutations = ["updateResume(", "deleteResume(", "createResume("];
for (const marker of forbiddenMutations) {
  if (engine.includes(marker) || route.includes(marker) || panel.includes(marker)) {
    throw new Error(`Stage 5I must remain read-only: found ${marker}`);
  }
}

console.log("Stage 5I recruiter 10-second scan guard passed");
