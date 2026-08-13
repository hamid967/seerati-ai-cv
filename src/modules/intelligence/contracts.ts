import { z } from "zod";

export const IntentSchema = z.enum([
  "create_resume",
  "import_resume",
  "improve_resume",
  "target_job",
  "check_ats",
  "translate_resume",
  "cover_letter",
  "interview_prep",
  "change_template",
  "shorten_resume",
  "create_profile",
  "clarify",
]);
export type Intent = z.infer<typeof IntentSchema>;

export const IntentResultSchema = z.object({
  intent: IntentSchema,
  confidence: z.number().min(0).max(1),
  requiredContext: z.array(z.string()),
  missingContext: z.array(z.string()),
  recommendedNextAction: z.string(),
  safeFallback: z.string(),
  language: z.enum(["ar", "en", "mixed"]),
});
export type IntentResult = z.infer<typeof IntentResultSchema>;

export const IntelligenceActionSchema = z.object({
  id: z.string().min(1),
  priority: z.enum(["critical", "high", "medium", "low"]),
  title: z.object({ ar: z.string(), en: z.string() }),
  explanation: z.object({ ar: z.string(), en: z.string() }),
  confidence: z.number().min(0).max(1),
  requiredConsent: z.enum(["none", "ai", "recovery", "account"]),
  localOrRemote: z.enum(["local", "remote"]),
  fallback: z.string(),
  surface: z.string(),
  to: z.string(),
});
export type IntelligenceAction = z.infer<typeof IntelligenceActionSchema>;

export const OnboardingQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.object({ ar: z.string(), en: z.string() }),
  reason: z.object({ ar: z.string(), en: z.string() }),
  section: z.string(),
  skippable: z.boolean(),
  sendsToAi: z.boolean(),
  savesData: z.boolean(),
});
export type OnboardingQuestion = z.infer<typeof OnboardingQuestionSchema>;

export const ResumeHealthSchema = z.object({
  score: z.number().min(0).max(100),
  status: z.enum(["ready", "needs_attention", "incomplete"]),
  dimensions: z.array(
    z.object({
      id: z.string(),
      label: z.object({ ar: z.string(), en: z.string() }),
      score: z.number().min(0).max(100),
      state: z.enum(["good", "warning", "critical"]),
      findings: z.array(z.string()),
      localOnly: z.boolean(),
    }),
  ),
  topIssues: z.array(z.string()).max(3),
  nextAction: z.string(),
  estimatedMinutes: z.number().int().nonnegative(),
});
export type ResumeHealth = z.infer<typeof ResumeHealthSchema>;

export const PrivacyPreviewSchema = z.object({
  dataLocation: z.enum(["memory", "consented_recovery", "account"]),
  fieldsIncluded: z.array(z.string()),
  fieldsExcluded: z.array(z.string()),
  reason: z.string(),
  provider: z.string(),
  expiresAt: z.string().datetime().nullable(),
  saveState: z.enum(["not_saved", "consented", "account_saved"]),
  canDelete: z.literal(true),
  canCancel: z.literal(true),
  sendsContent: z.boolean(),
});
export type PrivacyPreview = z.infer<typeof PrivacyPreviewSchema>;
