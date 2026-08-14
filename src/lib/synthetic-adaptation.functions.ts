/**
 * Optional AI adaptation for fictional specialty samples.
 *
 * This endpoint is deliberately authenticated: anonymous visitors never send a
 * request and keep the deterministic in-memory sample. It accepts only consent
 * plus product selections; CV content and free text are rejected at the boundary.
 */
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  SYNTHETIC_SPECIALTY_IDS,
  type SyntheticExperienceLevel,
} from "@/modules/synthetic-resume/types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { SyntheticAdaptationRequest } from "./ai-types";

const EXPERIENCE_LEVELS = [
  "student",
  "graduate",
  "junior",
  "mid",
  "advanced",
  "manager",
  "executive",
  "career-change",
  "general",
] as const satisfies readonly SyntheticExperienceLevel[];

const adaptationRequestSchema = z
  .object({
    consent: z.literal(true),
    specialtyId: z.enum(SYNTHETIC_SPECIALTY_IDS),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    language: z.enum(["ar", "en"]),
  })
  .strict();

function parseSyntheticAdaptationRequest(input: unknown): SyntheticAdaptationRequest {
  return adaptationRequestSchema.parse(input);
}

export const runSyntheticAdaptation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseSyntheticAdaptationRequest(input))
  .handler(async ({ data, context }) => {
    const { AiRateLimitError, assertWithinRateLimit, recordUsage, runSyntheticGatewayAdaptation } =
      await import("./ai-runtime.server");

    try {
      await assertWithinRateLimit(context.supabase, context.userId);
    } catch (error) {
      if (error instanceof AiRateLimitError) {
        return {
          ok: false as const,
          code:
            error.scope === "unavailable"
              ? ("provider_unavailable" as const)
              : error.scope === "minute"
                ? ("rate_limited" as const)
                : ("quota_exceeded" as const),
        };
      }
      throw error;
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, code: "provider_unavailable" as const };

    try {
      const result = await runSyntheticGatewayAdaptation(data, apiKey);
      await recordUsage(
        context.supabase,
        context.userId,
        "adapt_sample",
        "gateway",
        "ok",
        result.tokens,
      );
      return {
        ok: true as const,
        content: {
          ...result,
          /** Keeps the UI from interpreting generated wording as verified fact. */
          status: "sample" as const,
          source: "ai-adapted" as const,
          requiresUserReview: true as const,
          exportApproved: false as const,
        },
      };
    } catch {
      await recordUsage(context.supabase, context.userId, "adapt_sample", "gateway", "error", null);
      return { ok: false as const, code: "provider_error" as const };
    }
  });
