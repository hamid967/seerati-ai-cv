import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";

export const ATSFindingSchema = z.object({
  ruleId: z.string(),
  version: z.literal("0.1.0"),
  category: z.enum(["structure", "contact", "content", "evidence", "language", "alignment"]),
  severity: z.enum(["info", "warning", "high"]),
  weight: z.number().nonnegative(),
  evidenceFactIds: z.array(z.string()),
  explanationArabic: z.string(),
  explanationEnglish: z.string(),
  remediation: z.string(),
  confidence: z.number().min(0).max(1),
});
export type ATSFinding = z.infer<typeof ATSFindingSchema>;

export const ATSReportSchema = z.object({
  version: z.literal("0.1.0"),
  overallAdvisoryScore: z.number().min(0).max(100),
  categoryScores: z.record(z.number().min(0).max(100)),
  evidence: z.array(z.string()),
  passedRules: z.array(z.string()),
  failedRules: z.array(ATSFindingSchema),
  warnings: z.array(z.string()),
  suggestedFixes: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  disclaimer: z.string(),
});
export type ATSReport = z.infer<typeof ATSReportSchema>;

function finding(args: Omit<ATSFinding, "version">): ATSFinding {
  return ATSFindingSchema.parse({ ...args, version: "0.1.0" });
}

export function analyzeCareerGraph(graph: CareerProfileGraph, jobDescription = ""): ATSReport {
  const facts = graph.facts;
  const byPath = (path: string) => facts.filter((fact) => fact.fieldPath === path);
  const failedRules: ATSFinding[] = [];
  const passedRules: string[] = [];
  const warnings: string[] = [];
  const suggestedFixes: string[] = [];
  const evidence = facts.map((fact) => fact.id);

  const contactFacts = facts.filter((fact) => fact.entity === "contact");
  if (contactFacts.some((fact) => fact.fieldPath === "contact.email"))
    passedRules.push("contact.email.present");
  else
    failedRules.push(
      finding({
        ruleId: "contact.email.present",
        category: "contact",
        severity: "high",
        weight: 20,
        evidenceFactIds: [],
        explanationArabic: "لم يتم العثور على بريد إلكتروني في الحقائق المقبولة.",
        explanationEnglish: "No email was found among accepted facts.",
        remediation: "أضف بريداً إلكترونياً وراجعه قبل التصدير.",
        confidence: 1,
      }),
    );

  if (byPath("summary.text").length) passedRules.push("content.summary.present");
  else {
    failedRules.push(
      finding({
        ruleId: "content.summary.present",
        category: "content",
        severity: "warning",
        weight: 15,
        evidenceFactIds: [],
        explanationArabic: "الملخص المهني غير موجود.",
        explanationEnglish: "The professional summary is missing.",
        remediation: "أضف ملخصاً قصيراً مبنياً على خبرتك المثبتة.",
        confidence: 1,
      }),
    );
    suggestedFixes.push("summary");
  }

  const achievementFacts = facts.filter((fact) => fact.entity === "achievement");
  if (achievementFacts.length) passedRules.push("evidence.achievement.present");
  else warnings.push("No achievement evidence was supplied.");

  if (jobDescription.trim()) {
    const terms = jobDescription
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((term) => term.length > 3);
    const corpus = facts.map((fact) => fact.value.toLocaleLowerCase()).join(" ");
    const matched = terms.filter((term) => corpus.includes(term));
    if (matched.length) passedRules.push("alignment.literal-term-match");
    else
      warnings.push(
        "No literal job-description terms matched; semantic matching is not claimed by this version.",
      );
  }

  const penalty = failedRules.reduce((sum, rule) => sum + rule.weight, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return ATSReportSchema.parse({
    version: "0.1.0",
    overallAdvisoryScore: score,
    categoryScores: {
      structure: 100,
      contact: contactFacts.length ? 100 : 0,
      content: byPath("summary.text").length ? 100 : 50,
      evidence: achievementFacts.length ? 100 : 50,
    },
    evidence,
    passedRules,
    failedRules,
    warnings,
    suggestedFixes,
    confidence: jobDescription.trim() ? 0.8 : 0.9,
    disclaimer: "هذه نتيجة إرشادية قابلة للتفسير وليست ضماناً لاجتياز ATS أو قرار توظيف.",
  });
}
