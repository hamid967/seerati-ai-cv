export type SmartCommand = {
  id: string;
  label: { ar: string; en: string };
  intent: string;
  destructive: boolean;
  requiresPreview: boolean;
  to?: string;
};

export const SMART_COMMANDS: SmartCommand[] = [
  {
    id: "add_experience",
    label: { ar: "أضف خبرة", en: "Add experience" },
    intent: "create_experience",
    destructive: false,
    requiresPreview: false,
    to: "/resumes/new",
  },
  {
    id: "check_resume",
    label: { ar: "افحص السيرة", en: "Check resume" },
    intent: "check_ats",
    destructive: false,
    requiresPreview: false,
    to: "/ats",
  },
  {
    id: "choose_ats_template",
    label: { ar: "اختر قالب ATS", en: "Choose ATS template" },
    intent: "change_template",
    destructive: false,
    requiresPreview: false,
    to: "/templates",
  },
  {
    id: "delete_data",
    label: { ar: "احذف بياناتي", en: "Delete my data" },
    intent: "delete_session",
    destructive: true,
    requiresPreview: true,
  },
  {
    id: "print_resume",
    label: { ar: "اطبع", en: "Print" },
    intent: "print_resume",
    destructive: false,
    requiresPreview: true,
  },
];

export type SearchItem = {
  id: string;
  kind: "section" | "template" | "skill" | "command" | "faq" | "privacy";
  label: { ar: string; en: string };
  keywords: string[];
  to?: string;
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}+# ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchLocal(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const needle = normalize(query);
  if (!needle) return [];
  return items
    .map((item) => ({
      item,
      score: [item.label.ar, item.label.en, ...item.keywords]
        .map(normalize)
        .reduce(
          (score, value) =>
            score +
            (value.includes(needle)
              ? 2
              : value.split(" ").some((part) => needle.includes(part))
                ? 1
                : 0),
          0,
        ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export type FailureRecovery = {
  state: "ready" | "retryable" | "manual_fallback" | "offline";
  message: { ar: string; en: string };
  canRetry: boolean;
  canEditManually: true;
  dataPreserved: true;
  autoRetryCount: number;
  logsContent: false;
};

export function recoverFromFailure(
  kind: "ai" | "pdf" | "network",
  autoRetryCount = 0,
): FailureRecovery {
  if (kind === "network")
    return {
      state: "offline",
      message: {
        ar: "الشبكة غير متاحة، لكن التحرير والفحوصات المحلية مستمرة.",
        en: "The network is unavailable, but editing and local checks continue.",
      },
      canRetry: true,
      canEditManually: true,
      dataPreserved: true,
      autoRetryCount,
      logsContent: false,
    };
  if (kind === "pdf")
    return {
      state: "manual_fallback",
      message: {
        ar: "تعذر إنشاء PDF؛ استخدم المعاينة والطباعة كبديل.",
        en: "PDF generation failed; use preview and print as a fallback.",
      },
      canRetry: autoRetryCount < 1,
      canEditManually: true,
      dataPreserved: true,
      autoRetryCount,
      logsContent: false,
    };
  return {
    state: autoRetryCount < 1 ? "retryable" : "manual_fallback",
    message: {
      ar: "تعذر تشغيل الذكاء؛ يمكنك المحاولة مرة أو المتابعة يدوياً.",
      en: "AI was unavailable; retry once or continue manually.",
    },
    canRetry: autoRetryCount < 1,
    canEditManually: true,
    dataPreserved: true,
    autoRetryCount,
    logsContent: false,
  };
}
