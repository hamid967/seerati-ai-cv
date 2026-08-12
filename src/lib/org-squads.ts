/**
 * Product-facing snapshot of Seerati engineering & delivery squads.
 * Distilled from docs/SAUDI_MARKET_LEADERSHIP_100_TEAM.md for /team — not a
 * full headcount roster.
 */

export type OrgSquad = {
  id: string;
  name: { ar: string; en: string };
  focus: { ar: string; en: string };
  roles: { ar: string; en: string }[];
};

/** Engineering-heavy squads shown on the public team page. */
export const ENGINEERING_SQUADS: OrgSquad[] = [
  {
    id: "frontend",
    name: { ar: "الواجهات ونظام التصميم", en: "Frontend & Design System" },
    focus: {
      ar: "React / TanStack، RTL، إمكانية الوصول، والأداء.",
      en: "React / TanStack, RTL, accessibility and performance.",
    },
    roles: [
      { ar: "مهندس واجهات رئيسي", en: "Principal frontend architect" },
      { ar: "مهندس React/TanStack", en: "Staff React/TanStack engineer" },
      { ar: "مهندس TypeScript", en: "Senior TypeScript engineer" },
      { ar: "مهندس RTL/i18n", en: "RTL/i18n engineer" },
      { ar: "مهندس إمكانية وصول", en: "Accessibility engineer" },
      { ar: "مهندس أداء ويب", en: "Web performance engineer" },
    ],
  },
  {
    id: "backend",
    name: { ar: "الخوادم والبيانات والمنصة", en: "Backend, Data & Platform" },
    focus: {
      ar: "Supabase / Postgres، واجهات البرمجة، وRLS.",
      en: "Supabase / Postgres, APIs and multi-tenant RLS.",
    },
    roles: [
      { ar: "مهندس منصات رئيسي", en: "Principal backend architect" },
      { ar: "مهندس Supabase/Postgres", en: "Staff Supabase/Postgres engineer" },
      { ar: "مهندس واجهات برمجة", en: "Senior API engineer" },
      { ar: "مهندس قواعد بيانات", en: "Senior database engineer" },
      { ar: "مهندس RLS وتعدد المستأجرين", en: "RLS & multi-tenant engineer" },
      { ar: "مهندس مهام خلفية", en: "Background jobs engineer" },
    ],
  },
  {
    id: "documents",
    name: { ar: "مستند السيرة والعرض", en: "Resume Document & Rendering" },
    focus: {
      ar: "PDF، الطباعة، القوالب، وترقيم صفحات A4.",
      en: "PDF, print, templates and A4 pagination.",
    },
    roles: [
      { ar: "مهندس مستندات PDF", en: "PDF document engineer" },
      { ar: "مهندس طباعة وعربية", en: "Print & Arabic typography engineer" },
      { ar: "مهندس قوالب", en: "Template engineer" },
      { ar: "مهندس ترقيم صفحات", en: "Pagination engineer" },
    ],
  },
  {
    id: "ai",
    name: { ar: "الذكاء الاصطناعي والمسار المهني", en: "AI & Career Intelligence" },
    focus: {
      ar: "المطالبات، السلامة، المطابقة، والتقييم ثنائي اللغة.",
      en: "Prompts, safety, matching and bilingual evaluation.",
    },
    roles: [
      { ar: "مهندس LLM", en: "LLM engineer" },
      { ar: "مهندس سلامة وقيود", en: "AI safety engineer" },
      { ar: "مهندس مطالبات", en: "Prompt engineer" },
      { ar: "مهندس مطابقة وظائف", en: "Job-matching engineer" },
      { ar: "مهندس تقييم ثنائي اللغة", en: "Bilingual eval engineer" },
    ],
  },
];

export const ENGINEERING_SQUAD_COUNT = ENGINEERING_SQUADS.length;
