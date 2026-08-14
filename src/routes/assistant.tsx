import { lazy, Suspense, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { GuestNotice } from "@/components/guest-notice";
import { AdaptiveQuestion } from "@/components/noura/adaptive-question";
import { buildNouraEvidencePlan, requestNouraEvidenceSuggestion } from "@/modules/ai";
import { createPrivacyRuntime } from "@/modules/privacy";
import { getTemplate } from "@/lib/template-utils";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import {
  buildAssistantData,
  createFilledAssistantResume,
  emptyAssistantAnswers,
  type AssistantAnswers,
} from "@/lib/assistant-create";
import { agentById, agentsForSurface } from "@/lib/team";
import { defaultTemplates } from "@/lib/templates";
import type { Resume } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  adaptiveQuestionForGoal,
  createInitialJourney,
  isAdaptiveQuestionComplete,
  journeyPrompt,
  journeyStageProgress,
  NOURA_GOALS,
  NOURA_PROFILE,
  transitionJourney,
  type JourneyEvent,
  type NouraGoal,
} from "@/modules/noura";

const ASSISTANT_AGENTS = agentsForSurface("assistant");
const AssistantCapabilityHub = lazy(() =>
  import("@/components/assistant-capability-hub").then((m) => ({
    default: m.AssistantCapabilityHub,
  })),
);
const ResumePreview = lazy(() =>
  import("@/components/resume-preview").then((m) => ({ default: m.ResumePreview })),
);
const SyntheticSampleFlow = lazy(() =>
  import("@/components/noura/synthetic-sample-flow").then((m) => ({
    default: m.SyntheticSampleFlow,
  })),
);

export const Route = createFileRoute("/assistant")({
  validateSearch: z.object({ agent: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "مساعد سيرتي — أنشئ سيرتك خطوة بخطوة" },
      {
        name: "description",
        content:
          "مساعد سيرتي يسألك أسئلة قصيرة، يكتب لك الملخص والإنجازات بالذكاء الاصطناعي، ويساعدك على اختيار القالب المناسب.",
      },
      { property: "og:title", content: "مساعد سيرتي" },
      {
        property: "og:description",
        content: "أنشئ سيرة ذاتية احترافية بمساعدة الذكاء الاصطناعي واختر قالبك بمعاينة مباشرة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

type Answers = AssistantAnswers;
type PendingDraft = {
  summary: string;
  providerId: string;
  evidenceFactIds: string[];
};
const emptyAnswers = emptyAssistantAnswers();
const goalToCreationMode: Record<NouraGoal, Answers["creationMode"]> = {
  create_resume: "scratch",
  improve_resume: "improve",
  target_job: "scratch",
  import_resume: "import",
  check_ats: "improve",
  cover_letter: "improve",
  review_resume: "improve",
};

function DeferredCapabilityHub() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {lang === "ar" ? "الأدوات عند الحاجة" : "Tools when needed"}
      </Button>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="min-h-24 rounded-2xl border border-border bg-card" aria-hidden="true" />
      }
    >
      <AssistantCapabilityHub />
    </Suspense>
  );
}

function AssistantPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { agent: agentFromSearch } = Route.useSearch();
  const { atLimit, isGuest, createResume, updateResume } = useStore();
  useAuthGuard({ allowGuest: true });

  const initialAgent =
    (agentFromSearch && agentById(agentFromSearch)?.id) || ASSISTANT_AGENTS[0]?.id || "noura";

  const [journey, setJourney] = useState(createInitialJourney);
  const step = journey.step;
  const goal = journey.goal ?? "";
  const nouraState = journey.state;
  const dispatchJourney = (event: JourneyEvent) =>
    setJourney((snapshot) => transitionJourney(snapshot, event));
  const [agentId, setAgentId] = useState(initialAgent);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [resumeLang, setResumeLang] = useState<"ar" | "en">(lang);
  const [drafting, setDrafting] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [summary, setSummary] = useState("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
  const evidencePrivacy = useMemo(createPrivacyRuntime, []);
  const [templateId, setTemplateId] = useState("cloud-flow");
  const [saving, setSaving] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);

  const specialist = agentById(agentId) ?? ASSISTANT_AGENTS[0]!;
  const isNoura = specialist.id === NOURA_PROFILE.id;
  const selectedGoal = NOURA_GOALS.find((item) => item.id === goal);
  const adaptiveQuestion = adaptiveQuestionForGoal(journey.goal);
  const hasPreviewContent = Boolean(
    answers.fullName || answers.jobTitle || summary || bullets.length || skills.length,
  );

  const set = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));
  const chooseGoal = (nextGoal: NouraGoal) => {
    dispatchJourney({ type: "choose_goal", goal: nextGoal });
    set({ creationMode: goalToCreationMode[nextGoal] });
  };

  const openContextTool = (tool: "import" | "ats" | "cover-letter") => {
    const destinations = {
      import: "/import",
      ats: "/ats",
      "cover-letter": "/cover-letters",
    } as const;
    void navigate({ to: destinations[tool] });
  };

  const previewData = useMemo(
    () => buildAssistantData(answers, resumeLang, summary, bullets, skills),
    [answers, resumeLang, summary, bullets, skills],
  );

  const evidencePlan = useMemo(
    () =>
      buildNouraEvidencePlan({
        data: previewData,
        locale: resumeLang,
        consentAiProcessing: aiConsent,
      }),
    [previewData, resumeLang, aiConsent],
  );

  const previewResume: Resume = useMemo(
    () => ({
      id: "assistant-preview",
      ownerId: "preview",
      title: answers.jobTitle || (ar ? "سيرتي الذاتية" : "My resume"),
      templateId,
      language: resumeLang,
      data: previewData,
      status: "draft",
      completionScore: 0,
      atsScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [answers.jobTitle, ar, templateId, resumeLang, previewData],
  );

  const currentHeading =
    step === 0
      ? ar
        ? "ابدأ مع نورة"
        : "Start with Noura"
      : step === 1 && adaptiveQuestion
        ? adaptiveQuestion.title[lang]
        : step === 2
          ? ar
            ? "خبرتك وأدلتك"
            : "Your experience and evidence"
          : step === 3
            ? ar
              ? "مراجعة المسودة"
              : "Review your draft"
            : ar
              ? "اختر قالباً"
              : "Pick a template";
  const isFinalStep = step === 4;
  const progressValue = goal
    ? step === 1 && adaptiveQuestion
      ? journeyStageProgress(adaptiveQuestion.stage)
      : Math.min(96, Math.max(20, ((step + 1) / 5) * 100))
    : 8;

  const canNext =
    step === 1 ? isAdaptiveQuestionComplete(adaptiveQuestion, answers) : step === 0 ? false : true;

  const runDrafting = async () => {
    if (!aiConsent) {
      dispatchJourney({ type: "request_ai" });
      toast.message(
        ar
          ? "اختر الموافقة أولاً. يمكنك متابعة التحرير محلياً دون إرسال البيانات."
          : "Choose consent first. You can continue editing locally without sending data.",
      );
      return;
    }
    setDrafting(true);
    dispatchJourney({ type: "request_ai" });
    try {
      const result = await requestNouraEvidenceSuggestion(evidencePrivacy, evidencePlan);
      if ("error" in result) {
        dispatchJourney({ type: "retry" });
        toast.error(
          ar
            ? "لم نتمكن من التحقق من الاقتراح مقابل أدلتك. يمكنك المتابعة بالتحرير المحلي."
            : "We could not validate the suggestion against your evidence. You can continue editing locally.",
        );
        return;
      }
      const [suggestion] = result.suggestions;
      const [diff] = result.diffs;
      if (!suggestion || !diff) {
        dispatchJourney({ type: "retry" });
        toast.error(ar ? "لم يصل اقتراح قابل للمراجعة." : "No reviewable suggestion was returned.");
        return;
      }
      setPendingDraft({
        summary: diff.after,
        providerId: evidencePlan.providerId,
        evidenceFactIds: diff.evidenceFactIds,
      });
      dispatchJourney({ type: "suggestion_ready" });
      toast.success(ar ? "الاقتراح جاهز للمراجعة" : "Suggestion ready for review");
    } catch {
      dispatchJourney({ type: "retry" });
      toast.error(
        ar
          ? "تعذّرت الصياغة الآن، واستمر محرر المسودة محلياً دون تغيير."
          : "Drafting is unavailable; your local draft remains unchanged.",
      );
    } finally {
      setDrafting(false);
    }
  };

  const finish = async () => {
    if (atLimit) {
      toast.error(ar ? "وصلت الحد الأقصى للسير الذاتية." : "You reached your resume limit.");
      return;
    }
    setSaving(true);
    try {
      const created = await createFilledAssistantResume(
        { createResume, updateResume },
        {
          answers,
          templateId,
          language: resumeLang,
          summary,
          bullets,
          skills,
          titleFallback: ar ? "سيرتي الذاتية" : "My resume",
        },
      );
      toast.success(
        ar ? "أُنشئت سيرتك وتم ملء الأقسام تلقائياً" : "Resume created with sections pre-filled",
      );
      if (isGuest) {
        toast.message(
          ar
            ? "ستبقى السيرة في هذه الجلسة فقط. يمكنك اختيار التسجيل لاحقاً إذا أردت الحفظ."
            : "Your resume stays in this session only. You can choose to sign up later if you want to save it.",
        );
      }
      navigate({ to: "/resumes/$id/edit", params: { id: created.id } });
    } catch {
      toast.error(ar ? "تعذّر إنشاء السيرة الذاتية." : "Could not create the resume.");
    } finally {
      setSaving(false);
    }
  };

  if (sampleMode) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-start gap-3">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              <span className="text-xl font-black">ن</span>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                NOURA · نورة
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {ar ? "نموذج سيرة حسب التخصص" : "Sample CV by profession"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {ar
                  ? "بيانات تجريبية محلية فقط، قابلة للتحرير والمراجعة."
                  : "Local fictional data only, ready for editing and review."}
              </p>
            </div>
          </div>
          <GuestNotice className="mt-5" compact />
          <Suspense
            fallback={
              <div
                className="mt-5 min-h-96 rounded-2xl border border-border bg-card"
                aria-busy="true"
              />
            }
          >
            <div className="mt-5">
              <SyntheticSampleFlow onClose={() => setSampleMode(false)} />
            </div>
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex items-start gap-3">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              <span className="text-xl font-black">ن</span>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                NOURA · نورة
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {isNoura ? NOURA_PROFILE.role[lang] : specialist.name[lang]}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {isNoura
                  ? ar
                    ? "أهلًا، أنا نورة. سأساعدك تبني سيرة مهنية خطوة بخطوة، ولن أرسل شيئاً للذكاء الاصطناعي دون موافقتك."
                    : "Hi, I’m Noura. I’ll help you build a professional resume step by step, and I won’t send anything to AI without your consent."
                  : `${specialist.name[lang]} · ${specialist.role[lang]}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:justify-end">
            <Badge variant="secondary">
              {nouraState === "ai_processing"
                ? ar
                  ? "AI يعمل"
                  : "AI processing"
                : ar
                  ? "محلي أولاً"
                  : "Local first"}
            </Badge>
            <Badge variant="outline">
              {goal
                ? ar
                  ? "رحلة مخصصة"
                  : "Tailored journey"
                : ar
                  ? "ابدأ بهدف"
                  : "Start with a goal"}
            </Badge>
          </div>
        </div>

        <Progress
          value={progressValue}
          className="mt-5 h-1.5"
          aria-label={ar ? "تقدم إنشاء السيرة" : "Resume creation progress"}
        />
        <GuestNotice className="mt-4" compact />
        <div className="mt-4 flex justify-end" id="assistant-capabilities">
          <DeferredCapabilityHub />
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_.9fr]" id="assistant-builder">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold">{currentHeading}</h2>
            {journey.questionFamily && (
              <div
                className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground"
                aria-live="polite"
                data-testid="journey-next-question"
              >
                <span className="font-semibold text-foreground">
                  {ar ? "السؤال التالي:" : "Next question:"}
                </span>{" "}
                {journeyPrompt(journey, lang)}
              </div>
            )}

            {step === 0 && (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {ar ? "ما الذي تريد إنجازه اليوم؟" : "What do you want to accomplish today?"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ar
                      ? "اختر هدفاً واحداً، وسأعرض السؤال الأنسب فقط."
                      : "Choose one goal and I’ll show only the next useful question."}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {NOURA_GOALS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={goal === item.id}
                      onClick={() => chooseGoal(item.id)}
                      className={cn(
                        "min-h-14 rounded-xl border p-3 text-start text-sm transition-colors",
                        goal === item.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border hover:bg-secondary/60",
                      )}
                    >
                      <span className="block font-semibold">{item[lang]}</span>
                      {goal === item.id && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {item[lang === "ar" ? "nextAr" : "nextEn"]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  data-testid="synthetic-sample-resume-goal"
                  onClick={() => setSampleMode(true)}
                  className="min-h-14 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 text-start text-sm transition-colors hover:bg-primary/10"
                >
                  <span className="block font-semibold">
                    {ar ? "إنشاء نموذج جاهز حسب التخصص" : "Create a sample CV for my profession"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {ar
                      ? "بيانات وهمية قابلة للاستبدال، بلا تسجيل"
                      : "Fictional data to replace, no sign-up"}
                  </span>
                </button>
                {selectedGoal && (
                  <div
                    className="border-t border-border pt-4 text-sm text-muted-foreground"
                    aria-live="polite"
                  >
                    {ar ? "الخطوة التالية:" : "Next:"}{" "}
                    <span className="font-semibold text-foreground">
                      {selectedGoal[lang === "ar" ? "nextAr" : "nextEn"]}
                    </span>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="mt-4 space-y-4">
                <AdaptiveQuestion
                  goal={journey.goal}
                  lang={lang}
                  answers={answers}
                  onChange={set}
                  onOpenTool={openContextTool}
                />

                <details className="rounded-xl border border-border bg-secondary/20 px-3 py-2.5">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    {ar ? "إضافة بيانات التواصل اختيارياً" : "Add contact details (optional)"}
                  </summary>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="fullName">{ar ? "الاسم الكامل" : "Full name"}</Label>
                      <Input
                        id="fullName"
                        value={answers.fullName}
                        onChange={(event) => set({ fullName: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</Label>
                      <Input
                        id="email"
                        value={answers.email}
                        onChange={(event) => set({ email: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">{ar ? "رقم الجوال" : "Phone"}</Label>
                      <Input
                        id="phone"
                        value={answers.phone}
                        onChange={(event) => set({ phone: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">{ar ? "المدينة" : "City"}</Label>
                      <Input
                        id="city"
                        value={answers.city}
                        placeholder={ar ? "مدينة تختارها" : "A city you choose"}
                        onChange={(event) => set({ city: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="mb-1 block">{ar ? "لغة السيرة" : "Resume language"}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={resumeLang === "ar" ? "default" : "outline"}
                          onClick={() => setResumeLang("ar")}
                        >
                          العربية
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={resumeLang === "en" ? "default" : "outline"}
                          onClick={() => setResumeLang("en")}
                        >
                          English
                        </Button>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {step === 2 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="years">{ar ? "سنوات الخبرة" : "Years of experience"}</Label>
                  <Input
                    id="years"
                    value={answers.years}
                    placeholder={ar ? "مثال: ٤" : "e.g. 4"}
                    onChange={(e) => set({ years: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry">{ar ? "القطاع" : "Industry"}</Label>
                  <Input
                    id="industry"
                    value={answers.industry}
                    placeholder={ar ? "مثال: المالية" : "e.g. Finance"}
                    onChange={(e) => set({ industry: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">{ar ? "آخر مسمى وظيفي" : "Most recent role"}</Label>
                  <Input
                    id="role"
                    value={answers.role}
                    onChange={(e) => set({ role: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">{ar ? "جهة العمل" : "Company"}</Label>
                  <Input
                    id="company"
                    value={answers.company}
                    onChange={(e) => set({ company: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="period">{ar ? "الفترة" : "Period"}</Label>
                  <Input
                    id="period"
                    value={answers.period}
                    placeholder={ar ? "2021 - 2025" : "2021 - 2025"}
                    onChange={(e) => set({ period: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="story">
                    {ar
                      ? "أبرز إنجازاتك بجملة أو جملتين"
                      : "Your top achievements in a sentence or two"}
                  </Label>
                  <Textarea
                    id="story"
                    rows={4}
                    value={answers.story}
                    placeholder={
                      ar
                        ? "مثال: خفّضت زمن إعداد التقارير ٣٠٪ وأدرت فريقاً من ٥ أشخاص."
                        : "e.g. Cut reporting time by 30% and led a team of 5."
                    }
                    onChange={(e) => set({ story: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="skills">
                    {ar ? "مهاراتك (اختياري)" : "Your skills (optional)"}
                  </Label>
                  <Input
                    id="skills"
                    value={answers.skills}
                    placeholder={
                      ar ? "Excel، SQL، إدارة المشاريع" : "Excel, SQL, Project management"
                    }
                    onChange={(e) => set({ skills: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="degree">{ar ? "المؤهل" : "Degree"}</Label>
                  <Input
                    id="degree"
                    value={answers.degree}
                    onChange={(e) => set({ degree: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="school">{ar ? "الجامعة/المعهد" : "School"}</Label>
                  <Input
                    id="school"
                    value={answers.school}
                    onChange={(e) => set({ school: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-4 space-y-4">
                <section
                  className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm"
                  data-testid="noura-evidence-payload-preview"
                  aria-live="polite"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {ar ? "معاينة الإرسال قبل الموافقة" : "Transmission preview before consent"}
                    </p>
                    <Badge variant="outline">
                      {evidencePlan.preview.allowed
                        ? ar
                          ? "جاهز بعد الموافقة"
                          : "Ready after consent"
                        : ar
                          ? "لن يُرسل شيء الآن"
                          : "Nothing is sent now"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {ar
                      ? `المزوّد: ${evidencePlan.providerId}. يتم إرسال ${evidencePlan.preview.factCount} حقائق موثقة فقط عند موافقتك (${evidencePlan.estimatedPayloadCharacters} حرفاً تقريباً).`
                      : `Provider: ${evidencePlan.providerId}. Only ${evidencePlan.preview.factCount} evidenced facts are sent after your consent (~${evidencePlan.estimatedPayloadCharacters} characters).`}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {ar ? "حقول ستُرسل" : "Fields that may be sent"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {evidencePlan.includedFieldPaths.length > 0
                          ? evidencePlan.includedFieldPaths.join(" · ")
                          : ar
                            ? "لا توجد حقائق كافية بعد؛ يمكنك الاستمرار بالتحرير المحلي."
                            : "No sufficient facts yet; you can continue editing locally."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {ar ? "حقول مستبعدة" : "Excluded fields"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {evidencePlan.excludedFieldPaths.length > 0
                          ? evidencePlan.excludedFieldPaths.join(" · ")
                          : ar
                            ? "لا توجد حقول إضافية مستبعدة."
                            : "No additional fields are excluded."}
                      </p>
                    </div>
                  </div>
                </section>
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                  <Checkbox
                    id="assistant-ai-consent"
                    checked={aiConsent}
                    onCheckedChange={(value) => {
                      const consent = Boolean(value);
                      setAiConsent(consent);
                      if (consent) dispatchJourney({ type: "consent_granted" });
                    }}
                  />
                  <label htmlFor="assistant-ai-consent" className="cursor-pointer leading-relaxed">
                    {ar
                      ? "أوافق على إرسال الحد الأدنى من البيانات الموضحة أعلاه إلى مزود الذكاء الاصطناعي لصياغة اقتراح قابل للمراجعة. لن تُطبق التغييرات تلقائياً."
                      : "I consent to sending only the data listed above to the AI provider for a reviewable suggestion. Changes will not be applied automatically."}
                  </label>
                </div>
                <Button type="button" onClick={runDrafting} disabled={drafting} className="gap-2">
                  {drafting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {pendingDraft
                    ? ar
                      ? "إعادة إنشاء اقتراح"
                      : "Generate another suggestion"
                    : ar
                      ? "إنشاء اقتراح للمراجعة"
                      : "Generate a suggestion for review"}
                </Button>

                {pendingDraft ? (
                  <section
                    className="rounded-xl border border-primary/30 bg-primary/5 p-4"
                    aria-live="polite"
                    data-testid="noura-suggestion-diff"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {ar ? "اقتراح ينتظر موافقتك" : "Suggestion awaiting your approval"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ar
                            ? "لا تزال المسودة الحالية دون تغيير حتى تختار القبول."
                            : "Your current draft remains unchanged until you choose accept."}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ar
                            ? `المزوّد: ${pendingDraft.providerId} · الدليل: ${pendingDraft.evidenceFactIds.join("، ")}`
                            : `Provider: ${pendingDraft.providerId} · Evidence: ${pendingDraft.evidenceFactIds.join(", ")}`}
                        </p>
                      </div>
                      <Badge variant="outline">{ar ? "مراجعة مطلوبة" : "Review required"}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border bg-card p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {ar ? "قبل" : "Before"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                          {summary || (ar ? "لا يوجد ملخص محفوظ بعد." : "No saved summary yet.")}
                        </p>
                      </div>
                      <div className="rounded-lg border border-primary/30 bg-card p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {ar ? "الاقتراح" : "Suggestion"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                          {pendingDraft.summary ||
                            (ar ? "لا يوجد ملخص مقترح." : "No summary proposed.")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setSummary(pendingDraft.summary);
                          setPendingDraft(null);
                          dispatchJourney({ type: "approve_suggestion" });
                        }}
                      >
                        <Check className="me-2 size-4" />
                        {ar ? "قبول الاقتراح" : "Accept suggestion"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPendingDraft(null);
                          dispatchJourney({ type: "reject_suggestion" });
                        }}
                      >
                        {ar ? "رفض والاحتفاظ بالمسودة" : "Reject and keep draft"}
                      </Button>
                    </div>
                  </section>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="summary">
                      {ar ? "ملخص محلي اختياري" : "Optional local summary"}
                    </Label>
                    <Textarea
                      id="summary"
                      rows={5}
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder={
                        ar
                          ? "يمكنك كتابة ملخصك بنفسك دون استخدام الذكاء الاصطناعي."
                          : "You can write your own summary without using AI."
                      }
                    />
                  </div>
                )}

                {bullets.length > 0 && (
                  <div className="space-y-2">
                    <Label>{ar ? "إنجازات مقبولة" : "Accepted achievements"}</Label>
                    {bullets.map((bullet, index) => (
                      <Textarea
                        key={index}
                        rows={2}
                        value={bullet}
                        onChange={(event) =>
                          setBullets((list) =>
                            list.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="space-y-2">
                    <Label>{ar ? "مهارات مقبولة" : "Accepted skills"}</Label>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => setSkills((list) => list.filter((item) => item !== skill))}
                          className="rounded-full border border-border bg-secondary px-3 py-1 text-xs hover:border-destructive hover:text-destructive"
                        >
                          {skill} ×
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {defaultTemplates
                  .filter((t) => t.active !== false)
                  .map((t) => {
                    const selected = t.id === templateId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplateId(t.id)}
                        aria-pressed={selected}
                        className={`overflow-hidden rounded-xl border bg-card p-1.5 text-start transition-shadow hover:shadow-lift ${
                          selected ? "border-primary ring-2 ring-primary/40" : "border-border"
                        }`}
                      >
                        <div className="relative h-[150px] overflow-hidden rounded-lg bg-white">
                          <div
                            aria-hidden
                            className="pointer-events-none absolute start-0 top-0 origin-top-left rtl:origin-top-right"
                            style={{ width: 794, transform: "scale(0.24)" }}
                          >
                            <ResumePreview
                              resume={{ ...previewResume, templateId: t.id }}
                              template={t}
                            />
                          </div>
                          {selected && (
                            <span className="absolute end-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </span>
                          )}
                        </div>
                        <span className="mt-1.5 block truncate px-1 pb-1 text-xs font-semibold">
                          {t.name[lang]}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}

            {step === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground" role="status">
                {ar
                  ? "اختر هدفاً واحداً لبدء سؤال مخصص لك."
                  : "Choose one goal to start a question tailored to you."}
              </p>
            ) : (
              <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => dispatchJourney({ type: "back" })}
                  className="gap-2"
                >
                  {ar ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
                  {ar ? "السابق" : "Back"}
                </Button>

                {!isFinalStep ? (
                  <Button
                    type="button"
                    onClick={() => dispatchJourney({ type: "next" })}
                    disabled={!canNext}
                    className="gap-2"
                  >
                    {ar ? "التالي" : "Next"}
                    {ar ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                  </Button>
                ) : (
                  <Button type="button" onClick={finish} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    {ar ? "أنشئ سيرتي الآن" : "Create my resume"}
                  </Button>
                )}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                {ar ? "معاينة مباشرة" : "Live preview"}
              </span>
              <Badge variant="outline">{getTemplate(templateId).name[lang]}</Badge>
            </div>
            <div className="relative h-[520px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              {!hasPreviewContent && (
                <div className="absolute inset-x-4 top-5 z-10 border border-dashed border-primary/40 bg-primary/5 p-4 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {ar
                      ? "مثال توضيحي — ستظهر إجاباتك هنا تدريجياً"
                      : "Illustrative preview — your answers will appear here progressively"}
                  </p>
                  <p className="mt-1">
                    {ar
                      ? "لا اسم أو مدينة أو جنسية مفترضة."
                      : "No assumed name, city, or nationality."}
                  </p>
                </div>
              )}
              <div
                id="print-area"
                aria-hidden
                className="pointer-events-none absolute start-0 top-0 origin-top-left rtl:origin-top-right"
                style={{ width: 794, transform: "scale(0.52)" }}
              >
                <ResumePreview resume={previewResume} template={getTemplate(templateId)} />
              </div>
            </div>
            {isGuest && (
              <p className="mt-3 text-xs text-muted-foreground">
                {ar
                  ? "المعاينة مبنية على مسودة هذه الجلسة فقط. لا تُنقل إلى حساب إلا بعد اختيارك الصريح للحفظ."
                  : "This preview is a draft for this session. It is not moved to an account unless you explicitly choose to save it."}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
