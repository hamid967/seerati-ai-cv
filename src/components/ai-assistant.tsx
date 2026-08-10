import { useMemo, useRef, useState } from "react";
import { Bot, Check, RefreshCw, Send, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiService, summaryWizard, type AiTask } from "@/lib/ai-service";
import { keywordCoverage } from "@/lib/ats";
import { useI18n } from "@/lib/i18n";
import type { Resume } from "@/lib/types";

type Msg = { id: number; role: "user" | "assistant"; text: string };

export type AssistantTarget = "summary" | "bullets" | "skills";

type Suggestion = { task: AiTask; target: AssistantTarget; text: string; items?: string[] };

const quick: { task: AiTask; target: AssistantTarget; ar: string; en: string }[] = [
  { task: "improve", target: "bullets", ar: "تحسين النقاط", en: "Improve bullets" },
  { task: "quantify", target: "bullets", ar: "أضف أرقاماً", en: "Quantify" },
  { task: "rewrite", target: "summary", ar: "إعادة صياغة الملخص", en: "Rewrite summary" },
  { task: "shorten", target: "summary", ar: "اختصار", en: "Shorten" },
  { task: "expand", target: "summary", ar: "توسيع", en: "Expand" },
  { task: "proofread", target: "summary", ar: "تصحيح لغوي", en: "Proofread" },
  { task: "suggest_skills", target: "skills", ar: "اقترح مهارات", en: "Suggest skills" },
  { task: "translate", target: "summary", ar: "ترجمة الملخص", en: "Translate summary" },
];

export function AiAssistant({
  resume,
  section,
  onApplySummary,
  onApplyBullets,
  onAddSkills,
}: {
  resume: Resume;
  section?: string;
  onApplySummary?: (text: string) => void;
  onApplyBullets?: (bullets: string[]) => void;
  onAddSkills?: (skills: string[]) => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const idRef = useRef(1);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [lastRun, setLastRun] = useState<{
    task: AiTask;
    target: AssistantTarget;
    input: string;
  } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: "assistant",
      text: ar
        ? "أنا مساعد سيرتي. اختر إجراءً سريعاً، أو استخدم «المقابلة» لأسألك سؤالاً واحداً في كل مرة ثم أقترح نصاً تعتمده بنفسك."
        : "I’m the Seerati Assistant. Pick a quick action, or use the interview tab and I’ll ask one question at a time, then propose text you approve.",
    },
  ]);

  // wizard
  const [wizardStep, setWizardStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wizardInput, setWizardInput] = useState("");

  // job description analyzer
  const [jd, setJd] = useState("");
  const coverage = useMemo(
    () => (jd.trim() ? keywordCoverage(jd, resume.data) : null),
    [jd, resume.data],
  );

  const push = (role: Msg["role"], text: string) =>
    setMessages((m) => [...m, { id: idRef.current++, role, text }]);

  const contextFor = (extra?: Record<string, string>) => ({
    ...resume.data,
    targetRole: resume.data.personal.jobTitle,
    ...(section ? { section } : {}),
    ...(jd.trim() ? { jobDescription: jd } : {}),
    answers: { ...answers, ...(extra ?? {}) },
  });

  const run = async (
    task: AiTask,
    target: AssistantTarget,
    text: string,
    extraAnswers?: Record<string, string>,
  ) => {
    setBusy(true);
    try {
      const res = await aiService.run({
        task,
        lang,
        input: text,
        context: contextFor(extraAnswers),
      });
      push("assistant", res.text);
      setSuggestion({ task, target, text: res.text, ...(res.items ? { items: res.items } : {}) });
      setLastRun({ task, target, input: text });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
    } finally {
      setBusy(false);
    }
  };

  const sourceFor = (target: AssistantTarget) =>
    target === "bullets"
      ? resume.data.experience.flatMap((e) => e.bullets.filter(Boolean)).join("\n")
      : target === "skills"
        ? resume.data.skills.map((s) => s.name).join(", ")
        : resume.data.summary || resume.data.personal.jobTitle;

  const apply = () => {
    if (!suggestion) return;
    if (suggestion.target === "summary") {
      onApplySummary?.(suggestion.text);
    } else if (suggestion.target === "bullets") {
      onApplyBullets?.(suggestion.items ?? suggestion.text.split("\n").filter(Boolean));
    } else {
      onAddSkills?.(
        suggestion.items ??
          suggestion.text
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      );
    }
    toast.success(ar ? "تم تطبيق الاقتراح على سيرتك" : "Suggestion applied to your resume");
    setSuggestion(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Bot className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold">{ar ? "مساعد سيرتي" : "Seerati Assistant"}</p>
          <p className="text-[11px] text-muted-foreground">
            {aiService.isMock
              ? ar
                ? "مزود مسودة داخلي — الاقتراحات تُطبَّق فقط بعد موافقتك"
                : "Built-in draft provider — nothing changes until you apply"
              : aiService.providerId}
          </p>
        </div>
      </div>

      <Tabs defaultValue="actions" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3">
          <TabsTrigger value="actions" className="flex-1 text-xs">
            {ar ? "إجراءات" : "Actions"}
          </TabsTrigger>
          <TabsTrigger value="interview" className="flex-1 text-xs">
            {ar ? "مقابلة" : "Interview"}
          </TabsTrigger>
          <TabsTrigger value="jd" className="flex-1 text-xs">
            {ar ? "وصف الوظيفة" : "Job desc."}
          </TabsTrigger>
        </TabsList>

        {/* Quick actions + chat */}
        <TabsContent value="actions" className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap gap-1.5 px-3 py-2">
            {quick.map((q) => (
              <Button
                key={`${q.task}-${q.target}`}
                size="sm"
                variant="secondary"
                disabled={busy}
                className="h-7 text-[11.5px]"
                onClick={() => {
                  push("user", q[lang]);
                  void run(q.task, q.target, sourceFor(q.target));
                }}
              >
                <Sparkles className="size-3" />
                {q[lang]}
              </Button>
            ))}
          </div>

          <ScrollArea className="min-h-32 flex-1 px-4 py-2">
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "ms-auto max-w-[85%] rounded-2xl rounded-ee-sm bg-primary px-3 py-2 text-[13px] leading-relaxed text-primary-foreground"
                      : "me-auto max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-ss-sm bg-secondary px-3 py-2 text-[13px] leading-relaxed"
                  }
                >
                  {m.text}
                </div>
              ))}
              {busy && (
                <div className="me-auto rounded-2xl bg-secondary px-3 py-2 text-[13px] text-muted-foreground">
                  {ar ? "يكتب…" : "Typing…"}
                </div>
              )}
            </div>
          </ScrollArea>

          {suggestion && (
            <div className="mx-3 mb-2 rounded-xl border border-accent/40 bg-accent/5 p-3">
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
                {ar ? "اقتراح جاهز للاعتماد" : "Suggestion ready to apply"}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={apply} disabled={busy}>
                  <Check className="size-3.5" />
                  {ar ? "اعتماد" : "Apply"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !lastRun}
                  onClick={() => lastRun && void run(lastRun.task, lastRun.target, lastRun.input)}
                >
                  <RefreshCw className="size-3.5" />
                  {ar ? "توليد بديل" : "Regenerate"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                  {ar ? "تجاهل" : "Dismiss"}
                </Button>
              </div>
            </div>
          )}

          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || busy) return;
              const text = input.trim();
              setInput("");
              push("user", text);
              void run("chat", "summary", text);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ar ? "اكتب رسالتك…" : "Type a message…"}
              aria-label={ar ? "رسالة" : "Message"}
            />
            <Button type="submit" size="icon" disabled={busy} aria-label={ar ? "إرسال" : "Send"}>
              <Send className="size-4" />
            </Button>
          </form>
        </TabsContent>

        {/* One-question-at-a-time wizard */}
        <TabsContent value="interview" className="min-h-0 flex-1 overflow-auto p-4">
          {wizardStep < summaryWizard.length ? (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                {ar ? "سؤال" : "Question"} {wizardStep + 1}/{summaryWizard.length}
              </p>
              <p className="text-sm font-semibold">{summaryWizard[wizardStep]![lang]}</p>
              <Input
                value={wizardInput}
                onChange={(e) => setWizardInput(e.target.value)}
                placeholder={summaryWizard[wizardStep]!.placeholder[lang]}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!wizardInput.trim() || busy}
                  onClick={() => {
                    const q = summaryWizard[wizardStep]!;
                    const next = { ...answers, [q.id]: wizardInput.trim() };
                    setAnswers(next);
                    setWizardInput("");
                    if (wizardStep + 1 === summaryWizard.length) {
                      setWizardStep(wizardStep + 1);
                      void run("summary", "summary", next["role"] ?? "", next);
                    } else {
                      setWizardStep(wizardStep + 1);
                    }
                  }}
                >
                  {ar ? "التالي" : "Next"}
                </Button>
                {wizardStep > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setWizardStep(wizardStep - 1)}>
                    {ar ? "السابق" : "Back"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{ar ? "مسودة الملخص" : "Draft summary"}</p>
              <Textarea
                rows={7}
                value={suggestion?.text ?? ""}
                onChange={(e) =>
                  setSuggestion({ task: "summary", target: "summary", text: e.target.value })
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={apply} disabled={!suggestion?.text}>
                  <Check className="size-3.5" />
                  {ar ? "اعتماد في السيرة" : "Apply to resume"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void run("summary", "summary", answers["role"] ?? "")}
                >
                  <RefreshCw className="size-3.5" />
                  {ar ? "توليد بديل" : "Regenerate"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setWizardStep(0);
                    setAnswers({});
                  }}
                >
                  {ar ? "إعادة المقابلة" : "Restart"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Job description analyzer */}
        <TabsContent value="jd" className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
          <Textarea
            rows={6}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder={ar ? "الصق وصف الوظيفة هنا…" : "Paste the job description here…"}
          />
          <p className="text-[11px] text-muted-foreground">
            {ar
              ? "التحليل إرشادي لمساعدتك على اختيار المصطلحات، ولا يضمن القبول أو الترشيح."
              : "This analysis is advisory: it helps you choose terminology and does not guarantee shortlisting."}
          </p>
          {coverage && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {ar ? "نسبة التطابق" : "Match"}: {coverage.coverage}% ({coverage.matched.length}/
                {coverage.total})
              </p>
              {coverage.missing.length > 0 && (
                <>
                  <p className="text-[11px] text-muted-foreground">
                    {ar ? "كلمات ناقصة" : "Missing terms"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {coverage.missing.slice(0, 18).map((m) => (
                      <Badge key={m} variant="outline" className="text-[10.5px]">
                        {m}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onAddSkills?.(coverage.missing.slice(0, 6));
                      toast.success(ar ? "أضفنا الكلمات إلى المهارات" : "Terms added to skills");
                    }}
                  >
                    <Wand2 className="size-3.5" />
                    {ar ? "أضف أهم ٦ كلمات إلى المهارات" : "Add top 6 terms to skills"}
                  </Button>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
