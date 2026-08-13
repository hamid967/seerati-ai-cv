import { z } from "zod";

export const SafeEventSchema = z.object({
  route: z.string().max(200),
  durationMs: z.number().nonnegative().max(3_600_000),
  success: z.boolean(),
  errorCode: z.string().max(100).optional(),
  releaseVersion: z.string().max(100),
  modelIdentifier: z.string().max(100).optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  approximateCost: z.number().nonnegative().optional(),
  pdfSuccess: z.boolean().optional(),
  parserSuccess: z.boolean().optional(),
  anonymousFlowCompletion: z.boolean().optional(),
  lcpMs: z.number().nonnegative().optional(),
  cls: z.number().nonnegative().optional(),
  correlationId: z.string().regex(/^[a-z0-9-]{8,80}$/),
});
export type SafeEvent = z.infer<typeof SafeEventSchema>;

const forbiddenKeys =
  /resume|cv|job.?description|prompt|response|name|email|phone|employer|file|token|authorization|cookie/i;

export function createCorrelationId(): string {
  return `evt-${Math.random().toString(36).slice(2, 14)}`;
}

export function redactEvent(input: Record<string, unknown>): SafeEvent {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (forbiddenKeys.test(key)) continue;
    if (typeof value === "string" && forbiddenKeys.test(value)) continue;
    if (
      [
        "route",
        "durationMs",
        "success",
        "errorCode",
        "releaseVersion",
        "modelIdentifier",
        "inputTokens",
        "outputTokens",
        "approximateCost",
        "pdfSuccess",
        "parserSuccess",
        "anonymousFlowCompletion",
        "lcpMs",
        "cls",
        "correlationId",
      ].includes(key)
    )
      output[key] = value;
  }
  output["correlationId"] =
    typeof output["correlationId"] === "string" ? output["correlationId"] : createCorrelationId();
  return SafeEventSchema.parse(output);
}
