import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";
import { findTaxonomyTerms } from "@/modules/taxonomy";

export const MatchItemSchema = z.object({
  term: z.string(),
  matchType: z.enum(["exact", "synonym", "taxonomy", "evidence", "experience_level", "unmatched"]),
  evidenceFactIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  status: z.enum(["strong", "partial", "unverified", "gap"]),
  explanation: z.string(),
});
export type MatchItem = z.infer<typeof MatchItemSchema>;

export const JobMatchReportSchema = z.object({
  version: z.literal("0.1.0"),
  requiredSkills: z.array(MatchItemSchema),
  preferredSkills: z.array(MatchItemSchema),
  strongMatches: z.array(MatchItemSchema),
  partialMatches: z.array(MatchItemSchema),
  unverifiedMatches: z.array(MatchItemSchema),
  missingEvidence: z.array(MatchItemSchema),
  suggestedQuestions: z.array(z.string()),
  advisoryScore: z.number().min(0).max(100),
  disclaimer: z.string(),
});
export type JobMatchReport = z.infer<typeof JobMatchReportSchema>;

function terms(description: string): string[] {
  return [
    ...new Set(
      description
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}+#.-]+/u)
        .map((term) => term.trim())
        .filter((term) => term.length > 3),
    ),
  ];
}

function buildItem(term: string, graph: CareerProfileGraph): MatchItem {
  const normalized = term.toLocaleLowerCase();
  const exact = graph.facts.filter((fact) => fact.value.toLocaleLowerCase().includes(normalized));
  if (exact.length)
    return {
      term,
      matchType: "exact",
      evidenceFactIds: exact.map((fact) => fact.id),
      confidence: 0.95,
      status: "strong",
      explanation: "Exact normalized text matched an accepted fact.",
    };
  const taxonomy = findTaxonomyTerms(term);
  const synonym = graph.facts.filter((fact) =>
    taxonomy.some((item) =>
      [item.ar, item.en, ...item.synonymsAr, ...item.synonymsEn].some((value) =>
        fact.value.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
      ),
    ),
  );
  if (synonym.length)
    return {
      term,
      matchType: "synonym",
      evidenceFactIds: synonym.map((fact) => fact.id),
      confidence: 0.75,
      status: "partial",
      explanation: "A curated synonym matched an accepted fact; review the evidence.",
    };
  if (taxonomy.length)
    return {
      term,
      matchType: "taxonomy",
      evidenceFactIds: [],
      confidence: 0.35,
      status: "unverified",
      explanation:
        "The term exists in Seerati's non-official taxonomy, but no user evidence matched it.",
    };
  return {
    term,
    matchType: "unmatched",
    evidenceFactIds: [],
    confidence: 0,
    status: "gap",
    explanation: "No accepted evidence or taxonomy term matched this requirement.",
  };
}

export function matchCareerToJob(
  graph: CareerProfileGraph,
  jobDescription: string,
  options: { requiredTerms?: string[]; preferredTerms?: string[] } = {},
): JobMatchReport {
  const detected = terms(jobDescription);
  const required = (options.requiredTerms?.length ? options.requiredTerms : detected).map((term) =>
    buildItem(term, graph),
  );
  const preferred = (options.preferredTerms ?? []).map((term) => buildItem(term, graph));
  const all = [...required, ...preferred];
  const strongMatches = all.filter((item) => item.status === "strong");
  const partialMatches = all.filter((item) => item.status === "partial");
  const unverifiedMatches = all.filter((item) => item.status === "unverified");
  const missingEvidence = all.filter((item) => item.status === "gap");
  const advisoryScore = all.length
    ? Math.round(
        (strongMatches.length * 100 + partialMatches.length * 60 + unverifiedMatches.length * 25) /
          all.length,
      )
    : 0;
  return JobMatchReportSchema.parse({
    version: "0.1.0",
    requiredSkills: required,
    preferredSkills: preferred,
    strongMatches,
    partialMatches,
    unverifiedMatches,
    missingEvidence,
    suggestedQuestions: missingEvidence.map((item) => `ما الدليل العملي على: ${item.term}؟`),
    advisoryScore,
    disclaimer: "هذه مطابقة إرشادية لا تثبت امتلاك مهارة ولا تضمن نتيجة توظيف.",
  });
}
