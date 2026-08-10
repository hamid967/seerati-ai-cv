import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppChromeContext, type AppChrome } from "./app-chrome";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { CommandPalette } from "./command-palette";
import { MobileBottomNav } from "./mobile-bottom-nav";

const STORAGE_KEY = "seerati.sidebar.collapsed";

export type AppShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  back?: { to: string; label?: string };
  /** Focus mode: chrome collapses to the icon rail and the bottom bar hides. */
  focus?: boolean;
  /** Constrain the content column. Use "full" for editor-style pages. */
  width?: "default" | "wide" | "full";
  /** Remove the default content padding (editor panes manage their own). */
  bare?: boolean;
};

/**
 * Application shell: desktop sidebar, tablet icon rail, mobile bottom nav,
 * a sticky app bar and the global command palette. Marketing routes keep the
 * site header — this wraps signed-in product surfaces only.
 */
export function AppShell({
  children,
  title,
  subtitle,
  actions,
  back,
  focus = false,
  width = "default",
  bare = false,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Restore the user's rail preference; focus mode always starts collapsed.
  useEffect(() => {
    if (focus) {
      setCollapsed(true);
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, [focus]);

  const applyCollapsed = useCallback((v: boolean) => {
    setCollapsed(v);
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const chrome = useMemo<AppChrome>(
    () => ({
      collapsed,
      setCollapsed: applyCollapsed,
      toggleCollapsed: () => applyCollapsed(!collapsed),
      drawerOpen,
      setDrawerOpen,
      paletteOpen,
      setPaletteOpen,
      focus,
    }),
    [collapsed, applyCollapsed, drawerOpen, paletteOpen, focus],
  );

  const widthClass =
    width === "full" ? "w-full" : width === "wide" ? "mx-auto w-full max-w-[1400px]" : "mx-auto w-full max-w-6xl";

  return (
    <AppChromeContext.Provider value={chrome}>
      <div className="flex min-h-dvh w-full bg-sand text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar
            {...(title ? { title } : {})}
            {...(subtitle ? { subtitle } : {})}
            {...(actions ? { actions } : {})}
            {...(back ? { back } : {})}
          />
          <main
            className={`flex-1 ${bare ? "" : "px-4 py-5 md:px-6 md:py-7"} ${focus ? "pb-6" : "pb-24 md:pb-6"}`}
          >
            <div className={bare ? "h-full w-full" : widthClass}>{children}</div>
          </main>
        </div>
        {!focus && <MobileBottomNav />}
        <CommandPalette />
      </div>
    </AppChromeContext.Provider>
  );
}
