import type { ResumeData } from "@/lib/types";
import { fromResumeData, type CareerProfileGraph } from "@/modules/career";
import {
  createPrivacyRuntime,
  type PrivacyRuntime,
  type TransmissionPreview,
} from "@/modules/privacy";
import { runLegacyEvidenceLockedAI } from "./legacy-adapter";
import type { EvidenceLockedRequest } from "./evidence";

export const NOURA_EVIDENCE_PROVIDER_ID = "legacy-ai-service-phase18-adapter";
const MAXIMUM_PAYLOAD_CHARACTERS = 12_000;
const MAXIMUM_FACTS = 24;

type NouraEvidencePlanInput = {
  data: ResumeData;
  locale: "ar" | "en";
  consentAiProcessing: boolean;
};

export type NouraEvidencePlan = {
  graph: CareerProfileGraph;
  request: EvidenceLockedRequest;
  preview: TransmissionPreview;
  providerId: string;
  includedFieldPaths: string[];
  excludedFieldPaths: string[];
  estimatedPayloadCharacters: number;
};

function isRemoteSafeFact(fact: CareerProfileGraph["facts"][number]): boolean {
  return (
    fact.value.trim().length > 0 &&
    fact.id !== "identity.fullName" &&
    !fact.id.startsWith("contact.") &&
    fact.sensitivity !== "sensitive"
  );
}

/**
 * Produces metadata and an evidence-locked request only. It never calls a
 * provider, persists content, or mutates the supplied resume data.
 */
export function buildNouraEvidencePlan(input: NouraEvidencePlanInput): NouraEvidencePlan {
  const { graph } = fromResumeData(input.data, {
    graphId: "noura-session-evidence",
    language: input.locale,
  });
  const allowedFactIds = graph.facts
    .filter(isRemoteSafeFact)
    .slice(0, MAXIMUM_FACTS)
    .map((fact) => fact.id);
  const allowed = new Set(allowedFactIds);
  const targetRole = graph.facts.find((fact) => fact.id === "targetRole.title")?.value.trim();
  const request: EvidenceLockedRequest = {
    action: "write_summary",
    graph,
    allowedFactIds,
    requestedLocale: input.locale,
    sensitivity: "personal",
    consentAiProcessing: input.consentAiProcessing,
    maximumPayloadCharacters: MAXIMUM_PAYLOAD_CHARACTERS,
    ...(targetRole ? { targetRole } : {}),
  };
  const estimatedPayloadCharacters = graph.facts
    .filter((fact) => allowed.has(fact.id))
    .map((fact) => `${fact.fieldPath}: ${fact.value}`)
    .join("\n").length;
  const privacy = createPrivacyRuntime();
  const rawPreview = privacy.previewTransmission(request);
  const preview =
    estimatedPayloadCharacters > MAXIMUM_PAYLOAD_CHARACTERS
      ? { ...rawPreview, allowed: false, reason: "payload-limit" as const }
      : rawPreview;

  return {
    graph,
    request,
    preview,
    providerId: NOURA_EVIDENCE_PROVIDER_ID,
    includedFieldPaths: graph.facts
      .filter((fact) => allowed.has(fact.id))
      .map((fact) => fact.fieldPath),
    excludedFieldPaths: graph.facts
      .filter((fact) => !allowed.has(fact.id))
      .map((fact) => fact.fieldPath),
    estimatedPayloadCharacters,
  };
}

export function requestNouraEvidenceSuggestion(privacy: PrivacyRuntime, plan: NouraEvidencePlan) {
  return runLegacyEvidenceLockedAI(privacy, plan.request);
}
