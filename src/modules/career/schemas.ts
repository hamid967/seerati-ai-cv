import { z } from "zod";

export const careerLanguages = ["ar", "en"] as const;
export const careerDirections = ["rtl", "ltr"] as const;
export const careerSources = [
  "user_manual",
  "imported_pdf",
  "imported_docx",
  "imported_text",
  "ai_suggestion",
  "translated",
  "derived_rule",
] as const;
export const careerSensitivities = ["public", "personal", "sensitive"] as const;
export const careerEntities = [
  "identity",
  "contact",
  "target_role",
  "summary",
  "experience",
  "achievement",
  "education",
  "skill",
  "language",
  "certification",
  "project",
  "volunteer_experience",
  "publication",
  "award",
  "membership",
  "link",
  "reference",
  "custom_section",
  "job_target",
] as const;

export const ProvenanceSchema = z.object({
  source: z.enum(careerSources),
  sourceLabel: z.string().trim().min(1).max(120),
  importedAt: z.string().datetime(),
  verifiedByUser: z.boolean(),
});

export const AIModificationSchema = z.object({
  action: z.string().trim().min(1).max(80),
  provider: z.string().trim().min(1).max(80),
  createdAt: z.string().datetime(),
  accepted: z.boolean(),
});

export const CareerFactSchema = z.object({
  id: z.string().trim().min(1).max(120),
  entity: z.enum(careerEntities),
  fieldPath: z.string().trim().min(1).max(160),
  value: z.string(),
  language: z.enum(careerLanguages),
  provenance: ProvenanceSchema,
  sensitivity: z.enum(careerSensitivities),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1).optional(),
  originalValue: z.string().optional(),
  acceptedValue: z.string().optional(),
  aiModificationHistory: z.array(AIModificationSchema).default([]),
});

export const ConsentSchema = z.object({
  aiProcessing: z.boolean().default(false),
  sessionRecovery: z.boolean().default(false),
  cloudPersistence: z.boolean().default(false),
  updatedAt: z.string().datetime(),
});

export const CareerProfileGraphSchema = z.object({
  id: z.string().trim().min(1).max(120),
  version: z.literal(1),
  language: z.enum(careerLanguages),
  direction: z.enum(careerDirections),
  facts: z.array(CareerFactSchema),
  consent: ConsentSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CareerSource = (typeof careerSources)[number];
export type CareerSensitivity = (typeof careerSensitivities)[number];
export type CareerEntity = (typeof careerEntities)[number];
export type Provenance = z.infer<typeof ProvenanceSchema>;
export type AIModification = z.infer<typeof AIModificationSchema>;
export type CareerFact = z.infer<typeof CareerFactSchema>;
export type CareerConsent = z.infer<typeof ConsentSchema>;
export type CareerProfileGraph = z.infer<typeof CareerProfileGraphSchema>;

export function parseCareerProfileGraph(input: unknown): CareerProfileGraph {
  return CareerProfileGraphSchema.parse(input);
}
