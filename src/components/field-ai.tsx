import { useState } from "react";
import { Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { aiService, AI_TASK_LABELS, type AiTask } from "@/lib/ai-service";
import { logAiUsage } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import type { Resume } from "@/lib/types";

const DEFAULT_TASKS: AiTask[] = [
  "improve",
  "rewrite",
  "shorten",
  "quantify",
  "ats_keywords",
  "translate",
];

/**
 * Inline AI quick actions for a single field.
 * The field is never mutated automatically: the user must press Apply.
 */
export function FieldAi({
  resume,
  value,
  section,
  tasks = DEFAULT_TASKS,
  jobDescription,
  onApply,
}: {
  resume: Resume;
  value: string;
  section: string;
  tasks?: AiTask[];
  jobDescription?: string;
  onApply: (text: string) => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [busy, setBusy] = useState<AiTask | null>(null);
  const [suggestion, setSuggestion] = useState<{ task: AiTask; text: string } | null>(null);

  const run = async (task: AiTask) => {
    const input = value.trim() || resume.data.personal.jobTitle;
    if (!input) {
      toast.error(ar ? "اكتب شيئاً أولاً حتى أستطيع تحسينه" : "Write something first so I can improve it");
      return;
    }
    setBusy(task);
    try {
      const res = await aiService.run({
        task,
        lang,
        input,
        context: {
          ...resume.data,
          targetRole: resume.data.personal.jobTitle,
          section,
          ...(jobDescription?.trim() ? { jobDescription } : {}),
        },
      });
      setSuggestion({ task, text: res.text });
      void logAiUsage(task);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Sparkles className="size-3" />
          {ar ? "مساعد سيرتي" : "Assistant"}
        </span>
        {tasks.map((t) => (
          <Button
            key={t}
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-[11px]"
            disabled={busy !== null}
            onClick={() => void run(t)}
          >
            {busy === t ? <Loader2 className="size-3 animate-spin" /> : null}
            {AI_TASK_LABELS[t][lang]}
          </Button>
        ))}
      </div>

      {suggestion && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
          <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
            {ar ? "اقتراح — لن يُطبَّق إلا بموافقتك" : "Suggestion — applied only when you approve"}
          </p>
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{suggestion.text}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-7 text-[11.5px]"
              onClick={() => {
                onApply(suggestion.text);
                setSuggestion(null);
                toast.success(ar ? "تم تطبيق الاقتراح" : "Suggestion applied");
              }}
            >
              <Check className="size-3.5" />
              {ar ? "اعتماد" : "Apply"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11.5px]"
              disabled={busy !== null}
              onClick={() => void run(suggestion.task)}
            >
              <RefreshCw className="size-3.5" />
              {ar ? "توليد بديل" : "Regenerate"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11.5px]" onClick={() => setSuggestion(null)}>
              {ar ? "تجاهل" : "Dismiss"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
