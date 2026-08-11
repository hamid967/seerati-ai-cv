#!/usr/bin/env node

import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const ops = read("docs/PRODUCTION_OPERATIONS.md");
const manifest = read("docs/RELEASE_MANIFEST.md");
const scorecard = read("docs/SAUDI_LAUNCH_SCORECARD.md");
const ci = read(".github/workflows/ci.yml");
const privacy = read("src/routes/privacy.tsx");
const terms = read("src/routes/terms.tsx");

const failures = [];
const check = (condition, label) => {
  if (condition) console.log(`PASS  ${label}`);
  else {
    failures.push(label);
    console.error(`FAIL  ${label}`);
  }
};

for (const marker of [
  "Release ownership",
  "Required release gates",
  "Production migration procedure",
  "Application release procedure",
  "Rollback triggers",
  "Incident severity",
  "User data requests",
  "Support and recovery",
  "Release record template",
]) {
  check(ops.includes(marker), `operations runbook includes ${marker}`);
}

check(
  ops.includes("a skipped runtime job is not approval") &&
    manifest.includes("must execute, not skip") &&
    scorecard.includes("not skipped"),
  "runtime QA cannot be treated as passed when route smoke is skipped",
);

check(
  manifest.includes("NOT AUTHORIZED BY THIS DOCUMENT") &&
    manifest.includes("explicit production authorization"),
  "release manifest does not silently authorize production changes",
);

check(
  manifest.includes("browser text/print PDF") && manifest.includes("rendered image"),
  "release manifest preserves export/ATS trust distinction",
);

check(
  ops.includes("cross-tenant") && ops.includes("RLS") && manifest.includes("user-owned through RLS"),
  "operations process treats tenant isolation as a hard trust boundary",
);

check(
  privacy.includes("ليست صياغة قانونية نهائية") &&
    terms.includes("ليست صياغة قانونية نهائية") &&
    manifest.includes("Saudi-qualified review"),
  "commercial launch remains gated on legal review while legal pages are placeholders",
);

check(ci.includes("check-production-launch-readiness.mjs"), "Stage 7 readiness guard remains in CI");

if (failures.length) {
  console.error(`\nStage 8 release-operations guard failed (${failures.length} check(s)).`);
  process.exit(1);
}

console.log("\nStage 8 release-operations static guard passed.");
console.log("NOTE: Operational documentation is not evidence that production gates were executed.");
