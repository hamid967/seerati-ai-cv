import type { TemplateDef } from "./types";

export type TemplateSignalId =
  "ats" | "global" | "document" | "visual" | "photo" | "compact" | "spacious";

export type TemplateSignal = {
  id: TemplateSignalId;
  label: { ar: string; en: string };
  detail: { ar: string; en: string };
};

const SIGNALS: Record<TemplateSignalId, TemplateSignal> = {
  ats: {
    id: "ats",
    label: { ar: "قراءة منظمة", en: "Structured reading" },
    detail: {
      ar: "تخطيط محافظ يدعم القراءة الآلية والمراجعة البشرية.",
      en: "A restrained structure for machine-readable and human review.",
    },
  },
  global: {
    id: "global",
    label: { ar: "عالمي الاتجاه", en: "Direction-ready" },
    detail: {
      ar: "يدعم العربية RTL والإنجليزية LTR من نفس تعريف القالب.",
      en: "Supports Arabic RTL and English LTR from the same template definition.",
    },
  },
  document: {
    id: "document",
    label: { ar: "وثيقة مركزة", en: "Focused document" },
    detail: {
      ar: "عمود واحد مناسب للمحتوى القصير والمركز.",
      en: "A single column suited to focused, concise content.",
    },
  },
  visual: {
    id: "visual",
    label: { ar: "تسلسل بصري", en: "Visual hierarchy" },
    detail: {
      ar: "توزيع متعدد المناطق يبرز الكتل والمعلومات المرئية.",
      en: "A multi-region layout that elevates visual information groups.",
    },
  },
  photo: {
    id: "photo",
    label: { ar: "صورة اختيارية", en: "Optional photo" },
    detail: {
      ar: "يتسع لصورة مهنية عند ملاءمتها لسياق التقديم.",
      en: "Makes room for a professional photo when it suits the application context.",
    },
  },
  compact: {
    id: "compact",
    label: { ar: "كثافة مدمجة", en: "Compact density" },
    detail: {
      ar: "مسافات مدمجة للمحتوى الذي يحتاج مسحاً سريعاً.",
      en: "Compact spacing for content that benefits from rapid scanning.",
    },
  },
  spacious: {
    id: "spacious",
    label: { ar: "مساحة مريحة", en: "Generous spacing" },
    detail: {
      ar: "مسافات أوسع للملفات التنفيذية أو الأطول.",
      en: "More generous spacing for senior or longer profiles.",
    },
  },
};

/**
 * Builds explainable display signals from static template properties only.
 * It reads no resume content and does not persist a visitor's choices.
 */
export function getTemplateSignals(template: TemplateDef): TemplateSignal[] {
  const signals: TemplateSignal[] = [];

  if (template.atsFriendly) signals.push(SIGNALS.ats);
  if (template.supportsRTL) signals.push(SIGNALS.global);
  signals.push(template.design.layout === "single" ? SIGNALS.document : SIGNALS.visual);
  if (template.design.supportsPhoto) signals.push(SIGNALS.photo);
  if (template.design.spacing === "compact") signals.push(SIGNALS.compact);
  if (template.design.spacing === "airy") signals.push(SIGNALS.spacious);

  return signals;
}

export function getPrimaryTemplateSignals(template: TemplateDef, limit = 3): TemplateSignal[] {
  return getTemplateSignals(template).slice(0, limit);
}
