import { emptyResumeData } from "../src/lib/types";
import {
  buildNouraEvidencePlan,
  requestNouraEvidenceSuggestion,
} from "../src/modules/ai/noura-evidence";
import { requestEvidenceLockedSuggestion as requestEvidenceLocked } from "../src/modules/ai/evidence";
import { createPrivacyRuntime } from "../src/modules/privacy";
import type { AIProvider } from "../src/modules/providers";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const data = {
  ...emptyResumeData(),
  personal: {
    ...emptyResumeData().personal,
    fullName: "TEST_PERSON_001",
    jobTitle: "Product Analyst",
    email: "test.person@example.test",
    phone: "+966500000000",
    city: "Test City",
  },
  targetJob: "Product Analyst",
  summary: "Improved a documented onboarding workflow.",
  experience: [
    {
      id: "exp-1",
      role: "Product Analyst",
      company: "Evidence Co",
      start: "2024",
      end: "2025",
      bullets: ["Improved onboarding completion from 70 to 80."],
    },
  ],
};

const noConsentPlan = buildNouraEvidencePlan({
  data,
  locale: "en",
  consentAiProcessing: false,
});
assert(!noConsentPlan.preview.allowed, "remote request must be blocked without explicit consent");
assert(noConsentPlan.preview.reason === "consent-required", "consent reason must be explicit");
assert(
  !noConsentPlan.includedFieldPaths.some((field) => field.startsWith("contact.")),
  "contact fields must not enter the evidence projection",
);
assert(
  !noConsentPlan.includedFieldPaths.includes("identity.fullName"),
  "full name must not enter the evidence projection",
);
assert(
  noConsentPlan.excludedFieldPaths.includes("contact.email"),
  "email must be visible as excluded metadata",
);

let providerCalled = false;
const noCallProvider: AIProvider = {
  id: "test-no-call",
  async suggest() {
    providerCalled = true;
    throw new Error("provider must not be called without consent");
  },
};
const noCall = await requestEvidenceLocked(
  noCallProvider,
  createPrivacyRuntime(),
  noConsentPlan.request,
);
assert("error" in noCall, "policy rejection must return a safe error");
assert(!providerCalled, "consent rejection must prevent a network/provider call");

const consentedPlan = buildNouraEvidencePlan({
  data,
  locale: "en",
  consentAiProcessing: true,
});
assert(consentedPlan.preview.allowed, "consented plan with facts must be allowed");
assert(consentedPlan.request.allowedFactIds.length > 0, "allowed evidence IDs are required");
const allowedFactId = consentedPlan.request.allowedFactIds[0]!;
const allowedValue = consentedPlan.graph.facts.find((fact) => fact.id === allowedFactId)!.value;

const validProvider: AIProvider = {
  id: "test-valid",
  async suggest(request) {
    return {
      provider: "test-valid",
      suggestions: [
        {
          id: "valid-suggestion",
          action: request.action,
          proposedValue: allowedValue,
          evidenceFactIds: [allowedFactId],
          requiresApproval: true,
        },
      ],
    };
  },
};
const valid = await requestEvidenceLocked(
  validProvider,
  createPrivacyRuntime(),
  consentedPlan.request,
);
assert(!("error" in valid), "schema-valid suggestion must produce a review diff");
if (!("error" in valid)) {
  assert(valid.diffs[0]?.requiresApproval, "valid diff must remain approval-gated");
  assert(valid.diffs[0]?.evidenceFactIds[0] === allowedFactId, "diff must retain allowed evidence");
}

const unsupportedMetricProvider: AIProvider = {
  id: "test-unsupported-metric",
  async suggest(request) {
    return {
      provider: "test-unsupported-metric",
      suggestions: [
        {
          id: "unsupported-metric",
          action: request.action,
          proposedValue: "Delivered a 999% improvement.",
          evidenceFactIds: [allowedFactId],
          requiresApproval: true,
        },
      ],
    };
  },
};
const invalid = await requestEvidenceLocked(
  unsupportedMetricProvider,
  createPrivacyRuntime(),
  consentedPlan.request,
);
assert("error" in invalid, "unsupported metric must be rejected safely");
if ("error" in invalid) {
  assert(
    invalid.error.code === "parse_failed",
    "invalid output must be classified as schema validation failure",
  );
}

const outOfScopeProvider: AIProvider = {
  id: "test-out-of-scope",
  async suggest(request) {
    return {
      provider: "test-out-of-scope",
      suggestions: [
        {
          id: "out-of-scope",
          action: request.action,
          proposedValue: "test.person@example.test",
          evidenceFactIds: ["contact.email"],
          requiresApproval: true,
        },
      ],
    };
  },
};
const outOfScope = await requestEvidenceLocked(
  outOfScopeProvider,
  createPrivacyRuntime(),
  consentedPlan.request,
);
assert("error" in outOfScope, "suggestion outside allowedFactIds must be rejected safely");

const legacyResult = await requestNouraEvidenceSuggestion(createPrivacyRuntime(), noConsentPlan);
assert(
  "error" in legacyResult,
  "Noura gateway must preserve consent rejection at the adapter boundary",
);

console.log(
  "Phase 20 evidence smoke passed: consent, allowlist, schema validation, and approval gates.",
);
