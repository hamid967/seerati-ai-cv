import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { analyzeResume } from "@/lib/ats";
import { explainFinding, LINT_CATEGORY_LABEL, lintResume } from "@/lib/resume-lint";
import { buildRecruiterSnapshot } from "@/lib/recruiter-view";
import { emptyFactGraph } from "@/lib/career-facts";
import { RecruiterSnapshotCard } from "@/components/recruiter-snapshot";
import { demoResume } from "@/lib/demo-data";
import { getTemplate } from "@/components/resume-preview";

export const Route = createFileRoute("/ats")({
  head: () => ({
    meta: [
      { title: "فحص ATS | سيرتي — Seerati ATS Check" },
      {
        name: "description",
        content:
          "فحص إرشادي لجاهزية السيرة الذاتية لأنظمة التوظيف: اكتمال الأقسام، الاتصال، الملخص، الإنجازات القابلة للقياس، المهارات، التنسيق، وتغطية كلمات وصف الوظيفة.",
      },
      { property: "og:title", content: "فحص جاهزية ATS | سيرتي" },
      { property: "og:description", content: "افهم مكوّنات درجة الجاهزية وكيف ترفعها قبل التقديم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AtsPage,
});

function AtsPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [jd, setJd] = useState("");
  const sample = useMemo(() => demoResume("demo"), []);
  const report = useMemo(() => analyzeResume(sample, getTemplate(sample.templateId), jd), [sample, jd]);
  const lint = useMemo(() => lintResume(sample), [sample]);
  const snapshot = useMemo(
    () => buildRecruiterSnapshot(sample, { graph: emptyFactGraph(), jobDescription: jd }),
    [sample, jd],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ar ? "جاهزية أنظمة التوظيف (ATS)" : "ATS readiness"}
        </h1>
        <p className="mt-3 text-sm leading-[1.9] text-muted-foreground">
          {ar
            ? "الفحص يعتمد على قواعد كتابة واضحة قابلة للتحقق. النتيجة إرشادية تساعدك على تحسين البنية والصياغة قبل التقديم، ولا تعني ضماناً للترشيح أو القبول."
            : "The check applies explicit, verifiable writing rules. The score is guidance for improving structure and wording; it does not guarantee shortlisting."}
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-bold">{ar ? "مثال على سيرة تجريبية" : "Example: demo resume"}</p>
            <p className="text-2xl font-extrabold text-emerald-accent">{report.score}/100</p>
          </div>
          <Progress value={report.score} className="mt-4" />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {report.categories.map((c) => (
              <div key={c.id} className="rounded-xl border border-border p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{c.label[lang]}</p>
                  <span className="text-xs font-bold text-muted-foreground">
                    {c.earned}/{c.max}
                  </span>
                </div>
                <Progress value={(c.earned / c.max) * 100} className="mt-2 h-1.5" />
                {c.tips[0] && <p className="mt-2 text-xs text-muted-foreground">{c.tips[0][lang]}</p>}
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-2">
            <Label htmlFor="jd">
              {ar ? "جرّب وصف وظيفة لقياس تغطية الكلمات المفتاحية" : "Try a job description to measure keyword coverage"}
            </Label>
            <Textarea id="jd" rows={5} value={jd} onChange={(e) => setJd(e.target.value)} />
            {report.keywords && (
              <div className="pt-2">
                <p className="text-sm font-semibold">
                  {ar ? "التطابق" : "Match"}: {report.keywords.coverage}% (
                  {report.keywords.matched.length}/{report.keywords.total})
                </p>
                {report.keywords.missing.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {report.keywords.missing.slice(0, 20).map((m) => (
                      <Badge key={m} variant="outline" className="text-[10.5px]">
                        {m}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{ar ? lint.label.ar : lint.label.en}</p>
              <p className="mt-1 text-xs leading-[1.8] text-muted-foreground">
                {ar
                  ? "فحص برمجي صلب بقواعد ثابتة — بلا ذكاء اصطناعي، ونفس السيرة تعطي نفس النتيجة دائماً."
                  : "A hard, rule-based check — no AI involved, and the same resume always yields the same result."}
              </p>
            </div>
            <p className="text-2xl font-extrabold">{lint.score}/100</p>
          </div>
          <Progress value={lint.score} className="mt-4" />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {lint.categories.map((c) => (
              <div key={c.category} className="rounded-xl border border-border p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {ar ? LINT_CATEGORY_LABEL[c.category].ar : LINT_CATEGORY_LABEL[c.category].en}
                  </p>
                  <span className="text-xs font-bold text-muted-foreground">
                    {c.earned}/{c.max}
                  </span>
                </div>
                <Progress value={(c.earned / c.max) * 100} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>

          {lint.findings.length ? (
            <ul className="mt-5 space-y-2 border-t border-border pt-4">
              {lint.findings.slice(0, 10).map((f) => (
                <li key={`${f.rule}-${f.where ?? ""}`} className="flex flex-wrap items-start gap-2 text-sm leading-[1.9]">
                  <Badge
                    variant={f.severity === "error" ? "destructive" : "outline"}
                    className="mt-0.5 text-[10.5px]"
                  >
                    {ar
                      ? f.severity === "error"
                        ? "حرج"
                        : f.severity === "warning"
                          ? "تحذير"
                          : "ملاحظة"
                      : f.severity}
                  </Badge>
                  <span className="flex-1">{explainFinding(f, ar ? "ar" : "en")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 border-t border-border pt-4 text-sm text-emerald-accent">
              {ar ? "لا توجد ملاحظات — بنية السيرة سليمة." : "No findings — the structure looks clean."}
            </p>
          )}
        </section>

        <div className="mt-8">
          <RecruiterSnapshotCard snapshot={snapshot} />
        </div>




        <Button size="lg" className="mt-8" asChild>
          <Link to="/auth" search={{ mode: "signup" }}>
            {ar ? "افحص سيرتي" : "Check my resume"}
          </Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
