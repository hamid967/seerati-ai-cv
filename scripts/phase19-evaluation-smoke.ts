import assert from "node:assert/strict";
import { buildSyntheticIntentCases, evaluateIntentRouter } from "@/modules/intelligence";

const cases = buildSyntheticIntentCases(500);
assert.equal(cases.length, 500);
const report = evaluateIntentRouter(cases);
console.log(
  JSON.stringify(
    { firstFailures: report.failures.slice(0, 12), intentAccuracy: report.intentAccuracy },
    null,
    2,
  ),
);
assert.ok(report.intentAccuracy >= 0.95, `intent accuracy ${report.intentAccuracy} below target`);
assert.equal(report.failures.length, 0);
console.log(
  JSON.stringify(
    {
      total: report.total,
      correct: report.correct,
      intentAccuracy: report.intentAccuracy,
      clarificationCases: report.clarificationCases,
    },
    null,
    2,
  ),
);
