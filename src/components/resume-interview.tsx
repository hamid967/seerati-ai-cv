import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { aiService } from "@/lib/ai-service";
import { useStore } from "@/lib/store";
import { emptyResumeData, uid, type Experience, type ResumeData } from "@/lib/types";

/**
 * A guided, chat-style interview that incrementally builds a `ResumeData`
 * draft, then creates the resume through the store and hands off to the editor.
 * AI is only ever used to *suggest* rewrites: nothing is applied without an
 * explicit "Apply" click, and any AI-suggested number is wrapped as an
 * unresolved placeholder the user must confirm.
 */

type Msg = { from: "bot" | "user"; text: string };

type StepId =
  | "fullName"
  | "currentTitle"
  | "targetJob"
  | "years"
  | "industry"
  | "exp1_company"
  | "exp1_role"
  | "exp1_dates"
  | "exp1_resp"
  | "exp1_achv"
  | "hasSecondExp"
  | "exp2_company"
  | "exp2_role"
  | "exp2_dates"
  | "exp2_resp"
  | "exp2_achv"
  | "eduDegree"
  | "eduSchool"
  | "eduDates"
  | "courses"
  | "skills"
  | "languages"
  | "projects"
  | "summary"
  | "done";

const ORDER: StepId[] = [
  "fullName",
  "currentTitle",
  "targetJob",
  "years",
  "industry",
  "exp1_company",
  "exp1_role",
  "exp1_dates",
  "exp1_resp",
  "exp1_achv",
  "hasSecondExp",
  // exp2_* inserted conditionally
  "eduDegree",
  "eduSchool",
  "eduDates",
  "courses",
  "skills",
  "languages",
  "projects",
  "summary",
  "done",
];

const YEARS_CHIPS = ["٠-١", "١-٣", "٤-٧", "٨+"];
const YEARS_CHIPS_EN = ["0-1", "1-3", "4-7", "8+"];
const INDUSTRY_CHIPS_AR = [
  "تقنية المعلومات",
  "المالية",
  "الصحة",
  "التعليم",
  "التجزئة",
  "الطاقة",
  "الحكومي",
  "أخرى",
];
const INDUSTRY_CHIPS_EN = [
  "IT",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Energy",
  "Government",
  "Other",
];
const LANG_CHIPS_AR = ["العربية", "الإنجليزية", "الفرنسية", "لا يوجد"];
const LANG_CHIPS_EN = ["Arabic", "English", "French", "None"];

/** Wraps any AI-suggested numeric figure with an explicit confirm placeholder,
 *  so we never present an invented number as fact. */
function sanitizeQuantified(text: string, ar: boolean): string {
  return text.replace(/([\d٠-٩]+(?:[.,][\d٠-٩]+)?\s?[%٪])/g, (m) =>
    ar ? `[أكّد الرقم: ${m}]` : `[confirm figure: ${m}]`,
  );
}

function AiReviewPanel({
  ar,
  before,
  after,
  busy,
  onApply,
  onRegenerate,
  onKeep,
}: {
  ar: boolean;
  before: string;
  after: string;
  busy: boolean;
  onApply: () => void;
  onRegenerate: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-accent/40 bg-accent/5 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <Sparkles className="size-3.5" />
        {ar
          ? "مقارنة قبل / بعد — لن يُطبَّق شيء تلقائياً"
          : "Before / after — nothing applies automatically"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-2">
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
            {ar ? "قبل" : "Before"}
          </p>
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{before || "—"}</p>
        </div>
        <div className="rounded-lg border border-primary/40 bg-background p-2">
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
            {ar ? "بعد (مقترح)" : "After (suggested)"}
          </p>
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{after}</p>
        </div>
      </div>
      {/(أكّد الرقم|confirm figure)/.test(after) && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          {ar
            ? "الأرقام الموضوعة بين قوسين اقتراح فقط — استبدلها برقمك الحقيقي قبل الحفظ."
            : "Bracketed figures are placeholders only — replace them with your real number before saving."}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="h-7 text-[11.5px]" onClick={onApply} disabled={busy}>
          {ar ? "تطبيق" : "Apply"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11.5px]"
          onClick={onRegenerate}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : null}
          {ar ? "إعادة توليد" : "Regenerate"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[11.5px]"
          onClick={onKeep}
          disabled={busy}
        >
          {ar ? "الاحتفاظ بالأصل" : "Keep original"}
        </Button>
      </div>
    </div>
  );
}

export function ResumeInterview({
  lang,
  templateId,
  initial,
  onCancel,
}: {
  lang: "ar" | "en";
  templateId: string;
  initial?: {
    fullName?: string;
    currentTitle?: string;
    targetJob?: string;
    years?: string;
    industry?: string;
  };
  onCancel: () => void;
}) {
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { createResume, updateResume } = useStore();

  const [stepIdx, setStepIdx] = useState(0);
  const [extraExp2, setExtraExp2] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: ar
        ? "لنبنِ سيرتك الذاتية معاً خطوة بخطوة. ما اسمك الكامل؟"
        : "Let’s build your resume together, step by step. What’s your full name?",
    },
  ]);
  const [input, setInput] = useState(initial?.fullName ?? "");
  const [langsSelected, setLangsSelected] = useState<string[]>([]);
  const [busySave, setBusySave] = useState(false);

  const [draft, setDraft] = useState<ResumeData>(() => ({
    ...emptyResumeData(),
    personal: {
      ...emptyResumeData().personal,
      fullName: initial?.fullName ?? "",
      jobTitle: initial?.currentTitle ?? "",
    },
    targetJob: initial?.targetJob ?? "",
  }));

  const exp1Ref = useRef<Partial<Experience>>({});
  const exp2Ref = useRef<Partial<Experience>>({});

  const [aiPanel, setAiPanel] = useState<{
    before: string;
    after: string;
    busy: boolean;
    apply: (text: string) => void;
    regenerate: () => void;
  } | null>(null);

  const steps = useMemo(() => {
    if (!extraExp2) return ORDER;
    const idx = ORDER.indexOf("hasSecondExp");
    return [
      ...ORDER.slice(0, idx + 1),
      "exp2_company",
      "exp2_role",
      "exp2_dates",
      "exp2_resp",
      "exp2_achv",
      ...ORDER.slice(idx + 1),
    ] as StepId[];
  }, [extraExp2]);

  const step: StepId = steps[stepIdx] ?? "done";

  const say = (text: string) => setMessages((m) => [...m, { from: "bot", text }]);
  const reply = (text: string) => setMessages((m) => [...m, { from: "user", text }]);

  const advance = (nextPrompt?: string) => {
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    setInput("");
    setAiPanel(null);
    if (nextPrompt) say(nextPrompt);
  };

  const promptFor: Record<StepId, string> = {
    fullName: ar ? "ما اسمك الكامل؟" : "What is your full name?",
    currentTitle: ar ? "ما مسمّاك الوظيفي الحالي؟" : "What is your current job title?",
    targetJob: ar ? "ما المسمى الوظيفي الذي تستهدفه؟" : "Which job title are you targeting?",
    years: ar ? "كم سنة خبرة لديك؟" : "How many years of experience do you have?",
    industry: ar ? "في أي قطاع تعمل؟" : "Which industry do you work in?",
    exp1_company: ar
      ? "لنبدأ بأحدث وظيفة. ما اسم الشركة؟"
      : "Let’s start with your most recent job. What’s the company name?",
    exp1_role: ar ? "وما كان مسمّاك فيها؟" : "What was your title there?",
    exp1_dates: ar
      ? "متى بدأت وانتهيت (أو تكتب حتى الآن)؟"
      : "Start and end dates (or say ‘current’)?",
    exp1_resp: ar
      ? "صف مسؤولياتك الرئيسية هناك، سطر لكل مهمة."
      : "Describe your main responsibilities there, one line each.",
    exp1_achv: ar
      ? "ما أبرز إنجاز حققته في هذه الوظيفة؟"
      : "What is your top achievement in this role?",
    hasSecondExp: ar
      ? "هل لديك وظيفة سابقة أخرى تريد إضافتها؟"
      : "Do you have another previous job to add?",
    exp2_company: ar
      ? "ما اسم الشركة في الوظيفة السابقة؟"
      : "What’s the company name for that previous job?",
    exp2_role: ar ? "وما كان مسمّاك فيها؟" : "What was your title there?",
    exp2_dates: ar ? "متى بدأت وانتهيت؟" : "Start and end dates?",
    exp2_resp: ar
      ? "صف مسؤولياتك الرئيسية هناك، سطر لكل مهمة."
      : "Describe your main responsibilities there, one line each.",
    exp2_achv: ar
      ? "ما أبرز إنجاز حققته في هذه الوظيفة؟"
      : "What is your top achievement in this role?",
    eduDegree: ar ? "ما آخر مؤهل علمي حصلت عليه؟" : "What is your highest qualification?",
    eduSchool: ar ? "من أي جهة أو جامعة؟" : "From which institution?",
    eduDates: ar ? "سنة التخرج (اختياري)؟" : "Graduation year (optional)?",
    courses: ar
      ? "هل لديك دورات أو شهادات تريد إضافتها؟ اذكرها مفصولة بفواصل، أو اكتب «لا يوجد»."
      : "Any courses or certificates to add? Comma-separated, or say ‘None’.",
    skills: ar ? "اذكر أهم مهاراتك مفصولة بفواصل." : "List your top skills, comma-separated.",
    languages: ar ? "ما اللغات التي تتقنها؟" : "Which languages do you speak?",
    projects: ar
      ? "هل لديك مشاريع أو روابط (بورتفوليو، لينكدإن) تريد إضافتها؟ أو اكتب «لا يوجد»."
      : "Any projects or links (portfolio, LinkedIn) to add? Or say ‘None’.",
    summary: ar
      ? "سأقترح لك ملخصاً مهنياً بناءً على إجاباتك."
      : "I’ll suggest a professional summary based on your answers.",
    done: "",
  };

  const chipsFor = (): string[] | null => {
    switch (step) {
      case "years":
        return ar ? YEARS_CHIPS : YEARS_CHIPS_EN;
      case "industry":
        return ar ? INDUSTRY_CHIPS_AR : INDUSTRY_CHIPS_EN;
      case "hasSecondExp":
        return ar ? ["نعم", "لا"] : ["Yes", "No"];
      case "courses":
      case "projects":
        return ar ? ["لا يوجد"] : ["None"];
      default:
        return null;
    }
  };

  const isSkippable = (): boolean =>
    !["fullName", "targetJob", "years", "hasSecondExp"].includes(step);

  const finalizeSummary = async (raw: string) => {
    setAiPanel({ before: "", after: "", busy: true, apply: () => {}, regenerate: () => {} });
    try {
      const res = await aiService.run({
        task: "summary",
        lang,
        input: raw,
        context: {
          ...draft,
          targetRole: draft.targetJob ?? "",
          answers: { years: draft.personal.jobTitle },
        },
      });
      setAiPanel({
        before: draft.summary || (ar ? "لا يوجد ملخص بعد" : "No summary yet"),
        after: res.text,
        busy: false,
        apply: (t: string) => {
          setDraft((d) => ({ ...d, summary: t }));
          setAiPanel(null);
          advance();
          say(
            ar
              ? "تم اعتماد الملخص. أعددت لك ملخص إنجازاتك — راجع البطاقة أدناه."
              : "Summary applied. Review your progress card below.",
          );
        },
        regenerate: () => void finalizeSummary(raw),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
      setAiPanel(null);
    }
  };

  const runQuantify = async (raw: string, applyTo: (text: string) => void) => {
    setAiPanel({ before: raw, after: "", busy: true, apply: () => {}, regenerate: () => {} });
    try {
      const res = await aiService.run({
        task: "quantify",
        lang,
        input: raw,
        context: { ...draft },
      });
      const after = sanitizeQuantified(res.text, ar);
      setAiPanel({
        before: raw,
        after,
        busy: false,
        apply: (t: string) => {
          applyTo(t);
          setAiPanel(null);
        },
        regenerate: () => void runQuantify(raw, applyTo),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
      setAiPanel(null);
    }
  };

  const submit = (valueOverride?: string) => {
    const value = (valueOverride ?? input).trim();
    if (!value && isSkippable()) {
      handleSkip();
      return;
    }
    if (!value) return;
    reply(value);

    switch (step) {
      case "fullName":
        setDraft((d) => ({ ...d, personal: { ...d.personal, fullName: value } }));
        break;
      case "currentTitle":
        setDraft((d) => ({
          ...d,
          personal: { ...d.personal, jobTitle: d.personal.jobTitle || value },
        }));
        break;
      case "targetJob":
        setDraft((d) => ({
          ...d,
          targetJob: value,
          personal: { ...d.personal, jobTitle: d.personal.jobTitle || value },
        }));
        break;
      case "years":
      case "industry":
        // Kept only in the transcript/context; profile-level fields are saved by onboarding itself.
        break;
      case "exp1_company":
        exp1Ref.current.company = value;
        break;
      case "exp1_role":
        exp1Ref.current.role = value;
        break;
      case "exp1_dates": {
        const [start, end] = value.split(/[-–]/).map((s) => s.trim());
        exp1Ref.current.start = start ?? "";
        exp1Ref.current.end = end || (ar ? "حتى الآن" : "Present");
        break;
      }
      case "exp1_resp": {
        const bullets = value
          .split(/\n|،\s*(?=\S{6,})/)
          .map((s) => s.trim())
          .filter(Boolean);
        exp1Ref.current.bullets = bullets.length ? bullets : [value];
        break;
      }
      case "exp1_achv": {
        const bullets = [...(exp1Ref.current.bullets ?? []), value];
        exp1Ref.current.bullets = bullets;
        const exp: Experience = {
          id: uid(),
          company: exp1Ref.current.company ?? "",
          role: exp1Ref.current.role ?? "",
          start: exp1Ref.current.start ?? "",
          end: exp1Ref.current.end ?? "",
          bullets,
        };
        setDraft((d) => ({
          ...d,
          experience: [...d.experience.filter((e) => e.id !== exp.id), exp],
        }));
        setAiPanel(null);
        setMessages((m) => [...m]);
        // Offer an AI quantify pass on the achievement line before moving on.
        void runQuantify(value, (t) => {
          setDraft((d) => ({
            ...d,
            experience: d.experience.map((e) =>
              e.id === exp.id ? { ...e, bullets: [...e.bullets.slice(0, -1), t] } : e,
            ),
          }));
        });
        break;
      }
      case "hasSecondExp": {
        const yes = /^(نعم|yes|y)/i.test(value);
        setExtraExp2(yes);
        break;
      }
      case "exp2_company":
        exp2Ref.current.company = value;
        break;
      case "exp2_role":
        exp2Ref.current.role = value;
        break;
      case "exp2_dates": {
        const [start, end] = value.split(/[-–]/).map((s) => s.trim());
        exp2Ref.current.start = start ?? "";
        exp2Ref.current.end = end || (ar ? "حتى الآن" : "Present");
        break;
      }
      case "exp2_resp": {
        const bullets = value
          .split(/\n|،\s*(?=\S{6,})/)
          .map((s) => s.trim())
          .filter(Boolean);
        exp2Ref.current.bullets = bullets.length ? bullets : [value];
        break;
      }
      case "exp2_achv": {
        const bullets = [...(exp2Ref.current.bullets ?? []), value];
        const exp: Experience = {
          id: uid(),
          company: exp2Ref.current.company ?? "",
          role: exp2Ref.current.role ?? "",
          start: exp2Ref.current.start ?? "",
          end: exp2Ref.current.end ?? "",
          bullets,
        };
        setDraft((d) => ({ ...d, experience: [...d.experience, exp] }));
        void runQuantify(value, (t) => {
          setDraft((d) => ({
            ...d,
            experience: d.experience.map((e) =>
              e.id === exp.id ? { ...e, bullets: [...e.bullets.slice(0, -1), t] } : e,
            ),
          }));
        });
        break;
      }
      case "eduDegree":
        setDraft((d) => ({
          ...d,
          education: [{ id: uid(), degree: value, school: "" }, ...d.education],
        }));
        break;
      case "eduSchool":
        setDraft((d) => ({
          ...d,
          education: d.education.map((e, i) => (i === 0 ? { ...e, school: value } : e)),
        }));
        break;
      case "eduDates":
        setDraft((d) => ({
          ...d,
          education: d.education.map((e, i) => (i === 0 ? { ...e, end: value } : e)),
        }));
        break;
      case "courses": {
        if (!/^(لا يوجد|none)$/i.test(value)) {
          const items = value
            .split(/[,،]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((title) => ({ id: uid(), title }));
          setDraft((d) => ({ ...d, certificates: items }));
        }
        break;
      }
      case "skills": {
        const items = value
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ id: uid(), name }));
        setDraft((d) => ({ ...d, skills: items }));
        break;
      }
      case "languages": {
        const chosen = langsSelected.length
          ? langsSelected
          : value
              .split(/[,،]/)
              .map((s) => s.trim())
              .filter(Boolean);
        if (!chosen.some((c) => /^(لا يوجد|none)$/i.test(c))) {
          setDraft((d) => ({
            ...d,
            languages: chosen.map((name) => ({
              id: uid(),
              name,
              level: ar ? "جيد" : "Proficient",
            })),
          }));
        }
        break;
      }
      case "projects": {
        if (!/^(لا يوجد|none)$/i.test(value)) {
          const items = value
            .split(/[,،]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((title) => ({ id: uid(), title }));
          setDraft((d) => ({ ...d, projects: items }));
        }
        break;
      }
      default:
        break;
    }

    if (step === "exp1_achv" || step === "exp2_achv") {
      // Advance happens after the AI panel is resolved (Apply/Keep), not immediately.
      return;
    }

    const nextIdx = stepIdx + 1;
    const nextStepId: StepId = steps[nextIdx] ?? "done";
    if (step === "hasSecondExp" && !/^(نعم|yes|y)/i.test(value)) {
      // Skip straight past the exp2 block since ORDER already excludes it when extraExp2=false.
    }
    if (nextStepId === "summary") {
      advance();
      const raw = ar
        ? `${draft.personal.fullName || value} — ${draft.targetJob || draft.personal.jobTitle}`
        : `${draft.personal.fullName || value} — ${draft.targetJob || draft.personal.jobTitle}`;
      void finalizeSummary(raw);
      return;
    }
    advance(promptFor[nextStepId]);
  };

  const handleSkip = () => {
    reply(ar ? "تخطي" : "Skip");
    const nextIdx = stepIdx + 1;
    const nextStepId: StepId = steps[nextIdx] ?? "done";
    if (nextStepId === "summary") {
      advance();
      void finalizeSummary(
        `${draft.personal.fullName} — ${draft.targetJob || draft.personal.jobTitle}`,
      );
      return;
    }
    advance(promptFor[nextStepId]);
  };

  const toggleLang = (l: string) => {
    setLangsSelected((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  const filledSections = useMemo(() => {
    const s: string[] = [];
    if (draft.summary) s.push(ar ? "الملخص" : "Summary");
    if (draft.experience.length) s.push(ar ? "الخبرات" : "Experience");
    if (draft.education.length) s.push(ar ? "التعليم" : "Education");
    if (draft.certificates.length) s.push(ar ? "الدورات والشهادات" : "Certificates");
    if (draft.skills.length) s.push(ar ? "المهارات" : "Skills");
    if (draft.languages.length) s.push(ar ? "اللغات" : "Languages");
    if (draft.projects.length) s.push(ar ? "المشاريع" : "Projects");
    return s;
  }, [draft, ar]);

  const finish = async () => {
    setBusySave(true);
    const created = await createResume({
      title: draft.targetJob
        ? ar
          ? `سيرة ${draft.targetJob}`
          : `${draft.targetJob} resume`
        : ar
          ? "سيرتي الذاتية"
          : "My resume",
      templateId,
      language: lang,
      jobTitle: draft.targetJob || draft.personal.jobTitle,
    });
    if (!created) {
      setBusySave(false);
      toast.error(ar ? "تعذّر إنشاء السيرة الذاتية" : "Couldn’t create the resume");
      return;
    }
    await updateResume(created.id, {
      data: {
        ...draft,
        personal: { ...draft.personal, email: created.data.personal.email },
      },
    });
    setBusySave(false);
    toast.success(ar ? "سيرتك جاهزة للتحرير" : "Your resume is ready to edit");
    navigate({ to: "/resumes/$id/edit", params: { id: created.id } });
  };

  if (step === "done") {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-lg font-extrabold">
            {ar ? "سيرتك جاهزة للتحرير" : "Your resume is ready to edit"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar
              ? "الأقسام التي جمعناها من محادثتنا:"
              : "Sections we gathered from our conversation:"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {filledSections.length ? (
              filledSections.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                {ar ? "لا توجد أقسام بعد" : "No sections yet"}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void finish()} disabled={busySave}>
            {busySave ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "افتح المحرر" : "Open editor"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={busySave}>
            {ar ? "رجوع" : "Back"}
          </Button>
        </div>
      </div>
    );
  }

  const chips = chipsFor();

  return (
    <div className="space-y-4">
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-secondary/20 p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-1.5 text-[13px] ${
                m.from === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {aiPanel && (
        <AiReviewPanel
          ar={ar}
          before={aiPanel.before}
          after={aiPanel.after}
          busy={aiPanel.busy}
          onApply={() => aiPanel.apply(aiPanel.after)}
          onRegenerate={aiPanel.regenerate}
          onKeep={() => {
            if (step === "exp1_achv" || step === "exp2_achv") {
              setAiPanel(null);
              const nextIdx = stepIdx + 1;
              const nextStepId: StepId = steps[nextIdx] ?? "done";
              if (nextStepId === "summary") {
                advance();
                void finalizeSummary(
                  `${draft.personal.fullName} — ${draft.targetJob || draft.personal.jobTitle}`,
                );
              } else {
                advance(promptFor[nextStepId]);
              }
            } else {
              setAiPanel(null);
            }
          }}
        />
      )}

      {!aiPanel && step === "languages" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(ar ? LANG_CHIPS_AR : LANG_CHIPS_EN).map((l) => (
              <Button
                key={l}
                size="sm"
                variant={langsSelected.includes(l) ? "default" : "outline"}
                onClick={() => toggleLang(l)}
              >
                {l}
              </Button>
            ))}
          </div>
          <Button onClick={() => submit(langsSelected.join(", ") || (ar ? "لا يوجد" : "None"))}>
            {ar ? "متابعة" : "Continue"}
          </Button>
        </div>
      ) : !aiPanel ? (
        <div className="space-y-2">
          {chips && (
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <Button key={c} size="sm" variant="outline" onClick={() => submit(c)}>
                  {c}
                </Button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            {step === "exp1_resp" || step === "exp2_resp" ? (
              <Textarea
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ar ? "سطر لكل مسؤولية" : "One line per responsibility"}
              />
            ) : (
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={ar ? "اكتب إجابتك هنا" : "Type your answer"}
              />
            )}
            <Button onClick={() => submit()} aria-label="send">
              <Send className="size-4" />
            </Button>
          </div>
          <div className="flex justify-between">
            {isSkippable() ? (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                {ar ? "تخطي" : "Skip"}
              </Button>
            ) : (
              <span />
            )}
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {ar ? "إلغاء والعودة" : "Cancel and go back"}
            </Button>
          </div>
        </div>
      ) : null}

      {filledSections.length > 0 && (
        <div className="rounded-lg border border-dashed border-border p-3 text-xs">
          <p className="mb-1 font-semibold text-muted-foreground">
            {ar ? "ما جمعناه حتى الآن" : "What we’ve gathered so far"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filledSections.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
