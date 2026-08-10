import { Link, useRouter } from "@tanstack/react-router";
import { FileText, Globe, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function SiteHeader() {
  const t = useT();
  const { lang, toggle } = useI18n();
  const { user, signOut } = useStore();
  const router = useRouter();

  const links = [
    { to: "/templates", label: t("nav_templates") },
    { to: "/features", label: t("nav_features") },
    { to: "/ats", label: t("nav_ats") },
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
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-foreground bg-secondary" }}
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
                <Button variant="outline" size="sm">
                  {user.fullName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="size-4" /> {t("nav_dashboard")}
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
                    signOut();
                    router.navigate({ to: "/" });
                  }}
                >
                  <LogOut className="size-4" /> {t("nav_logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{t("nav_login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  {t("nav_start")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
