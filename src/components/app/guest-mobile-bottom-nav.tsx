import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  FileText,
  LayoutTemplate,
  Mail,
  MoreHorizontal,
  ScanSearch,
  Upload,
  Wand2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const asPath = (to: string) => to as "/dashboard";

type GuestNavItem = {
  id: string;
  to: string;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  icon: typeof Wand2;
  matches?: string[];
};

const PRIMARY_ITEMS: GuestNavItem[] = [
  {
    id: "assistant",
    to: "/assistant",
    label: { ar: "نورة", en: "Noura" },
    description: {
      ar: "ابدأ أو حسّن سيرتك خطوة بخطوة",
      en: "Build or improve your resume step by step",
    },
    icon: Wand2,
  },
  {
    id: "resumes",
    to: "/resumes/new",
    label: { ar: "السيرة", en: "Resume" },
    description: {
      ar: "أنشئ أو حرر سيرتك في هذه الجلسة",
      en: "Create or edit a resume in this session",
    },
    icon: FileText,
    matches: ["/resumes"],
  },
  {
    id: "ats",
    to: "/ats",
    label: { ar: "ATS", en: "ATS" },
    description: {
      ar: "افحص جاهزية السيرة لأنظمة التوظيف",
      en: "Check applicant tracking readiness",
    },
    icon: ScanSearch,
  },
  {
    id: "jobs",
    to: "/jobs",
    label: { ar: "الوظائف", en: "Jobs" },
    description: {
      ar: "حلّل وظيفة واكتب خطاب تقديم محلياً",
      en: "Analyse a job and draft a local cover letter",
    },
    icon: Briefcase,
  },
];

const MORE_ITEMS: GuestNavItem[] = [
  {
    id: "import",
    to: "/import",
    label: { ar: "استيراد", en: "Import" },
    description: {
      ar: "أضف محتوى سيرتك إلى جلسة الضيف",
      en: "Bring resume content into this guest session",
    },
    icon: Upload,
  },
  {
    id: "templates",
    to: "/templates",
    label: { ar: "القوالب", en: "Templates" },
    description: {
      ar: "اختر قالباً قبل التحرير أو أثناءه",
      en: "Choose a template before or during editing",
    },
    icon: LayoutTemplate,
  },
  {
    id: "cover-letters",
    to: "/cover-letters",
    label: { ar: "خطابات التقديم", en: "Cover letters" },
    description: {
      ar: "أنشئ مسودة مرتبطة بالوظيفة محلياً",
      en: "Create a job-linked draft locally",
    },
    icon: Mail,
  },
];

function isActive(item: GuestNavItem, pathname: string) {
  const paths = [item.to, ...(item.matches ?? [])];
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Guest-only mobile navigation. It is present on public and product routes,
 * but never creates an account, writes visitor data, or puts resume content
 * into URL state. The bottom sheet keeps secondary tools reachable by touch
 * and keyboard without crowding a narrow viewport.
 */
export function GuestMobileBottomNav() {
  const { lang } = useI18n();
  const { atLimit, isGuest } = useStore();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const ar = lang === "ar";

  if (!isGuest) return null;

  return (
    <>
      {!atLimit && !pathname.startsWith("/resumes/new") && (
        <Link
          to="/resumes/new"
          aria-label={ar ? "إنشاء سيرة جديدة في هذه الجلسة" : "Create a new resume in this session"}
          className="fixed end-4 z-50 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift motion-safe:transition-transform motion-safe:active:scale-95 md:hidden"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
          data-testid="guest-mobile-create-resume"
        >
          <FileText className="size-6" aria-hidden="true" />
        </Link>
      )}

      <nav
        aria-label={ar ? "تنقل الضيف السريع" : "Guest quick navigation"}
        className="seerati-guest-mobile-nav fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        data-testid="guest-mobile-navigation"
      >
        <ul className="grid grid-cols-5">
          {PRIMARY_ITEMS.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  to={asPath(item.to)}
                  aria-current={active ? "page" : undefined}
                  aria-label={ar ? item.label.ar : item.label.en}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold motion-safe:transition-colors ${
                    active ? "text-emerald-accent" : "text-muted-foreground"
                  }`}
                  data-testid={`guest-mobile-nav-${item.id}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{ar ? item.label.ar : item.label.en}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={ar ? "فتح المزيد من أدوات الضيف" : "Open more guest tools"}
                  className="flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold text-muted-foreground motion-safe:transition-colors"
                  data-testid="guest-mobile-nav-more"
                >
                  <MoreHorizontal className="size-5" aria-hidden="true" />
                  <span>{ar ? "المزيد" : "More"}</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85dvh] overflow-y-auto bg-background px-4 pb-6 pt-4"
              >
                <SheetTitle>{ar ? "أدوات الضيف" : "Guest tools"}</SheetTitle>
                <SheetDescription className="mt-1 text-sm leading-relaxed">
                  {ar
                    ? "استخدم الأدوات الأساسية دون تسجيل. تبقى بيانات السيرة في ذاكرة هذا التبويب إلى أن تحذفها أو تنتهي الجلسة."
                    : "Use core tools without registering. Resume data remains in this tab’s memory until you delete it or the session ends."}
                </SheetDescription>
                <nav
                  className="mt-5 space-y-1"
                  aria-label={ar ? "مزيد من أدوات الضيف" : "More guest tools"}
                >
                  {MORE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item, pathname);
                    return (
                      <Link
                        key={item.id}
                        to={asPath(item.to)}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 text-start motion-safe:transition-colors ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {ar ? item.label.ar : item.label.en}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {ar ? item.description.ar : item.description.en}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                  <p>
                    {ar
                      ? "الحساب اختياري لحفظ نسخة سحابية لاحقاً؛ لا تُنسخ بيانات هذه الجلسة تلقائياً."
                      : "An account is optional for later cloud saving; this session’s data is never copied automatically."}
                  </p>
                  <Link
                    to="/auth"
                    className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {ar ? "عرض خيارات الحساب الاختيارية" : "View optional account choices"}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
