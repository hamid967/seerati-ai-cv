import fs from "node:fs";

const engine = fs.readFileSync("src/lib/saudi-career-readiness.ts", "utf8");
const panel = fs.readFileSync("src/components/saudi-career-readiness-panel.tsx", "utf8");
const autoDesign = fs.readFileSync("src/components/resume-auto-design-panel.tsx", "utf8");
const team = fs.readFileSync("docs/SAUDI_MARKET_LEADERSHIP_100_TEAM.md", "utf8");

const engineMarkers = [
  "buildSaudiCareerReadiness",
  "SAUDI_CITIES",
  "SAUDI_PHONE_RE",
  "NATIONAL_ID_RE",
  "privacy-minimization",
  "ats-template",
  "bilingual-capability",
  "quantified-impact",
  "ليس اعتمادًا حكوميًا",
  "not government certification",
];

for (const marker of engineMarkers) {
  if (!engine.includes(marker)) throw new Error(`Saudi readiness engine guard missing: ${marker}`);
}

if (!panel.includes("SaudiCareerReadinessPanel")) {
  throw new Error("Saudi Career Readiness panel is missing");
}
if (!autoDesign.includes("<SaudiCareerReadinessPanel")) {
  throw new Error("Saudi Career Readiness is not surfaced inside Resume Studio");
}
if (!team.includes("Total: 100 people")) {
  throw new Error("100-person Saudi Market Leadership operating model is missing");
}

const forbiddenClaims = [
  "government certified resume",
  "officially compatible with Jadarat",
  "guaranteed hiring",
  "guaranteed job",
  "100% job acceptance",
];
const combined = `${engine}\n${panel}`.toLowerCase();
for (const claim of forbiddenClaims) {
  if (combined.includes(claim.toLowerCase())) {
    throw new Error(`Unsupported Saudi market claim detected: ${claim}`);
  }
}

console.log("Saudi Market Leadership Stage 6A guard passed");
