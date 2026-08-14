/**
 * Client-safe validation of AI requests. Used by the server function's
 * inputValidator, so it must not import server-only modules.
 */
import { ALL_AI_TASKS, type AiContext, type AiRequest, type AiTask } from "./ai-types";

export const AI_INPUT_MAX = 6000;
const AI_CONTEXT_MAX = 4_000;
const MAX_CONTEXT_ANSWERS = 12;
const CONTEXT_ANSWER_KEY = /^[A-Za-z0-9_.-]{1,40}$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readBoundedString(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`invalid_context_${field}`);
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength) throw new Error(`context_${field}_too_long`);
  return normalized;
}

/**
 * Normalizes the context to the exact fields consumed by buildPrompt. This keeps
 * full resume objects, arbitrary nested properties, and unbounded metadata out
 * of AI requests even when a caller accidentally passes them at runtime.
 */
function parseAiContext(value: unknown): AiContext | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) throw new Error("invalid_context");

  const context: AiContext = {};
  const personal = value["personal"];
  if (personal !== undefined) {
    if (!isRecord(personal)) throw new Error("invalid_context_personal");
    const jobTitle = readBoundedString(personal["jobTitle"], "job_title", 200);
    if (jobTitle) context.personal = { jobTitle };
  }

  const targetRole = readBoundedString(value["targetRole"], "target_role", 200);
  if (targetRole) context.targetRole = targetRole;
  const jobDescription = readBoundedString(value["jobDescription"], "job_description", 1_500);
  if (jobDescription) context.jobDescription = jobDescription;
  const section = readBoundedString(value["section"], "section", 100);
  if (section) context.section = section;
  const protectedTerms = readBoundedString(value["protectedTerms"], "protected_terms", 1_200);
  if (protectedTerms) context.protectedTerms = protectedTerms;

  const answers = value["answers"];
  if (answers !== undefined) {
    if (!isRecord(answers)) throw new Error("invalid_context_answers");
    const entries = Object.entries(answers);
    if (entries.length > MAX_CONTEXT_ANSWERS) throw new Error("context_answers_too_many");
    const normalizedAnswers: Record<string, string> = {};
    for (const [key, answer] of entries) {
      if (!CONTEXT_ANSWER_KEY.test(key)) throw new Error("invalid_context_answer_key");
      const normalized = readBoundedString(answer, "answer", 240);
      if (normalized) normalizedAnswers[key] = normalized;
    }
    if (Object.keys(normalizedAnswers).length) context.answers = normalizedAnswers;
  }

  const serializedLength = JSON.stringify(context).length;
  if (serializedLength > AI_CONTEXT_MAX) throw new Error("context_too_long");
  return Object.keys(context).length ? context : undefined;
}

export function parseAiRequest(input: unknown): AiRequest {
  if (!isRecord(input)) throw new Error("invalid_request");

  const task = input["task"];
  if (typeof task !== "string" || !ALL_AI_TASKS.includes(task as AiTask)) {
    throw new Error("invalid_task");
  }

  const lang = input["lang"] === "en" ? "en" : "ar";
  const text = typeof input["input"] === "string" ? input["input"].trim() : "";
  if (!text) throw new Error("empty_input");
  if (text.length > AI_INPUT_MAX) throw new Error("input_too_long");

  const agentId =
    typeof input["agentId"] === "string" && input["agentId"].trim()
      ? input["agentId"].trim().slice(0, 40)
      : undefined;
  const context = parseAiContext(input["context"]);

  return {
    task: task as AiTask,
    lang,
    input: text,
    ...(agentId ? { agentId } : {}),
    ...(context ? { context } : {}),
  };
}
