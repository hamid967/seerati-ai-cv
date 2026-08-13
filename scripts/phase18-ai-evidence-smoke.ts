import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { applyApprovedSuggestion, requestEvidenceLockedSuggestion } from "@/modules/ai";
import { createPrivacyRuntime } from "@/modules/privacy";
import { MockAIProvider } from "@/modules/providers";

const data = emptyResumeData();
data.summary = "ملخص مثبت بالأدلة.";
const { graph } = fromResumeData(data, { graphId: "ai-fixture", language: "ar" });
const summaryFact = graph.facts.find((fact) => fact.fieldPath === "summary.text");
assert.ok(summaryFact);
const privacy = createPrivacyRuntime();
const denied = await requestEvidenceLockedSuggestion(new MockAIProvider(), privacy, {
  action: "write_summary",
  graph,
  allowedFactIds: [summaryFact.id],
  requestedLocale: "ar",
  sensitivity: "personal",
  consentAiProcessing: false,
  maximumPayloadCharacters: 4000,
});
assert.equal("error" in denied ? denied.error.code : "unexpected", "policy_rejected");
const allowed = await requestEvidenceLockedSuggestion(new MockAIProvider(), privacy, {
  action: "write_summary",
  graph,
  allowedFactIds: [summaryFact.id],
  requestedLocale: "ar",
  sensitivity: "personal",
  consentAiProcessing: true,
  maximumPayloadCharacters: 4000,
});
assert.equal("diffs" in allowed ? allowed.diffs[0]?.requiresApproval : false, true);
if (!("suggestions" in allowed)) throw new Error("Expected synthetic AI suggestion");
const unchanged = applyApprovedSuggestion(graph, allowed.suggestions[0], false);
assert.equal(unchanged.facts.find((fact) => fact.id === summaryFact.id)?.value, summaryFact.value);
const applied = applyApprovedSuggestion(graph, allowed.suggestions[0], true);
const updated = applied.facts.find((fact) => fact.id === summaryFact.id);
assert.ok(updated);
assert.notEqual(updated.value, summaryFact.value);
assert.equal(updated.originalValue, summaryFact.value);
assert.equal(updated.acceptedValue, updated.value);
assert.equal(updated.aiModificationHistory[0]?.accepted, true);
console.log("Phase 18 AI evidence smoke OK.");
