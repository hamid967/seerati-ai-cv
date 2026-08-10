/**
 * Copilot action contract + language routing.
 *
 * The assistant never mutates data on its own: every model reply is turned into
 * a validated action object, and any action that writes to the career profile
 * carries `requiresConfirmation` so the UI must show Original / Suggested /
 * Reason before anything is applied.
 */
import type { AiTask } from "./ai-types";

/* ------------------------------ language mode ----------------------------- */

export type LanguageMode = "auto" | "ar" | "en";
export type ResumeLanguage = "ar" | "en" | "bilingual";
export type DetectedLanguage = "ar" | "en" | "mixed";

const AR_RE = /[\u0600-\u06FF]/g;
const EN_RE = /[A-Za-z]/g;

/** Detect the language of a single chat message (Arabic / English / mixed). */
export function detectMessageLanguage(text: string): DetectedLanguage {
  const ar = (text.match(AR_RE) ?? []).length;
  const en = (text.match(EN_RE) ?? []).length;
  if (!ar && !en) return "en";
  if (ar && en) {
    const ratio = ar / (ar + en);
    if (ratio > 0.65) return "ar";
    if (ratio < 0.35) return "en";
    return "mixed";
  }
  return ar ? "ar" : "en";
}

/**
 * Resolve which language the assistant answers in.
 * Auto follows the user's message; a mixed message falls back to the dominant
 * script and, when there is none, to the interface language.
 */
export function resolveReplyLanguage(
  mode: LanguageMode,
  message: string,
  uiLang: "ar" | "en",
): "ar" | "en" {
  if (mode !== "auto") return mode;
  const detected = detectMessageLanguage(message);
  return detected === "mixed" ? uiLang : detected;
}

export const LANGUAGE_MODE_LABEL: Record<LanguageMode, { ar: string; en: string }> = {
  auto: { ar: "تلقائي", en: "Auto" },
  ar: { ar: "العربية", en: "Arabic" },
  en: { ar: "الإنجليزية", en: "English" },
};

export const RESUME_LANGUAGE_LABEL: Record<ResumeLanguage, { ar: string; en: string }> = {
  ar: { ar: "سيرة بالعربية", en: "Arabic resume" },
  en: { ar: "سيرة بالإنجليزية", en: "English resume" },
  bilingual: { ar: "نسختان: عربية وإنجليزية", en: "Two linked versions: AR + EN" },
};

/* -------------------------------- actions --------------------------------- */

export type CopilotActionType =
  "ask" | "suggest_edit" | "update_field" | "add_item" | "translate" | "analyze";

export type CopilotAction = {
  type: CopilotActionType;
  /** Career Twin / resume target, e.g. "identity.summary" or "achievements". */
  target: string;
  payload: { text: string; items?: string[] };
  reason: string;
  requiresConfirmation: boolean;
};

const WRITE_TYPES: CopilotActionType[] = ["update_field", "add_item", "translate"];

/** Build a validated action; write actions always require confirmation. */
export function makeAction(input: {
  type: CopilotActionType;
  target: string;
  text: string;
  items?: string[];
  reason: string;
}): CopilotAction | null {
  const text = input.text?.trim() ?? "";
  const target = input.target?.trim() ?? "";
  if (!target) return null;
  if (input.type !== "ask" && !text) return null;
  return {
    type: input.type,
    target,
    payload: { text, ...(input.items?.length ? { items: input.items } : {}) },
    reason: input.reason.trim() || "—",
    requiresConfirmation: WRITE_TYPES.includes(input.type) || input.type === "suggest_edit",
  };
}

/** Reject anything that is not a well-formed action (never execute raw model text). */
export function isExecutableAction(action: CopilotAction | null): action is CopilotAction {
  if (!action) return false;
  if (!action.payload.text.trim()) return false;
  return action.payload.text.trim().length <= 4000;
}

/* ------------------------------ quick actions ----------------------------- */

export type QuickAction = {
  id: string;
  label: { ar: string; en: string };
  task: AiTask;
  /** Rendered as the action `reason` when there is no model-provided reason. */
  reason: { ar: string; en: string };
  /** Forces the output language regardless of the conversation language. */
  forceLang?: "ar" | "en";
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "professional",
    label: { ar: "اكتبها باحتراف", en: "Make professional" },
    task: "rewrite",
    reason: {
      ar: "صياغة مهنية أوضح مع فعل قوي في البداية.",
      en: "Clearer professional phrasing with a strong opening verb.",
    },
  },
  {
    id: "shorten",
    label: { ar: "اختصر", en: "Shorten" },
    task: "shorten",
    reason: { ar: "نص أقصر وأسهل للقراءة السريعة.", en: "Shorter text that scans faster." },
  },
  {
    id: "impact",
    label: { ar: "قوّي الأثر", en: "Strengthen impact" },
    task: "improve",
    reason: {
      ar: "إبراز الأثر والنتيجة بدل وصف المهام.",
      en: "Highlights outcome instead of describing duties.",
    },
  },
  {
    id: "achievement",
    label: { ar: "حوّلها إلى إنجاز", en: "Turn into achievement" },
    task: "quantify",
    reason: {
      ar: "تحويل المهمة إلى إنجاز قابل للقياس.",
      en: "Turns the duty into a measurable achievement.",
    },
  },
  {
    id: "keywords",
    label: { ar: "أضف كلمات الوظيفة", en: "Align to job keywords" },
    task: "ats_keywords",
    reason: {
      ar: "مواءمة النص مع كلمات الوصف الوظيفي.",
      en: "Aligns wording with the job description keywords.",
    },
  },
  {
    id: "to_ar",
    label: { ar: "ترجمة للعربية", en: "Translate to Arabic" },
    task: "translate",
    forceLang: "ar",
    reason: {
      ar: "ترجمة مهنية مع الحفاظ على أسماء الشركات والشهادات.",
      en: "Professional Arabic, keeping company and certificate names as-is.",
    },
  },
  {
    id: "to_en",
    label: { ar: "ترجمة للإنجليزية", en: "Translate to English" },
    task: "translate",
    forceLang: "en",
    reason: {
      ar: "ترجمة مهنية مع الحفاظ على الأسماء الخاصة.",
      en: "Professional English, keeping proper nouns as-is.",
    },
  },
  {
    id: "ats",
    label: { ar: "تحقق من ATS", en: "Check ATS" },
    task: "ats_keywords",
    reason: {
      ar: "مراجعة توافق النص مع أنظمة التتبع.",
      en: "Reviews how well the text matches applicant tracking systems.",
    },
  },
];

/* ------------------------------- guardrails ------------------------------- */

const AR_CONFIRM = "[أكّد الرقم]";
const EN_CONFIRM = "[confirm figure]";

/**
 * Any unverified number the model produced is flagged so it cannot silently
 * become a "fact" on the profile.
 */
export function flagUnverifiedFigures(text: string, lang: "ar" | "en"): string {
  const tag = lang === "ar" ? AR_CONFIRM : EN_CONFIRM;
  if (text.includes(AR_CONFIRM) || text.includes(EN_CONFIRM)) return text;
  const hasFigure = /(\d[\d,.]*\s?%|\bSAR\b|ريال|\d{2,})/u.test(text);
  return hasFigure ? `${text} ${tag}` : text;
}

/** Descriptive progress only — never a fake score. */
export function describeProgress(
  state: { hasBasics: boolean; achievementsNeeded: number; missing: string[] },
  lang: "ar" | "en",
): string[] {
  const ar = lang === "ar";
  const out: string[] = [];
  out.push(
    state.hasBasics
      ? ar
        ? "البيانات الأساسية مكتملة."
        : "Core details are complete."
      : ar
        ? "نحتاج إكمال البيانات الأساسية."
        : "Core details still need completing.",
  );
  if (state.achievementsNeeded > 0) {
    out.push(
      ar
        ? `نحتاج دليلاً لـ${state.achievementsNeeded} إنجاز.`
        : `We need evidence for ${state.achievementsNeeded} achievement${state.achievementsNeeded === 1 ? "" : "s"}.`,
    );
  }
  if (state.missing.length) {
    out.push(
      ar ? `باقي: ${state.missing.join("، ")}.` : `Still to add: ${state.missing.join(", ")}.`,
    );
  }
  return out;
}
