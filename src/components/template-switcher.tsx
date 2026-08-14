import { useMemo, useState } from "react";
import {
  Check,
  Columns2,
  Expand,
  FileText,
  Globe2,
  ImagePlus,
  LayoutTemplate,
  Rows3,
  ScanText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResumeThumb, getTemplate } from "@/components/resume-preview";
import { useI18n } from "@/lib/i18n";
import { getPrimaryTemplateSignals, type TemplateSignalId } from "@/lib/template-signals";
import { defaultTemplates } from "@/lib/templates";
import type { Resume, TemplateDef } from "@/lib/types";

const CATEGORIES: { id: string; ar: string; en: string }[] = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "ats", ar: "ATS", en: "ATS" },
  { id: "modern", ar: "عصري", en: "Modern" },
  { id: "executive", ar: "تنفيذي", en: "Executive" },
  { id: "minimal", ar: "مبسّط", en: "Minimal" },
  { id: "creative", ar: "إبداعي", en: "Creative" },
];

const TEMPLATE_SIGNAL_ICONS: Record<TemplateSignalId, LucideIcon> = {
  ats: ScanText,
  global: Globe2,
  document: FileText,
  visual: Columns2,
  photo: ImagePlus,
  compact: Rows3,
  spacious: Expand,
};

/**
 * Live template switcher for the resume editor: each card renders the user's
 * real content in that template, and picking one applies the template design
 * immediately (clearing the overrides that would otherwise mask the change).
 */
export function TemplateSwitcher({
  resume,
  onSelect,
  templates = defaultTemplates,
}: {
  resume: Resume;
  onSelect: (templateId: string) => void;
  templates?: TemplateDef[];
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("all");

  const active = getTemplate(resume.templateId, templates);
  const list = useMemo(
    () => templates.filter((t) => t.active !== false && (cat === "all" || t.category === cat)),
    [templates, cat],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 max-w-[15rem] gap-2">
          <LayoutTemplate className="size-4 shrink-0" />
          <span className="truncate">{active.name[lang]}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88dvh] w-[min(96vw,64rem)] max-w-[96vw] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-accent" />
            {ar ? "تبديل القالب" : "Switch template"}
          </DialogTitle>
          <DialogDescription>
            {ar
              ? "المعاينة تعرض بياناتك الحقيقية داخل كل قالب — الاختيار يُطبّق التخطيط فورًا."
              : "Each preview uses your real content — picking one applies the layout instantly."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="sm"
              variant={cat === c.id ? "default" : "outline"}
              onClick={() => setCat(c.id)}
            >
              {ar ? c.ar : c.en}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => {
            const selected = t.id === resume.templateId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                aria-pressed={selected}
                className={`group overflow-hidden rounded-xl border bg-card p-2 text-start transition-shadow hover:shadow-lift ${
                  selected ? "border-primary ring-2 ring-primary/40" : "border-border"
                }`}
              >
                <div className="relative overflow-hidden rounded-lg bg-white">
                  <ResumeThumb resume={{ ...resume, templateId: t.id }} template={t} />
                  {selected && (
                    <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </span>
                  )}
                </div>

                <div className="mt-2 px-1 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{t.name[lang]}</span>
                    {t.atsFriendly && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        ATS
                      </Badge>
                    )}
                  </div>
                  <div
                    className="mt-1.5 flex flex-wrap gap-1"
                    aria-label={ar ? "خصائص القالب" : "Template properties"}
                  >
                    {getPrimaryTemplateSignals(t, 3).map((signal) => {
                      const Icon = TEMPLATE_SIGNAL_ICONS[signal.id];
                      return (
                        <span
                          key={signal.id}
                          className="inline-flex items-center rounded-md bg-muted px-1.5 py-1 text-muted-foreground"
                          title={signal.detail[lang]}
                        >
                          <Icon className="size-3" aria-hidden="true" />
                          <span className="sr-only">{signal.label[lang]}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
