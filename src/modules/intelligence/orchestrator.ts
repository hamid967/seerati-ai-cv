import type { CareerProfileGraph } from "@/modules/career";
import type { FactGraph } from "@/lib/career-facts";
import type { Resume } from "@/lib/types";
import type { JobWorkspace } from "@/lib/career";
import { routeIntent } from "./intent-router";
import { computeIntelligenceActions } from "./next-best-action";
import { assessResumeHealth } from "./resume-health";
import type { IntelligenceAction, IntentResult } from "./contracts";

export type OrchestratorInput = {
  route: string;
  command?: string;
  sessionState: string[];
  graph: CareerProfileGraph | null;
  factGraph: FactGraph;
  resume: Resume | null;
  resumes: Resume[];
  jobs: JobWorkspace[];
  consentAiProcessing: boolean;
  network: "online" | "offline";
  aiAvailable: boolean;
};

export type OrchestratorOutput = {
  intent: IntentResult;
  nextBestAction: IntelligenceAction | null;
  explanation: string;
  requiredConsent: "none" | "ai" | "recovery" | "account";
  localOrRemote: "local" | "remote";
  confidence: number;
  fallback: string;
  uiSurface: string;
  healthScore: number | null;
};

export function orchestrate(input: OrchestratorInput): OrchestratorOutput {
  const intent = routeIntent(input.command ?? "", input.sessionState);
  const health = input.resume ? assessResumeHealth(input.resume.data) : null;
  const actions = computeIntelligenceActions(
    { twin: null, graph: input.factGraph, resumes: input.resumes, jobs: input.jobs },
    1,
  );
  const action = actions[0] ?? null;
  const wantsAi = ["translate_resume", "cover_letter", "interview_prep", "improve_resume"].includes(
    intent.intent,
  );
  const consentRequired = wantsAi && !input.consentAiProcessing ? "ai" : "none";
  const local = input.network === "offline" || !input.aiAvailable || consentRequired === "ai";
  return {
    intent,
    nextBestAction: action,
    explanation: action?.explanation.en ?? "Use the next local step shown by the current surface.",
    requiredConsent: consentRequired,
    localOrRemote: local ? "local" : "remote",
    confidence: Math.min(intent.confidence, action?.confidence ?? 1),
    fallback: action?.fallback ?? "continue with local editing and checks",
    uiSurface: input.route,
    healthScore: health?.score ?? null,
  };
}
