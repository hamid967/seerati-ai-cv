/**
 * Conversational Resume Copilot.
 *
 * Fills the gaps the import could not: it asks one question at a time about a
 * specific missing field, and every suggestion is applied only after the user
 * approves it (before/after is shown). Language follows the app language.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, MessageSquare, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { AiUserError, aiService } from "@/lib/ai-service";

export type CopilotGap = {
  /** Field the question targets, e.g. "summary" or "skills". */
  key: string;
  label: { ar: string; en: string };
  question: { ar: string; en: string };
};

type Turn =
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "user"; text: string }
  | { id: string; role: "proposal"; gapKey: string; before: string; after: string; resolved?: "applied" | "skipped" };

const rid = () => Math.random().toString(36).slice(2, 10);

export function ResumeCopilot({
  gaps,
  currentValue,
  onApply,
  targetRole,
}: {
  gaps: CopilotGap[];
  /** Existing value of a gap field, for an honest before/after. */
  currentValue: (key: string) => string;
  onApply: (key: string, value: string) => void | Promise<void>;
  targetRole?: string;
}) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const gap = gaps[index];
  const openedRef = useRef<string | null>(null);

  // Ask the first question for each gap exactly once (no effect loops).
  useEffect(() => {
    if (!gap || openedRef.current === gap.key) return;
    openedRef.current = gap.key;
    setTurns((prev) => [...prev, { id: rid(), role: "assistant", text: gap.question[ar ? "ar" : "en"] }]);
  }, [gap, ar]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const remaining = useMemo(() => Math.max(0, gaps.length - index), [gaps.length, index]);

  async function send() {
    const answer = input.trim();
    if (!answer || !gap || busy) return;
    setInput("");
    setError(null);
    setTurns((prev) => [...prev, { id: rid(), role: "user", text: answer }]);
    setBusy(true);
    try {
      const res = await aiService.run({
        task: gap.key === "summary" ? "summary" : "copilot",
        lang,
        input: answer,
        context: {
          section: gap.key,
          ...(targetRole ? { targetRole } : {}),
        },
      });
      const after = (res.items?.[0] ?? res.text).trim();
      setTurns((prev) => [
        ...prev,
        { id: rid(), role: "proposal", gapKey: gap.key, before: currentValue(gap.key), after },
      ]);
    } catch (e) {
      setError(
        e instanceof AiUserError
          ? e.message
          : ar
            ? "تعذّر الحصول على اقتراح الآن. أعد المحاولة."
            : "Could not get a suggestion right now. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  function resolve(turnId: string, decision: "applied" | "skipped") {
    setTurns((prev) =>
      prev.map((t) => (t.id === turnId && t.role === "proposal" ? { ...t, resolved: decision } : t)),
    );
    const turn = turns.find((t) => t.id === turnId);
    if (turn?.role === "proposal" && decision === "applied") void onApply(turn.gapKey, turn.after);
    setIndex((i) => Math.min(gaps.length, i + 1));
  }

  return (
    <Card dir={dir}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4 text-primary" />
          {ar ? "أكمل الناقص بالمحادثة" : "Finish the gaps by chatting"}
        </CardTitle>
        <Badge variant="secondary">
          {ar ? `${remaining} سؤال متبقٍ` : `${remaining} question${remaining === 1 ? "" : "s"} left`}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={scroller} className="max-h-80 space-y-3 overflow-y-auto pe-1">
          {turns.map((turn) => {
            if (turn.role === "assistant")
              return (
                <p key={turn.id} className="text-sm leading-relaxed text-foreground">
                  {turn.text}
                </p>
              );
            if (turn.role === "user")
              return (
                <p
                  key={turn.id}
                  className="ms-auto w-fit max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                >
                  {turn.text}
                </p>
              );
            return (
              <div key={turn.id} className="rounded-xl border bg-muted/40 p-3 text-sm">
                {turn.before ? (
                  <p className="mb-2 text-muted-foreground line-through">{turn.before}</p>
                ) : (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {ar ? "الحقل فارغ حالياً" : "This field is currently empty"}
                  </p>
                )}
                <p className="font-medium leading-relaxed">{turn.after}</p>
                {turn.resolved ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {turn.resolved === "applied"
                      ? ar
                        ? "تم الحفظ في ملفك المهني."
                        : "Saved to your career profile."
                      : ar
                        ? "تم التجاهل."
                        : "Skipped."}
                  </p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => resolve(turn.id, "applied")}>
                      <Check className="size-4" />
                      {ar ? "اعتماد" : "Approve"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resolve(turn.id, "skipped")}>
                      <X className="size-4" />
                      {ar ? "تجاهل" : "Skip"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {busy && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {ar ? "أصيغ اقتراحاً…" : "Drafting a suggestion…"}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {gap ? (
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder={ar ? "اكتب إجابتك…" : "Type your answer…"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button onClick={() => void send()} disabled={busy || !input.trim()} size="icon">
              <Send className="size-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {ar ? "أكملنا كل الأسئلة. يمكنك المتابعة إلى ملفك المهني." : "All questions are done — continue to your career profile."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
