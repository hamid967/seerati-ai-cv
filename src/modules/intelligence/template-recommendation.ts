import { defaultTemplates } from "@/lib/templates";
import type { TemplateDef } from "@/lib/types";

export type TemplateRecommendationInput = {
  language: "ar" | "en";
  direction: "rtl" | "ltr";
  sector?: string;
  experienceYears?: number;
  pages?: 1 | 2;
  atsRequired?: boolean;
  contentLength?: number;
};

export type TemplateRecommendation = {
  templateId: string;
  score: number;
  reason: { ar: string; en: string };
  atsLevel: "high" | "medium" | "review";
  expectedPages: 1 | 2;
  cautions: { ar: string; en: string }[];
};

function scoreTemplate(template: TemplateDef, input: TemplateRecommendationInput): number {
  let score = template.atsFriendly ? 30 : 10;
  if (input.atsRequired && !template.atsFriendly) score -= 20;
  if (input.pages === 1 && template.design.layout === "single") score += 15;
  if (input.pages === 2 && template.design.layout !== "single") score += 15;
  if (input.language === "ar" && template.supportsRTL) score += 12;
  if (input.sector && template.category === input.sector) score += 15;
  if ((input.contentLength ?? 0) > 4500 && template.design.layout === "single") score -= 12;
  return score;
}

export function recommendTemplates(
  input: TemplateRecommendationInput,
  limit = 3,
): TemplateRecommendation[] {
  return defaultTemplates
    .filter((template) => template.active !== false)
    .map((template) => ({ template, score: scoreTemplate(template, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ template, score }) => ({
      templateId: template.id,
      score: Math.max(0, Math.min(100, score)),
      reason: {
        ar:
          input.atsRequired && template.atsFriendly
            ? "قالب متوافق مع قواعد ATS الأساسية."
            : "اختيار محلي مبني على اللغة وطول المحتوى.",
        en:
          input.atsRequired && template.atsFriendly
            ? "A template aligned with basic ATS rules."
            : "A local recommendation based on language and content length.",
      },
      atsLevel: template.atsFriendly ? "high" : "review",
      expectedPages: input.pages ?? (template.design.layout === "single" ? 1 : 2),
      cautions: template.atsFriendly
        ? []
        : [
            {
              ar: "راجع المعاينة وPDF قبل الإرسال.",
              en: "Review the preview and PDF before sending.",
            },
          ],
    }));
}
