import { z } from "zod";

export const NouraStateSchema = z.enum([
  "idle",
  "asking",
  "local_analysis",
  "consent_required",
  "ai_processing",
  "suggestion_ready",
  "awaiting_approval",
  "completed",
  "offline",
  "error",
  "session_expiring",
  "data_deleted",
]);
export type NouraState = z.infer<typeof NouraStateSchema>;

export const NouraGoalSchema = z.enum([
  "create_resume",
  "improve_resume",
  "target_job",
  "import_resume",
  "check_ats",
  "cover_letter",
  "review_resume",
]);
export type NouraGoal = z.infer<typeof NouraGoalSchema>;

export const NouraAgentProfileSchema = z.object({
  id: z.literal("noura"),
  name: z.object({ ar: z.string(), en: z.string() }),
  role: z.object({ ar: z.string(), en: z.string() }),
  tone: z.object({ ar: z.string(), en: z.string() }),
  policy: z.object({ ar: z.string(), en: z.string() }),
  supportedGoals: z.array(NouraGoalSchema),
  prohibited: z.array(z.string()),
  version: z.literal("0.1.0"),
});
export type NouraAgentProfile = z.infer<typeof NouraAgentProfileSchema>;

export const NOURA_PROFILE: NouraAgentProfile = NouraAgentProfileSchema.parse({
  id: "noura",
  name: { ar: "نورة", en: "Noura" },
  role: { ar: "وكيلتك المهنية السعودية", en: "Your Saudi career agent" },
  tone: { ar: "مهنية، دافئة، واضحة ومختصرة", en: "Professional, warm, clear and concise" },
  policy: {
    ar: "أبني على حقائقك فقط، وأشرح أي اقتراح قبل تطبيقه.",
    en: "I build from your facts only and explain every suggestion before applying it.",
  },
  supportedGoals: [
    "create_resume",
    "improve_resume",
    "target_job",
    "import_resume",
    "check_ats",
    "cover_letter",
    "review_resume",
  ],
  prohibited: [
    "invent_company",
    "invent_qualification",
    "invent_date",
    "invent_metric",
    "automatic_apply",
    "unconsented_ai_transmission",
    "employment_guarantee",
  ],
  version: "0.1.0",
});

export const NOURA_GOALS: Array<{
  id: NouraGoal;
  ar: string;
  en: string;
  nextAr: string;
  nextEn: string;
}> = [
  {
    id: "create_resume",
    ar: "إنشاء سيرة من الصفر",
    en: "Create a resume from scratch",
    nextAr: "لنبدأ بهدفك المهني ومستواك الحالي.",
    nextEn: "We’ll start with your target role and current level.",
  },
  {
    id: "improve_resume",
    ar: "تحسين سيرة موجودة",
    en: "Improve an existing resume",
    nextAr: "يمكنك رفع ملف أو لصق النص أو فتح سيرة هذه الجلسة.",
    nextEn: "You can import a file, paste text, or open a resume from this session.",
  },
  {
    id: "target_job",
    ar: "تجهيز سيرة لوظيفة",
    en: "Target a specific job",
    nextAr: "ألصق وصف الوظيفة وسأوضح ما سأحلله أولاً.",
    nextEn: "Paste the job description and I’ll preview what I will analyze first.",
  },
  {
    id: "import_resume",
    ar: "استيراد ملف",
    en: "Import a resume",
    nextAr: "سنراجع الملف قبل إضافة أي معلومة إلى مسودتك.",
    nextEn: "We’ll review the file before adding anything to your draft.",
  },
  {
    id: "check_ats",
    ar: "فحص ATS",
    en: "Check ATS readiness",
    nextAr: "سأعرض لك الفحص الإرشادي دون ادعاء ضمان القبول.",
    nextEn: "I’ll show an advisory check without promising acceptance.",
  },
  {
    id: "cover_letter",
    ar: "كتابة خطاب تقديم",
    en: "Write a cover letter",
    nextAr: "سأبني الخطاب على الأدلة التي تؤكدها أنت.",
    nextEn: "I’ll build the letter from evidence you confirm.",
  },
  {
    id: "review_resume",
    ar: "مراجعة سريعة",
    en: "Run a quick review",
    nextAr: "سأبدأ بأهم ثلاث خطوات الآن، لا بقائمة طويلة.",
    nextEn: "I’ll start with the three most useful next steps, not a long checklist.",
  },
];
