import { z } from "zod";
import type { CareerFact, CareerProfileGraph } from "@/modules/career";
import { CareerProfileGraphSchema } from "@/modules/career";
import { PrivacyRuntime, type TransmissionRequest } from "@/modules/privacy";
import type {
  AIAction,
  AIProvider,
  AIRequest,
  AISuggestion,
  ProviderError,
} from "@/modules/providers";

export const EvidenceLockedRequestSchema = z.object({
  action: z.enum(["write_summary", "improve_bullet", "translate"]),
  graph: CareerProfileGraphSchema,
  allowedFactIds: z.array(z.string().min(1)).min(1).max(100),
  requestedLocale: z.enum(["ar", "en"]),
  sensitivity: z.enum(["public", "personal", "sensitive"]),
  consentAiProcessing: z.boolean(),
  maximumPayloadCharacters: z.number().int().positive().max(100_000),
  targetRole: z.string().max(160).optional(),
});
export type EvidenceLockedRequest = z.infer<typeof EvidenceLockedRequestSchema>;

export type SuggestionDiff = {
  factId: string;
  before: string;
  after: string;
  evidenceFactIds: string[];
  requiresApproval: true;
};

function projectedGraph(graph: CareerProfileGraph, factIds: string[]): CareerProfileGraph {
  const allowed = new Set(factIds);
  return CareerProfileGraphSchema.parse({
    ...graph,
    facts: graph.facts.filter((fact) => allowed.has(fact.id)),
  });
}

function normalizedDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\s+/g, " ");
}

function validateSuggestion(
  suggestion: AISuggestion,
  graph: CareerProfileGraph,
  allowedIds: Set<string>,
): SuggestionDiff {
  if (!suggestion.requiresApproval)
    throw new Error("AI suggestions must require explicit approval");
  const fact = graph.facts.find((item) => item.id === suggestion.evidenceFactIds[0]);
  if (!fact) throw new Error("AI suggestion has no valid evidence fact");
  if (suggestion.evidenceFactIds.some((id) => !allowedIds.has(id)))
    throw new Error("AI suggestion references a fact outside the allowed set");
  if (!suggestion.proposedValue.trim()) throw new Error("AI suggestion cannot be empty");
  const evidence = normalizedDigits(
    suggestion.evidenceFactIds
      .map((id) => graph.facts.find((item) => item.id === id)?.value ?? "")
      .join(" "),
  );
  const unsupportedNumbers = (
    normalizedDigits(suggestion.proposedValue).match(/\d+/g) ?? []
  ).filter((number) => !evidence.includes(number));
  if (unsupportedNumbers.length > 0)
    throw new Error("AI suggestion contains numbers that are not present in the allowed evidence");
  return {
    factId: fact.id,
    before: fact.value,
    after: suggestion.proposedValue,
    evidenceFactIds: suggestion.evidenceFactIds,
    requiresApproval: true,
  };
}

export async function requestEvidenceLockedSuggestion(
  provider: AIProvider,
  privacy: PrivacyRuntime,
  input: EvidenceLockedRequest,
): Promise<
  | { suggestions: AISuggestion[]; diffs: SuggestionDiff[] }
  | { error: ProviderError | { code: "policy_rejected"; message: string } }
> {
  const request = EvidenceLockedRequestSchema.parse(input);
  const transmission: TransmissionRequest = {
    action: request.action,
    allowedFactIds: request.allowedFactIds,
    requestedLocale: request.requestedLocale,
    sensitivity: request.sensitivity,
    consentAiProcessing: request.consentAiProcessing,
    maximumPayloadCharacters: request.maximumPayloadCharacters,
  };
  const preview = privacy.previewTransmission(transmission);
  if (!preview.allowed) return { error: { code: "policy_rejected", message: preview.reason } };
  const graph = projectedGraph(request.graph, request.allowedFactIds);
  const projectedPayloadCharacters = graph.facts
    .map((fact) => `${fact.fieldPath}: ${fact.value}`)
    .join("\n").length;
  if (projectedPayloadCharacters > request.maximumPayloadCharacters) {
    return { error: { code: "policy_rejected", message: "payload-limit" } };
  }
  const providerRequest: AIRequest = {
    requestId: `ai-${request.action}`,
    locale: request.requestedLocale,
    timeoutMs: 30_000,
    sensitivity: request.sensitivity,
    action: request.action as AIAction,
    graph,
    allowedFactIds: request.allowedFactIds,
    consentAiProcessing: request.consentAiProcessing,
    outputSchemaVersion: 1,
    ...(request.targetRole ? { targetRole: request.targetRole } : {}),
  };
  const response = await provider.suggest(providerRequest);
  if ("error" in response) return response;
  if (response.suggestions.length === 0) {
    return {
      error: {
        code: "parse_failed",
        retryable: false,
        provider: provider.id,
        safeMessage: "The AI provider returned no reviewable suggestion.",
      },
    };
  }
  const allowed = new Set(request.allowedFactIds);
  try {
    const diffs = response.suggestions.map((suggestion) =>
      validateSuggestion(suggestion, graph, allowed),
    );
    return { suggestions: response.suggestions, diffs };
  } catch {
    return {
      error: {
        code: "parse_failed",
        retryable: false,
        provider: provider.id,
        safeMessage: "The AI response could not be validated against the approved evidence.",
      },
    };
  }
}

export function applyApprovedSuggestion(
  graph: CareerProfileGraph,
  suggestion: AISuggestion,
  approved: boolean,
): CareerProfileGraph {
  if (!approved) return graph;
  const diff = validateSuggestion(suggestion, graph, new Set(suggestion.evidenceFactIds));
  const timestamp = new Date().toISOString();
  const facts: CareerFact[] = graph.facts.map((fact) => {
    if (fact.id !== diff.factId) return fact;
    return {
      ...fact,
      value: diff.after,
      originalValue: fact.originalValue ?? fact.value,
      acceptedValue: diff.after,
      updatedAt: timestamp,
      aiModificationHistory: [
        ...fact.aiModificationHistory,
        {
          action: suggestion.action,
          provider: "approved-provider",
          createdAt: timestamp,
          accepted: true,
        },
      ],
    };
  });
  return CareerProfileGraphSchema.parse({ ...graph, facts, updatedAt: timestamp });
}
