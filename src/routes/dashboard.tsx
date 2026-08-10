import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, FileText, MoreVertical, Pencil, Plus, Trash2, Eye, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getTemplate } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n, useT } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import { analyzeResume, completeness, resumeStatus } from "@/lib/ats";
import { TEAM } from "@/lib/team";
import {
  JOB_STATUS_LABEL,
  listAgentActivity,
  listJobs,
  listTasks,
  loadCareerTwin,
  twinHealth,
  type AgentActivity,
  type CareerTask,
  type CareerTwin,
  type JobWorkspace,
} from "@/lib/career";
import { emptyFactGraph, loadFactGraph, type FactGraph } from "@/lib/career-facts";
import { computeNextActions } from "@/lib/next-best-action";
import { NextBestActions } from "@/components/next-best-actions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحتي | سيرتي — Seerati Dashboard" },
      { name: "description", content: "مركز قيادة مسارك المهني: ملفك المهني، وظائفك، سيرك الذاتية، وخطوتك التالية في مكان واحد." },
      { property: "og:title", content: "لوحة التحكم | سيرتي" },
      { property: "og:description", content: "كل مسارك المهني في مكان واحد." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { user, ready, resumes, atLimit, duplicateResume, deleteResume, updateResume, createResume, maxResumes } = useStore();
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  const [twin, setTwin] = useState<CareerTwin | null>(null);
  const [graph, setGraph] = useState<FactGraph>(() => emptyFactGraph());
  const [twinScore, setTwinScore] = useState<number | null>(null);
  const [jobs, setJobs] = useState<JobWorkspace[]>([]);
  const [tasks, setTasks] = useState<CareerTask[]>([]);
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [loadingCenter, setLoadingCenter] = useState(true);

  useAuthGuard();

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingCenter(true);
    void Promise.all([
      loadCareerTwin(user.id),
      listJobs(user.id),
      listTasks(user.id),
      listAgentActivity(user.id, 6),
      loadFactGraph(user.id),
    ]).then(([twinData, jobList, taskList, activityList, factGraph]) => {
      if (!active) return;
      setTwin(twinData);
      setTwinScore(twinHealth(twinData).score);
      setJobs(jobList);
      setTasks(taskList);
      setActivity(activityList);
      setGraph(factGraph);
      setLoadingCenter(false);
    });
    return () => {
      active = false;
    };
  }, [user]);


  if (!ready || !user) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
          <Skeleton className="h-10 w-52" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Actions come from the deterministic engine, so nothing here is invented.
  const nextActions = computeNextActions({
    twin,
    graph,
    resumes,
    jobs,
    upcomingInterviews: jobs
      .filter((j) => j.status === "interview" && j.nextActionAt)
      .map((j) => ({ jobId: j.id, jobTitle: j.jobTitle, occurredAt: j.nextActionAt as string })),
  });


  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-10">
        {/* Greeting + profile completeness */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {ar ? `أهلاً ${user.fullName || "بك"}` : `Hi ${user.fullName || "there"}`}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {ar
                ? "هذا مركز قيادة مسارك المهني: ملفك، وظائفك، وسيرك الذاتية في مكان واحد."
                : "Your career command center: profile, jobs and resumes in one place."}
            </p>
          </div>
          <a href="/career-twin" className="w-full max-w-xs rounded-2xl border border-border bg-card p-4 shadow-soft sm:w-64">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{ar ? "اكتمال الملف المهني" : "Career profile completeness"}</span>
              <span className="font-semibold text-foreground">{twinScore ?? "—"}%</span>
            </div>
            <Progress value={twinScore ?? 0} className="mt-2" />
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-accent">
              {ar ? "افتح ملفي المهني" : "Open my career profile"}
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </span>
          </a>
        </div>

        {/* Career OS cohesion strip: readiness + one-tap entry points.
            Every number below is counted from the user's own rows — no demo data. */}
        <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{vault.headline}</p>
              <Badge variant="outline" className="text-[10px]">
                {loadingCenter ? "…" : `${graph.facts.length} / ${graph.evidence.length}`}
              </Badge>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {vault.items.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Button asChild size="sm" variant="outline">
                <Link to="/career-evidence">{ar ? "خزانة الأدلة" : "Evidence vault"}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to="/privacy-center">{ar ? "مركز الخصوصية" : "Privacy center"}</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-sm font-bold">{ar ? "إجراءات سريعة" : "Quick actions"}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/import">{ar ? "استيراد سيرة أو ملف مهني" : "Import a resume or profile"}</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/career-evidence">{ar ? "إضافة دليل جديد" : "Add new evidence"}</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/jobs">{ar ? "تحديد وظيفة مستهدفة" : "Target a job"}</Link>
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                disabled={!resumes.length}
                onClick={() => {
                  const first = resumes[0];
                  if (first) void navigate({ to: "/resumes/$id/edit", params: { id: first.id } });
                }}
              >
                {ar ? "إنشاء نسخة من سيرة" : "Create a resume variant"}
              </Button>
            </div>
            {!resumes.length && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {ar
                  ? "أنشئ سيرتك الأولى أولاً لتتمكن من إنشاء نسخ مخصصة لكل وظيفة."
                  : "Create your first resume to start branching per-job variants."}
              </p>
            )}
          </div>
        </section>


        <section>
          {loadingCenter ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <NextBestActions actions={nextActions} />
          )}

        </section>

        {/* Team status strip */}
        <section>
          <h2 className="text-lg font-bold">{ar ? "فريقك جاهز للمساعدة" : "Your team is ready to help"}</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {TEAM.map((agent) => (
              <div key={agent.id} className="flex min-w-[220px] shrink-0 items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-soft">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-ink-foreground"
                  style={{ backgroundColor: `var(--agent-${agent.accent})` }}
                >
                  {agent.initials}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{agent.name[lang]}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{agent.blurb[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resumes */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-lg font-bold">{t("dash_title")}</h2>
            <div className="flex items-center gap-4">
              <div className="min-w-32">
                <p className="text-xs text-muted-foreground">
                  {t("usage")} {resumes.length}/{maxResumes}
                </p>
                <Progress value={(resumes.length / maxResumes) * 100} className="mt-2" />
              </div>
              {atLimit ? (
                <Button disabled title={t("limit_reached")}>
                  <Plus className="size-4" />
                  {t("dash_new")}
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/resumes/new">
                    <Plus className="size-4" />
                    {t("dash_new")}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {atLimit && (
            <p className="mt-4 rounded-lg border border-border bg-secondary px-4 py-3 text-sm">{t("limit_reached")}</p>
          )}

          {resumes.length === 0 ? (
            <Card className="mt-6 border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-secondary">
                  <FileText className="size-6 text-primary" />
                </span>
                <div>
                  <p className="text-lg font-bold">{t("empty_resumes")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("empty_resumes_d")}</p>
                  <p className="mt-2 text-sm font-semibold">
                    {ar ? "أنشئ سيرتك الأولى بمساعدة الذكاء الاصطناعي" : "Create your first CV with AI help"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link to="/resumes/new">{t("dash_new")}</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void (async () => {
                        const created = await createResume({
                          title: ar ? "سيرة تجريبية" : "Demo resume",
                          templateId: "saudi-professional",
                          language: "ar",
                          seed: true,
                        });
                        if (created) toast.success(ar ? "أضفنا سيرة تجريبية" : "Demo resume added");
                        else toast.error(t("limit_reached"));
                      })();
                    }}
                  >
                    {ar ? "جرّب ببيانات تجريبية" : "Try with demo data"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resumes.map((r) => {
                const tpl = getTemplate(r.templateId);
                const score = analyzeResume(r, tpl).score;
                const done = resumeStatus(r) === "complete";
                return (
                  <Card key={r.id} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold leading-tight">{r.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("template")}: {tpl.name[lang]} · {r.language.toUpperCase()}
                          </p>
                          {r.data.targetJob && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ar ? "الوظيفة المستهدفة" : "Target job"}: {r.data.targetJob}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={ar ? "خيارات" : "Options"}>
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate({ to: "/resumes/$id/edit", params: { id: r.id } })}>
                              <Pencil className="size-4" /> {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate({ to: "/resumes/$id/preview", params: { id: r.id } })}>
                              <Eye className="size-4" /> {t("preview")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRenaming({ id: r.id, title: r.title })}>
                              {t("rename")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                void duplicateResume(r.id).then((copy) => {
                                  toast[copy ? "success" : "error"](copy ? t("duplicate") : t("limit_reached"));
                                });
                              }}
                            >
                              <Copy className="size-4" /> {t("duplicate")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                void deleteResume(r.id);
                                toast.success(ar ? "تم الحذف" : "Deleted");
                              }}
                            >
                              <Trash2 className="size-4" /> {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t("completeness")}</span>
                          <span className="font-semibold">{completeness(r)}%</span>
                        </div>
                        <Progress value={completeness(r)} />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge variant={done ? "default" : "outline"}>
                          {done ? (ar ? "مكتملة" : "Complete") : ar ? "مسودة" : "Draft"}
                        </Badge>
                        <Badge variant="secondary">ATS {score}/100</Badge>
                        <span className="text-xs text-muted-foreground">
                          {t("updated")}: {new Date(r.updatedAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button size="sm" className="flex-1" asChild>
                          <Link to="/resumes/$id/edit" params={{ id: r.id }}>
                            {ar ? "أكمل التحرير" : "Continue editing"}
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" asChild>
                          <Link to="/resumes/$id/edit" params={{ id: r.id }} hash="ats">
                            {ar ? "فحص ATS" : "Analyze ATS"}
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" asChild>
                          <Link to="/resumes/$id/preview" params={{ id: r.id }}>
                            {ar ? "معاينة وتنزيل" : "Preview & download"}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Active job workspaces */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{ar ? "مساحات الوظائف النشطة" : "Active job spaces"}</h2>
            <a href="/jobs" className="text-xs font-semibold text-emerald-accent">
              {ar ? "عرض الكل" : "View all"}
            </a>
          </div>
          {loadingCenter ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              {ar ? "لا توجد مساحات وظائف بعد." : "No job spaces yet."}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {jobs.slice(0, 4).map((j) => (
                <a
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  className="rounded-xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-secondary"
                >
                  <p className="truncate text-sm font-bold">{j.jobTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{j.company}</p>
                  <Badge variant="outline" className="mt-2 text-[10.5px]">
                    {JOB_STATUS_LABEL[j.status][lang]}
                  </Badge>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-lg font-bold">{ar ? "النشاط الأخير" : "Recent activity"}</h2>
          {loadingCenter ? (
            <Skeleton className="mt-4 h-28 rounded-xl" />
          ) : activity.length === 0 ? (
            <Card className="mt-4 border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Sparkles className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {ar ? "لا يوجد نشاط مسجّل بعد — سيظهر هنا عند استخدام أدوات الفريق." : "No activity yet — it will appear here once you use the team's tools."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="mt-4 space-y-2">
              {activity.map((a) => {
                const agent = TEAM.find((x) => x.id === a.agentId);
                return (
                  <li key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
                    <span className="font-medium">
                      {agent ? agent.name[lang] : a.agentId} — {a.task}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <Dialog open={Boolean(renaming)} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rename")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renaming?.title ?? ""}
            onChange={(e) => setRenaming((r) => (r ? { ...r, title: e.target.value } : r))}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                if (renaming) {
                  void updateResume(renaming.id, { title: renaming.title.trim() || renaming.title });
                  toast.success(ar ? "تم التحديث" : "Updated");
                }
                setRenaming(null);
              }}
            >
              {ar ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
