import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Globe, Menu, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { APP_NAV, navForPath } from "@/lib/app-navigation";
import { useAppChrome } from "./app-chrome";
import { AppSidebarNav } from "./app-sidebar";

export type AppTopbarProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  back?: { to: string; label?: string };
};

const asPath = (to: string) => to as "/dashboard";

export function AppTopbar({ title, subtitle, actions, back }: AppTopbarProps) {
  const { lang, toggle } = useI18n();
  const ar = lang === "ar";
  const { user, signOut, atLimit } = useStore();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setPaletteOpen, drawerOpen, setDrawerOpen } = useAppChrome();

  const current = navForPath(pathname);
  const heading = title ?? (current ? (ar ? current.label.ar : current.label.en) : "سيرتي");
  const BackIcon = ar ? ArrowRight : ArrowLeft;

  const quickCreate = APP_NAV.filter((i) => i.enabled && (i.id === "resumes" || i.id === "jobs"));

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile / tablet nav drawer */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:hidden"
                aria-label={ar ? "القائمة" : "Menu"}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={ar ? "right" : "left"} className="w-[268px] bg-sidebar p-4">
              <SheetTitle className="sr-only">{ar ? "التنقل" : "Navigation"}</SheetTitle>
              <AppSidebarNav collapsed={false} onNavigate={() => setDrawerOpen(false)} />
            </SheetContent>
          </Sheet>

          {back && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label={back.label ?? (ar ? "رجوع" : "Back")}
              onClick={() => router.navigate({ to: asPath(back.to) })}
            >
              <BackIcon className="size-4" />
            </Button>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">{heading}</h1>
            {subtitle && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {actions}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-10 gap-2 text-muted-foreground lg:flex"
          >
            <Search className="size-4" />
            <span>{ar ? "بحث سريع" : "Quick search"}</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 lg:hidden"
            onClick={() => setPaletteOpen(true)}
            aria-label={ar ? "بحث" : "Search"}
          >
            <Search className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="size-11" aria-label={ar ? "إنشاء" : "Create"}>
                <Plus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild disabled={atLimit}>
                <Link to="/resumes/new">
                  {atLimit
                    ? ar
                      ? "وصلت الحد الأقصى للسير"
                      : "Resume limit reached"
                    : ar
                      ? "سيرة ذاتية جديدة"
                      : "New resume"}
                </Link>
              </DropdownMenuItem>
              {quickCreate.some((i) => i.id === "jobs") && (
                <DropdownMenuItem asChild>
                  <Link to="/jobs">{ar ? "مساحة وظيفة" : "Job workspace"}</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={toggle}
            aria-label={ar ? "تغيير اللغة" : "Switch language"}
          >
            <Globe className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={ar ? "الحساب" : "Account"}
              >
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {(user?.fullName || user?.email || "?").trim().charAt(0).toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-semibold">
                  {user?.fullName || (ar ? "مستخدم" : "User")}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/account">{ar ? "حسابي" : "Account"}</Link>
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link to="/admin">{ar ? "لوحة الإدارة" : "Admin"}</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void signOut()}>
                {ar ? "تسجيل الخروج" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
