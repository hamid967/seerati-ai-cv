import { createContext, useContext } from "react";

export type AppChrome = {
  /** Desktop sidebar collapsed to the icon rail. */
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  /** Mobile / tablet slide-over nav. */
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  /** Global command palette. */
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  /** Focus mode (resume builder): chrome shrinks out of the way. */
  focus: boolean;
};

export const AppChromeContext = createContext<AppChrome | null>(null);

export function useAppChrome(): AppChrome {
  const ctx = useContext(AppChromeContext);
  if (!ctx) throw new Error("useAppChrome must be used inside <AppShell>");
  return ctx;
}
