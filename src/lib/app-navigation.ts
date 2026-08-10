import {
  Briefcase,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Mic,
  Mail,
  Shield,
  Sparkles,
  User,
  UserSquare2,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for in-app navigation.
 *
 * The sidebar, the mobile bottom bar and the command palette all read this
 * list, so a new Phase 4 surface only has to be registered once. Items whose
 * route does not exist yet stay `enabled: false` — they render as
 * "coming soon" instead of a broken link.
 */

export type AppNavId =
  | "home"
  | "career-twin"
  | "resumes"
  | "jobs"
  | "cover-letters"
  | "interviews"
  | "templates"
  | "team"
  | "ats"
  | "account"
  | "admin";

export type AppNavItem = {
  id: AppNavId;
  label: { ar: string; en: string };
  hint?: { ar: string; en: string };
  icon: LucideIcon;
  /** Router path. Only navigated to when `enabled` is true. */
  to: string;
  /** Extra path prefixes that should mark this item active. */
  matches?: string[];
  enabled: boolean;
  adminOnly?: boolean;
  /** Shown in the mobile bottom bar (max 5 across the whole config). */
  mobile?: boolean;
  group: "main" | "tools" | "footer";
};

export const APP_NAV: AppNavItem[] = [
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
    hint: { ar: "قريباً", en: "Coming soon" },
    icon: Mail,
    to: "/cover-letters",
    enabled: false,
    group: "main",
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
    hint: { ar: "قريباً", en: "Coming soon" },
    icon: Sparkles,
    to: "/team",
    enabled: false,
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

/** Up to 5 destinations for the mobile bottom bar, in config order. */
export const mobileNav = (isAdmin: boolean) =>
  APP_NAV.filter((i) => i.mobile && i.enabled && (!i.adminOnly || isAdmin)).slice(0, 5);

export const isNavActive = (item: AppNavItem, pathname: string): boolean => {
  const paths = [item.to, ...(item.matches ?? [])];
  if (item.id === "home") return pathname === "/dashboard";
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};

/** The nav item that best describes the current pathname (for the app bar). */
export const navForPath = (pathname: string): AppNavItem | undefined =>
  [...APP_NAV].sort((a, b) => b.to.length - a.to.length).find((i) => isNavActive(i, pathname));
