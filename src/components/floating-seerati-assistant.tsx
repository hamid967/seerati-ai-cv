import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, MessageCircle, Send, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  createFilledAssistantResume,
  emptyAssistantAnswers,
  type AssistantAnswers,
} from "@/lib/assistant-create";
import { aiService, AiUserError } from "@/lib/ai-service";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { agentById, agentsForSurface } from "@/lib/team";
import { defaultTemplates } from "@/lib/templates";
import { cn } from "@/lib/utils";

type Msg = { id: number; role: "assistant" | "user"; text: string };
type Phase =
  | "pick_agent"
  | "ask_name"
  | "ask_title"
  | "ask_years"
  | "ask_story"
  | "ask_skills"
  | "drafting"
  | "pick_template"
  | "creating";

const HIDDEN_PREFIXES = [
  "/auth",
  "/admin",
  "/onboarding",
  "/dashboard",
  "/account",
  "/career-twin",
  "/career-evidence",
  "/jobs",
  "/resumes",
  "/import",
  "/privacy-center",
];
const FOCUS_EDITOR = /^\/resumes\/[^/]+\/(edit|preview|studio|composer)$/;
const ASSISTANT_AGENTS = agentsForSurface("assistant");

function shouldHide(pathname: string) {
  if (pathname === "/assistant") return true;
  if (FOCUS_EDITOR.test(pathname)) return true;
  return HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function FloatingSeeratiAssistant() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { atLimit, isGuest, createResume, updateResume, ready } = useStore();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("pick_agent");
  const [agentId, setAgentId] = useState("noura");
  const [answers, setAnswers] = useState<AssistantAnswers>(emptyAssistantAnswers);
  const [summary, setSummary] = useState("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState("classic-ats");
  const idRef = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  const templates = useMemo(
    () => defaultTemplates.filter((t) => t.active !== false).slice(0, 8),
    [],
  );

  const specialist = agentById(agentId) ?? ASSISTANT_AGENTS[0]!;

  const intro = ar
    ? "مرحباً، أنا مساعد سيرتي — مع فريق مسار مهني وهندسة. اختر من يقود جلستك، ثم نبني السيرة ونختار القالب."
    : "Hi, I’m the Seerati Assistant — backed by career and engineering specialists. Pick who leads, then we’ll build your resume and pick a template.";

  const [messages, setMessages] = useState<Msg[]>([{ id: 0, role: "assistant", text: intro }]);

  const hidden = !ready || shouldHide(pathname);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, phase, open, busy]);

  const push = (role: Msg["role"], text: string) =>
    setMessages((m) => [...m, { id: idRef.current++, role, text }]);

  const resetChat = () => {
    setPhase("pick_agent");
    setAgentId("noura");
    setAnswers(emptyAssistantAnswers());
    setSummary("");
    setBullets([]);
    setSkills([]);
    setTemplateId("classic-ats");
    setInput("");
    setBusy(false);
    idRef.current = 1;
    setMessages([{ id: 0, role: "assistant", text: intro }]);
  };

  const askNext = (next: Phase, prompt: string) => {
    setPhase(next);
    push("assistant", prompt);
  };

  const beginWithAgent = (id: string) => {
    const agent = agentById(id) ?? ASSISTANT_AGENTS[0]!;
    setAgentId(agent.id);
    push("user", ar ? agent.name.ar : agent.name.en);
    askNext(
      "ask_name",
      ar
        ? `معك ${agent.name.ar} — ${agent.role.ar}. ابدأ باسمك الكامل.`
        : `${agent.name.en} here — ${agent.role.en}. Start with your full name.`,
    );
  };

  const runDrafting = async (latest: AssistantAnswers) => {
    setPhase("drafting");
    setBusy(true);
    push(
      "assistant",
      ar ? "أحضّر الملخص والإنجازات والمهارات…" : "Drafting your summary, achievements and skills…",
    );
    try {
      const ctx = {
        targetRole: latest.jobTitle,
        answers: {
          role: latest.jobTitle,
          years: latest.years,
          industry: latest.industry,
          achievement: latest.story,
        },
      };
      const agentOpt = { agentId };
      const [sum, bl, sk] = await Promise.all([
        aiService.run({
          task: "summary",
          lang,
          input: `${latest.jobTitle} — ${latest.years} ${ar ? "سنوات" : "years"} — ${latest.industry}. ${latest.story}`,
          context: ctx,
          ...agentOpt,
        }),
        latest.story
          ? aiService.run({
              task: "quantify",
              lang,
              input: latest.story,
              context: { ...ctx, section: "experience" },
              ...agentOpt,
            })
          : Promise.resolve({ text: "", items: [] as string[] }),
        aiService.run({
          task: "suggest_skills",
          lang,
          input: `${latest.jobTitle} ${latest.industry} ${latest.skills}`,
          context: ctx,
          ...agentOpt,
        }),
      ]);
      const nextSummary = sum.text.trim();
      const nextBullets = (bl.items ?? []).filter(Boolean).slice(0, 4);
      const manual = latest.skills
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const suggested = (sk.items ?? []).map((s) => s.trim()).filter(Boolean);
      const nextSkills = Array.from(new Set([...manual, ...suggested])).slice(0, 12);
      setSummary(nextSummary);
      setBullets(nextBullets);
      setSkills(nextSkills);
      push(
        "assistant",
        ar
          ? "جاهز! اختر قالباً من الأسفل لإنشاء سيرتك."
          : "Ready! Pick a template below to create your resume.",
      );
      setPhase("pick_template");
    } catch (error) {
      const msg =
        error instanceof AiUserError
          ? error.message
          : ar
            ? "تعذّرت الصياغة. أعد المحاولة أو أكمل من صفحة المساعد."
            : "Drafting failed. Retry or continue on the full assistant page.";
      push("assistant", msg);
      setPhase("ask_skills");
    } finally {
      setBusy(false);
    }
  };

  const createWithTemplate = async (id: string) => {
    if (atLimit) {
      toast.error(
        isGuest
          ? ar
            ? "كزائر يمكنك سيرة واحدة — سجّل لحفظ المزيد."
            : "Guests can keep one resume — sign up for more."
          : ar
            ? "وصلت الحد الأقصى للسير الذاتية."
            : "You reached your resume limit.",
      );
      return;
    }
    setTemplateId(id);
    setPhase("creating");
    setBusy(true);
    const tpl = templates.find((t) => t.id === id);
    push(
      "assistant",
      ar
        ? `إنشاء سيرتك بقالب «${tpl?.name.ar ?? id}»…`
        : `Creating your resume with “${tpl?.name.en ?? id}”…`,
    );
    try {
      const created = await createFilledAssistantResume(
        { createResume, updateResume },
        {
          answers: {
            ...answers,
            role: answers.role || answers.jobTitle,
          },
          templateId: id,
          language: lang,
          summary,
          bullets,
          skills,
          titleFallback: ar ? "سيرتي الذاتية" : "My resume",
        },
      );
      toast.success(ar ? "أُنشئت سيرتك بنجاح" : "Your resume was created");
      setOpen(false);
      if (isGuest) {
        toast.message(
          ar ? "سجّل حساباً لحفظ سيرتك والمتابعة" : "Sign up to save your resume and continue",
        );
        navigate({ to: "/auth", search: { mode: "signup" } });
      } else {
        navigate({ to: "/resumes/$id/edit", params: { id: created.id } });
      }
      resetChat();
    } catch {
      toast.error(ar ? "تعذّر إنشاء السيرة." : "Could not create the resume.");
      push(
        "assistant",
        ar ? "حدث خطأ أثناء الإنشاء. جرّب قالباً آخر." : "Creation failed. Try another template.",
      );
      setPhase("pick_template");
    } finally {
      setBusy(false);
    }
  };

  const submitText = async () => {
    const text = input.trim();
    if (!text || busy || phase === "pick_agent") return;
    setInput("");
    push("user", text);

    if (phase === "ask_name") {
      const next = { ...answers, fullName: text };
      setAnswers(next);
      askNext("ask_title", ar ? "ما المسمى الوظيفي المستهدف؟" : "What’s your target job title?");
      return;
    }
    if (phase === "ask_title") {
      const next = { ...answers, jobTitle: text, role: text };
      setAnswers(next);
      askNext(
        "ask_years",
        ar
          ? "كم سنة خبرة لديك؟ (يمكنك أيضاً ذكر المجال مثل: تقنية، مالية…)"
          : "How many years of experience? (You can also mention the industry.)",
      );
      return;
    }
    if (phase === "ask_years") {
      const yearsMatch = text.match(/\d+/);
      const next = {
        ...answers,
        years: yearsMatch?.[0] ?? text,
        industry: text,
      };
      setAnswers(next);
      askNext(
        "ask_story",
        ar
          ? "اذكر إنجازاً واحداً من عملك بجملة أو جملتين."
          : "Share one work achievement in a sentence or two.",
      );
      return;
    }
    if (phase === "ask_story") {
      const next = { ...answers, story: text };
      setAnswers(next);
      askNext(
        "ask_skills",
        ar
          ? "اكتب مهاراتك مفصولة بفاصلة (أو اكتب «تخطي»)."
          : "List your skills separated by commas (or type “skip”).",
      );
      return;
    }
    if (phase === "ask_skills") {
      const skip = /^(تخطي|skip|no|لا)$/i.test(text);
      const next = { ...answers, skills: skip ? "" : text };
      setAnswers(next);
      await runDrafting(next);
    }
  };

  if (hidden) return null;

  const ui = (
    <div
      className="seerati-float-assistant pointer-events-none fixed z-[1100] flex flex-col items-stretch gap-3"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        insetInlineEnd: "max(1rem, env(safe-area-inset-inline-end, 0px))",
        insetInlineStart: "auto",
        width: "min(28rem, calc(100vw - 2rem))",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      {open && (
        <div
          className={cn(
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lift",
            "h-[min(34rem,calc(100dvh-6.5rem))] max-h-[calc(100dvh-6.5rem)]",
            "max-md:h-[min(78dvh,calc(100dvh-5.5rem))]",
          )}
          role="dialog"
          aria-modal="true"
          aria-label={ar ? "مساعد سيرتي" : "Seerati Assistant"}
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border bg-primary px-3 py-2.5 text-primary-foreground">
            <span className="grid size-8 place-items-center rounded-xl bg-primary-foreground/15">
              <Wand2 className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {ar ? "مساعد سيرتي" : "Seerati Assistant"}
              </p>
              <p className="truncate text-[11px] opacity-80">
                {phase === "pick_agent"
                  ? ar
                    ? "اختر متخصصاً ليقود الجلسة"
                    : "Pick a specialist to lead"
                  : ar
                    ? `معك ${specialist.name.ar} · إنشاء سيرة + قالب`
                    : `With ${specialist.name.en} · resume + template`}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-10 shrink-0 text-primary-foreground hover:bg-primary-foreground/15 md:size-8"
              onClick={() => setOpen(false)}
              aria-label={ar ? "إغلاق" : "Close"}
            >
              <X className="size-4" />
            </Button>
          </header>

          <ScrollArea className="min-h-0 flex-1 px-3 py-3">
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-secondary text-foreground"
                      : "ms-auto bg-primary text-primary-foreground",
                  )}
                >
                  {m.text}
                </div>
              ))}

              {phase === "pick_agent" && (
                <div className="grid gap-2">
                  {ASSISTANT_AGENTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => beginWithAgent(a.id)}
                      className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background p-2.5 text-start transition-colors hover:border-primary/40 hover:bg-secondary/70"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {a.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{a.name[lang]}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {a.role[lang]}
                        </span>
                      </span>
                      {a.track === "engineering" && (
                        <Badge variant="outline" className="shrink-0 text-[9px]">
                          {ar ? "هندسة" : "Eng"}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {phase === "pick_template" && (
                <div className="space-y-2 rounded-2xl border border-border bg-background p-2">
                  <p className="px-1 text-xs font-semibold text-muted-foreground">
                    {ar ? "اختر قالباً" : "Choose a template"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        disabled={busy}
                        onClick={() => void createWithTemplate(tpl.id)}
                        className={cn(
                          "min-h-11 rounded-xl border p-2.5 text-start transition-colors",
                          templateId === tpl.id
                            ? "border-primary bg-secondary"
                            : "border-border hover:bg-secondary/70",
                        )}
                      >
                        <div
                          className="mb-2 h-10 rounded-lg border border-border/60"
                          style={{
                            background: `linear-gradient(160deg, ${tpl.design.accent}22, transparent 70%)`,
                          }}
                        />
                        <p className="text-xs font-bold leading-snug">{tpl.name[lang]}</p>
                        {tpl.atsFriendly && (
                          <Badge variant="outline" className="mt-1 text-[9px]">
                            ATS
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {busy && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  {ar ? "يعمل…" : "Working…"}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <footer className="shrink-0 border-t border-border p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
            {phase !== "pick_agent" &&
            phase !== "pick_template" &&
            phase !== "drafting" &&
            phase !== "creating" ? (
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitText();
                }}
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  disabled={busy}
                  placeholder={ar ? "اكتب ردك…" : "Type your reply…"}
                  className="min-h-11 resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitText();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-11 shrink-0"
                  disabled={busy || !input.trim()}
                  aria-label={ar ? "إرسال" : "Send"}
                >
                  <Send className="size-4" />
                </Button>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <Button type="button" variant="ghost" size="sm" onClick={resetChat} disabled={busy}>
                  {ar ? "ابدأ من جديد" : "Start over"}
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to="/assistant" search={{ agent: agentId }} onClick={() => setOpen(false)}>
                    <Sparkles className="size-3.5" />
                    {ar ? "المساعد الكامل" : "Full assistant"}
                  </Link>
                </Button>
              </div>
            )}
          </footer>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className={cn(
          "pointer-events-auto ms-auto h-14 min-w-14 gap-2 rounded-2xl px-4 shadow-lift",
          "bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90",
          "touch-manipulation",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={ar ? "فتح مساعد سيرتي" : "Open Seerati Assistant"}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span className="font-bold max-[380px]:hidden sm:inline">
          {ar ? "مساعد سيرتي" : "Seerati Assistant"}
        </span>
      </Button>
    </div>
  );

  if (typeof document === "undefined") return ui;
  return createPortal(ui, document.body);
}
