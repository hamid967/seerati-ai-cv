import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Database,
  Download,
  Eraser,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard } from "@/lib/store";
import { ProtectedTermsManager } from "@/components/protected-terms-manager";
import {
  buildCareerExport,
  clearAiUsage,
  clearImportProvenance,
  deleteCareerTwin,
  downloadJson,
} from "@/lib/career-export";
import { loadFactGraph, emptyFactGraph, type FactGraph } from "@/lib/career-facts";
import { loadCareerTwin, listJobs, type CareerTwin, type JobWorkspace } from "@/lib/career";

export const Route = createFileRoute("/privacy-center")({
  head: () => ({
    meta: [
      { title: "مركز الخصوصية | سيرتي — Seerati Privacy Center" },
      {
        name: "description",
        content:
          "مركز الخصوصية في سيرتي: اعرف بالتفصيل أي بيانات مهنية نحفظها لك، صدّرها بصيغة JSON، واحذف ما تريد حذفه بنفسك.",
      },
      { property: "og:title", content: "مركز الخصوصية | سيرتي" },
      { property: "og:description", content: "بياناتك المهنية ملكك: اعرضها، صدّرها، أو احذفها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyCenterPage,
});

type Counts = {
  resumes: number;
  facts: number;
  evidence: number;
  jobs: number;
  twin: boolean;
  provenance: number;
};

function PrivacyCenterPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, user } = useAuthGuard();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [graph, setGraph] = useState<FactGraph>(() => emptyFactGraph());
  const [twin, setTwin] = useState<CareerTwin | null>(null);
  const [jobs, setJobs] = useState<JobWorkspace[]>([]);

  const refresh = useCallback(async (userId: string) => {
    setLoading(true);
    const [g, t, j] = await Promise.all([
      loadFactGraph(userId),
      loadCareerTwin(userId),
      listJobs(userId),
    ]);
    setGraph(g);
    setTwin(t);
    setJobs(j);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    void refresh(user.id);
  }, [user, refresh]);

  if (!ready || !user) return null;

  const provenanceCount = twin?.importHistory.length ?? 0;
  const counts: Counts = {
    resumes: 0,
    facts: graph.facts.length,
    evidence: graph.evidence.length,
    jobs: jobs.length,
    twin: Boolean(twin),
    provenance: provenanceCount,
  };

  const dataMap: Array<{ icon: typeof Database; title: string; body: string; meta?: string }> = [
    {
      icon: FileText,
      title: ar ? "الحساب والملف الشخصي" : "Account & profile",
      body: ar
        ? "بريدك الإلكتروني واسمك والدور المستهدف وسنوات الخبرة والقطاع، وحالة إكمال التهيئة."
        : "Your email, name, target role, years of experience, industry and onboarding state.",
    },
    {
      icon: Database,
      title: ar ? "الملف المهني (التوأم المهني)" : "Career profile (Career Twin)",
      body: ar
        ? "الهوية والأهداف والخبرات والتعليم والمهارات واللغات والمشاريع والروابط وبنك القصص."
        : "Identity, targets, work history, education, skills, languages, projects, links and story bank.",
      meta: counts.twin ? (ar ? "موجود" : "Present") : ar ? "غير موجود" : "Not created",
    },
    {
      icon: ShieldCheck,
      title: ar ? "خزانة الأدلة" : "Evidence vault",
      body: ar
        ? "الحقائق المهنية وأدلتها: الأرقام والمصادر والملاحظات وحالة التوثيق. المراجع الخارجية تبقى خاصة ولا تُنشر."
        : "Career facts and their evidence: figures, sources, notes and verification state. External references stay private and are never published.",
      meta: `${counts.facts} · ${counts.evidence}`,
    },
    {
      icon: FileText,
      title: ar ? "السير الذاتية ونسخها" : "Resumes and versions",
      body: ar
        ? "محتوى كل سيرة، القالب المختار، درجات الاكتمال وATS، ولقطات النسخ التي تسمح بالرجوع للخلف."
        : "Resume content, chosen template, completion and ATS scores, and the version snapshots that make undo possible.",
    },
    {
      icon: Database,
      title: ar ? "أصل البيانات المستوردة" : "Import provenance",
      body: ar
        ? "من أي ملف أو منصة جاء كل قسم مستورد ومتى، لتتمكن من تمييز ما كتبته بنفسك."
        : "Which file or platform each imported section came from and when, so you can tell it apart from what you wrote.",
      meta: counts.provenance ? (ar ? "مسجّل" : "Recorded") : ar ? "لا شيء" : "None",
    },
    {
      icon: Database,
      title: ar ? "الوظائف والتقديمات" : "Jobs and applications",
      body: ar
        ? "مساحات الوظائف، وصف الوظيفة الذي لصقته، حالة التقديم، الأحداث الزمنية والمهام."
        : "Job workspaces, the job description you pasted, application status, timeline events and tasks.",
      meta: `${counts.jobs}`,
    },
    {
      icon: ShieldCheck,
      title: ar ? "بيانات استخدام الذكاء الاصطناعي" : "AI usage metadata",
      body: ar
        ? "نوع المهمة وعدد الوحدات وتاريخها فقط — لا نحفظ محادثات المساعد الخام في قاعدة البيانات."
        : "Task type, token counts and timestamps only — raw assistant conversations are not stored in the database.",
    },
  ];

  const doExport = async () => {
    setBusy("export");
    try {
      const doc = await buildCareerExport({ id: user.id, email: user.email });
      downloadJson(doc, `seerati-career-data-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success(ar ? "تم تصدير بياناتك" : "Your data was exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ar ? "فشل التصدير" : "Export failed");
    } finally {
      setBusy("");
    }
  };

  const run = async (key: string, fn: () => Promise<void>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      await refresh(user.id);
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ar ? "تعذّر التنفيذ" : "Action failed");
    } finally {
      setBusy("");
    }
  };

  const destructive: Array<{
    key: string;
    title: string;
    body: string;
    confirm: string;
    action: () => Promise<void>;
  }> = [
    {
      key: "provenance",
      title: ar ? "حذف أصل البيانات المستوردة" : "Clear import provenance",
      body: ar
        ? "يحذف سجل مصادر الاستيراد فقط. محتوى ملفك المهني وسيرك يبقى كما هو."
        : "Removes only the record of import sources. Your career profile and resume content stay untouched.",
      confirm: ar
        ? "سيُحذف سجل المصادر نهائياً."
        : "The provenance record will be deleted permanently.",
      action: async () => {
        await clearImportProvenance(user.id);
      },
    },
    {
      key: "ai-usage",
      title: ar ? "حذف بيانات استخدام الذكاء الاصطناعي" : "Clear AI usage metadata",
      body: ar
        ? "يحاول حذف سجلات الاستخدام الخاصة بك. إن كانت السياسة تمنع الحذف سنخبرك بذلك بصراحة بدلاً من الادعاء."
        : "Attempts to delete your usage rows. If policy prevents deletion we tell you plainly instead of pretending.",
      confirm: ar
        ? "سيتم محاولة حذف سجلات الاستخدام."
        : "Deletion of your usage rows will be attempted.",
      action: async () => {
        const res = await clearAiUsage(user.id);
        if (!res.deleted) {
          throw new Error(
            ar
              ? "سجلات الاستخدام محفوظة للقراءة فقط بسبب سياسة الحماية، ولا يمكن حذفها من التطبيق."
              : "Usage rows are read-only under the protection policy and cannot be deleted from the app.",
          );
        }
      },
    },
    {
      key: "twin",
      title: ar ? "حذف الملف المهني" : "Delete Career Profile",
      body: ar
        ? "يحذف التوأم المهني بالكامل. ستفقد المطابقة مع الوظائف وسياق المساعد، وستحتاج لإعادة التهيئة أو الاستيراد. السير الذاتية المحفوظة لن تُحذف."
        : "Deletes the entire Career Twin. Job matching and assistant context will be lost and you will need to re-onboard or re-import. Saved resumes are not deleted.",
      confirm: ar
        ? "هذا الإجراء لا يمكن التراجع عنه ويؤثر على المطابقة والمساعد."
        : "This cannot be undone and affects matching and the assistant.",
      action: async () => {
        await deleteCareerTwin(user.id);
      },
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ar ? "مركز الخصوصية" : "Privacy Center"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {ar
            ? "هذه خريطة واضحة لما نحفظه لك فعلياً داخل سيرتي، مع أدوات تصدير وحذف تنفّذها بنفسك. هذه الصفحة توضيح عملي لسلوك التطبيق، وليست شهادة امتثال لأي نظام أو لائحة."
            : "A plain map of what Seerati actually stores for you, with export and deletion tools you run yourself. This page describes how the app behaves; it is not a compliance certification for any regulation."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link
            to="/privacy"
            className="rounded-full border border-border px-3 py-1 hover:bg-muted"
          >
            {ar ? "سياسة الخصوصية" : "Privacy policy"}
          </Link>
          <Link to="/terms" className="rounded-full border border-border px-3 py-1 hover:bg-muted">
            {ar ? "الشروط والأحكام" : "Terms"}
          </Link>
          <Link
            to="/account"
            className="rounded-full border border-border px-3 py-1 hover:bg-muted"
          >
            {ar ? "إعدادات الحساب" : "Account settings"}
          </Link>
        </div>
      </header>

      {/* Data map */}
      <section>
        <h2 className="text-lg font-bold">{ar ? "خريطة بياناتك" : "Your data map"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {dataMap.map((row) => (
            <div
              key={row.title}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-muted p-2 text-muted-foreground">
                    <row.icon className="size-4" />
                  </span>
                  <p className="font-bold">{row.title}</p>
                </div>
                {row.meta && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {loading ? "…" : row.meta}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{row.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Export */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="font-bold">{ar ? "تصدير بياناتي المهنية" : "Export my career data"}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {ar
                ? "ينشئ ملف JSON من بياناتك أنت فقط، ويحتوي على إصدار المخطط وتاريخ الإنشاء وأقسام مصنّفة. لا يحتوي على أي مفاتيح أو بيانات مستخدمين آخرين."
                : "Creates a JSON file from your own data only, including a schema version, timestamp and labelled sections. It contains no keys and no other users' data."}
            </p>
          </div>
          <Button onClick={doExport} disabled={busy === "export"}>
            {busy === "export" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {ar ? "تصدير JSON" : "Export JSON"}
          </Button>
        </div>
      </section>

      {/* Protected terms live here too: they are a privacy/naming control. */}
      <section>
        <h2 className="text-lg font-bold">
          {ar ? "قواعد الترجمة والأسماء" : "Translation & naming rules"}
        </h2>
        <div className="mt-4">
          <ProtectedTermsManager userId={user.id} />
        </div>
      </section>

      {/* Deletion */}
      <section>
        <h2 className="text-lg font-bold">{ar ? "الحذف الانتقائي" : "Selective deletion"}</h2>
        <div className="mt-4 space-y-3">
          {destructive.map((d) => (
            <div
              key={d.key}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="max-w-xl">
                <p className="font-bold">{d.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.body}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={busy === d.key}>
                    {busy === d.key ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : d.key === "twin" ? (
                      <Trash2 className="size-4" />
                    ) : (
                      <Eraser className="size-4" />
                    )}
                    {ar ? "تنفيذ" : "Run"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{d.title}</AlertDialogTitle>
                    <AlertDialogDescription>{d.confirm}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void run(d.key, d.action, ar ? "تم التنفيذ" : "Done")}
                    >
                      {ar ? "تأكيد الحذف" : "Confirm"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}

          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">
                {ar ? "حذف الحقائق والأدلة" : "Deleting facts and evidence"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {ar
                  ? "الحذف الانتقائي للحقائق والأدلة يتم من خزانة الأدلة، حيث ترى كل حقيقة ودليلها قبل الحذف."
                  : "Facts and evidence are deleted from the Evidence Vault, where you can see each item and its evidence first."}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link to="/career-evidence">
                  {ar ? "افتح خزانة الأدلة" : "Open Evidence Vault"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">
                {ar ? "حذف الحساب بالكامل" : "Full account deletion"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {ar
                  ? "حذف الحساب نفسه لا يمكن تنفيذه من داخل التطبيق حالياً لأنه يتطلب صلاحيات إدارية على نظام المصادقة. أرسل طلباً من صفحة الحساب وسيُنفّذ يدوياً — لن ندّعي تنفيذه تلقائياً."
                  : "Deleting the account itself cannot be performed in-app today: it requires administrative access to the authentication system. Request it from your account page and it will be handled manually — we will not pretend it happens automatically."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
