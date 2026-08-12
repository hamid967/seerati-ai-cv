import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ScanSearch, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { scanKeywords } from "@/lib/keyword-scanner";
import { useAuthGuard, useStore } from "@/lib/store";
import { emptyResumeData } from "@/lib/types";

export const Route = createFileRoute("/keyword-scanner")({
  head: () => ({
    meta: [
      { title: "ماسح الكلمات المفتاحية | سيرتي — Keyword Scanner" },
      {
        name: "description",
        content:
          "قارن وصف الوظيفة مع سيرتك لترى الكلمات المطابقة والناقصة قبل التقديم — فحص إرشادي شفاف.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KeywordScannerPage,
});

function KeywordScannerPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, ready, resumes } = useStore();
  useAuthGuard();
  const [jd, setJd] = useState("");
  const [resumeId, setResumeId] = useState<string>("");

  const activeResume = useMemo(() => {
    if (!resumes.length) return null;
    return resumes.find((r) => r.id === resumeId) ?? resumes[0] ?? null;
  }, [resumes, resumeId]);

  const report = useMemo(() => {
    if (!jd.trim() || !activeResume) return null;
    return scanKeywords(jd, activeResume.data ?? emptyResumeData());
  }, [jd, activeResume]);

  if (!ready || !user) {
    return (
      <div className="p-10 text-sm text-muted-foreground">{ar ? "جارٍ التحميل…" : "Loading…"}</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {ar ? "أدوات الاستهداف" : "Targeting tools"}
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <ScanSearch className="size-7 text-emerald-accent" />
          {ar ? "ماسح الكلمات المفتاحية" : "Keyword scanner"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {ar
            ? "ألصق وصف الوظيفة واختر سيرة — نُظهر التغطية المطابقة والكلمات الناقصة بشفافية. لا نضيف كلمات تلقائياً إلى سيرتك."
            : "Paste a job description and pick a resume — we show matched coverage and missing terms transparently. Keywords are never auto-inserted."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "وصف الوظيفة" : "Job description"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="jd">{ar ? "الصق الإعلان هنا" : "Paste the posting here"}</Label>
            <Textarea
              id="jd"
              rows={12}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder={
                ar
                  ? "مثال: نبحث عن مهندس برمجيات بخبرة React وTypeScript…"
                  : "Example: Looking for a software engineer with React and TypeScript…"
              }
              className="min-h-[220px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "السيرة المستهدفة" : "Target resume"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!resumes.length ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{ar ? "لا توجد سير ذاتية بعد." : "No resumes yet."}</p>
                <Button asChild>
                  <Link to="/resumes/new">{ar ? "أنشئ سيرة" : "Create a resume"}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    type="button"
                    onClick={() => setResumeId(resume.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-start text-sm transition-colors ${
                      (activeResume?.id ?? "") === resume.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <span className="font-medium">{resume.title}</span>
                    <Badge variant="outline">{resume.language.toUpperCase()}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {report ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">{ar ? "نتيجة المسح" : "Scan result"}</CardTitle>
            <p className="text-2xl font-extrabold text-emerald-accent">{report.coverage}%</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress value={report.coverage} />
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  report.band === "strong"
                    ? "default"
                    : report.band === "fair"
                      ? "secondary"
                      : "destructive"
                }
              >
                {report.band === "strong"
                  ? ar
                    ? "تغطية قوية"
                    : "Strong coverage"
                  : report.band === "fair"
                    ? ar
                      ? "تغطية متوسطة"
                      : "Fair coverage"
                    : ar
                      ? "تغطية ضعيفة"
                      : "Weak coverage"}
              </Badge>
              <Badge variant="outline">
                {ar
                  ? `${report.matched.length} مطابقة / ${report.missing.length} ناقصة`
                  : `${report.matched.length} matched / ${report.missing.length} missing`}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  {ar ? "كلمات مطابقة" : "Matched keywords"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.matched.length ? (
                    report.matched.map((token) => (
                      <Badge key={token} variant="secondary">
                        {token}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  {ar ? "كلمات ناقصة" : "Missing keywords"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.missing.length ? (
                    report.missing.slice(0, 40).map((token) => (
                      <Badge key={token} variant="outline">
                        {token}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {ar ? "خطوات تالية" : "Next actions"}
              </p>
              {report.actions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <p className="font-semibold">{action.title[lang]}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{action.detail[lang]}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {activeResume ? (
                <Button asChild>
                  <Link to="/resumes/$id/edit" params={{ id: activeResume.id }}>
                    <Target className="size-4" />
                    {ar ? "تحرير السيرة" : "Edit resume"}
                  </Link>
                </Button>
              ) : null}
              <Button variant="secondary" asChild>
                <Link to="/jobs">
                  <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                  {ar ? "استوديو التخصيص عبر الوظائف" : "Tailoring via Jobs"}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ats">{ar ? "فحص ATS" : "ATS check"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {ar
              ? "الصق وصف وظيفة واختر سيرة لبدء المسح."
              : "Paste a job description and select a resume to start scanning."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
