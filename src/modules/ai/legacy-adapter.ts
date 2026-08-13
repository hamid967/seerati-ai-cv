import type { AiTask } from "@/lib/ai-types";
import { aiService } from "@/lib/ai-service";
import type { PrivacyRuntime } from "@/modules/privacy";
import type { CareerProfileGraph } from "@/modules/career";
import type { AIAction, AIProvider, AIRequest } from "@/modules/providers";
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
      const response = await aiService.run({
        task,
        lang: request.locale,
        input: factsInput(request.graph),
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
      return {
        error: {
          code: "unavailable",
          retryable: true,
          provider: "legacy-ai-service-phase18-adapter",
          safeMessage: "The AI provider is unavailable. Try again later.",
        },
      };
    }
  },
};

export function runLegacyEvidenceLockedAI(privacy: PrivacyRuntime, request: EvidenceLockedRequest) {
  return requestEvidenceLockedSuggestion(legacyAIProvider, privacy, request);
}
