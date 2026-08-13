import type { CareerProfileGraph } from "@/modules/career";

export type AuthenticityFinding = {
  id: string;
  severity: "warning" | "info";
  text: string;
  question: string;
  factIds: string[];
};

const generic = [
  /exceptional|outstanding|results-driven|dynamic|passionate|استثنائي|متميز|قيادي|شغوف|محترف جداً/i,
];
const evidenceWords = /\d|%|increased|reduced|improved|saved|grew|زاد|خفض|حسن|وفر|نما/i;

export function checkAuthenticity(
  text: string,
  graph: CareerProfileGraph | null = null,
): AuthenticityFinding[] {
  const findings: AuthenticityFinding[] = [];
  const factIds =
    graph?.facts.filter((fact) => fact.provenance.verifiedByUser).map((fact) => fact.id) ?? [];
  if (generic.some((pattern) => pattern.test(text))) {
    findings.push({
      id: "generic_claim",
      severity: "warning",
      text: "The wording uses a broad quality claim without a concrete example.",
      question: "What specific situation, scope, or result proves this claim?",
      factIds,
    });
  }
  if (text.length > 80 && !evidenceWords.test(text)) {
    findings.push({
      id: "no_evidence",
      severity: "warning",
      text: "The statement has no visible evidence marker.",
      question: "What result, scope, tool, or verifiable example can you confirm?",
      factIds,
    });
  }
  const sentences = text
    .split(/[.!؟\n]+/)
    .map((item) => item.trim().toLocaleLowerCase())
    .filter(Boolean);
  if (sentences.length !== new Set(sentences).size) {
    findings.push({
      id: "repetition",
      severity: "info",
      text: "A sentence is repeated.",
      question: "Which version is more accurate and useful?",
      factIds,
    });
  }
  return findings;
}
