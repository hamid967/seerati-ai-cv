import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsLeftRight, FileText, HelpCircle, LogOut, PanelsTopLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { APP_NAV, isNavActive, navByGroup, type AppNavItem } from "@/lib/app-navigation";
import { useAppChrome } from "./app-chrome";

/** Casts a config path to a router path so typed <Link> stays happy. */
const asPath = (to: string) => to as "/dashboard";

function NavRow({
  item,
  active,
  collapsed,
  ar,
  onNavigate,
}: {
  item: AppNavItem;
  active: boolean;
  collapsed: boolean;
  ar: boolean;
  onNavigate?: () => void;
}) {
  const label = ar ? item.label.ar : item.label.en;
  const Icon = item.icon;

  const base =
    "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150";

  if (!item.enabled) {
    const row = (
      <span
        aria-disabled="true"
        className={`${base} cursor-default text-sidebar-foreground/45`}
        title={ar ? "قريباً" : "Coming soon"}
      >
        <Icon className="size-[18px] shrink-0" />
        {!collapsed && (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate">{label}</span>
            <span className="shrink-0 rounded-md border border-sidebar-border px-1.5 py-0.5 text-[10px] font-semibold">
              {ar ? "قريباً" : "Soon"}
            </span>
          </span>
        )}
      </span>
    );
    return collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent
          side={ar ? "left" : "right"}
        >{`${label} — ${ar ? "قريباً" : "Soon"}`}</TooltipContent>
      </Tooltip>
    ) : (
      row
    );
  }

  const row = (
    <Link
      to={asPath(item.to)}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      } ${collapsed ? "justify-center px-0" : ""}`}
    >
      <Icon className={`size-[18px] shrink-0 ${active ? "text-emerald-accent" : ""}`} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side={ar ? "left" : "right"}>{label}</TooltipContent>
    </Tooltip>
  ) : (
    row
  );
}

export function AppSidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, signOut } = useStore();
  const isAdmin = user?.role === "admin";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups: { key: AppNavItem["group"]; title?: { ar: string; en: string } }[] = [
    { key: "main" },
    { key: "tools", title: { ar: "أدوات", en: "Tools" } },
  ];

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex h-full min-h-0 flex-col gap-4">
        {/* Brand */}
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-accent/15 text-emerald-accent">
            <FileText className="size-[18px]" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-base font-extrabold tracking-tight text-sidebar-foreground">
                سيرتي
              </span>
              <span className="block truncate text-[11px] font-medium text-sidebar-foreground/55">
                Seerati
              </span>
            </span>
          )}
        </Link>

        {/* Workspace identity */}
        {!collapsed && (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/55">
              {ar ? "مساحة العمل" : "Workspace"}
            </p>
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {ar ? "مسيرتي المهنية" : "My career"}
            </p>
          </div>
        )}

        <nav
          className="min-h-0 flex-1 overflow-y-auto pe-0.5"
          aria-label={ar ? "التنقل" : "Navigation"}
        >
          {groups.map((g) => {
            const items = navByGroup(g.key, isAdmin);
            if (!items.length) return null;
            return (
              <div key={g.key} className="mb-4 space-y-1">
                {g.title && !collapsed && (
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/45">
                    {ar ? g.title.ar : g.title.en}
                  </p>
                )}
                {items.map((item) => (
                  <NavRow
                    key={item.id}
                    item={item}
                    active={isNavActive(item, pathname)}
                    collapsed={collapsed}
                    ar={ar}
                    {...(onNavigate ? { onNavigate } : {})}
                  />
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer: account / admin / help / sign out */}
        <div className="space-y-1 border-t border-sidebar-border pt-3">
          {navByGroup("footer", isAdmin).map((item) => (
            <NavRow
              key={item.id}
              item={item}
              active={isNavActive(item, pathname)}
              collapsed={collapsed}
              ar={ar}
              {...(onNavigate ? { onNavigate } : {})}
            />
          ))}
          <NavRow
            item={{
              id: "ats",
              label: { ar: "المساعدة", en: "Help" },
              icon: HelpCircle,
              to: "/features",
              enabled: true,
              group: "footer",
            }}
            active={pathname === "/features"}
            collapsed={collapsed}
            ar={ar}
            {...(onNavigate ? { onNavigate } : {})}
          />
          <button
            type="button"
            onClick={() => void signOut()}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <LogOut className="size-[18px] shrink-0" />
            {!collapsed && <span>{ar ? "خروج" : "Sign out"}</span>}
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}

/** Desktop / tablet sidebar column. */
export function AppSidebar() {
  const { collapsed, toggleCollapsed } = useAppChrome();
  const { lang } = useI18n();
  const ar = lang === "ar";

  return (
    <aside
      className={`relative sticky top-0 hidden h-dvh shrink-0 border-e border-sidebar-border bg-sidebar px-3 py-4 md:block ${
        collapsed ? "w-[72px]" : "w-[248px]"
      }`}
      data-collapsed={collapsed}
    >
      <AppSidebarNav collapsed={collapsed} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        aria-label={ar ? "طيّ القائمة" : "Toggle sidebar"}
        className="absolute end-2 top-4 h-9 w-9 text-sidebar-foreground/60 hover:text-sidebar-foreground"
      >
        {collapsed ? (
          <PanelsTopLeft className="size-4" />
        ) : (
          <ChevronsLeftRight className="size-4" />
        )}
      </Button>
    </aside>
  );
}

export { APP_NAV };
