/**
 * Resume diff view — renders the deterministic diff from resume-diff.ts.
 *
 * Only shows what actually changed, grouped by section, with before/after side
 * by side. Nothing is summarised by a model, so what you read is what will be
 * written if you restore.
 */
import { ArrowRight, Minus, Plus, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { DiffKind, ResumeDiff } from "@/lib/resume-diff";

const KIND_META: Record<DiffKind, { icon: typeof Plus; ar: string; en: string; tone: string }> = {
  added: { icon: Plus, ar: "إضافة", en: "Added", tone: "text-primary" },
  removed: { icon: Minus, ar: "حذف", en: "Removed", tone: "text-destructive" },
  changed: { icon: PenLine, ar: "تعديل", en: "Changed", tone: "text-muted-foreground" },
};

export function ResumeDiffView({ diff }: { diff: ResumeDiff }) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";

  if (diff.identical) {
    return (
      <p dir={dir} className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        {ar ? "النسختان متطابقتان حرفياً." : "The two versions are identical."}
      </p>
    );
  }

  return (
    <div dir={dir} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">
          {ar ? `${diff.total} تغيير` : `${diff.total} change${diff.total === 1 ? "" : "s"}`}
        </Badge>
        {diff.sections.map((s) => (
          <span key={s.section} className="text-muted-foreground">
            {ar ? s.label.ar : s.label.en} ({s.changes.length})
          </span>
        ))}
      </div>

      {diff.sections.map((section) => (
        <section key={section.section} className="rounded-2xl border border-border bg-card p-3">
          <h4 className="text-sm font-bold">{ar ? section.label.ar : section.label.en}</h4>
          <ul className="mt-2 space-y-2">
            {section.changes.map((c) => {
              const meta = KIND_META[c.kind];
              const Icon = meta.icon;
              return (
                <li key={c.path} className="rounded-xl bg-muted/40 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-3.5 shrink-0 ${meta.tone}`} />
                    <span className="font-medium">{ar ? c.label.ar : c.label.en}</span>
                    <span className="text-muted-foreground">· {ar ? meta.ar : meta.en}</span>
                  </div>
                  <div className="mt-1.5 grid gap-1.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <p className="break-words leading-[1.8] text-muted-foreground line-through decoration-destructive/40">
                      {c.before || (ar ? "— فارغ —" : "— empty —")}
                    </p>
                    <ArrowRight className="hidden size-3.5 shrink-0 text-muted-foreground sm:block rtl:sm:rotate-180" />
                    <p className="break-words leading-[1.8]">
                      {c.after || (ar ? "— فارغ —" : "— empty —")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
