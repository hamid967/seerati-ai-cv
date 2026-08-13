import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData, toResumeData } from "@/modules/career";
import { CareerProfileGraphSchema } from "@/modules/career";
import { PrivacyPolicyError, createPrivacyRuntime } from "@/modules/privacy";
import {
  MockAIProvider,
  MockErrorProvider,
  MockPDFProvider,
  MockParserProvider,
  MockStorageProvider,
} from "@/modules/providers";

const resume = emptyResumeData();
resume.personal.fullName = "ريم عبدالله";
resume.personal.email = "reem@example.test";
resume.personal.jobTitle = "مديرة منتجات رقمية";
resume.summary = "قادت منتجات رقمية متعددة التخصصات.";
resume.targetJob = "مديرة منتجات";
resume.experience = [
  {
    id: "exp-1",
    role: "مديرة منتجات",
    company: "شركة اختبار",
    bullets: ["حسّنت تجربة المستخدم بعد مراجعة الأدلة."],
  },
];
resume.skills = [{ id: "skill-1", name: "Product strategy" }];

const converted = fromResumeData(resume, { graphId: "fixture-graph", language: "ar" });
assert.equal(converted.graph.version, 1);
assert.equal(converted.graph.direction, "rtl");
assert.equal(converted.graph.consent.aiProcessing, false);
assert.ok(converted.graph.facts.some((fact) => fact.fieldPath === "identity.fullName"));
assert.ok(converted.graph.facts.every((fact) => fact.provenance.source === "user_manual"));
const roundTrip = toResumeData(converted.graph);
assert.equal(roundTrip.personal.fullName, resume.personal.fullName);
assert.equal(roundTrip.personal.email, resume.personal.email);
assert.equal(roundTrip.summary, resume.summary);
assert.equal(roundTrip.targetJob, resume.targetJob);
assert.equal(roundTrip.skills[0]?.name, resume.skills[0]?.name);
assert.equal(roundTrip.experience.length, 1);
assert.equal(roundTrip.experience[0]?.role, resume.experience[0]?.role);
assert.equal(roundTrip.experience[0]?.company, resume.experience[0]?.company);
assert.equal(roundTrip.experience[0]?.bullets[0], resume.experience[0]?.bullets[0]);
assert.ok(converted.loss.some((item) => item.reason === "empty"));

assert.throws(() => CareerProfileGraphSchema.parse({ id: "bad" }));

const privacy = createPrivacyRuntime();
assert.equal(privacy.getStorageMode(), "memory");

const context = {
  requestId: "synthetic-request",
  locale: "ar" as const,
  timeoutMs: 1000,
  sensitivity: "personal" as const,
};
const ai = new MockAIProvider();
const aiDenied = await ai.suggest({
  ...context,
  action: "write_summary",
  graph: converted.graph,
  allowedFactIds: ["summary.text"],
  consentAiProcessing: false,
  outputSchemaVersion: 1,
});
assert.equal("error" in aiDenied ? aiDenied.error.code : "unexpected", "consent_required");
const aiAccepted = await ai.suggest({
  ...context,
  action: "write_summary",
  graph: converted.graph,
  allowedFactIds: ["summary.text"],
  consentAiProcessing: true,
  outputSchemaVersion: 1,
});
assert.equal(
  "suggestions" in aiAccepted ? aiAccepted.suggestions[0]?.requiresApproval : false,
  true,
);
const parser = new MockParserProvider();
const parsed = await parser.parse({
  ...context,
  filenameLabel: "file.pdf",
  mimeType: "application/pdf",
  text: "synthetic resume text",
});
assert.equal("candidates" in parsed ? parsed.candidates[0]?.source : "unexpected", "imported_pdf");
const pdf = new MockPDFProvider();
const exported = await pdf.export({
  ...context,
  graph: converted.graph,
  templateId: "classic-ats",
  direction: "rtl",
  format: "ats",
});
assert.equal("bytes" in exported ? exported.mimeType : "unexpected", "application/pdf");
const storage = new MockStorageProvider();
assert.equal((await storage.save(converted.graph, context)).id, converted.graph.id);
assert.equal("facts" in (await storage.load(converted.graph.id, context)) ? true : false, true);
assert.equal((await storage.delete(converted.graph.id, context)).deleted, true);
const errors = new MockErrorProvider();
errors.report(
  { code: "timeout", retryable: true, provider: "mock-ai", safeMessage: "Timed out" },
  { requestId: context.requestId },
);
assert.equal(errors.errors.length, 1);
assert.equal(
  privacy.previewTransmission({
    action: "write_summary",
    allowedFactIds: ["summary.text"],
    requestedLocale: "ar",
    sensitivity: "personal",
    consentAiProcessing: false,
    maximumPayloadCharacters: 4000,
  }).reason,
  "consent-required",
);
assert.throws(
  () =>
    privacy.assertTransmissionAllowed({
      action: "write_summary",
      allowedFactIds: ["summary.text"],
      requestedLocale: "ar",
      sensitivity: "personal",
      consentAiProcessing: false,
      maximumPayloadCharacters: 4000,
    }),
  PrivacyPolicyError,
);
privacy.setSessionRecoveryConsent(true);
assert.equal(privacy.getStorageMode(), "consented-recovery");
const controller = new AbortController();
privacy.registerRequest(controller);
const deletion = await privacy.clearSession();
assert.equal(deletion.clearedMemory, true);
assert.equal(deletion.clearedRecovery, true);
assert.equal(deletion.cancelledRequests, 1);
assert.equal(controller.signal.aborted, true);
assert.equal(privacy.getStorageMode(), "memory");

console.log("Phase 18 foundation smoke OK.");
