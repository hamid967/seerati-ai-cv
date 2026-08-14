import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  UserSquare2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n, useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function SiteHeader() {
  const t = useT();
  const { lang, toggle } = useI18n();
  const { user, signOut } = useStore();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  /** Homepage hides login/signup — guests start via templates then register. */
  const hideAuthCtas = !user && pathname === "/";
  const ar = lang === "ar";

  useEffect(() => {
    if (!exploreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExploreOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [exploreOpen]);

  const links = [
    { to: "/templates", label: t("nav_templates") },
    { to: "/team", label: t("nav_team") },
  ] as const;

  const memberLinks = [
    { href: "/career-twin", label: t("nav_career_twin"), icon: UserSquare2 },
    { href: "/jobs", label: t("nav_jobs"), icon: Briefcase },
  ] as const;

  return (
    <header className="seerati-site-header sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="seerati-logo-cube grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            {t("brand")}
            <span className="ms-1 text-xs font-medium text-muted-foreground">Seerati</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={exploreOpen}
              aria-haspopup="menu"
              onClick={() => setExploreOpen((value) => !value)}
              className="gap-1.5 text-sm font-medium text-muted-foreground"
            >
              <Sparkles className="size-4" />
              {ar ? "استكشف" : "Explore"}
              <ChevronDown
                className={`size-3.5 transition-transform ${exploreOpen ? "rotate-180" : ""}`}
              />
            </Button>
            {exploreOpen && (
              <div
                role="menu"
                aria-label={ar ? "استكشف سيرتي" : "Explore Seerati"}
                className="absolute start-0 top-[calc(100%+0.75rem)] z-50 grid w-[min(42rem,calc(100vw-2rem))] grid-cols-1 gap-4 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur md:grid-cols-3"
              >
                <div className="space-y-2">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {ar ? "ابنِ" : "Build"}
                  </p>
                  <Link
                    role="menuitem"
                    to="/assistant"
                    search={{ agent: "noura" }}
                    onClick={() => setExploreOpen(false)}
                    className="group block rounded-xl p-3 hover:bg-secondary"
                  >
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {ar ? "ابدأ سيرتك مجانًا" : "Start your resume free"}
                      <ArrowUpRight className="size-4 opacity-60 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {ar
                        ? "مجاني، دون تسجيل، وذاكرة مؤقتة"
                        : "Free, registration-optional, memory-only"}
                    </span>
                  </Link>
                  <Link
                    role="menuitem"
                    to="/templates"
                    onClick={() => setExploreOpen(false)}
                    className="group block rounded-xl p-3 hover:bg-secondary"
                  >
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {ar ? "تصفّح القوالب" : "Browse templates"}
                      <ArrowUpRight className="size-4 opacity-60 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {ar
                        ? "24 قالباً أصلياً بلا علامة مائية"
                        : "24 original watermark-free templates"}
                    </span>
                  </Link>
                </div>
                <div className="space-y-2">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {ar ? "حسّن" : "Improve"}
                  </p>
                  <Link
                    role="menuitem"
                    to="/features"
                    onClick={() => setExploreOpen(false)}
                    className="group block rounded-xl p-3 hover:bg-secondary"
                  >
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {ar ? "المزايا" : "Features"}
                      <ArrowUpRight className="size-4 opacity-60 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {ar ? "ذكاء اصطناعي وفحص ATS وPDF" : "AI guidance, ATS checks, and PDF"}
                    </span>
                  </Link>
                  <Link
                    role="menuitem"
                    to="/ats"
                    onClick={() => setExploreOpen(false)}
                    className="group block rounded-xl p-3 hover:bg-secondary"
                  >
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {ar ? "فحص ATS" : "ATS check"}
                      <ArrowUpRight className="size-4 opacity-60 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {ar ? "إرشاد عملي دون وعود توظيف" : "Practical guidance, no hiring promises"}
                    </span>
                  </Link>
                </div>
                <div className="space-y-2">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {ar ? "اطمئن" : "Trust"}
                  </p>
                  <Link
                    role="menuitem"
                    to="/privacy"
                    onClick={() => setExploreOpen(false)}
                    className="group block rounded-xl p-3 hover:bg-secondary"
                  >
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {ar ? "الخصوصية أولاً" : "Privacy first"}
                      <ArrowUpRight className="size-4 opacity-60 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {ar ? "تحكم واضح وحذف فوري للجلسة" : "Clear controls and immediate deletion"}
                    </span>
                  </Link>
                  <Link
                    role="menuitem"
                    to="/team"
                    onClick={() => setExploreOpen(false)}
                    className="group block rounded-xl p-3 hover:bg-secondary"
                  >
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {ar ? "فريق التصميم" : "Design team"}
                      <ArrowUpRight className="size-4 opacity-60 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {ar ? "هوية سعودية مهنية أصلية" : "Original Saudi professional identity"}
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
          {user &&
            memberLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <l.icon className="size-4" />
                {l.label}
              </a>
            ))}
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{
                className:
                  "rounded-md px-3 py-2 text-sm font-semibold text-foreground bg-secondary",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            aria-label={`${t("language")}: ${lang === "ar" ? "EN" : "ع"}`}
          >
            <Globe className="size-4" />
            {lang === "ar" ? "EN" : "ع"}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  {user.fullName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="size-4" /> {t("nav_dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/career-twin";
                  }}
                >
                  <UserSquare2 className="size-4" /> {t("nav_career_twin")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/jobs";
                  }}
                >
                  <Briefcase className="size-4" /> {t("nav_jobs")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.navigate({ to: "/account" })}>
                  {t("nav_account")}
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => router.navigate({ to: "/admin" })}>
                    <Shield className="size-4" /> {t("nav_admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    void signOut();
                    router.navigate({ to: "/" });
                  }}
                >
                  <LogOut className="size-4" /> {t("nav_logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !hideAuthCtas && (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">{t("nav_login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/assistant" search={{ agent: "noura" }}>
                    {ar ? "ابدأ سيرتك مجانًا" : "Start free"}
                  </Link>
                </Button>
              </div>
            )
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={lang === "ar" ? "left" : "right"} className="w-72">
              <nav className="mt-10 flex flex-col gap-1">
                {user &&
                  memberLinks.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                    >
                      <l.icon className="size-4" />
                      {l.label}
                    </a>
                  ))}
                <Link
                  to="/assistant"
                  search={{ agent: "noura" }}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-semibold text-primary hover:bg-secondary"
                >
                  {ar ? "ابدأ سيرتك مجانًا" : "Start your resume free"}
                </Link>
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                      {t("nav_dashboard")}
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                      {t("nav_account")}
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                        router.navigate({ to: "/" });
                      }}
                      className="rounded-md px-3 py-2.5 text-start text-sm font-medium text-destructive hover:bg-secondary"
                    >
                      {t("nav_logout")}
                    </button>
                  </>
                ) : (
                  !hideAuthCtas && (
                    <>
                      <Link
                        to="/auth"
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                      >
                        {t("nav_login")}
                      </Link>
                      <Link
                        to="/assistant"
                        search={{ agent: "noura" }}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2.5 text-sm font-semibold text-primary hover:bg-secondary"
                      >
                        {ar ? "ابدأ سيرتك مجانًا" : "Start free"}
                      </Link>
                    </>
                  )
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
