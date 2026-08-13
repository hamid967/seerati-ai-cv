import type { CareerProfileGraph } from "@/modules/career";

export type RewriteCommand =
  "shorten" | "clearer" | "executive" | "result_focused" | "professional" | "remove_repetition";

export type RewritePreview = {
  command: RewriteCommand;
  before: string;
  after: string;
  factsPreserved: string[];
  wordsRemoved: string[];
  keywordsAdded: string[];
  riskWarnings: string[];
  requiresApproval: true;
  applied: false;
};

export function previewLocalRewrite(
  text: string,
  command: RewriteCommand,
  graph: CareerProfileGraph | null = null,
): RewritePreview {
  const before = text.trim();
  const sentences = before
    .split(/[.!؟\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const after =
    command === "shorten" || command === "remove_repetition"
      ? [...new Set(sentences)].slice(0, 3).join(". ")
      : before;
  const wordsRemoved = before
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !after.split(/\s+/).includes(word));
  const factTokens =
    graph?.facts.filter((fact) => fact.provenance.verifiedByUser).map((fact) => fact.id) ?? [];
  return {
    command,
    before,
    after,
    factsPreserved: factTokens,
    wordsRemoved,
    keywordsAdded: [],
    riskWarnings:
      after === before
        ? ["Local mode does not rewrite this command; use reviewable AI only after consent."]
        : [],
    requiresApproval: true,
    applied: false,
  };
}
