import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Sparkles,
  ClipboardList,
  FileText,
  Mic,
  ListChecks,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import {
  getJob,
  updateJob,
  listAssets,
  saveAsset,
  addTask,
  loadCareerTwin,
  logAgentActivity,
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  type JobWorkspace,
  type CareerTwin,
  type ApplicationAsset,
  type MatchGap,
} from "@/lib/career";
import { parseJobDescription, matchTwinToJob, GAP_LABEL } from "@/lib/job-match";
import { agentsForSurface } from "@/lib/team";
import { ApplicationTimeline } from "@/components/application-timeline";
import { RecruiterSnapshotCard } from "@/components/recruiter-snapshot";
import { NextBestActions } from "@/components/next-best-actions";
import { ResumeVariantSwitcher } from "@/components/resume-variant-switcher";
import { InterviewEvidenceAnswer } from "@/components/interview-evidence-answer";
import { addJobEvent, listJobEvents, upcomingInterviews, type TimelineEvent } from "@/lib/job-timeline";
import { buildRecruiterSnapshot } from "@/lib/recruiter-view";
import { computeNextActions } from "@/lib/next-best-action";
import { loadFactGraph, type FactGraph } from "@/lib/career-facts";
import { createJobVariantSnapshot, listResumeVersions, type ResumeVersion } from "@/lib/resume-versions";
import type { ResumeData } from "@/lib/types";

export const Route = createFileRoute("/jobs/$id")({
  head: () => ({
    meta: [
      { title: "مساحة الوظيفة | سيرتي — Job Workspace" },
      { name: "description", content: "حلّل الوصف الوظيفي، قارن مع ملفك المهني، وجهّز حزمة طلبك الكاملة." },
      { property: "og:title", content: "مساحة الوظيفة | سيرتي" },
      { property: "og:description", content: "تحليل، مطابقة، وحزمة طلب واحدة لكل وظيفة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JobWorkspacePage,
});

const ASSET_META: Record<
  string,
  { icon: typeof FileText; ar: string; en: string }
> = {
  resume: { icon: FileText, ar: "نسخة السيرة", en: "Resume variant" },
  cover_letter: { icon: FileText, ar: "خطاب تقديم", en: "Cover letter" },
  pitch: { icon: Mic, ar: "تلخيص 60 ثانية", en: "60-sec pitch" },
  interview_pack: { icon: ListChecks, ar: "تحضير المقابلة", en: "Interview pack" },
  followup: { icon: CheckSquare, ar: "قائمة متابعة", en: "Follow-up checklist" },
};

function useDebouncedSave<T>(value: T, delay: number, onSave: (v: T) => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(value), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

function JobWorkspacePage() {
  const { id } = useParams({ from: "/jobs/$id" });
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, ready, createResume, atLimit, resumes, updateResume } = useStore();
  const navigate = useNavigate();

  useAuthGuard();

  const [job, setJob] = useState<JobWorkspace | null | undefined>(undefined);
  const [twin, setTwin] = useState<CareerTwin | null>(null);
  const [assets, setAssets] = useState<ApplicationAsset[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [graph, setGraph] = useState<FactGraph>({ facts: [], evidence: [] });
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [branching, setBranching] = useState(false);
  const [reload, setReload] = useState(0);

  /** The resume this job's variants branch from: its linked one, else the first. */
  const baseResume =
    resumes.find((r) => r.id === assets.find((a) => a.assetType === "resume")?.resumeId) ??
    resumes[0] ??
    null;

  const [form, setForm] = useState({
    jobTitle: "",
    company: "",
    location: "",
    jobUrl: "",
    salary: "",
    notes: "",
    jobDescription: "",
    status: "saved" as JobWorkspace["status"],
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      const [loadedJob, loadedTwin, loadedGraph] = await Promise.all([
        getJob(id),
        loadCareerTwin(user.id),
        loadFactGraph(user.id),
      ]);
      if (!active) return;
      if (loadedJob && loadedJob.userId === user.id) {
        setJob(loadedJob);
        setForm({
          jobTitle: loadedJob.jobTitle,
          company: loadedJob.company,
          location: loadedJob.location ?? "",
          jobUrl: loadedJob.jobUrl ?? "",
          salary: loadedJob.salary ?? "",
          notes: loadedJob.notes ?? "",
          jobDescription: loadedJob.jobDescription,
          status: loadedJob.status,
        });
        const [list, evts] = await Promise.all([
          listAssets(loadedJob.id),
          listJobEvents(loadedJob.id),
        ]);
        if (active) {
          setAssets(list);
          setEvents(evts);
        }
      } else {
        setJob(null);
      }
      setGraph(loadedGraph);
      setTwin(loadedTwin);
      setLoadingEvents(false);
    })();
    return () => {
      active = false;
    };
  }, [id, user, reload]);

  useEffect(() => {
    if (!baseResume) return;
    let active = true;
    void listResumeVersions(baseResume.id).then((v) => {
      if (active) setVersions(v);
    });
    return () => {
      active = false;
    };
  }, [baseResume?.id, reload]);


  const persist = useCallback(
    (patch: Partial<JobWorkspace>) => {
      if (!job) return;
      void updateJob(job.id, patch);
    },
    [job],
  );

  useDebouncedSave(form, 700, (v) => {
    if (!job) return;
    persist({
      jobTitle: v.jobTitle,
      company: v.company,
      location: v.location || null,
      jobUrl: v.jobUrl || null,
      salary: v.salary || null,
      notes: v.notes || null,
      jobDescription: v.jobDescription,
    });
  });

  const refreshEvents = useCallback(() => {
    if (!job) return;
    void listJobEvents(job.id).then(setEvents);
  }, [job]);

  const handleStatusChange = (status: JobWorkspace["status"]) => {
    setForm((f) => ({ ...f, status }));
    persist({ status });
    if (user && job) {
      // Logged after the status write is issued, describing the real new state.
      void addJobEvent(user.id, {
        jobId: job.id,
        eventType: status === "applied" ? "applied" : "status_change",
        title: ar
          ? `الحالة: ${JOB_STATUS_LABEL[status].ar}`
          : `Status: ${JOB_STATUS_LABEL[status].en}`,
        metadata: { status },
      }).then(refreshEvents);
    }
  };

  const handleAnalyze = async () => {
    if (!job || !user) return;
    if (!form.jobDescription.trim()) {
      toast.error(ar ? "الصق نص الوصف الوظيفي أولاً" : "Paste the job description text first");
      return;
    }
    setAnalyzing(true);
    const requirements = parseJobDescription(form.jobDescription);
    const matchAnalysis = matchTwinToJob(twin, requirements);
    await updateJob(job.id, { requirements, matchAnalysis, matchScore: matchAnalysis.score });
    setJob({ ...job, requirements, matchAnalysis, matchScore: matchAnalysis.score });
    await logAgentActivity(user.id, {
      agentId: "layan",
      task: "job.parse",
      jobId: job.id,
      summary: ar
        ? `تحليل وصف ${job.jobTitle} — نسبة مطابقة ${matchAnalysis.score}%`
        : `Parsed ${job.jobTitle} — ${matchAnalysis.score}% match`,
    });
    await addJobEvent(user.id, {
      jobId: job.id,
      eventType: "analyzed",
      title: ar
        ? `تحليل الوصف — مطابقة ${matchAnalysis.score}%`
        : `Description analyzed — ${matchAnalysis.score}% match`,
      metadata: { matchScore: matchAnalysis.score },
    });
    refreshEvents();
    setAnalyzing(false);
    toast.success(ar ? "تم تحليل الوصف الوظيفي" : "Job description analyzed");
  };

  const handlePreparePack = async () => {
    if (!job || !user) return;
    setPreparing(true);
    try {
      const title = `${job.jobTitle} — ${job.company}`;
      let resumeId: string | undefined;
      if (atLimit) {
        toast.error(
          ar
            ? "وصلت للحد الأقصى من السير الذاتية؛ لن ننشئ نسخة سيرة جديدة."
            : "You reached your resume limit; a new resume variant will not be created.",
        );
      } else {
        const resume = await createResume({
          title,
          templateId: "saudi-professional",
          language: ar ? "ar" : "en",
          jobTitle: job.jobTitle,
        });
        if (resume) {
          resumeId = resume.id;
          await saveAsset(user.id, job.id, "resume", { title, resumeId: resume.id }, { resumeId: resume.id });
        }
      }

      await saveAsset(user.id, job.id, "cover_letter", {
        note: ar
          ? `مسودة خطاب تقديم لوظيفة ${job.jobTitle} في ${job.company}. أكمل الخطوة من صفحة خطاب التقديم.`
          : `Cover letter draft for ${job.jobTitle} at ${job.company}. Continue from the cover-letter step.`,
        cta: "/dashboard",
      });

      const topSkills = (twin?.skills ?? []).slice(0, 3).map((s) => s.name).filter(Boolean);
      await saveAsset(user.id, job.id, "pitch", {
        outline: [
          ar ? `من أنا: ${twin?.identity.headline || "—"}` : `Who I am: ${twin?.identity.headline || "—"}`,
          ar
            ? `أبرز مهاراتي: ${topSkills.length ? topSkills.join("، ") : "أضفها في ملفك المهني"}`
            : `Key skills: ${topSkills.length ? topSkills.join(", ") : "add them to your Career Twin"}`,
          ar ? `لماذا هذه الوظيفة: اربطها بهدفك المهني في الملف` : `Why this job: link it to your career target`,
          ar ? `دعوة للخطوة التالية` : `Call to next step`,
        ],
      });

      await saveAsset(user.id, job.id, "interview_pack", {
        outline: [
          ar ? "أسئلة متوقعة حسب متطلبات الوصف الوظيفي" : "Likely questions based on the job requirements",
          ar ? "إجابات STAR من بنك قصصك الموثّق" : "STAR answers from your verified story bank",
          ar ? "أسئلة تطرحها أنت على جهة التوظيف" : "Questions you ask the employer",
        ],
      });

      await saveAsset(user.id, job.id, "followup", {
        checklist: [
          ar ? "تأكيد استلام الطلب" : "Confirm application received",
          ar ? "متابعة بعد 5 أيام عمل" : "Follow up after 5 business days",
          ar ? "تحديث حالة الوظيفة في المساحة" : "Update job status in the workspace",
        ],
      });

      await addTask(user.id, { title: ar ? `متابعة طلب ${job.company}` : `Follow up on ${job.company}`, jobId: job.id });

      const list = await listAssets(job.id);
      setAssets(list);
      toast.success(ar ? "تم تجهيز حزمة الطلب" : "Application pack is ready");
    } finally {
      setPreparing(false);
    }
  };

  if (!ready || !user || job === undefined) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
          <p className="text-xl font-bold">{ar ? "لم نجد هذه الوظيفة" : "We couldn't find this job"}</p>
          <p className="text-sm text-muted-foreground">
            {ar ? "قد تكون محذوفة أو لا تملك صلاحية الوصول إليها." : "It may be deleted or you don't have access to it."}
          </p>
          <Button asChild>
            <Link to="/jobs">{ar ? "العودة إلى مساحات الوظائف" : "Back to job workspaces"}</Link>
          </Button>
        </main>
      </div>
    );
  }

  const gapsByKind = (job.matchAnalysis?.gaps ?? []).reduce<Record<string, MatchGap[]>>((acc, g) => {
    (acc[g.kind] ??= []).push(g);
    return acc;
  }, {});

  const BackIcon = ar ? ArrowRight : ArrowLeft;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/jobs">
            <BackIcon className="size-4" />
            {ar ? "كل الوظائف" : "All jobs"}
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{form.jobTitle || (ar ? "وظيفة بلا عنوان" : "Untitled job")}</h1>
            <p className="text-sm text-muted-foreground">{form.company}</p>
          </div>
          <Select value={form.status} onValueChange={(v) => handleStatusChange(v as JobWorkspace["status"])}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {JOB_STATUS_LABEL[s][lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_280px]">
          {/* Zone 1: job fields */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{ar ? "بيانات الوظيفة" : "Job details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-1.5">
                  <Label>{ar ? "المسمى الوظيفي" : "Job title"}</Label>
                  <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>{ar ? "الشركة" : "Company"}</Label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>{ar ? "الموقع" : "Location"}</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{ar ? "الراتب" : "Salary"}</Label>
                    <Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>{ar ? "رابط الوظيفة" : "Job URL"}</Label>
                  <Input value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>{ar ? "ملاحظات" : "Notes"}</Label>
                  <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>{ar ? "الوصف الوظيفي" : "Job description"}</Label>
                  <Textarea
                    rows={10}
                    value={form.jobDescription}
                    onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                  />
                </div>
                <Button onClick={() => void handleAnalyze()} disabled={analyzing} className="w-full">
                  <Sparkles className="size-4" />
                  {analyzing ? (ar ? "جارِ التحليل..." : "Analyzing...") : ar ? "تحليل الوصف الوظيفي" : "Analyze job description"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Zone 2: requirements + match */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{ar ? "المتطلبات المستخرجة" : "Extracted requirements"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {ar
                    ? "هذا التحليل مبني فقط على النص الذي لصقته — لا وصول للإنترنت."
                    : "This analysis is built only from the text you pasted — no internet access."}
                </p>
                {job.requirements ? (
                  <>
                    <ReqRow label={ar ? "المهارات التقنية" : "Hard skills"} items={job.requirements.hardSkills} />
                    <ReqRow label={ar ? "المهارات الشخصية" : "Soft skills"} items={job.requirements.softSkills} />
                    <ReqRow label={ar ? "المسؤوليات" : "Responsibilities"} items={job.requirements.responsibilities} />
                    <ReqRow label={ar ? "كلمات مفتاحية" : "Keywords"} items={job.requirements.keywords} />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><span className="text-muted-foreground">{ar ? "المستوى" : "Seniority"}: </span>{job.requirements.seniority || "—"}</p>
                      <p><span className="text-muted-foreground">{ar ? "الخبرة" : "Years"}: </span>{job.requirements.years || "—"}</p>
                      <p><span className="text-muted-foreground">{ar ? "اللغة" : "Language"}: </span>{job.requirements.language || "—"}</p>
                    </div>
                    <ReqRow label={ar ? "التعليم" : "Education"} items={job.requirements.education} />
                    {job.requirements.missing.length > 0 && (
                      <div className="rounded-lg border border-dashed border-border p-2">
                        <p className="mb-1 text-xs font-bold">{ar ? "غير مذكور في النص" : "Not stated in the text"}</p>
                        <ul className="list-inside list-disc text-xs text-muted-foreground">
                          {job.requirements.missing.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">{ar ? "لم يتم التحليل بعد." : "Not analyzed yet."}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{ar ? "المطابقة مع ملفك" : "Match with your profile"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {job.matchAnalysis ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{ar ? "نسبة المطابقة" : "Match score"}</span>
                        <span className="font-bold">{job.matchAnalysis.score}%</span>
                      </div>
                      <Progress value={job.matchAnalysis.score} className="mt-1" />
                    </div>
                    <ReqRow label={ar ? "مهارات متطابقة" : "Matched skills"} items={job.matchAnalysis.matchedSkills} />
                    <ReqRow label={ar ? "مهارات غير موجودة" : "Missing skills"} items={job.matchAnalysis.missingSkills} />
                    <div className="space-y-2">
                      {(Object.keys(GAP_LABEL) as Array<keyof typeof GAP_LABEL>).map((kind) =>
                        gapsByKind[kind]?.length ? (
                          <div key={kind} className="rounded-lg border border-border p-2">
                            <p className="mb-1 text-xs font-bold">{GAP_LABEL[kind][lang]}</p>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              {gapsByKind[kind]?.map((g) => (
                                <li key={g.id}>
                                  <span className="font-semibold text-foreground">{g.label}</span> — {g.hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null,
                      )}
                    </div>
                    <div className="rounded-lg bg-secondary p-2 text-xs text-muted-foreground">
                      {job.matchAnalysis.limitations.map((l) => (
                        <p key={l}>{l}</p>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">{ar ? "حلّل الوصف الوظيفي أولاً لعرض المطابقة." : "Analyze the job description first to see the match."}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{ar ? "حزمة طلبك" : "Application pack"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => void handlePreparePack()} disabled={preparing} className="w-full">
                  <ClipboardList className="size-4" />
                  {preparing ? (ar ? "جارِ التجهيز..." : "Preparing...") : ar ? "جهّز طلبي" : "Prepare my application"}
                </Button>
                {assets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{ar ? "لا توجد عناصر بعد." : "No items yet."}</p>
                ) : (
                  <ul className="space-y-2">
                    {assets.map((a) => {
                      const meta = ASSET_META[a.assetType] ?? { icon: FileText, ar: a.assetType, en: a.assetType };
                      const Icon = meta.icon;
                      return (
                        <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-xs">
                          <span className="flex items-center gap-2">
                            <Icon className="size-4 text-muted-foreground" />
                            {meta[lang]}
                          </span>
                          <span className="flex items-center gap-2 text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString(ar ? "ar" : "en")}
                            {a.assetType === "resume" && a.resumeId && (
                              <Button size="sm" variant="ghost" asChild>
                                <Link to="/resumes/$id/edit" params={{ id: a.resumeId }}>
                                  {ar ? "فتح" : "Open"}
                                </Link>
                              </Button>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Zone 3: specialists rail */}
          <div className="space-y-3">
            <p className="text-sm font-bold">{ar ? "الفريق المختص" : "Specialists"}</p>
            {agentsForSurface("jobs").map((agent) => (
              <Card key={agent.id}>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback>{agent.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold leading-tight">{agent.name[lang]}</p>
                      <p className="text-xs text-muted-foreground">{agent.role[lang]}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{agent.blurb[lang]}</p>
                  {agent.id === "layan" && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => void handleAnalyze()} disabled={analyzing}>
                      {ar ? "حلّل الوصف" : "Analyze"}
                    </Button>
                  )}
                  {agent.id === "salman" && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => void handlePreparePack()} disabled={preparing}>
                      {ar ? "جهّز الحزمة" : "Prepare pack"}
                    </Button>
                  )}
                  {agent.id === "rashed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (!user) return;
                        void addTask(user.id, {
                          title: ar ? `متابعة طلب ${job.company}` : `Follow up on ${job.company}`,
                          jobId: job.id,
                        }).then(() => toast.success(ar ? "أُضيفت مهمة متابعة" : "Follow-up task added"));
                      }}
                    >
                      {ar ? "أضف مهمة متابعة" : "Add follow-up"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ReqRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((i) => (
          <Badge key={i} variant="secondary" className="text-xs font-normal">
            {i}
          </Badge>
        ))}
      </div>
    </div>
  );
}
