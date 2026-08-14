import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { matchResumeToJob, parseJobDescription } from "@/lib/job-match";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_CHECKLIST = {
  resume: false,
  letter: false,
  interview: false,
  followup: false,
};

/**
 * A detailed job workspace for anonymous visitors. All form values and derived
 * analysis are React memory only; this component never calls cloud job, asset,
 * timeline, Career Twin, or analytics APIs.
 */
export function GuestJobWorkspace() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { resumes } = useStore();
  const resume = resumes[0] ?? null;
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);

  const requirements = useMemo(
    () => (analyzed && description.trim() ? parseJobDescription(description) : null),
    [analyzed, description],
  );
  const match = useMemo(
    () => (requirements ? matchResumeToJob(resume, requirements) : null),
    [requirements, resume],
  );
  const evidence = useMemo(() => {
    const data = resume?.data;
    const skills = (data?.skills ?? [])
      .slice(0, 5)
      .map((skill) => skill.name)
      .filter(Boolean)
      .join(ar ? "، " : ", ");
    const role = data?.experience?.[0]?.role ?? data?.personal.jobTitle ?? "";
    return { skills, role, summary: data?.summary?.trim() ?? "" };
  }, [ar, resume]);

  const reset = () => {
    setJobTitle("");
    setCompany("");
    setDescription("");
    setNotes("");
    setAnalyzed(false);
    setChecklist(EMPTY_CHECKLIST);
  };
  const toggle = (key: keyof typeof EMPTY_CHECKLIST) =>
    setChecklist((current) => ({ ...current, [key]: !current[key] }));

  const checklistItems = [
    {
      key: "resume" as const,
      ar: "راجع السيرة الذاتية مقابل المتطلبات",
      en: "Review the resume against requirements",
    },
    { key: "letter" as const, ar: "اكتب مسودة خطاب تقديم", en: "Draft a cover letter" },
    { key: "interview" as const, ar: "حضّر أمثلة للمقابلة", en: "Prepare interview examples" },
    { key: "followup" as const, ar: "حدد خطوة متابعة", en: "Set a follow-up step" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {ar ? "مساحة وظيفة محلية" : "Local job workspace"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {ar
                ? "حلّل الوظيفة وجهّز خطوات التقديم داخل هذه الجلسة فقط. لا تحفظ التفاصيل في حساب أو قاعدة بيانات."
                : "Analyse a job and prepare application steps in this session only. Details are not saved to an account or database."}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {ar ? "ذاكرة الجلسة فقط" : "Session memory only"}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{ar ? "تفاصيل الوظيفة" : "Job details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={jobTitle}
                onChange={(event) => {
                  setJobTitle(event.target.value);
                  setAnalyzed(false);
                }}
                aria-label={ar ? "المسمى الوظيفي" : "Job title"}
                placeholder={ar ? "المسمى الوظيفي" : "Job title"}
              />
              <Input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                aria-label={ar ? "الشركة" : "Company"}
                placeholder={ar ? "الشركة" : "Company"}
              />
            </div>
            <Textarea
              rows={10}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setAnalyzed(false);
              }}
              aria-label={ar ? "الوصف الوظيفي" : "Job description"}
              placeholder={
                ar ? "الصق الوصف الوظيفي كاملاً هنا…" : "Paste the full job description here…"
              }
            />
            <Textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              aria-label={ar ? "ملاحظاتك" : "Your notes"}
              placeholder={
                ar
                  ? "ملاحظاتك الخاصة لهذه الجلسة (اختياري)"
                  : "Private notes for this session (optional)"
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setAnalyzed(true)} disabled={description.trim().length < 20}>
                <ClipboardList className="size-4" />
                {ar ? "حلّل محلياً" : "Analyse locally"}
              </Button>
              <Button variant="outline" onClick={reset} type="button">
                <RefreshCcw className="size-4" />
                {ar ? "مسح مساحة الوظيفة" : "Clear workspace"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ar ? "حزمة تقديم محلية" : "Local application pack"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklistItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-start text-sm hover:bg-muted"
                aria-pressed={checklist[item.key]}
              >
                <CheckCircle2
                  className={`size-5 ${checklist[item.key] ? "text-emerald-600" : "text-muted-foreground"}`}
                  aria-hidden="true"
                />
                <span>{ar ? item.ar : item.en}</span>
              </button>
            ))}
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              {resume
                ? ar
                  ? "تستند المسودات المحلية إلى السيرة الحالية؛ لا يتم إرسالها أو حفظها تلقائياً."
                  : "Local drafts use the current resume; nothing is sent or saved automatically."
                : ar
                  ? "أنشئ سيرة مجانية أولاً لربط التحليل بخبرتك."
                  : "Create a free resume first to ground the analysis in your experience."}
              {!resume && (
                <a
                  className="ms-2 font-semibold text-primary underline"
                  href="/assistant?agent=noura"
                >
                  {ar ? "فتح نورة" : "Open Noura"}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {match && requirements && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{ar ? "ملخص المطابقة" : "Match summary"}</CardTitle>
              <Badge>{match.score}%</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {ar
                  ? "مؤشر محلي للمراجعة، وليس قرار توظيف أو توصية بنتيجة."
                  : "A local review signal, not a hiring decision or outcome recommendation."}
              </p>
              <div>
                <h2 className="font-semibold">{ar ? "المهارات المستخرجة" : "Detected skills"}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requirements.hardSkills.length ? (
                    requirements.hardSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={match.matchedSkills.includes(skill) ? "default" : "outline"}
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">
                      {ar ? "لم تُكتشف مهارات محددة" : "No specific skills detected"}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h2 className="font-semibold">{ar ? "فجوات للمراجعة" : "Gaps to review"}</h2>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground">
                  {match.gaps.slice(0, 5).map((gap) => (
                    <li key={gap.id}>{gap.label}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{ar ? "مسودة عرض شخصي" : "Local pitch outline"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                {ar
                  ? `الدور المستهدف: ${jobTitle || "أضف المسمى الوظيفي"}`
                  : `Target role: ${jobTitle || "add a job title"}`}
              </p>
              <p>
                {ar
                  ? `خبرتي ذات الصلة: ${evidence.role || "أضف خبرتك في السيرة"}`
                  : `Relevant experience: ${evidence.role || "add experience to your resume"}`}
              </p>
              <p>
                {ar
                  ? `المهارات الموثقة: ${evidence.skills || "أضف مهاراتك في السيرة"}`
                  : `Documented skills: ${evidence.skills || "add skills to your resume"}`}
              </p>
              {evidence.summary && <p>{evidence.summary}</p>}
              <p className="rounded-lg bg-muted p-3 text-xs">
                {ar
                  ? `هذه مسودة محلية لـ ${company || "الجهة المستهدفة"}؛ راجعها يدوياً قبل استخدامها.`
                  : `This is a local outline for ${company || "the target organisation"}; review it manually before use.`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
