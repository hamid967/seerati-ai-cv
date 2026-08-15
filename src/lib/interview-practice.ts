export type PracticeLocale = "ar" | "en";

export type PracticeQuestion = {
  id: string;
  competency: string;
  question: string;
  coaching: string;
};

export type InterviewPracticeSession = {
  locale: PracticeLocale;
  role: string;
  questions: PracticeQuestion[];
  disclaimer: string;
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "before",
  "company",
  "description",
  "from",
  "have",
  "into",
  "job",
  "role",
  "that",
  "their",
  "this",
  "with",
  "على",
  "إلى",
  "الى",
  "التي",
  "العمل",
  "الوصف",
  "وظيفة",
  "وظيفية",
  "شركة",
  "عن",
  "في",
  "من",
]);

const FALLBACKS: Record<PracticeLocale, string[]> = {
  ar: ["حل المشكلات", "التعاون", "إدارة الأولويات", "التواصل"],
  en: ["problem solving", "collaboration", "prioritisation", "communication"],
};

function terms(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}+#.-]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4 && !STOP_WORDS.has(term));
}

function competencies(role: string, jobDescription: string, locale: PracticeLocale): string[] {
  const seen = new Set<string>();
  const selected: string[] = [];
  for (const term of [...terms(role), ...terms(jobDescription)]) {
    if (seen.has(term)) continue;
    seen.add(term);
    selected.push(term);
    if (selected.length === 4) return selected;
  }
  return FALLBACKS[locale];
}

export function createInterviewPractice(input: {
  role: string;
  jobDescription: string;
  locale: PracticeLocale;
}): InterviewPracticeSession {
  const role = input.role.trim();
  const locale = input.locale;
  const selected = competencies(role, input.jobDescription, locale);
  const target = role || (locale === "ar" ? "هذا الدور" : "this role");

  return {
    locale,
    role,
    questions: selected.map((competency, index) => ({
      id: `practice-${index + 1}`,
      competency,
      question:
        locale === "ar"
          ? `احكِ عن موقف يوضح ${competency} في سياق ${target}. استخدم طريقة STAR.`
          : `Tell me about a situation showing ${competency} for ${target}. Use the STAR method.`,
      coaching:
        locale === "ar"
          ? "اذكر الموقف والمهمة والفعل والنتيجة، ولا تضف رقماً أو إنجازاً لا تستطيع تأكيده."
          : "Cover the situation, task, action, and result. Do not add a number or achievement you cannot verify.",
    })),
    disclaimer:
      locale === "ar"
        ? "هذا تمرين إرشادي محلي. لا يسجل صوتاً ولا يتنبأ بقرار جهة العمل."
        : "This is local practice guidance. It records no audio and does not predict an employer decision.",
  };
}

export function interviewPracticePrivacyCopy(locale: PracticeLocale) {
  return locale === "ar"
    ? "يبقى الدور والوصف والإجابات في ذاكرة هذه الصفحة فقط حتى تغلقها أو تمسح التمرين. لا ترسل تلقائياً إلى الذكاء الاصطناعي أو التخزين السحابي."
    : "The role, description, and answers stay only in this page's memory until you close it or clear the practice. They are not automatically sent to AI or cloud storage.";
}
