/**
 * Server-only AI runtime: rate limiting, gateway call, validation, usage logging.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { AI_MODEL, buildPrompt, validateAiOutput } from "./ai-prompts.server";
import type { AiRequest, AiResponse } from "./ai-types";

/** Per-user quota enforced server-side (client-side throttling is not enough). */
export const RATE_LIMIT_PER_MINUTE = 20;
export const RATE_LIMIT_PER_DAY = 300;

export type AiRunResult = AiResponse & { provider: "gateway"; runId?: string };

export class AiRateLimitError extends Error {
  constructor(public scope: "minute" | "day" | "unavailable") {
    super(
      scope === "minute"
        ? "rate_limited_minute"
        : scope === "day"
          ? "rate_limited_day"
          : "usage_counter_unavailable",
    );
  }
}

/** Counts this user's AI calls in a window using their own RLS-scoped client. */
async function countUsage(supabase: SupabaseClient, userId: string, sinceIso: string) {
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);

  // Quotas are a server-side abuse boundary. If the counter cannot be read,
  // fail safely instead of silently treating the user as having zero usage.
  if (error) {
    console.error("[ai] usage counter unavailable", error.message);
    throw new AiRateLimitError("unavailable");
  }

  return count ?? 0;
}

export async function assertWithinRateLimit(supabase: SupabaseClient, userId: string) {
  const now = Date.now();
  const [perMinute, perDay] = await Promise.all([
    countUsage(supabase, userId, new Date(now - 60_000).toISOString()),
    countUsage(supabase, userId, new Date(now - 86_400_000).toISOString()),
  ]);
  if (perMinute >= RATE_LIMIT_PER_MINUTE) throw new AiRateLimitError("minute");
  if (perDay >= RATE_LIMIT_PER_DAY) throw new AiRateLimitError("day");
}

/** Append-only usage log: `task.provider.status` plus token estimate. */
export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  task: string,
  provider: string,
  status: "ok" | "error",
  tokens: number | null,
) {
  const { error } = await supabase
    .from("ai_usage")
    .insert({ user_id: userId, task: `${task}.${provider}.${status}`, tokens });
  if (error) console.error("[ai] usage log failed", error.message);
}

/** Calls the gateway once, with a hard timeout, and validates the output shape. */
export async function runGatewayTask(req: AiRequest, apiKey: string): Promise<AiRunResult> {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const { system, prompt } = buildPrompt(req);

  const result = await generateText({
    model: gateway(AI_MODEL),
    system,
    prompt,
    temperature: 0.6,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(45_000),
  });

  const validated = validateAiOutput(req.task, result.text ?? "");
  const runId = gateway.getRunId();
  return {
    ...validated,
    provider: "gateway",
    ...(runId ? { runId } : {}),
    tokens: result.usage?.totalTokens ?? null,
  } as AiRunResult & { tokens: number | null };
}
