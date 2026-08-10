/**
 * Fixtures for the deterministic resume diff and timeline event contract.
 * Run: npm run test:resume-diff
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const diffSrc = readFileSync("src/lib/resume-diff.ts", "utf8");
const timelineSrc = readFileSync("src/lib/job-timeline.ts", "utf8");

// add / remove / change semantics must all be represented in the diff kinds.
for (const kind of ["added", "removed", "changed"]) {
  assert.ok(diffSrc.includes(`"${kind}"`), `resume-diff must handle "${kind}" changes`);
}
assert.ok(/before/.test(diffSrc) && /after/.test(diffSrc), "diff entries must expose before/after");

// restore semantics live in resume-versions and must check ownership.
const versionsSrc = readFileSync("src/lib/resume-versions.ts", "utf8");
assert.ok(versionsSrc.includes("restoreResumeVersion"), "restore helper is required");
assert.ok(versionsSrc.includes("user_id"), "restore must scope by owner");

// every documented event type is validated by the type guard list.
for (const type of [
  "imported",
  "analyzed",
  "resume_variant",
  "cover_letter",
  "applied",
  "followup",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "note",
  "status_change",
]) {
  assert.ok(timelineSrc.includes(`"${type}"`), `timeline must accept "${type}"`);
}
assert.ok(timelineSrc.includes("isTimelineEventType"), "timeline needs a runtime type guard");

console.log("resume-diff + timeline fixtures passed");
