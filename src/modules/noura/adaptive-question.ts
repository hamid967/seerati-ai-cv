import type { AssistantAnswers } from "@/lib/assistant-create";
import type { NouraGoal } from "./agent-profile";

export const JourneyStageSchema = [
  "profile_classification",
  "target_role",
  "career_evidence",
  "section_review",
  "template_recommendation",
] as const;
export type JourneyStage = (typeof JourneyStageSchema)[number];

export type AdaptiveQuestion = {
  id: string;
  stage: JourneyStage;
  title: { ar: string; en: string };
  prompt: { ar: string; en: string };
  hint: { ar: string; en: string };
  requiredFields: Array<keyof AssistantAnswers>;
};

const QUESTION_BY_GOAL: Record<NouraGoal, AdaptiveQuestion> = {
  create_resume: {
    id: "career-stage",
    stage: "profile_classification",
    title: { ar: "من أنت", en: "About you" },
    prompt: { ar: "ما مرحلتك المهنية الآن؟", en: "What is your current career stage?" },
    hint: {
      ar: "استخدم خياراً يصفك اليوم فقط، ثم سنبني الأسئلة التالية على إجابتك.",
      en: "Choose what describes you today; the next questions will build on that answer.",
    },
    requiredFields: ["userType", "jobTitle"],
  },
  improve_resume: {
    id: "resume-review-intent",
    stage: "section_review",
    title: { ar: "ما الذي تريد تحسينه", en: "What would you like to improve?" },
    prompt: {
      ar: "حدد المسمى الذي تريد أن تخدمه سيرتك أولاً.",
      en: "Start with the role your resume should support.",
    },
    hint: {
      ar: "يمكنك فتح أدوات الاستيراد أو التحرير عندما تحتاجها؛ لن ننقل أي ملف تلقائياً.",
      en: "You can open import or editing tools when needed; no file is moved automatically.",
    },
    requiredFields: ["jobTitle"],
  },
  target_job: {
    id: "target-role",
    stage: "target_role",
    title: { ar: "الوظيفة المستهدفة", en: "Target role" },
    prompt: {
      ar: "ما المسمى الذي تستهدفه، وما الدليل الذي تريد مراجعته؟",
      en: "Which role are you targeting, and what evidence should we review?",
    },
    hint: {
      ar: "يمكنك لصق مقتطف موجز من وصف الوظيفة في حقل الأدلة؛ لن نحلله عن بُعد دون موافقتك.",
      en: "You may paste a short job-description excerpt as evidence; it is not analyzed remotely without consent.",
    },
    requiredFields: ["jobTitle", "story"],
  },
  import_resume: {
    id: "import-review",
    stage: "section_review",
    title: { ar: "مراجعة قبل الاستيراد", en: "Review before import" },
    prompt: {
      ar: "ما المسمى الذي تريد أن تخدمه السيرة المستوردة؟",
      en: "Which role should the imported resume support?",
    },
    hint: {
      ar: "افتح أداة الاستيراد عندما تكون جاهزاً؛ سنطلب مراجعتك قبل إضافة أي معلومة للمسودة.",
      en: "Open the import tool when you are ready; you will review information before it is added to the draft.",
    },
    requiredFields: ["jobTitle"],
  },
  check_ats: {
    id: "ats-context",
    stage: "section_review",
    title: { ar: "سياق فحص ATS", en: "ATS review context" },
    prompt: {
      ar: "ما المسمى الذي ستراجعه السيرة من أجله؟",
      en: "Which role should the resume be reviewed for?",
    },
    hint: {
      ar: "سيبقى الفحص إرشادياً وشفافاً؛ لا يضمن القبول أو التوظيف.",
      en: "The check stays advisory and transparent; it does not guarantee acceptance or employment.",
    },
    requiredFields: ["jobTitle"],
  },
  cover_letter: {
    id: "letter-evidence",
    stage: "career_evidence",
    title: { ar: "دليل خطاب التقديم", en: "Cover-letter evidence" },
    prompt: {
      ar: "ما الدليل أو الإنجاز الذي تريد أن يبني عليه الخطاب؟",
      en: "Which evidence or achievement should the letter build on?",
    },
    hint: {
      ar: "اكتب حقيقة تود استخدامها فقط؛ لن نملأ شركات أو أرقاماً أو نتائج من عندنا.",
      en: "Enter only a fact you want to use; we will not invent companies, metrics, or outcomes.",
    },
    requiredFields: ["jobTitle", "story"],
  },
  review_resume: {
    id: "review-priority",
    stage: "section_review",
    title: { ar: "أولوية المراجعة", en: "Review priority" },
    prompt: {
      ar: "ما المسمى الذي تريد أن تكون المراجعة مفيدة له؟",
      en: "Which role should make this review useful?",
    },
    hint: {
      ar: "سنبدأ بأولوية قابلة للتنفيذ بدلاً من قائمة طويلة من التوصيات.",
      en: "We will begin with one actionable priority instead of a long recommendation list.",
    },
    requiredFields: ["jobTitle"],
  },
};

export function adaptiveQuestionForGoal(goal?: NouraGoal): AdaptiveQuestion | undefined {
  return goal ? QUESTION_BY_GOAL[goal] : undefined;
}

export function isAdaptiveQuestionComplete(
  question: AdaptiveQuestion | undefined,
  answers: AssistantAnswers,
): boolean {
  if (!question) return false;

  return question.requiredFields.every((field) => Boolean(answers[field].trim()));
}

export function journeyStageProgress(stage: JourneyStage): number {
  const index = JourneyStageSchema.indexOf(stage);
  return index === -1 ? 0 : ((index + 1) / JourneyStageSchema.length) * 100;
}

export const USER_TYPE_OPTIONS: Array<{
  value: NonNullable<AssistantAnswers["userType"]>;
  ar: string;
  en: string;
}> = [
  { value: "student", ar: "طالب/ـة", en: "Student" },
  { value: "graduate", ar: "خريج/ـة", en: "Graduate" },
  { value: "employee", ar: "موظف/ـة", en: "Professional" },
  { value: "job_seeker", ar: "باحث/ـة عن عمل", en: "Job seeker" },
  { value: "executive", ar: "قيادي/ـة", en: "Executive" },
];
