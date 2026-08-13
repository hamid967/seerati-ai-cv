import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";

export const CoverLetterParagraphSchema = z.object({
  text: z.string(),
  evidenceFactIds: z.array(z.string()),
  requiresApproval: z.literal(true),
});
export const CoverLetterSchema = z.object({
  version: z.literal("0.1.0"),
  locale: z.enum(["ar", "en"]),
  company: z.string(),
  role: z.string(),
  paragraphs: z.array(CoverLetterParagraphSchema),
  disclaimer: z.string(),
});
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

export function buildEvidenceCoverLetter(input: {
  graph: CareerProfileGraph;
  role: string;
  company: string;
  tone?: "formal" | "warm";
  maxCharacters?: number;
}): CoverLetter {
  const { graph, role, company } = input;
  const summary = graph.facts.find((fact) => fact.fieldPath === "summary.text");
  const experience = graph.facts
    .filter((fact) => fact.entity === "experience" || fact.entity === "achievement")
    .slice(0, 3);
  const ar = graph.language === "ar";
  const paragraphs = [
    {
      text: ar
        ? `السادة في ${company}،\nأتقدم باهتمام إلى دور ${role}.`
        : `Dear ${company} team,\nI am applying with interest for the ${role} position.`,
      evidenceFactIds: [],
    },
    summary
      ? {
          text: ar
            ? `أستند في اهتمامي إلى هذا الملخص المثبت: ${summary.value}`
            : `My interest is grounded in this verified summary: ${summary.value}`,
          evidenceFactIds: [summary.id],
        }
      : {
          text: ar
            ? "أحتاج إلى ملخص مهني مقبول قبل تخصيص هذه الفقرة."
            : "A user-approved professional summary is needed before tailoring this paragraph.",
          evidenceFactIds: [],
        },
    experience.length
      ? {
          text: ar
            ? `ومن الأدلة المتاحة: ${experience.map((fact) => fact.value).join("؛ ")}`
            : `Relevant evidence available: ${experience.map((fact) => fact.value).join("; ")}`,
          evidenceFactIds: experience.map((fact) => fact.id),
        }
      : {
          text: ar
            ? "لم تُقدم أدلة خبرة كافية بعد."
            : "Sufficient experience evidence has not been provided yet.",
          evidenceFactIds: [],
        },
    {
      text: ar
        ? "أرحب بفرصة مناقشة الملاءمة بمزيد من التفصيل."
        : "I would welcome the opportunity to discuss the fit in more detail.",
      evidenceFactIds: [],
    },
  ].map((paragraph) => ({ ...paragraph, requiresApproval: true as const }));
  const result = CoverLetterSchema.parse({
    version: "0.1.0",
    locale: graph.language,
    company,
    role,
    paragraphs,
    disclaimer: ar
      ? "خطاب إرشادي مبني على الأدلة ويحتاج مراجعة المستخدم قبل الإرسال."
      : "Advisory evidence-based letter; review before sending.",
  });
  if (input.maxCharacters && JSON.stringify(result).length > input.maxCharacters)
    return CoverLetterSchema.parse({ ...result, paragraphs: result.paragraphs.slice(0, 2) });
  return result;
}
