import { computeNextActions, type NextActionInput } from "@/lib/next-best-action";
import { IntelligenceActionSchema, type IntelligenceAction } from "./contracts";

const priorityConfidence: Record<IntelligenceAction["priority"], number> = {
  critical: 0.98,
  high: 0.9,
  medium: 0.8,
  low: 0.7,
};

export function computeIntelligenceActions(
  input: NextActionInput,
  limit = 5,
): IntelligenceAction[] {
  return computeNextActions(input, limit).map((action) =>
    IntelligenceActionSchema.parse({
      id: action.id,
      priority: action.priority,
      title: action.title,
      explanation: action.why,
      confidence: priorityConfidence[action.priority],
      requiredConsent: "none",
      localOrRemote: "local",
      fallback: "continue editing and run the local check again",
      surface: action.personaOwner,
      to: action.to,
    }),
  );
}
