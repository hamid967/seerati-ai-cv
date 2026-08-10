import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Plus, Search, Table as TableIcon, LayoutGrid, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { TaxonomyInput } from "@/components/taxonomy-input";
import { cityOptions, titleOptions } from "@/lib/saudi-career-taxonomy";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import {
  createJob,
  deleteJob,
  listJobs,
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  updateJob,
  type JobStatus,
  type JobWorkspace,
} from "@/lib/career";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "مساحات الوظائف | سيرتي — Job Workspaces" },
      { name: "description", content: "تابع طلبات التوظيف، حلل الوصف الوظيفي، وجهّز حزمة طلبك في مكان واحد." },
      { property: "og:title", content: "مساحات الوظائف | سيرتي" },
      { property: "og:description", content: "تتبّع وظائفك من الحفظ حتى العرض." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JobsIndex,
});

type FormState = {
  jobTitle: string;
  company: string;
  location: string;
  jobUrl: string;
  salary: string;
  jobDescription: string;
  notes: string;
  status: JobStatus;
};

const emptyForm = (): FormState => ({
  jobTitle: "",
  company: "",
  location: "",
  jobUrl: "",
  salary: "",
  jobDescription: "",
  notes: "",
  status: "saved",
});

function JobsIndex() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, ready } = useStore();
  const navigate = useNavigate();

  useAuthGuard();

  const [jobs, setJobs] = useState<JobWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<"table" | "kanban">("table");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "score">("updated");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void listJobs(user.id).then((list) => {
      setJobs(list);
      setLoading(false);
    });
  }, [user]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (statusFilter !== "all") list = list.filter((j) => j.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (j) => j.company.toLowerCase().includes(q) || j.jobTitle.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) =>
      sortBy === "score"
        ? b.matchScore - a.matchScore
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [jobs, statusFilter, query, sortBy]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter((j) => ["applied", "interview", "offer"].includes(j.status)).length;
    const interviews = jobs.filter((j) => j.status === "interview").length;
    const offers = jobs.filter((j) => j.status === "offer").length;
    return { total, applied, interviews, offers };
  }, [jobs]);

  const resetForm = () => setForm(emptyForm());

  const handleCreate = async () => {
    if (!user || !form.jobTitle.trim() || !form.company.trim()) {
      toast.error(ar ? "أدخل المسمى الوظيفي والشركة على الأقل" : "Add at least job title and company");
      return;
    }
    setSaving(true);
    const optional = (key: string, value: string) =>
      value.trim() ? { [key]: value.trim() } : {};
    const created = await createJob(user.id, {
      jobTitle: form.jobTitle.trim(),
      company: form.company.trim(),
      status: form.status,
      ...optional("location", form.location),
      ...optional("jobUrl", form.jobUrl),
      ...optional("salary", form.salary),
      ...optional("jobDescription", form.jobDescription),
      ...optional("notes", form.notes),
    });
    setSaving(false);
    if (!created) {
      toast.error(ar ? "تعذّر إضافة الوظيفة" : "Could not add the job");
      return;
    }
    setOpen(false);
    resetForm();
    void navigate({ to: "/jobs/$id", params: { id: created.id } });
  };

  const handleDelete = async (id: string) => {
    setJobs((list) => list.filter((j) => j.id !== id));
    await deleteJob(id);
    toast.success(ar ? "تم حذف الوظيفة" : "Job deleted");
  };

  const handleStatusChange = async (job: JobWorkspace, status: JobStatus) => {
    setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, status } : j)));
    await updateJob(job.id, { status });
  };

  if (!ready || !user) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    );
  }

  const addDialog = (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {ar ? "أضف وظيفة" : "Add job"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ar ? "وظيفة جديدة" : "New job"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{ar ? "المسمى الوظيفي" : "Job title"}</Label>
            <TaxonomyInput
              value={form.jobTitle}
              options={titleOptions(ar ? "ar" : "en")}
              onChange={(v) => setForm({ ...form, jobTitle: v })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{ar ? "الشركة" : "Company"}</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{ar ? "الموقع" : "Location"}</Label>
              <TaxonomyInput
                value={form.location}
                options={cityOptions(ar ? "ar" : "en")}
                onChange={(v) => setForm({ ...form, location: v })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{ar ? "رابط الوظيفة" : "Job URL"}</Label>
              <Input value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{ar ? "الراتب المتوقع" : "Expected salary"}</Label>
              <Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>{ar ? "الحالة" : "Status"}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as JobStatus })}>
                <SelectTrigger>
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
          </div>
          <div className="grid gap-1.5">
            <Label>{ar ? "الوصف الوظيفي (الصق النص كاملاً)" : "Job description (paste full text)"}</Label>
            <Textarea
              rows={6}
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{ar ? "ملاحظات" : "Notes"}</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button disabled={saving} onClick={() => void handleCreate()}>
            {ar ? "إنشاء المساحة" : "Create workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{ar ? "مساحات الوظائف" : "Job Workspaces"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar ? `${jobs.length} وظيفة محفوظة` : `${jobs.length} saved jobs`}
            </p>
          </div>
          {addDialog}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: ar ? "الإجمالي" : "Total", value: stats.total },
            { label: ar ? "تم التقديم" : "Applied", value: stats.applied },
            { label: ar ? "مقابلات" : "Interviews", value: stats.interviews },
            { label: ar ? "عروض" : "Offers", value: stats.offers },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : jobs.length === 0 ? (
          <Card className="mt-10 border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <div>
                <p className="text-lg font-bold">
                  {ar ? "لا توجد وظائف بعد" : "No job workspaces yet"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {ar
                    ? "كل وظيفة تفتح مساحة عمل مستقلة: تحليل الوصف، مقارنة مع ملفك، وحزمة طلب كاملة (سيرة، خطاب، تلخيص، تحضير مقابلة، متابعة)."
                    : "Each job opens its own workspace: description analysis, a match against your profile, and a full application pack (resume, letter, pitch, interview prep, follow-up)."}
                </p>
              </div>
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                {ar ? "أضف وظيفة" : "Add job"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder={ar ? "بحث بالشركة أو المسمى" : "Search company or title"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus | "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ar ? "كل الحالات" : "All statuses"}</SelectItem>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {JOB_STATUS_LABEL[s][lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "updated" | "score")}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">{ar ? "الأحدث تحديثاً" : "Recently updated"}</SelectItem>
                  <SelectItem value="score">{ar ? "الأعلى مطابقة" : "Highest match"}</SelectItem>
                </SelectContent>
              </Select>
              <div className="ms-auto flex gap-1 rounded-lg border border-border p-1">
                <Button
                  size="sm"
                  variant={view === "table" ? "default" : "ghost"}
                  onClick={() => setView("table")}
                >
                  <TableIcon className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant={view === "kanban" ? "default" : "ghost"}
                  onClick={() => setView("kanban")}
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </div>
            </div>

            {view === "table" ? (
              <Card className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{ar ? "الشركة" : "Company"}</TableHead>
                      <TableHead>{ar ? "المسمى" : "Role"}</TableHead>
                      <TableHead>{ar ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{ar ? "المطابقة" : "Match"}</TableHead>
                      <TableHead>{ar ? "الموقع" : "Location"}</TableHead>
                      <TableHead>{ar ? "آخر تحديث" : "Updated"}</TableHead>
                      <TableHead>{ar ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.company}</TableCell>
                        <TableCell>{job.jobTitle}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{JOB_STATUS_LABEL[job.status][lang]}</Badge>
                        </TableCell>
                        <TableCell>{job.matchScore}%</TableCell>
                        <TableCell className="text-muted-foreground">{job.location || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(job.updatedAt).toLocaleDateString(ar ? "ar" : "en")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" asChild>
                              <Link to="/jobs/$id" params={{ id: job.id }}>
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => void handleDelete(job.id)}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {JOB_STATUSES.filter((s) => s !== "archived" || statusFilter === "archived").map((status) => (
                  <div key={status} className="min-w-0">
                    <p className="mb-2 text-sm font-bold">{JOB_STATUS_LABEL[status][lang]}</p>
                    <div className="space-y-2">
                      {filtered
                        .filter((j) => j.status === status)
                        .map((job) => (
                          <Card key={job.id}>
                            <CardContent className="space-y-2 p-3">
                              <Link to="/jobs/$id" params={{ id: job.id }} className="block">
                                <p className="text-sm font-bold leading-tight">{job.jobTitle}</p>
                                <p className="text-xs text-muted-foreground">{job.company}</p>
                              </Link>
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="secondary">{job.matchScore}%</Badge>
                                <Select
                                  value={job.status}
                                  onValueChange={(v) => void handleStatusChange(job, v as JobStatus)}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {JOB_STATUSES.map((s) => (
                                      <SelectItem key={s} value={s} className="text-xs">
                                        {JOB_STATUS_LABEL[s][lang]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
