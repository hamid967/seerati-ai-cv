import { Check, Eye, RotateCcw, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildResumeDesignProposal,
  type ResumeDesignProposal,
} from "@/lib/resume-design-intelligence";
import { defaultTemplates } from "@/lib/templates";
import type { Resume } from "@/lib/types";

export function ResumeAutoDesignPanel({
  resume,
  measuredPages,
  lang,
  previewing,
  canUndo,
  onPreview,
  onCancelPreview,
  onApply,
  onUndo,
}: {
  resume: Resume;
  measuredPages: number;
  lang: "ar" | "en";
  previewing: boolean;
  canUndo: boolean;
  onPreview: (proposal: ResumeDesignProposal) => void;
  onCancelPreview: () => void;
  onApply: (proposal: ResumeDesignProposal) => void;
  onUndo: () => void;
}) {
  const ar = lang === "ar";
  const proposal = buildResumeDesignProposal(resume, defaultTemplates, { measuredPages });
  const template = defaultTemplates.find((item) => item.id === proposal.templateId);

  return (
    <section className="seerati-panel overflow-hidden border-emerald-accent/30">
      <div className="border-b border-border/70 bg-emerald-accent/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-accent/10 p-2 text-emerald-accent">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold">
                {ar ? "التصميم الذكي للسيرة" : "Resume Design Intelligence"}
              </h2>
              <Badge variant="secondary">
                {proposal.confidence === "high"
                  ? ar
                    ? "ثقة عالية"
                    : "High confidence"
                  : ar
                    ? "ثقة متوسطة"
                    : "Medium confidence"}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {ar
                ? "اقتراح حتمي وقابل للتفسير. لا يغيّر النص أو يخفي الأقسام، ولا يحفظ شيئًا قبل موافقتك."
                : "A deterministic, explainable proposal. It never rewrites text or hides sections, and nothing is saved before approval."}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline">{proposal.roleFamily}</Badge>
          <Badge variant="outline">{proposal.careerBand}</Badge>
          <Badge variant="outline">{proposal.contentLoad}</Badge>
          <Badge variant="outline">
            {ar ? `هدف ${proposal.targetPages} صفحة` : `${proposal.targetPages}-page target`}
          </Badge>
          {proposal.atsPriority ? <Badge>ATS priority</Badge> : null}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-bold">{ar ? "الخيار المقترح" : "Recommended direction"}</p>
          <p className="mt-1 text-sm font-extrabold">
            {template?.name[lang] ?? proposal.templateId}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{template?.description[lang]}</p>
        </div>

        <div className="space-y-2">
          {proposal.reasons.map((reason, index) => (
            <p key={index} className="text-xs leading-relaxed text-muted-foreground">
              • {reason[lang]}
            </p>
          ))}
        </div>

        <div className="rounded-xl border border-border/70 bg-background/50 p-3">
          <p className="text-xs font-bold">{ar ? "قبل / بعد" : "Before / after"}</p>
          {proposal.changes.length ? (
            <div className="mt-2 space-y-2">
              {proposal.changes.map((change) => (
                <div key={change.key} className="grid gap-1 text-[11px] sm:grid-cols-[95px_1fr]">
                  <span className="font-semibold">{change.label[lang]}</span>
                  <span className="min-w-0 text-muted-foreground">
                    <span className="line-through opacity-70">{change.before}</span>
                    <span className="mx-1.5">→</span>
                    <strong className="text-foreground">{change.after}</strong>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {ar
                ? "الإعداد الحالي قريب بالفعل من الاقتراح."
                : "The current design already closely matches the proposal."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {previewing ? (
            <Button size="sm" variant="outline" onClick={onCancelPreview}>
              <X className="size-4" />
              {ar ? "إنهاء المعاينة" : "Cancel preview"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onPreview(proposal)}>
              <Eye className="size-4" />
              {ar ? "معاينة الاقتراح" : "Preview proposal"}
            </Button>
          )}
          <Button size="sm" onClick={() => onApply(proposal)}>
            <Check className="size-4" />
            {ar ? "اعتماد التصميم" : "Apply design"}
          </Button>
          <Button size="sm" variant="ghost" disabled={!canUndo} onClick={onUndo}>
            <RotateCcw className="size-4" />
            {ar ? "تراجع عن آخر اعتماد" : "Undo last apply"}
          </Button>
        </div>
      </div>
    </section>
  );
}
