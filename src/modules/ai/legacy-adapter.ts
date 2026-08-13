import type { AiTask } from "@/lib/ai-types";
import { aiService } from "@/lib/ai-service";
import type { PrivacyRuntime } from "@/modules/privacy";
import type { CareerProfileGraph } from "@/modules/career";
import type { AIAction, AIProvider, AIRequest } from "@/modules/providers";
import { providerError } from "@/modules/providers";
import { requestEvidenceLockedSuggestion, type EvidenceLockedRequest } from "./evidence";

const actionToLegacyTask: Partial<Record<AIAction, AiTask>> = {
  write_summary: "summary",
  improve_bullet: "improve",
  suggest_skills: "suggest_skills",
  translate: "translate",
  shorten: "shorten",
  expand: "expand",
  write_cover_letter: "chat",
  prepare_interview: "chat",
};

function factsInput(graph: CareerProfileGraph): string {
  return graph.facts.map((fact) => `${fact.fieldPath}: ${fact.value}`).join("\n");
}

export const legacyAIProvider: AIProvider = {
  id: "legacy-ai-service-phase18-adapter",
  async suggest(request: AIRequest) {
    if (!request.consentAiProcessing)
      return providerError("consent_required", this.id, "Explicit AI consent is required.");
    const task = actionToLegacyTask[request.action];
    if (!task)
      return {
        error: {
          code: "invalid_request",
          retryable: false,
          provider: "legacy-ai-service-phase18-adapter",
          safeMessage: "This action is not enabled by the migration adapter.",
        },
      };
    try {
      const input = factsInput(request.graph);
      if (input.length > 100_000)
        return providerError(
          "invalid_request",
          this.id,
          "The evidence payload is larger than the allowed limit.",
        );
      const response = await aiService.run({
        task,
        lang: request.locale,
        input,
        ...(request.targetRole ? { context: { targetRole: request.targetRole } } : {}),
      });
      const evidenceFactId = request.allowedFactIds[0];
      if (!evidenceFactId)
        return {
          error: {
            code: "invalid_request",
            retryable: false,
            provider: "legacy-ai-service-phase18-adapter",
            safeMessage: "At least one evidence fact is required.",
          },
        };
      const evidenceFactIds = [evidenceFactId];
      return {
        provider: this.id,
        suggestions: [
          {
            id: `${request.requestId}-suggestion`,
            action: request.action,
            proposedValue: response.text,
            evidenceFactIds,
            requiresApproval: true,
          },
        ],
      };
    } catch {
      return providerError(
        "unavailable",
        this.id,
        "The AI provider is unavailable. Try again later.",
        true,
      );
    }
  },
};

export function runLegacyEvidenceLockedAI(privacy: PrivacyRuntime, request: EvidenceLockedRequest) {
  return requestEvidenceLockedSuggestion(legacyAIProvider, privacy, request);
}
