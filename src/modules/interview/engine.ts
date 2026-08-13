import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";

export const InterviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  competency: z.string(),
  evidenceFactIds: z.array(z.string()),
  missingEvidence: z.boolean(),
});
export const InterviewSessionSchema = z.object({
  version: z.literal("0.1.0"),
  locale: z.enum(["ar", "en"]),
  questions: z.array(InterviewQuestionSchema),
  disclaimer: z.string(),
});
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type InterviewSession = z.infer<typeof InterviewSessionSchema>;

export function prepareInterview(
  graph: CareerProfileGraph,
  jobDescription: string,
): InterviewSession {
  const ar = graph.language === "ar";
  const evidence = graph.facts
    .filter((fact) => fact.entity === "experience" || fact.entity === "achievement")
    .slice(0, 5);
  const competencies = [
    ...new Set(
      jobDescription
        .split(/[^\p{L}\p{N}]+/u)
        .filter((term) => term.length > 4)
        .slice(0, 5),
    ),
  ];
  const fallback = ar
    ? ["القيادة", "حل المشكلات", "التعاون"]
    : ["leadership", "problem solving", "collaboration"];
  const selected = competencies.length ? competencies : fallback;
  const questions = selected.map((competency, index) => ({
    id: `question-${index + 1}`,
    question: ar
      ? `احكِ عن موقف يوضح ${competency} باستخدام طريقة STAR.`
      : `Tell me about a situation demonstrating ${competency} using the STAR method.`,
    competency,
    evidenceFactIds: evidence.map((fact) => fact.id),
    missingEvidence: evidence.length === 0,
  }));
  return InterviewSessionSchema.parse({
    version: "0.1.0",
    locale: graph.language,
    questions,
    disclaimer: ar
      ? "تدريب إرشادي لا يمثل قرار جهة التوظيف ولا يسجل الصوت افتراضياً."
      : "Advisory practice only; it does not represent an employer decision and records no audio by default.",
  });
}

export function buildStarPrompt(graph: CareerProfileGraph, question: InterviewQuestion) {
  const facts = graph.facts.filter((fact) => question.evidenceFactIds.includes(fact.id));
  return {
    situation: facts[0]?.value ?? "",
    task: "",
    action: facts[1]?.value ?? "",
    result: facts[2]?.value ?? "",
    missing: [
      ...(facts.some((fact) => fact.fieldPath.includes(".task")) ? [] : ["task"]),
      ...(facts[2]?.value ? [] : ["result"]),
    ],
  };
}
