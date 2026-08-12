import {
  Briefcase,
  Upload,
  FileText,
  IdCard,
  Languages,
  LayoutDashboard,
  LayoutTemplate,
  Mic,
  Mail,
  Lock,
  ScanSearch,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserSquare2,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { TEAM_COUNT } from "@/lib/team";

/** Single source of truth for in-app navigation. */
export type AppNavId =
  | "home"
  | "assistant"
  | "career-twin"
  | "career-passport"
  | "career-evidence"
  | "import"
  | "resumes"
  | "jobs"
  | "cover-letters"
  | "keyword-scanner"
  | "interviews"
  | "templates"
  | "arabic-intelligence"
  | "team"
  | "ats"
  | "account"
  | "privacy-center"
  | "admin";

export type AppNavItem = {
  id: AppNavId;
  label: { ar: string; en: string };
  hint?: { ar: string; en: string };
  icon: LucideIcon;
  to: string;
  matches?: string[];
  enabled: boolean;
  adminOnly?: boolean;
  mobile?: boolean;
  group: "main" | "tools" | "footer";
};

export const APP_NAV: AppNavItem[] = [
  {
    id: "assistant",
    label: { ar: "مساعد سيرتي", en: "Seerati Assistant" },
    hint: { ar: "أنشئ سيرتك خطوة بخطوة", en: "Build your resume step by step" },
    icon: Wand2,
    to: "/assistant",
    enabled: true,
    mobile: true,
    group: "main",
  },
  {
    id: "home",
    label: { ar: "الرئيسية", en: "Home" },
    hint: { ar: "مركز القيادة", en: "Command center" },
    icon: LayoutDashboard,
    to: "/dashboard",
    enabled: true,
    mobile: true,
    group: "main",
  },
  {
    id: "career-twin",
    label: { ar: "ملفي المهني", en: "Career profile" },
    hint: { ar: "المصدر الموحّد لبياناتك", en: "Your single source of truth" },
    icon: UserSquare2,
    to: "/career-twin",
    matches: ["/career-profile"],
    enabled: true,
    mobile: true,
    group: "main",
  },
  {
    id: "career-passport",
    label: { ar: "جوازي المهني", en: "Career Passport" },
    hint: { ar: "حقولك المهنية الجاهزة للنسخ", en: "Copy-ready professional fields" },
    icon: IdCard,
    to: "/career-passport",
    enabled: true,
    group: "main",
  },
  {
    id: "career-evidence",
    label: { ar: "خزانة الأدلة", en: "Evidence vault" },
    hint: { ar: "حقائقك الموثّقة", en: "Your verified facts" },
    icon: ShieldCheck,
    to: "/career-evidence",
    enabled: true,
    group: "main",
  },
  {
    id: "import",
    label: { ar: "استيراد", en: "Import" },
    hint: { ar: "من LinkedIn وملفاتك", en: "From LinkedIn and your files" },
    icon: Upload,
    to: "/import",
    enabled: true,
    group: "main",
  },
  {
    id: "resumes",
    label: { ar: "السير الذاتية", en: "Resumes" },
    hint: { ar: "إدارة سيرك وتحريرها", en: "Manage and edit resumes" },
    icon: FileText,
    to: "/resumes/new",
    matches: ["/resumes"],
    enabled: true,
    group: "main",
  },
  {
    id: "jobs",
    label: { ar: "الوظائف", en: "Jobs" },
    hint: { ar: "مساحات التقديم والمطابقة", en: "Workspaces and matching" },
    icon: Briefcase,
    to: "/jobs",
    enabled: true,
    mobile: true,
    group: "main",
  },
  {
    id: "cover-letters",
    label: { ar: "خطابات التقديم", en: "Cover letters" },
    hint: { ar: "مسودات مربوطة بالوظائف", en: "Job-linked drafts" },
    icon: Mail,
    to: "/cover-letters",
    enabled: true,
    group: "main",
  },
  {
    id: "keyword-scanner",
    label: { ar: "ماسح الكلمات", en: "Keyword scanner" },
    hint: { ar: "طابق وصف الوظيفة مع سيرتك", en: "Match the JD to your resume" },
    icon: ScanSearch,
    to: "/keyword-scanner",
    enabled: true,
    group: "tools",
  },
  {
    id: "interviews",
    label: { ar: "المقابلات", en: "Interviews" },
    hint: { ar: "قريباً", en: "Coming soon" },
    icon: Mic,
    to: "/interviews",
    enabled: false,
    group: "main",
  },
  {
    id: "templates",
    label: { ar: "القوالب", en: "Templates" },
    hint: { ar: "اختر تصميم سيرتك", en: "Pick your design" },
    icon: LayoutTemplate,
    to: "/templates",
    enabled: true,
    mobile: true,
    group: "tools",
  },
  {
    id: "arabic-intelligence",
    label: { ar: "ذكاء السيرة العربية", en: "Arabic Intelligence" },
    hint: { ar: "جودة الصياغة والاتساق", en: "Writing quality and consistency" },
    icon: Languages,
    to: "/arabic-intelligence",
    enabled: true,
    group: "tools",
  },
  {
    id: "ats",
    label: { ar: "فحص ATS", en: "ATS check" },
    hint: { ar: "جاهزية أنظمة التوظيف", en: "Applicant tracking readiness" },
    icon: Sparkles,
    to: "/ats",
    enabled: true,
    group: "tools",
  },
  {
    id: "team",
    label: { ar: "فريقي المهني", en: "My career team" },
    hint: {
      ar: `${TEAM_COUNT} مختصاً يعملون معك — مسار وهندسة`,
      en: `${TEAM_COUNT} specialists working with you — career & eng`,
    },
    icon: Sparkles,
    to: "/team",
    enabled: true,
    group: "tools",
  },
  {
    id: "account",
    label: { ar: "حسابي", en: "Account" },
    icon: User,
    to: "/account",
    enabled: true,
    mobile: true,
    group: "footer",
  },
  {
    id: "privacy-center",
    label: { ar: "مركز الخصوصية", en: "Privacy center" },
    hint: { ar: "بياناتك: عرض وتصدير وحذف", en: "View, export, delete your data" },
    icon: Lock,
    to: "/privacy-center",
    enabled: true,
    group: "footer",
  },
  {
    id: "admin",
    label: { ar: "لوحة الإدارة", en: "Admin" },
    icon: Shield,
    to: "/admin",
    matches: ["/admin"],
    enabled: true,
    adminOnly: true,
    group: "footer",
  },
];

export const navByGroup = (group: AppNavItem["group"], isAdmin: boolean) =>
  APP_NAV.filter((i) => i.group === group && (!i.adminOnly || isAdmin));

export const mobileNav = (isAdmin: boolean) =>
  APP_NAV.filter((i) => i.mobile && i.enabled && (!i.adminOnly || isAdmin)).slice(0, 5);

export const isNavActive = (item: AppNavItem, pathname: string): boolean => {
  const paths = [item.to, ...(item.matches ?? [])];
  if (item.id === "home") return pathname === "/dashboard";
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};

export const navForPath = (pathname: string): AppNavItem | undefined =>
  [...APP_NAV].sort((a, b) => b.to.length - a.to.length).find((i) => isNavActive(i, pathname));
