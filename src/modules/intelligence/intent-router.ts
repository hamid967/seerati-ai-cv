import { IntentResultSchema, type IntentResult } from "./contracts";

type IntentRule = {
  intent: IntentResult["intent"];
  ar: string[];
  en: string[];
  requiredContext: string[];
  next: string;
  fallback: string;
};

const RULES: IntentRule[] = [
  {
    intent: "create_resume",
    ar: ["أنشئ سيرتي", "إنشاء سيرة", "سيرة من الصفر", "سوي cv", "سوي سيرة"],
    en: ["create resume", "build my cv", "make a resume", "start resume"],
    requiredContext: ["resume"],
    next: "open_smart_start",
    fallback: "ask whether the user wants Arabic or English resume content",
  },
  {
    intent: "import_resume",
    ar: ["استورد", "استيراد سيرة", "ارفع سيرتي", "لدي سيرة"],
    en: ["import resume", "upload cv", "upload my resume", "parse resume"],
    requiredContext: ["file_or_text"],
    next: "open_import_review",
    fallback: "ask the user to paste text or choose a file",
  },
  {
    intent: "improve_resume",
    ar: ["حسن سيرتي", "تحسين السيرة", "طور السيرة", "عدّل سيرتي"],
    en: ["improve resume", "fix my cv", "optimize resume", "polish my resume", "حسن my resume"],
    requiredContext: ["resume"],
    next: "open_resume_health",
    fallback: "offer local resume health checks first",
  },
  {
    intent: "target_job",
    ar: ["جهزني لوظيفة", "وظيفة محددة", "طابق الوظيفة", "حلل الوصف"],
    en: ["prepare me for a job", "target a job", "match this job", "analyze job description"],
    requiredContext: ["job_description"],
    next: "open_job_match",
    fallback: "ask the user to paste the job description",
  },
  {
    intent: "check_ats",
    ar: ["افحص ats", "فحص ats", "فحص السيرة", "جاهزية التوظيف", "فحص نظام التوظيف"],
    en: ["check ats", "scan my resume", "ats check", "resume scan"],
    requiredContext: ["resume"],
    next: "open_ats",
    fallback: "run local ATS rules on the current resume",
  },
  {
    intent: "translate_resume",
    ar: ["ترجم السيرة", "ترجمة سيرتي", "حولها للانجليزية", "حولها للعربية"],
    en: ["translate resume", "translate my cv", "make it english", "make it arabic"],
    requiredContext: ["resume", "target_language"],
    next: "open_translation_review",
    fallback: "ask which target language is required",
  },
  {
    intent: "cover_letter",
    ar: ["خطاب تقديم", "اكتب خطاب", "رسالة تقديم"],
    en: ["cover letter", "write an application letter", "application letter"],
    requiredContext: ["resume", "job_target"],
    next: "open_cover_letter",
    fallback: "ask for the target role and company without sending data to AI",
  },
  {
    intent: "interview_prep",
    ar: ["استعد للمقابلة", "تحضير مقابلة", "تدرب للمقابلة"],
    en: ["prepare for interview", "interview prep", "practice interview"],
    requiredContext: ["job_target"],
    next: "open_interview_prep",
    fallback: "start local evidence-based questions",
  },
  {
    intent: "change_template",
    ar: ["غير القالب", "اختر قالب", "قالب ats"],
    en: ["change template", "choose a template", "pick an ats template"],
    requiredContext: ["resume"],
    next: "open_template_recommendation",
    fallback: "show local template recommendations",
  },
  {
    intent: "shorten_resume",
    ar: ["قصر السيرة", "اختصر السيرة", "صفحة واحدة"],
    en: ["shorten resume", "make it shorter", "one page resume"],
    requiredContext: ["resume"],
    next: "open_layout_review",
    fallback: "show local overflow and length findings",
  },
  {
    intent: "create_profile",
    ar: ["أنشئ ملف مهني", "ملف مهني", "career profile"],
    en: ["create professional profile", "build my profile", "career profile"],
    requiredContext: ["identity"],
    next: "open_profile_start",
    fallback: "ask for the intended professional goal",
  },
];

function normalize(input: string): string {
  return input
    .toLocaleLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}+# ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function languageOf(input: string): IntentResult["language"] {
  const ar = (input.match(/[\u0600-\u06ff]/g) ?? []).length;
  const en = (input.match(/[A-Za-z]/g) ?? []).length;
  if (ar && en) return "mixed";
  return ar ? "ar" : "en";
}

export function routeIntent(input: string, availableContext: string[] = []): IntentResult {
  const normalized = normalize(input);
  const language = languageOf(input);
  let best: { rule: IntentRule; score: number } | null = null;
  for (const rule of RULES) {
    const phrases = [...rule.ar, ...rule.en];
    const hits = phrases.filter((phrase) => normalized.includes(normalize(phrase))).length;
    if (!hits) continue;
    const score = Math.min(0.98, 0.58 + hits * 0.16);
    if (!best || score > best.score) best = { rule, score };
  }
  if (!best || best.score < 0.7) {
    return IntentResultSchema.parse({
      intent: "clarify",
      confidence: best?.score ?? 0.2,
      requiredContext: [],
      missingContext: ["clear_intent"],
      recommendedNextAction: "ask_clarifying_question",
      safeFallback: "show_smart_start_choices",
      language,
    });
  }
  const missingContext = best.rule.requiredContext.filter(
    (item) => !availableContext.includes(item),
  );
  return IntentResultSchema.parse({
    intent: best.rule.intent,
    confidence: best.score,
    requiredContext: best.rule.requiredContext,
    missingContext,
    recommendedNextAction: best.rule.next,
    safeFallback: best.rule.fallback,
    language,
  });
}
