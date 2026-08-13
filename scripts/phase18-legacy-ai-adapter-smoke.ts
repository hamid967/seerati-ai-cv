import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { createPrivacyRuntime } from "@/modules/privacy";
import { runLegacyEvidenceLockedAI } from "@/modules/ai";

const data = emptyResumeData();
data.summary = "ملخص اصطناعي مثبت.";
const { graph } = fromResumeData(data, { graphId: "legacy-ai-fixture", language: "ar" });
const fact = graph.facts.find((item) => item.fieldPath === "summary.text");
assert.ok(fact);
const privacy = createPrivacyRuntime();
const result = await runLegacyEvidenceLockedAI(privacy, {
  action: "write_summary",
  graph,
  allowedFactIds: [fact.id],
  requestedLocale: "ar",
  sensitivity: "personal",
  consentAiProcessing: true,
  maximumPayloadCharacters: 5000,
});
assert.equal("suggestions" in result, true);
if (!("suggestions" in result)) throw new Error("Expected local adapter suggestion");
assert.equal(result.suggestions[0]?.requiresApproval, true);
assert.deepEqual(result.suggestions[0]?.evidenceFactIds, [fact.id]);
console.log("Phase 18 legacy AI adapter smoke OK.");
