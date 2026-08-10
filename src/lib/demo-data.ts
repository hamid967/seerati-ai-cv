import { emptyResumeData, uid, type Resume, type ResumeData } from "./types";

export const demoResumeData = (): ResumeData => ({
  ...emptyResumeData(),
  personal: {
    fullName: "نورة العتيبي",
    jobTitle: "محللة بيانات",
    email: "noura@example.com",
    phone: "+966 55 000 0000",
    city: "الرياض",
    country: "السعودية",
    nationality: "سعودية",
  },
  summary:
    "محللة بيانات لديها خمس سنوات من الخبرة في بناء لوحات المؤشرات وتحليل سلوك العملاء لقطاع التجزئة. تعمل على تحويل البيانات إلى قرارات تشغيلية واضحة، وتجيد SQL وPython وPower BI، مع خبرة في التنسيق بين فرق التسويق والعمليات لإطلاق تقارير دورية موثوقة.",
  experience: [
    {
      id: uid(),
      role: "محللة بيانات أولى",
      company: "شركة تجزئة وطنية",
      location: "الرياض",
      start: "2022",
      end: "",
      current: true,
      bullets: [
        "بنيت ١٢ لوحة مؤشرات في Power BI خفّضت زمن إعداد التقارير الشهرية بنسبة ٤٠٪.",
        "طوّرت نموذج تقسيم للعملاء رفع معدل استجابة الحملات من ٦٪ إلى ٩٪.",
        "درّبت ٨ موظفين على قراءة التقارير واستخدام مكعبات البيانات.",
      ],
    },
    {
      id: uid(),
      role: "محللة بيانات",
      company: "مجموعة خدمات لوجستية",
      location: "جدة",
      start: "2019",
      end: "2022",
      bullets: [
        "أتممت أتمتة تقارير التشغيل اليومية باستخدام Python ما وفّر ١٠ ساعات عمل أسبوعياً.",
        "حلّلت أسباب تأخر الشحنات وأسهمت في خفض التأخير ١٥٪ خلال ربعين.",
      ],
    },
  ],
  education: [
    {
      id: uid(),
      degree: "بكالوريوس نظم معلومات إدارية",
      school: "جامعة الملك سعود",
      start: "2015",
      end: "2019",
      note: "تقدير ممتاز",
    },
  ],
  skills: [
    { id: uid(), name: "SQL", level: 5 },
    { id: uid(), name: "Python", level: 4 },
    { id: uid(), name: "Power BI", level: 5 },
    { id: uid(), name: "تحليل الأعمال", level: 4 },
    { id: uid(), name: "Excel المتقدم", level: 5 },
    { id: uid(), name: "إعداد التقارير", level: 4 },
  ],
  languages: [
    { id: uid(), name: "العربية", level: "اللغة الأم" },
    { id: uid(), name: "الإنجليزية", level: "متقدم" },
  ],
  certificates: [{ id: uid(), title: "Microsoft Power BI Data Analyst", detail: "2023" }],
  projects: [
    { id: uid(), title: "لوحة مؤشرات المخزون", detail: "نموذج بيانات موحّد لفروع المنطقة الوسطى." },
  ],
  achievements: [{ id: uid(), title: "جائزة أفضل تحسين تشغيلي", detail: "2023" }],
  volunteering: [
    { id: uid(), title: "متطوعة في مبادرة تعليم البيانات", detail: "٤٠ ساعة تدريب مجاني." },
  ],
  links: [{ id: uid(), label: "LinkedIn", url: "linkedin.com/in/example" }],
  references: [],
  custom: [],
});

export const demoResume = (ownerId: string): Resume => ({
  id: uid(),
  ownerId,
  title: "سيرة محللة بيانات (تجريبية)",
  templateId: "saudi-professional",
  language: "ar",
  data: demoResumeData(),
  status: "complete",
  completionScore: 100,
  atsScore: 86,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const demoUsers = [
  {
    id: "u_demo",
    email: "demo@seerati.sa",
    fullName: "نورة العتيبي",
    role: "user" as const,
    resumes: 2,
    joined: "2026-05-02",
  },
  {
    id: "u_2",
    email: "salem@example.com",
    fullName: "سالم القحطاني",
    role: "user" as const,
    resumes: 3,
    joined: "2026-06-11",
  },
  {
    id: "u_3",
    email: "huda@example.com",
    fullName: "هدى الزهراني",
    role: "user" as const,
    resumes: 1,
    joined: "2026-07-01",
  },
  {
    id: "u_admin",
    email: "admin@seerati.sa",
    fullName: "مسؤول النظام",
    role: "admin" as const,
    resumes: 0,
    joined: "2026-01-15",
  },
];

export const auditLog = [
  {
    id: "a1",
    at: "2026-08-09 21:14",
    actor: "admin@seerati.sa",
    action: "template.update",
    target: "modern",
  },
  {
    id: "a2",
    at: "2026-08-09 18:02",
    actor: "admin@seerati.sa",
    action: "user.role.view",
    target: "salem@example.com",
  },
  {
    id: "a3",
    at: "2026-08-08 12:40",
    actor: "admin@seerati.sa",
    action: "settings.update",
    target: "usage_limits",
  },
];
