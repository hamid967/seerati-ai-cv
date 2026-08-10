import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { atsScore, runAtsChecks } from "@/lib/ats";
import { demoResumeData } from "@/lib/demo-data";

export const Route = createFileRoute("/ats")({
  head: () => ({
    meta: [
      { title: "فحص ATS | سيرتي — Seerati ATS Check" },
      {
        name: "description",
        content: "فحص أولي لجاهزية السيرة الذاتية لأنظمة التوظيف: اكتمال الحقول، طول الملخص، عناوين الأقسام، ومعلومات الاتصال مع اقتراحات تحسين.",
      },
      { property: "og:title", content: "فحص جاهزية ATS | سيرتي" },
      { property: "og:description", content: "تعرّف على الفحوصات التسعة التي نطبّقها على سيرتك الذاتية." },
    ],
  }),
  component: AtsPage,
});

function AtsPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const data = demoResumeData();
  const checks = runAtsChecks(data, true);
  const score = atsScore(checks);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{ar ? "جاهزية أنظمة التوظيف (ATS)" : "ATS readiness"}</h1>
        <p className="mt-3 text-sm leading-[1.9] text-muted-foreground">
          {ar
            ? "الفحص يعتمد على قواعد واضحة قابلة للتحقق، ولا يستخدم أي وعود تسويقية. النتيجة إرشادية تساعدك على تحسين البنية والصياغة قبل التقديم."
            : "The check is based on explicit, verifiable rules. The score is guidance to improve structure and wording before you apply."}
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-bold">{ar ? "مثال على سيرة تجريبية" : "Example: demo resume"}</p>
            <p className="text-2xl font-extrabold text-emerald-accent">{score}/100</p>
          </div>
          <Progress value={score} className="mt-4" />
          <ul className="mt-6 space-y-3">
            {checks.map((c) => (
              <li key={c.id} className="flex gap-3">
                {c.passed ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-accent" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-semibold">{c.label[lang]}</p>
                  <p className="text-xs text-muted-foreground">{c.hint[lang]}</p>
                </div>
                <span className="ms-auto text-xs text-muted-foreground">{c.weight}%</span>
              </li>
            ))}
          </ul>
        </div>

        <Button size="lg" className="mt-8" asChild>
          <Link to="/auth" search={{ mode: "signup" }}>{ar ? "افحص سيرتي" : "Check my resume"}</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
