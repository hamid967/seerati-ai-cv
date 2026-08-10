/**
 * Client-safe validation of AI requests. Used by the server function's
 * inputValidator, so it must not import server-only modules.
 */
import { ALL_AI_TASKS, type AiRequest, type AiTask } from "./ai-types";

export const AI_INPUT_MAX = 6000;

export function parseAiRequest(input: unknown): AiRequest {
  if (!input || typeof input !== "object") throw new Error("invalid_request");
  const raw = input as Record<string, unknown>;

  const task = raw["task"];
  if (typeof task !== "string" || !ALL_AI_TASKS.includes(task as AiTask)) {
    throw new Error("invalid_task");
  }

  const lang = raw["lang"] === "en" ? "en" : "ar";

  const text = typeof raw["input"] === "string" ? raw["input"].trim() : "";
  if (!text) throw new Error("empty_input");
  if (text.length > AI_INPUT_MAX) throw new Error("input_too_long");

  const context =
    raw["context"] && typeof raw["context"] === "object"
      ? (raw["context"] as NonNullable<AiRequest["context"]>)
      : undefined;

  return { task: task as AiTask, lang, input: text, ...(context ? { context } : {}) };

}
