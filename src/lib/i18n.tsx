import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const dict: Dict = {
  brand: { ar: "سيرتي", en: "Seerati" },
  tagline: {
    ar: "سيرة ذاتية احترافية بالذكاء الاصطناعي",
    en: "Professional AI-powered resumes",
  },
  nav_templates: { ar: "القوالب", en: "Templates" },
  nav_features: { ar: "المزايا", en: "Features" },
  nav_ats: { ar: "فحص ATS", en: "ATS Check" },
  nav_dashboard: { ar: "لوحتي", en: "Dashboard" },
  nav_login: { ar: "تسجيل الدخول", en: "Sign in" },
  nav_start: { ar: "ابدأ الآن", en: "Get started" },
  nav_logout: { ar: "خروج", en: "Sign out" },
  nav_account: { ar: "حسابي", en: "Account" },
  nav_admin: { ar: "الإدارة", en: "Admin" },

  hero_badge: { ar: "مصمم للسوق السعودي والخليجي", en: "Built for Saudi & Gulf hiring" },
  hero_title_1: { ar: "اكتب سيرتك الذاتية", en: "Build your resume" },
  hero_title_2: { ar: "بمساعدة الذكاء الاصطناعي", en: "with AI assistance" },
  hero_sub: {
    ar: "اختر قالباً، أدخل بياناتك، دع «مساعد سيرتي» يحسّن الصياغة، ثم نزّل ملف PDF جاهزاً لأنظمة التوظيف.",
    en: "Pick a template, add your details, let the Seerati Assistant refine your wording, then download an ATS-ready PDF.",
  },
  hero_cta: { ar: "أنشئ سيرتي مجاناً", en: "Create my resume" },
  hero_cta2: { ar: "استعرض القوالب", en: "Browse templates" },
  hero_note: { ar: "تدعم العربية والإنجليزية · حتى ٣ سير ذاتية لكل حساب", en: "Arabic & English · up to 3 resumes per account" },

  steps_title: { ar: "ثلاث خطوات فقط", en: "Just three steps" },
  step1_t: { ar: "اختر القالب", en: "Choose a template" },
  step1_d: { ar: "قوالب متوافقة مع أنظمة ATS وأخرى عصرية وإبداعية.", en: "ATS-friendly, modern and creative layouts." },
  step2_t: { ar: "أدخل بياناتك", en: "Add your details" },
  step2_d: { ar: "نموذج متعدد الخطوات مع حفظ تلقائي ومعاينة مباشرة.", en: "Multi-step form with autosave and live preview." },
  step3_t: { ar: "حسّن ونزّل", en: "Refine & download" },
  step3_d: { ar: "تحسين بالذكاء الاصطناعي، فحص ATS، ثم تنزيل PDF.", en: "AI refinement, ATS check, then PDF export." },

  templates_title: { ar: "قوالب مصممة بعناية", en: "Carefully crafted templates" },
  templates_sub: { ar: "كل قالب يدعم العربية والإنجليزية ويمكن تبديله في أي وقت.", en: "Every template supports Arabic and English and can be switched anytime." },
  ai_title: { ar: "مساعد سيرتي", en: "Seerati Assistant" },
  ai_sub: { ar: "مساعد كتابة داخل المحرر يساعدك على الصياغة المهنية.", en: "An in-editor writing assistant for professional phrasing." },
  ats_title: { ar: "جاهزية أنظمة التوظيف (ATS)", en: "ATS readiness" },
  ats_sub: {
    ar: "فحص أولي يعتمد على قواعد واضحة: اكتمال الحقول، طول الملخص، عناوين الأقسام، ومعلومات الاتصال.",
    en: "A rule-based check: field completeness, summary length, section headings and contact details.",
  },
  faq_title: { ar: "الأسئلة الشائعة", en: "FAQ" },
  cta_title: { ar: "ابدأ سيرتك الذاتية اليوم", en: "Start your resume today" },
  cta_sub: { ar: "أنشئ حساباً وجرّب المحرر كاملاً.", en: "Create an account and try the full editor." },

  footer_rights: { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  footer_product: { ar: "المنتج", en: "Product" },
  footer_company: { ar: "الشركة", en: "Company" },

  auth_signin: { ar: "تسجيل الدخول", en: "Sign in" },
  auth_signup: { ar: "إنشاء حساب", en: "Create account" },
  auth_reset: { ar: "استعادة كلمة المرور", en: "Reset password" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  full_name: { ar: "الاسم الكامل", en: "Full name" },
  forgot: { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },

  dash_title: { ar: "سيري الذاتية", en: "My resumes" },
  dash_new: { ar: "سيرة ذاتية جديدة", en: "New resume" },
  usage: { ar: "الاستخدام", en: "Usage" },
  duplicate: { ar: "استنساخ", en: "Duplicate" },
  rename: { ar: "إعادة تسمية", en: "Rename" },
  delete: { ar: "حذف", en: "Delete" },
  edit: { ar: "تحرير", en: "Edit" },
  preview: { ar: "معاينة", en: "Preview" },
  updated: { ar: "آخر تعديل", en: "Last updated" },
  completeness: { ar: "الاكتمال", en: "Completeness" },
  template: { ar: "القالب", en: "Template" },
  empty_resumes: { ar: "لا توجد سير ذاتية بعد", en: "No resumes yet" },
  empty_resumes_d: { ar: "أنشئ أول سيرة ذاتية خلال دقائق.", en: "Create your first resume in minutes." },
  limit_reached: { ar: "وصلت الحد الأقصى (٣ سير ذاتية)", en: "You reached the limit of 3 resumes" },

  saved: { ar: "تم الحفظ", en: "Saved" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  download_pdf: { ar: "تنزيل PDF", en: "Download PDF" },
  download_txt: { ar: "نسخة نصية ATS", en: "ATS plain text" },
  back: { ar: "رجوع", en: "Back" },
  next: { ar: "التالي", en: "Next" },
  add: { ar: "إضافة", en: "Add" },
  language: { ar: "اللغة", en: "Language" },
};

export function useT() {
  const { lang } = useI18n();
  return (key: keyof typeof dict | string) => {
    const entry = dict[key as string];
    return entry ? entry[lang] : (key as string);
  };
}

type Ctx = { lang: Lang; dir: "rtl" | "ltr"; setLang: (l: Lang) => void; toggle: () => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem("seerati.lang") as Lang | null;
    if (stored === "ar" || stored === "en") setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("seerati.lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggle: () => setLang((p) => (p === "ar" ? "en" : "ar")),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { lang: "ar" as Lang, dir: "rtl" as const, setLang: () => {}, toggle: () => {} };
  return ctx;
}
