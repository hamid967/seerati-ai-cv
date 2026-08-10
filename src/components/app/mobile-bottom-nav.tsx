import { Link, useRouterState } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { isNavActive, mobileNav } from "@/lib/app-navigation";
import { AppSidebarNav } from "./app-sidebar";

const asPath = (to: string) => to as "/dashboard";

/**
 * Mobile bottom navigation. Four config destinations + a "more" sheet, with a
 * floating create action above the bar. Reads the same central nav config as
 * the sidebar and the command palette.
 */
export function MobileBottomNav() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, atLimit } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = mobileNav(user?.role === "admin").slice(0, 4);

  return (
    <>
      {!atLimit && (
        <Link
          to="/resumes/new"
          aria-label={ar ? "سيرة ذاتية جديدة" : "New resume"}
          className="fixed end-4 z-40 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift transition-transform active:scale-95 md:hidden"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
        >
          <Plus className="size-6" />
        </Link>
      )}

      <nav
        aria-label={ar ? "التنقل السريع" : "Primary navigation"}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const active = isNavActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  to={asPath(item.to)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors ${
                    active ? "text-emerald-accent" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
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
                  className="flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-muted-foreground"
                >
                  <MoreHorizontal className="size-5" />
                  <span>{ar ? "المزيد" : "More"}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto bg-sidebar p-4">
                <SheetTitle className="sr-only">{ar ? "كل الأدوات" : "All tools"}</SheetTitle>
                <AppSidebarNav collapsed={false} />
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
