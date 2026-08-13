import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AssistantCapabilityHub } from "@/components/assistant-capability-hub";
import { GuestNotice } from "@/components/guest-notice";
import { ResumePreview, getTemplate } from "@/components/resume-preview";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import { aiService, AiUserError } from "@/lib/ai-service";
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

const ASSISTANT_AGENTS = agentsForSurface("assistant");

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
const emptyAnswers = emptyAssistantAnswers();

function AssistantPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { agent: agentFromSearch } = Route.useSearch();
  const { atLimit, isGuest, createResume, updateResume } = useStore();
  useAuthGuard({ allowGuest: true });

  const initialAgent =
    (agentFromSearch && agentById(agentFromSearch)?.id) || ASSISTANT_AGENTS[0]?.id || "noura";

  const [step, setStep] = useState(0);
  const [agentId, setAgentId] = useState(initialAgent);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [resumeLang, setResumeLang] = useState<"ar" | "en">(lang);
  const [drafting, setDrafting] = useState(false);
  const [summary, setSummary] = useState("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState("cloud-flow");
  const [saving, setSaving] = useState(false);

  const specialist = agentById(agentId) ?? ASSISTANT_AGENTS[0]!;

  const set = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));

  const previewData = useMemo(
    () => buildAssistantData(answers, resumeLang, summary, bullets, skills),
    [answers, resumeLang, summary, bullets, skills],
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

  const steps = [
    { ar: "من أنت", en: "About you" },
    { ar: "خبرتك", en: "Your experience" },
    { ar: "صياغة بالذكاء الاصطناعي", en: "AI drafting" },
    { ar: "اختيار القالب", en: "Pick a template" },
  ];

  const canNext =
    step === 0 ? answers.fullName.trim().length > 1 && answers.jobTitle.trim().length > 1 : true;

  const runDrafting = async () => {
    setDrafting(true);
    try {
      const ctx = {
        targetRole: answers.jobTitle,
        answers: {
          role: answers.jobTitle,
          years: answers.years,
          industry: answers.industry,
          achievement: answers.story,
        },
      };
      const agentOpt = { agentId };
      const [sum, bl, sk] = await Promise.all([
        aiService.run({
          task: "summary",
          lang: resumeLang,
          input: `${answers.jobTitle} — ${answers.years} ${ar ? "سنوات خبرة" : "years"} — ${answers.industry}. ${answers.story}`,
          context: ctx,
          ...agentOpt,
        }),
        answers.story
          ? aiService.run({
              task: "quantify",
              lang: resumeLang,
              input: answers.story,
              context: { ...ctx, section: "experience" },
              ...agentOpt,
            })
          : Promise.resolve({ text: "", items: [] }),
        aiService.run({
          task: "suggest_skills",
          lang: resumeLang,
          input: `${answers.jobTitle} ${answers.industry} ${answers.skills}`,
          context: ctx,
          ...agentOpt,
        }),
      ]);
      setSummary(sum.text.trim());
      setBullets((bl.items ?? []).filter(Boolean).slice(0, 4));
      const manual = answers.skills
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const suggested = (sk.items ?? []).map((s) => s.trim()).filter(Boolean);
      setSkills(Array.from(new Set([...manual, ...suggested])).slice(0, 12));
      toast.success(ar ? "جهّزت مسودة سيرتك" : "Your draft is ready");
    } catch (error) {
      toast.error(
        error instanceof AiUserError
          ? error.message
          : ar
            ? "تعذّرت الصياغة الآن، جرّب مرة أخرى."
            : "Drafting failed, please retry.",
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
            ? "سجّل حساباً لحفظ سيرتك والمتابعة في المحرر"
            : "Sign up to save your resume and continue in the editor",
        );
        navigate({ to: "/auth", search: { mode: "signup" } });
        return;
      }
      navigate({ to: "/resumes/$id/edit", params: { id: created.id } });
    } catch {
      toast.error(ar ? "تعذّر إنشاء السيرة الذاتية." : "Could not create the resume.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wand2 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {ar ? "مساعد سيرتي" : "Seerati Assistant"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {ar
                ? `أسئلة قصيرة مع ${specialist.name.ar}، صياغة بالذكاء الاصطناعي، ثم تختار القالب.`
                : `A few questions with ${specialist.name.en}, AI drafting, then pick a template.`}
            </p>
          </div>
          <Badge variant="secondary" className="ms-auto">
            {ar ? `خطوة ${step + 1} من ${steps.length}` : `Step ${step + 1} of ${steps.length}`}
          </Badge>
        </div>

        <Progress
          value={((step + 1) / steps.length) * 100}
          className="mt-5 h-1.5"
          aria-label={ar ? "تقدم إنشاء السيرة" : "Resume creation progress"}
        />
        <GuestNotice className="mt-5" />
        <div className="mt-6" id="assistant-capabilities">
          <AssistantCapabilityHub />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]" id="assistant-builder">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold">{ar ? steps[step]!.ar : steps[step]!.en}</h2>

            {step === 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    {ar ? "المتخصص الذي يقود الجلسة" : "Specialist leading this session"}
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ASSISTANT_AGENTS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setAgentId(a.id);
                          void navigate({
                            to: "/assistant",
                            search: { agent: a.id },
                            replace: true,
                          });
                        }}
                        className={cn(
                          "flex min-h-11 items-center gap-2 rounded-xl border p-2.5 text-start transition-colors",
                          agentId === a.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-secondary/60",
                        )}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
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
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="fullName">{ar ? "الاسم الكامل" : "Full name"}</Label>
                  <Input
                    id="fullName"
                    value={answers.fullName}
                    onChange={(e) => set({ fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="jobTitle">{ar ? "الوظيفة المستهدفة" : "Target job title"}</Label>
                  <Input
                    id="jobTitle"
                    value={answers.jobTitle}
                    placeholder={ar ? "مثال: محلل بيانات" : "e.g. Data Analyst"}
                    onChange={(e) => set({ jobTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input
                    id="email"
                    value={answers.email}
                    onChange={(e) => set({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{ar ? "رقم الجوال" : "Phone"}</Label>
                  <Input
                    id="phone"
                    value={answers.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">{ar ? "المدينة" : "City"}</Label>
                  <Input
                    id="city"
                    value={answers.city}
                    placeholder={ar ? "الرياض" : "Riyadh"}
                    onChange={(e) => set({ city: e.target.value })}
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
            )}

            {step === 1 && (
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

            {step === 2 && (
              <div className="mt-4 space-y-4">
                <Button type="button" onClick={runDrafting} disabled={drafting} className="gap-2">
                  {drafting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {summary
                    ? ar
                      ? "أعد الصياغة"
                      : "Redraft"
                    : ar
                      ? "اكتب لي المسودة"
                      : "Draft it for me"}
                </Button>

                <div className="space-y-1.5">
                  <Label htmlFor="summary">{ar ? "الملخص المهني" : "Professional summary"}</Label>
                  <Textarea
                    id="summary"
                    rows={5}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder={ar ? "سيظهر هنا بعد الصياغة…" : "Appears here after drafting…"}
                  />
                </div>

                {bullets.length > 0 && (
                  <div className="space-y-2">
                    <Label>{ar ? "إنجازات مقترحة" : "Suggested achievements"}</Label>
                    {bullets.map((b, i) => (
                      <Textarea
                        key={i}
                        rows={2}
                        value={b}
                        onChange={(e) =>
                          setBullets((list) =>
                            list.map((item, idx) => (idx === i ? e.target.value : item)),
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="space-y-2">
                    <Label>{ar ? "المهارات" : "Skills"}</Label>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSkills((list) => list.filter((x) => x !== s))}
                          className="rounded-full border border-border bg-secondary px-3 py-1 text-xs hover:border-destructive hover:text-destructive"
                        >
                          {s} ×
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
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

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="gap-2"
              >
                {ar ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
                {ar ? "السابق" : "Back"}
              </Button>

              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
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
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                {ar ? "معاينة مباشرة" : "Live preview"}
              </span>
              <Badge variant="outline">{getTemplate(templateId).name[lang]}</Badge>
            </div>
            <div className="relative h-[520px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div
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
                  ? "تعمل كزائر — سيرتك تُحفظ في هذا المتصفح، وتُنقل لحسابك عند التسجيل."
                  : "Guest mode — your resume stays in this browser and moves to your account when you sign up."}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
