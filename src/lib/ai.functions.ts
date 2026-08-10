/**
 * AI server function (typed RPC). Thin wrapper by design: modules that declare
 * `createServerFn` are split at build time, so all runtime helpers are imported.
 */
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";

import { parseAiRequest } from "./ai-validate";

export const runAiTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseAiRequest(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { AiRateLimitError, assertWithinRateLimit, recordUsage, runGatewayTask } =
      await import("./ai-runtime.server");

    try {
      await assertWithinRateLimit(supabase, userId);
    } catch (error) {
      if (error instanceof AiRateLimitError) {
        if (error.scope === "unavailable") {
          return { ok: false as const, code: "provider_unavailable" };
        }
        return {
          ok: false as const,
          code: error.scope === "minute" ? "rate_limited" : "quota_exceeded",
        };
      }
      throw error;
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      console.error("[ai] LOVABLE_API_KEY is not configured");
      return { ok: false as const, code: "provider_unavailable" };
    }

    try {
      const result = await runGatewayTask(data, apiKey);
      await recordUsage(
        supabase,
        userId,
        data.task,
        "gateway",
        "ok",
        (result as { tokens?: number | null }).tokens ?? null,
      );
      return {
        ok: true as const,
        text: result.text,
        ...(result.items ? { items: result.items } : {}),
        provider: "gateway" as const,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[ai] gateway task failed", data.task, message);
      await recordUsage(supabase, userId, data.task, "gateway", "error", null);
      return { ok: false as const, code: "provider_error", message };
    }
  });
