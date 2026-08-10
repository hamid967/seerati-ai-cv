import { useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiService, type AiTask } from "@/lib/ai-service";
import { logAiUsage } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import type { Resume } from "@/lib/types";

type Msg = { id: number; role: "user" | "assistant"; text: string };

const quickTasks: { task: AiTask; ar: string; en: string }[] = [
  { task: "summary", ar: "اكتب ملخصاً مهنياً", en: "Write a summary" },
  { task: "improve_bullets", ar: "حسّن نقاط الخبرة", en: "Improve bullets" },
  { task: "duties_to_achievements", ar: "حوّل المهام إلى إنجازات", en: "Duties → achievements" },
  { task: "suggest_skills", ar: "اقترح مهارات", en: "Suggest skills" },
  { task: "proofread", ar: "تصحيح لغوي", en: "Proofread" },
  { task: "shorten", ar: "اختصر", en: "Shorten" },
  { task: "expand", ar: "وسّع", en: "Expand" },
  { task: "translate", ar: "ترجم القسم", en: "Translate" },
];

export function AiAssistant({
  resume,
  onApplySummary,
}: {
  resume: Resume;
  onApplySummary?: (text: string) => void;
}) {
  const { lang } = useI18n();
  const idRef = useRef(1);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: "assistant",
      text:
        lang === "ar"
          ? "أنا مساعد سيرتي. أخبرني عن خبرتك أو اختر أحد الاختصارات بالأسفل، وسأساعدك في الصياغة المهنية."
          : "I’m the Seerati Assistant. Tell me about your experience or pick a shortcut below.",
    },
  ]);

  const push = (role: Msg["role"], text: string) =>
    setMessages((m) => [...m, { id: idRef.current++, role, text }]);

  const run = async (task: AiTask, text: string) => {
    setBusy(true);
    try {
      const res = await aiService.run({
        task,
        lang,
        input: text,
        context: { ...resume.data, targetRole: resume.data.personal.jobTitle },
      });
      push("assistant", res.text);
      void logAiUsage(task);
      if (task === "summary" && onApplySummary) {
        onApplySummary(res.text);
        toast.success(lang === "ar" ? "تم إدراج الملخص في السيرة" : "Summary added to your resume");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Bot className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold">{lang === "ar" ? "مساعد سيرتي" : "Seerati Assistant"}</p>
          <p className="text-[11px] text-muted-foreground">
            {aiService.isMock
              ? lang === "ar"
                ? "نموذج تجريبي — جاهز للربط بمزود ذكاء اصطناعي"
                : "Demo provider — ready to connect a real AI provider"
              : aiService.providerId}
          </p>
        </div>
      </div>

      <ScrollArea className="h-64 flex-1 px-4 py-3">
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ms-auto max-w-[85%] rounded-2xl rounded-ee-sm bg-primary px-3 py-2 text-[13px] leading-relaxed text-primary-foreground"
                  : "me-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-ss-sm bg-secondary px-3 py-2 text-[13px] leading-relaxed"
              }
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div className="me-auto rounded-2xl bg-secondary px-3 py-2 text-[13px] text-muted-foreground">
              {lang === "ar" ? "يكتب…" : "Typing…"}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
        {quickTasks.map((q) => (
          <Button
            key={q.task}
            size="sm"
            variant="secondary"
            disabled={busy}
            className="h-7 text-[11.5px]"
            onClick={() => {
              const src =
                q.task === "summary"
                  ? resume.data.personal.jobTitle
                  : q.task === "improve_bullets" || q.task === "duties_to_achievements"
                    ? resume.data.experience[0]?.bullets.join("\n") || ""
                    : resume.data.summary;
              push("user", q[lang]);
              void run(q.task, src);
            }}
          >
            <Sparkles className="size-3" />
            {q[lang]}
          </Button>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || busy) return;
          const text = input.trim();
          setInput("");
          push("user", text);
          void run("chat", text);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === "ar" ? "اكتب رسالتك…" : "Type a message…"}
          aria-label={lang === "ar" ? "رسالة" : "Message"}
        />
        <Button type="submit" size="icon" disabled={busy} aria-label={lang === "ar" ? "إرسال" : "Send"}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
