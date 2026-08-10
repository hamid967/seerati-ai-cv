import { useNavigate, useRouterState } from "@tanstack/react-router";
import { FileText, Globe, LogOut, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { APP_NAV } from "@/lib/app-navigation";
import { useAppChrome } from "./app-chrome";

const asPath = (to: string) => to as "/dashboard";

/** Global Ctrl/⌘+K palette: navigation, resume jump-to, and quick actions. */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useAppChrome();
  const { lang, toggle } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { user, resumes, atLimit, signOut } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const go = (to: string) => {
    setPaletteOpen(false);
    void navigate({ to: asPath(to) });
  };

  const items = APP_NAV.filter((i) => i.enabled && (!i.adminOnly || user?.role === "admin"));

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
    >
      <CommandInput placeholder={ar ? "ابحث عن صفحة أو سيرة أو أمر…" : "Search pages, resumes, actions…"} />
      <CommandList>
        <CommandEmpty>{ar ? "لا نتائج" : "No results"}</CommandEmpty>

        <CommandGroup heading={ar ? "التنقل" : "Navigate"}>
          {items.map((item) => {
            const Icon = item.icon;
            const label = ar ? item.label.ar : item.label.en;
            return (
              <CommandItem
                key={item.id}
                value={`${item.label.ar} ${item.label.en} ${item.to}`}
                onSelect={() => go(item.to)}
              >
                <Icon className="size-4" />
                <span>{label}</span>
                {pathname === item.to && (
                  <span className="ms-auto text-xs text-muted-foreground">{ar ? "هنا" : "current"}</span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {resumes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={ar ? "سيرك الذاتية" : "Your resumes"}>
              {resumes.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`resume ${r.title} ${r.id}`}
                  onSelect={() => go(`/resumes/${r.id}/edit`)}
                >
                  <FileText className="size-4" />
                  <span className="truncate">{r.title || (ar ? "سيرة بدون عنوان" : "Untitled resume")}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading={ar ? "أوامر" : "Actions"}>
          {!atLimit && (
            <CommandItem value="new resume سيرة جديدة" onSelect={() => go("/resumes/new")}>
              <Plus className="size-4" />
              <span>{ar ? "سيرة ذاتية جديدة" : "New resume"}</span>
            </CommandItem>
          )}
          <CommandItem
            value="language لغة english arabic"
            onSelect={() => {
              toggle();
              setPaletteOpen(false);
            }}
          >
            <Globe className="size-4" />
            <span>{ar ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}</span>
          </CommandItem>
          <CommandItem
            value="sign out خروج"
            onSelect={() => {
              setPaletteOpen(false);
              void signOut();
            }}
          >
            <LogOut className="size-4" />
            <span>{ar ? "تسجيل الخروج" : "Sign out"}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
