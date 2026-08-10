import { Link, useRouter } from "@tanstack/react-router";
import {
  Briefcase,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  UserSquare2,
} from "lucide-react";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/templates", label: t("nav_templates") },
    { to: "/features", label: t("nav_features") },
    { to: "/ats", label: t("nav_ats") },
  ] as const;

  // /career-twin and /jobs are new surfaces still being wired up by another
  // workstream, so they are plain links (not typed router Links) for now.
  const memberLinks = [
    { href: "/career-twin", label: t("nav_career_twin"), icon: UserSquare2 },
    { href: "/jobs", label: t("nav_jobs"), icon: Briefcase },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            {t("brand")}
            <span className="ms-1 text-xs font-medium text-muted-foreground">Seerati</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
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
          <Button variant="ghost" size="sm" onClick={toggle} aria-label={t("language")}>
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
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{t("nav_login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  {t("nav_start")}
                </Link>
              </Button>
            </div>
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
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                      {t("nav_login")}
                    </Link>
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-semibold text-primary hover:bg-secondary"
                    >
                      {t("nav_start")}
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
