export type ApplicationLaunchpadLocale = "ar" | "en";

export type ApplicationChecklistItem = {
  id: "target" | "resume" | "keywords" | "letter" | "review";
  label: string;
  detail: string;
};

const LOCAL_CHECKLIST: Record<ApplicationLaunchpadLocale, ApplicationChecklistItem[]> = {
  ar: [
    {
      id: "target",
      label: "حدّد الهدف الوظيفي",
      detail: "راجع المسمى والشركة ومتطلبات الوظيفة قبل بدء الحزمة.",
    },
    {
      id: "resume",
      label: "اختر نسخة السيرة",
      detail: "استخدم نسخة تناسب الدور وتعرض أدلة يمكن التحقق منها.",
    },
    {
      id: "keywords",
      label: "طابق كلمات الوصف",
      detail: "قارن متطلبات الوظيفة مع مهاراتك من دون ادعاء خبرة غير موجودة.",
    },
    {
      id: "letter",
      label: "حضّر خطاب التقديم",
      detail: "اربط الخطاب بأدلة من ملفك، ثم راجع كل ادعاء قبل استخدامه.",
    },
    {
      id: "review",
      label: "راجع الحزمة قبل الإرسال",
      detail: "افحص الاسم والتواريخ والروابط ونسخة PDF أو النص المتوافق مع ATS.",
    },
  ],
  en: [
    {
      id: "target",
      label: "Set the job target",
      detail: "Review the role, company, and requirements before building the pack.",
    },
    {
      id: "resume",
      label: "Choose the resume version",
      detail: "Use a version that fits the role and shows verifiable evidence.",
    },
    {
      id: "keywords",
      label: "Map the job keywords",
      detail: "Compare requirements with your skills without claiming unsupported experience.",
    },
    {
      id: "letter",
      label: "Prepare the cover letter",
      detail: "Ground the letter in evidence from your profile and review every claim.",
    },
    {
      id: "review",
      label: "Review before sending",
      detail: "Check names, dates, links, and the PDF or ATS-friendly text version.",
    },
  ],
};

export function applicationChecklist(
  locale: ApplicationLaunchpadLocale,
): ApplicationChecklistItem[] {
  return LOCAL_CHECKLIST[locale].map((item) => ({ ...item }));
}

export function applicationChecklistProgress(
  checked: ReadonlySet<ApplicationChecklistItem["id"]>,
  locale: ApplicationLaunchpadLocale,
) {
  const total = LOCAL_CHECKLIST[locale].length;
  const completed = LOCAL_CHECKLIST[locale].filter((item) => checked.has(item.id)).length;
  return {
    completed,
    total,
    ready: completed === total,
  };
}

export function applicationLaunchpadPrivacyCopy(locale: ApplicationLaunchpadLocale) {
  return locale === "ar"
    ? "تعمل قائمة الجاهزية محلياً في هذه الصفحة فقط. لا تحفظ محتوى سيرتك أو الوصف الوظيفي ولا ترسله تلقائياً."
    : "This readiness checklist works locally on this page only. It does not save your resume or job-description content or send it automatically.";
}
