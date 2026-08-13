import assert from "node:assert/strict";
import { emptyFactGraph } from "@/lib/career-facts";
import { emptyResumeData } from "@/lib/types";
import {
  checkAuthenticity,
  inspectLayout,
  recoverFromFailure,
  recommendTemplates,
  searchLocal,
  coachSection,
  computeIntelligenceActions,
  assessResumeHealth,
  buildPrivacyPreview,
  inferOnboardingPersona,
  nextOnboardingQuestion,
  onboardingProgress,
  orchestrate,
  previewLocalRewrite,
  routeIntent,
} from "@/modules/intelligence";

const ar = routeIntent("أريد فحص ATS لسيرتي", ["resume"]);
assert.equal(ar.intent, "check_ats");
assert.equal(ar.language, "mixed");
const pureArabic = routeIntent("أريد فحص السيرة", ["resume"]);
assert.equal(pureArabic.language, "ar");
const mixed = routeIntent("please حسن my resume", ["resume"]);
assert.equal(mixed.intent, "improve_resume");
assert.equal(mixed.language, "mixed");
const unclear = routeIntent("ساعدني", []);
assert.equal(unclear.intent, "clarify");
assert.equal(unclear.recommendedNextAction, "ask_clarifying_question");

const onboardingState = {
  persona: inferOnboardingPersona({ years: 0, educationOnly: true }),
  answered: [],
  availableSections: [],
} as const;
const firstQuestion = nextOnboardingQuestion(onboardingState);
assert.equal(firstQuestion?.id, "target_role");
assert.equal(firstQuestion?.sendsToAi, false);
assert.equal(onboardingProgress({ ...onboardingState, answered: ["target_role"] }).remaining, 3);

const resume = emptyResumeData();
resume.personal.fullName = "Synthetic Candidate";
resume.summary = "A short synthetic profile summary.";
const health = assessResumeHealth(resume);
assert.ok(health.score >= 0 && health.score <= 100);
assert.equal(
  health.dimensions.every((dimension) => dimension.localOnly),
  true,
);
assert.ok(health.topIssues.length <= 3);

const preview = buildPrivacyPreview({
  availableFields: ["summary", "experience", "email"],
  requestedFields: ["summary", "email"],
  reason: "Draft a reviewable summary",
  provider: "not-used",
  consentAiProcessing: false,
});
assert.equal(preview.sendsContent, false);
assert.deepEqual(preview.fieldsIncluded, []);
assert.equal(preview.canDelete, true);

const actions = computeIntelligenceActions(
  { twin: null, graph: emptyFactGraph(), resumes: [], jobs: [] },
  3,
);
assert.ok(actions.length > 0);
assert.equal(actions[0]?.localOrRemote, "local");
assert.equal(
  actions.every((action) => action.requiredConsent === "none"),
  true,
);

const orchestration = orchestrate({
  route: "/assistant",
  command: "اكتب خطاب تقديم",
  sessionState: ["resume", "job_target"],
  graph: null,
  factGraph: emptyFactGraph(),
  resume: null,
  resumes: [],
  jobs: [],
  consentAiProcessing: false,
  network: "online",
  aiAvailable: true,
});
assert.equal(orchestration.requiredConsent, "ai");
assert.equal(orchestration.localOrRemote, "local");

assert.ok(checkAuthenticity("I am an exceptional leader with outstanding results.").length > 0);
assert.ok(coachSection("experience", "Managed a team").some((prompt) => prompt.requiresEvidence));
const rewrite = previewLocalRewrite("Built a dashboard. Built a dashboard.", "remove_repetition");
assert.equal(rewrite.applied, false);
assert.equal(rewrite.requiresApproval, true);
const recommendations = recommendTemplates({
  language: "ar",
  direction: "rtl",
  atsRequired: true,
  pages: 1,
});
assert.equal(recommendations.length, 3);
assert.equal(
  recommendations.every((item) => item.templateId.length > 0),
  true,
);
assert.ok(
  inspectLayout({
    text: "word ".repeat(700),
    pageCount: 1,
    sectionCount: 2,
    headingCount: 2,
    direction: "ltr",
  }).some((issue) => issue.id === "overflow"),
);
assert.equal(
  searchLocal(
    [
      {
        id: "ats",
        kind: "command",
        label: { ar: "افحص السيرة", en: "Check resume" },
        keywords: ["ats"],
        to: "/ats",
      },
    ],
    "ATS",
  )[0]?.id,
  "ats",
);
assert.equal(recoverFromFailure("ai", 2).dataPreserved, true);
assert.equal(recoverFromFailure("network").logsContent, false);

console.log("Phase 19 intelligence smoke OK.");
