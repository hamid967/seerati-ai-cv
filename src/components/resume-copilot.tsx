/**
 * Conversational Resume Copilot.
 *
 * One question at a time, never a questionnaire. Every model reply becomes a
 * validated action (see `ai-actions.ts`) and any write is shown as
 * Original / Suggested / Reason with Apply · Edit then apply · Regenerate ·
 * Keep original — nothing is ever auto-written.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Languages, Loader2, MessageSquare, Pencil, RotateCcw, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { AiUserError, aiService } from "@/lib/ai-service";
import {
  flagUnverifiedFigures,
  isExecutableAction,
  LANGUAGE_MODE_LABEL,
  makeAction,
  QUICK_ACTIONS,
  resolveReplyLanguage,
  type CopilotAction,
  type LanguageMode,
  type QuickAction,
} from "@/lib/ai-actions";
import { parseCopilotAction, type CopilotProtocolAction } from "@/lib/copilot/actions";
import { listProtectedTerms, type ProtectedTerm } from "@/lib/career-facts";
import {
  applyProtectedTerms,
  normalizeArabicEnglishPunctuation,
  preserveBrandEntities,
  protectedTermsPrompt,
} from "@/lib/bilingual-intelligence";
import { supabase } from "@/integrations/supabase/client";

export type CopilotGap = {
  /** Field the question targets, e.g. "summary" or "skills". */
  key: string;
  label: { ar: string; en: string };
  question: { ar: string; en: string };
};

type Turn =
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "proposal";
      gapKey: string;
      before: string;
      action: CopilotAction;
      /** Structured protocol form of the same change, when one exists. */
      protocol?: CopilotProtocolAction;
      editing?: boolean;
      resolved?: "applied" | "kept";
    };

const rid = () => Math.random().toString(36).slice(2, 10);
const MODES: LanguageMode[] = ["auto", "ar", "en"];

export function ResumeCopilot({
  gaps,
  currentValue,
  onApply,
  targetRole,
  jobDescription,
  recap,
  progress,
}: {
  gaps: CopilotGap[];
  /** Existing value of a gap field, for an honest before/after. */
  currentValue: (key: string) => string;
  onApply: (key: string, value: string) => void | Promise<void>;
  targetRole?: string;
  jobDescription?: string;
  /** Short recap lines shown once, e.g. right after an import. */
  recap?: string[];
  /** Descriptive progress lines (never a fake score). */
  progress?: string[];
}) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [mode, setMode] = useState<LanguageMode>("auto");
  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState("");
  const [terms, setTerms] = useState<ProtectedTerm[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);

  const gap = gaps[index];
  const openedRef = useRef<string | null>(null);

  // Ask the next question exactly once per gap (no effect loops).
  useEffect(() => {
    const key = gap ? gap.key : "__done__";
    if (openedRef.current === key) return;
    openedRef.current = key;
    const text = gap
      ? gap.question[ar ? "ar" : "en"]
      : ar
        ? "ما الوظيفة التي تستهدفها الآن؟ سأخصص السيرة لها."
        : "Which role are you targeting next? I will tailor the resume to it.";
    setTurns((prev) => [...prev, { id: rid(), role: "assistant", text }]);
  }, [gap, ar]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    composer.current?.focus();
  }, [busy]);

  // Protected terms are the user's own glossary; they gate every translation.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) return;
      try {
        const rows = await listProtectedTerms(uid);
        if (alive) setTerms(rows);
      } catch {
        /* glossary is an enhancement — never block the copilot on it */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const remaining = useMemo(() => Math.max(0, gaps.length - index), [gaps.length, index]);
  const activeKey = gap?.key ?? "headline";

  async function propose(source: string, quick?: QuickAction) {
    if (busy) return;
    const answer = source.trim();
    if (!answer) return;
    setError(null);
    setBusy(true);
    const replyLang = quick?.forceLang ?? resolveReplyLanguage(mode, answer, lang);
    try {
      const res = await aiService.run({
        task: quick ? quick.task : activeKey === "summary" ? "summary" : "copilot",
        lang: replyLang,
        input: answer,
        context: {
          section: activeKey,
          ...(targetRole ? { targetRole } : {}),
          ...(jobDescription ? { jobDescription } : {}),
          ...(terms.length ? { protectedTerms: protectedTermsPrompt(terms, replyLang) } : {}),
        },
      });
      const raw = (res.items?.[0] ?? res.text).trim();
      const isTranslate = quick?.task === "translate";
      // Deterministic post-processing: punctuation hygiene for the target
      // language, then the user's glossary spelling restored, then a report of
      // brands/terms the model dropped. The model never has the last word here.
      const hygienic = isTranslate ? normalizeArabicEnglishPunctuation(raw, replyLang) : raw;
      const applied = isTranslate ? applyProtectedTerms(hygienic, terms, answer) : null;
      const brands = isTranslate ? preserveBrandEntities(answer, applied?.text ?? hygienic) : null;
      const text = flagUnverifiedFigures(applied?.text ?? hygienic, replyLang);
      const droppedTerms = [
        ...(applied?.missing ?? []),
        ...(brands?.missing ?? []),
      ].filter((v, i, a) => a.indexOf(v) === i);
      const bilingualNote = isTranslate
        ? [
            applied?.restored.length
              ? replyLang === "ar"
                ? `أُعيد ضبط تهجئة: ${applied.restored.join("، ")}`
                : `Spelling restored for: ${applied.restored.join(", ")}`
              : "",
            droppedTerms.length
              ? replyLang === "ar"
                ? `تحقّق من غياب: ${droppedTerms.join("، ")}`
                : `Check missing: ${droppedTerms.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : "";
      const action = makeAction({
        type: quick?.task === "translate" ? "translate" : activeKey ? "update_field" : "suggest_edit",
        target: activeKey,
        text,
        ...(res.items?.length ? { items: res.items } : {}),
        reason: quick
          ? [quick.reason[replyLang], bilingualNote].filter(Boolean).join(" — ")
          : replyLang === "ar"
            ? "صياغة مهنية مبنية على ما ذكرته، بدون إضافة معلومات لم تقدّمها."
            : "Professional wording based only on what you told me — nothing invented.",
      });
      if (!isExecutableAction(action)) {
        setError(ar ? "لم يصل اقتراح صالح. أعد المحاولة." : "No valid suggestion came back. Please retry.");
        return;
      }
      // Field edits also travel as a structured protocol action, so the same
      // Zod contract that guards writes elsewhere guards this one too.
      const before = currentValue(activeKey);
      const protocolCandidate =
        activeKey === "summary"
          ? {
              type: "update_summary",
              reason:
                replyLang === "ar"
                  ? "صياغة مبنية على ما ذكرته فقط."
                  : "Wording based only on what you provided.",
              evidenceUsed: [],
              payload: { original: before, suggested: text },
            }
          : null;
      const protocolParsed = protocolCandidate ? parseCopilotAction(protocolCandidate) : null;
      setTurns((prev) => [
        ...prev,
        {
          id: rid(),
          role: "proposal",
          gapKey: activeKey,
          before,
          action,
          ...(protocolParsed?.ok ? { protocol: protocolParsed.action } : {}),
        },
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

  async function send() {
    const answer = input.trim();
    if (!answer || busy) return;
    setInput("");
    setLastAnswer(answer);
    setTurns((prev) => [...prev, { id: rid(), role: "user", text: answer }]);
    await propose(answer);
  }

  function editText(turnId: string, value: string) {
    setTurns((prev) =>
      prev.map((t) =>
        t.id === turnId && t.role === "proposal"
          ? { ...t, action: { ...t.action, payload: { ...t.action.payload, text: value } } }
          : t,
      ),
    );
  }

  async function resolve(turnId: string, decision: "applied" | "kept") {
    const turn = turns.find((t) => t.id === turnId);
    if (!turn || turn.role !== "proposal") return;
    setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, resolved: decision, editing: false } : t)));
    if (decision === "applied") {
      // The user pressing Apply is the approval gate; re-validate the protocol
      // action so an edited suggestion can never bypass the contract.
      if (turn.protocol) {
        const recheck = parseCopilotAction({
          ...turn.protocol,
          payload: { ...turn.protocol.payload, suggested: turn.action.payload.text.trim() },
        });
        if (!recheck.ok) {
          setError(ar ? "الاقتراح غير صالح للتطبيق." : "This suggestion is not valid to apply.");
          return;
        }
      }
      await onApply(turn.gapKey, turn.action.payload.text.trim());
    }
    setIndex((i) => Math.min(gaps.length, i + 1));
  }

  const quickSource = lastAnswer || currentValue(activeKey);

  return (
    <Card dir={dir} className="flex max-h-[80vh] flex-col">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-primary" />
            {ar ? "مساعد سيرتي" : "Seerati copilot"}
          </CardTitle>
          <Badge variant="secondary">
            {remaining > 0
              ? ar
                ? `${remaining} نقطة متبقية`
                : `${remaining} gap${remaining === 1 ? "" : "s"} left`
              : ar
                ? "الأساسيات مكتملة"
                : "Basics complete"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Languages className="size-3.5" />
            {ar ? "لغة المحادثة" : "Chat language"}
          </span>
          <div className="flex overflow-hidden rounded-lg border">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-2.5 py-1 text-xs transition ${
                  mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {LANGUAGE_MODE_LABEL[m][ar ? "ar" : "en"]}
              </button>
            ))}
          </div>
        </div>
        {progress && progress.length > 0 && (
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {progress.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto pe-1">
          {recap && recap.length > 0 && (
            <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">{ar ? "ما استخرجناه" : "What we extracted"}</p>
              {recap.map((line, i) => (
                <p key={i}>• {line}</p>
              ))}
            </div>
          )}
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
              <div key={turn.id} className="space-y-2 rounded-xl border bg-muted/40 p-3 text-sm">
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted-foreground">
                    {ar ? "النص الحالي" : "Original"}
                  </p>
                  <p className="text-muted-foreground">
                    {turn.before || (ar ? "لا يوجد نص حالي." : "Currently empty.")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted-foreground">
                    {ar ? "المقترح" : "Suggested"}
                  </p>
                  {turn.editing && !turn.resolved ? (
                    <Textarea
                      rows={4}
                      value={turn.action.payload.text}
                      onChange={(e) => editText(turn.id, e.target.value)}
                    />
                  ) : (
                    <p className="whitespace-pre-line font-medium leading-relaxed">{turn.action.payload.text}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{ar ? "السبب: " : "Reason: "}</span>
                  {turn.action.reason}
                </p>
                {turn.resolved ? (
                  <p className="text-xs text-muted-foreground">
                    {turn.resolved === "applied"
                      ? ar
                        ? "تم الحفظ في ملفك المهني — يمكنك التعديل أو التراجع من المحرّر."
                        : "Saved to your career profile — editable and reversible in the builder."
                      : ar
                        ? "أبقينا النص الأصلي."
                        : "Kept your original text."}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void resolve(turn.id, "applied")}>
                      <Check className="size-4" />
                      {ar ? "تطبيق" : "Apply"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTurns((prev) =>
                          prev.map((t) => (t.id === turn.id && t.role === "proposal" ? { ...t, editing: true } : t)),
                        )
                      }
                    >
                      <Pencil className="size-4" />
                      {ar ? "عدّل ثم طبّق" : "Edit then apply"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void propose(lastAnswer || turn.before || turn.action.payload.text)}
                    >
                      <RotateCcw className="size-4" />
                      {ar ? "أعد التوليد" : "Regenerate"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void resolve(turn.id, "kept")}>
                      <X className="size-4" />
                      {ar ? "أبقِ الأصلي" : "Keep original"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {busy && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {ar ? "أعمل على الصياغة…" : "Working on it…"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((qa) => (
            <Button
              key={qa.id}
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              disabled={busy || !quickSource.trim()}
              onClick={() => void propose(quickSource, qa)}
            >
              {qa.label[ar ? "ar" : "en"]}
            </Button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-end gap-2 pb-[env(safe-area-inset-bottom)]">
          <Textarea
            ref={composer}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={ar ? "اكتب إجابتك…" : "Type your answer…"}
          />
          <Button onClick={() => void send()} disabled={busy || !input.trim()} aria-label={ar ? "إرسال" : "Send"}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
