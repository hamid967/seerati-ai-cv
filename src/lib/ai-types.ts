/**
 * Shared AI contract types. Kept in its own module so the server-only prompt
 * builder and the client-side service can both use them without a cycle.
 */
import type { ResumeData } from "./types";

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
  | "copilot";

export type AiRequest = {
  task: AiTask;
  lang: "ar" | "en";
  input: string;
  context?: Partial<ResumeData> & {
    targetRole?: string;
    jobDescription?: string;
    section?: string;
    answers?: Record<string, string>;
    /** Protected-term policy block (see bilingual-intelligence.ts). */
    protectedTerms?: string;
  };
};

export type AiResponse = { text: string; items?: string[] };

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
