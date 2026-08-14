/**
 * Shared AI contract types. Kept in its own module so the server-only prompt
 * builder and the client-side service can both use them without a cycle.
 */
import type {
  SyntheticExperienceLevel,
  SyntheticSpecialtyId,
} from "@/modules/synthetic-resume/types";

export type AiTask =
  | "summary"
  | "improve"
  | "rewrite"
  | "shorten"
  | "expand"
  | "quantify"
  | "suggest_skills"
  | "proofread"
  | "ats_keywords"
  | "translate"
  | "chat"
  | "copilot"
  /** Internal, consented synthetic-resume adaptation only. */
  | "adapt_sample";

export type AiContext = {
  /** The only resume-derived title the generic prompt builder consumes. */
  personal?: { jobTitle?: string };
  targetRole?: string;
  jobDescription?: string;
  section?: string;
  answers?: Record<string, string>;
  /** Protected-term policy block (see bilingual-intelligence.ts). */
  protectedTerms?: string;
};

export type AiRequest = {
  task: AiTask;
  lang: "ar" | "en";
  input: string;
  /** Optional virtual specialist — prepends TEAM systemRole on the server. */
  agentId?: string;
  /** Bounded, allowlisted context only; never a full ResumeData object. */
  context?: AiContext;
};

export type AiResponse = { text: string; items?: string[] };

/**
 * The only data that can cross the optional synthetic-adaptation AI boundary.
 * `consent` is literal true so callers cannot invoke the endpoint accidentally.
 */
export type SyntheticAdaptationRequest = {
  consent: true;
  specialtyId: SyntheticSpecialtyId;
  experienceLevel: SyntheticExperienceLevel;
  language: "ar" | "en";
};

/** All returned text remains synthetic sample content and must be user-reviewed. */
export type SyntheticAdaptationContent = {
  summary: string;
  responsibilities: [string, string, string];
  skills: [string, string, string, string];
  project: string;
  certificate: string;
};

/** Tasks whose useful output is a list; these are validated as structured items. */
export const ITEM_TASKS: AiTask[] = [
  "improve",
  "rewrite",
  "quantify",
  "suggest_skills",
  "ats_keywords",
];

export const ALL_AI_TASKS: AiTask[] = [
  "summary",
  "improve",
  "rewrite",
  "shorten",
  "expand",
  "quantify",
  "suggest_skills",
  "proofread",
  "ats_keywords",
  "translate",
  "chat",
  "copilot",
];
