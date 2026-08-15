export type CareerRoadmapLocale = "ar" | "en";
export type CareerRoadmapFocus = "skills" | "portfolio" | "network" | "applications";
export type CareerRoadmapHorizon = "3" | "6" | "12";

export type CareerRoadmapMilestone = {
  id: "foundation" | "proof" | "review";
  period: string;
  title: string;
  detail: string;
};

const FOCUS_COPY: Record<
  CareerRoadmapLocale,
  Record<CareerRoadmapFocus, { title: string; action: string }>
> = {
  ar: {
    skills: { title: "المهارات", action: "اختيار مهارة عملية وبناء دليل صغير على استخدامها" },
    portfolio: {
      title: "المحفظة",
      action: "تنظيم مشروع أو دراسة حالة توضح دورك ونتيجته القابلة للتأكيد",
    },
    network: {
      title: "العلاقات المهنية",
      action: "إعداد قائمة تواصل صغيرة ورسائل مهنية يراجعها المستخدم قبل إرسالها",
    },
    applications: {
      title: "التقديم",
      action: "تخصيص حزمة طلب واحدة لكل فرصة ومراجعتها قبل الإرسال",
    },
  },
  en: {
    skills: {
      title: "Skills",
      action: "Choose one practical skill and build a small proof of using it",
    },
    portfolio: {
      title: "Portfolio",
      action: "Organise a project or case study that explains your role and verifiable result",
    },
    network: {
      title: "Professional network",
      action: "Prepare a small outreach list and messages for user review before sending",
    },
    applications: {
      title: "Applications",
      action: "Tailor one application pack for each opportunity and review it before sending",
    },
  },
};

const PERIODS: Record<
  CareerRoadmapLocale,
  Record<CareerRoadmapHorizon, [string, string, string]>
> = {
  ar: {
    "3": ["الأسبوع 1", "الأسبوع 2", "الأسبوع 3–4"],
    "6": ["الشهر 1", "الشهر 2–3", "الشهر 4–6"],
    "12": ["الشهر 1–2", "الشهر 3–6", "الشهر 7–12"],
  },
  en: {
    "3": ["Week 1", "Week 2", "Weeks 3–4"],
    "6": ["Month 1", "Months 2–3", "Months 4–6"],
    "12": ["Months 1–2", "Months 3–6", "Months 7–12"],
  },
};

export function createCareerRoadmap(input: {
  locale: CareerRoadmapLocale;
  focus: CareerRoadmapFocus;
  horizon: CareerRoadmapHorizon;
  targetRole: string;
}): CareerRoadmapMilestone[] {
  const target =
    input.targetRole.trim() || (input.locale === "ar" ? "الدور المستهدف" : "your target role");
  const focus = FOCUS_COPY[input.locale][input.focus];
  const [foundation, proof, review] = PERIODS[input.locale][input.horizon];

  if (input.locale === "ar") {
    return [
      {
        id: "foundation",
        period: foundation,
        title: `تحديد اتجاه ${target}`,
        detail: `اكتب سبب ارتباطك بالدور، ثم راجع الأدلة الحالية في سيرتك. التركيز المبدئي: ${focus.title}.`,
      },
      {
        id: "proof",
        period: proof,
        title: "بناء دليل قابل للمراجعة",
        detail: focus.action,
      },
      {
        id: "review",
        period: review,
        title: "مراجعة وتكييف المسار",
        detail: "راجع ما اكتمل، حدّث السيرة أو المحفظة بالحقائق فقط، ثم اختر الخطوة التالية بنفسك.",
      },
    ];
  }

  return [
    {
      id: "foundation",
      period: foundation,
      title: `Clarify direction for ${target}`,
      detail: `Write why the role fits, then review the evidence already in your resume. Initial focus: ${focus.title}.`,
    },
    {
      id: "proof",
      period: proof,
      title: "Build reviewable proof",
      detail: focus.action,
    },
    {
      id: "review",
      period: review,
      title: "Review and adapt the plan",
      detail:
        "Review what is complete, update your resume or portfolio with facts only, then choose your next step yourself.",
    },
  ];
}

export function careerRoadmapPrivacyCopy(locale: CareerRoadmapLocale) {
  return locale === "ar"
    ? "يبقى هدفك وخيارات الخطة في ذاكرة الصفحة فقط. لا تحفظ سيرتي هذه البيانات ولا تنقلها إلى حساب أو خدمة خارجية تلقائياً."
    : "Your target and plan choices remain in this page's memory only. Seerati does not automatically save them or transfer them to an account or external service.";
}
