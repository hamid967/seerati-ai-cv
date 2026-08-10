/**
 * SuggestionDiffCard — the single approval surface for every AI change.
 *
 * Nothing an assistant proposes is applied until the user presses Apply here,
 * and the card always shows why the change is suggested plus which evidence it
 * relied on, so a suggestion with no evidence is visibly unbacked.
 */
import { useState } from "react";
import { Check, Pencil, RefreshCw, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { ACTION_LABEL, diffOf, type CopilotProtocolAction } from "@/lib/copilot/actions";

export type SuggestionDiffCardProps = {
  action: CopilotProtocolAction;
  /** Flagged numbers with no verified evidence behind them. */
  unsupported?: string[];
  busy?: boolean;
  onApply: (action: CopilotProtocolAction) => void;
  onRegenerate?: () => void;
  onKeep: () => void;
};

export function SuggestionDiffCard({
  action,
  unsupported = [],
  busy,
  onApply,
  onRegenerate,
  onKeep,
}: SuggestionDiffCardProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { original, suggested } = diffOf(action);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(suggested);

  const applyEdited = () => {
    const text = draft.trim();
    if (!text) return;
    const next = structuredClone(action) as CopilotProtocolAction;
    const payload = next.payload as Record<string, unknown>;
    if ("suggested" in payload) payload["suggested"] = text;
    else if ("text" in payload) payload["text"] = text;
    else if ("name" in payload) payload["name"] = text;
    else if ("title" in payload) payload["title"] = text;
    else if ("targetJob" in payload) payload["targetJob"] = text;
    onApply(next);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-start shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {ar ? ACTION_LABEL[action.type].ar : ACTION_LABEL[action.type].en}
        </Badge>
        <Badge variant="outline">{ar ? "بانتظار موافقتك" : "Pending your approval"}</Badge>
      </div>

      {original ? (
        <div className="mt-3">
          <p className="text-xs font-bold text-muted-foreground">
            {ar ? "النص الحالي" : "Original"}
          </p>
          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm leading-[1.9] line-through decoration-muted-foreground/40">
            {original}
          </p>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-bold text-muted-foreground">{ar ? "المقترح" : "Suggested"}</p>
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="mt-1"
            aria-label={ar ? "تحرير المقترح" : "Edit suggestion"}
          />
        ) : (
          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-emerald-accent/10 p-3 text-sm leading-[1.9]">
            {suggested}
          </p>
        )}
      </div>

      <div className="mt-3 space-y-1 text-xs leading-[1.9] text-muted-foreground">
        <p>
          <span className="font-bold">{ar ? "السبب: " : "Why: "}</span>
          {action.reason}
        </p>
        <p className="flex flex-wrap items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="font-bold">{ar ? "الأدلة المستخدمة: " : "Evidence used: "}</span>
          {action.evidenceUsed.length
            ? action.evidenceUsed.join(" · ")
            : ar
              ? "لا يوجد دليل مرتبط — تأكد من صحة المعلومة قبل الاعتماد."
              : "No linked evidence — confirm the claim before applying."}
        </p>
        {unsupported.length ? (
          <p className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400">
            {ar ? "أرقام تحتاج تأكيدك: " : "Figures needing your confirmation: "}
            {unsupported.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <Button size="sm" disabled={busy} onClick={applyEdited}>
            <Check className="me-1 h-4 w-4" />
            {ar ? "حرّر ثم طبّق" : "Apply edited"}
          </Button>
        ) : (
          <Button size="sm" disabled={busy} onClick={() => onApply(action)}>
            <Check className="me-1 h-4 w-4" />
            {ar ? "تطبيق" : "Apply"}
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing((v) => !v)}>
          <Pencil className="me-1 h-4 w-4" />
          {editing ? (ar ? "إلغاء التحرير" : "Cancel edit") : ar ? "تحرير" : "Edit"}
        </Button>
        {onRegenerate ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={onRegenerate}>
            <RefreshCw className="me-1 h-4 w-4" />
            {ar ? "إعادة توليد" : "Regenerate"}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" disabled={busy} onClick={onKeep}>
          <X className="me-1 h-4 w-4" />
          {ar ? "أبقِ النص الحالي" : "Keep original"}
        </Button>
      </div>
    </div>
  );
}
