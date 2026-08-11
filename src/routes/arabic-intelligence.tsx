import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Languages, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { loadCareerTwin, type CareerTwin } from "@/lib/career";
import { analyzeArabicCareer } from "@/lib/arabic-career-intelligence";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";

export const Route = createFileRoute("/arabic-intelligence")({
  head: () => ({
    meta: [
      { title: "ذكاء السيرة العربية | سيرتي" },
      {
        name: "description",
        content:
          "مراجعة جودة الصياغة المهنية العربية والاتساق الثنائي والإنجازات بدون اختلاق بيانات.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ArabicIntelligencePage,
});

function ArabicIntelligencePage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, ready, resumes } = useStore();
  const [twin, setTwin] = useState<CareerTwin | null>(null);
  const [loading, setLoading] = useState(true);
  useAuthGuard();

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    void loadCareerTwin(user.id).then((value) => {
      if (!active) return;
      setTwin(value);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [ready, user]);

  const report = useMemo(() => analyzeArabicCareer({ twin, resumes }), [twin, resumes]);

  if (!ready || !user || loading) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="size-6 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight">
              {ar ? "ذكاء السيرة العربية" : "Arabic Career Intelligence"}
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {ar
              ? "مراجعة لغوية مهنية للسوق السعودي: وضوح المسمى، قوة الإنجازات، جودة العربية، الاتساق الثنائي، وتكرار المهارات — دون إعادة كتابة حقائقك تلقائيًا."
              : "A professional language review for the Saudi market: headline clarity, achievement strength, Arabic quality, bilingual consistency and skill duplication — without automatically rewriting your facts."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/career-twin">{ar ? "تحرير ملفي المهني" : "Edit Career Twin"}</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">
              {ar ? "جودة الصياغة" : "Writing quality"}
            </p>
            <p className="mt-1 text-4xl font-extrabold">{report.score}</p>
            <Progress value={report.score} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {ar
                ? "مؤشر تحريري داخلي، وليس تقييم توظيف."
                : "An internal editorial indicator, not a hiring score."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">
              {ar ? "نسبة الحروف العربية" : "Arabic character share"}
            </p>
            <p className="mt-1 text-4xl font-extrabold">{report.arabicRatio}%</p>
            <Progress value={report.arabicRatio} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {ar
                ? "المصطلحات التقنية الإنجليزية طبيعية؛ الهدف هو الاتساق لا التعريب القسري."
                : "English technical terms are normal; the goal is consistency, not forced translation."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {ar ? "نقاط تحتاج مراجعة" : "Review points"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!report.issues.length ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
                <CheckCircle2 className="size-5 text-emerald-700" />
                {ar
                  ? "لم نجد ملاحظات تحريرية أساسية حاليًا."
                  : "No major editorial issues found right now."}
              </div>
            ) : (
              report.issues.map((issue) => (
                <div key={issue.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {issue.level === "strong" ? (
                      <AlertTriangle className="size-4 text-destructive" />
                    ) : (
                      <Sparkles className="size-4 text-primary" />
                    )}
                    <p className="text-sm font-bold">{issue.title[lang]}</p>
                    <Badge variant={issue.level === "strong" ? "destructive" : "outline"}>
                      {issue.level === "strong"
                        ? ar
                          ? "مهم"
                          : "Important"
                        : issue.level === "warning"
                          ? ar
                            ? "تحسين"
                            : "Improve"
                          : ar
                            ? "ملاحظة"
                            : "Note"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {issue.detail[lang]}
                  </p>
                  {issue.sample ? (
                    <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs">{issue.sample}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "نقاط قوة" : "Strengths"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.strengths.length ? (
              report.strengths.map((strength) => (
                <div
                  key={strength.en}
                  className="flex items-start gap-2 rounded-xl border p-3 text-xs leading-5"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                  <span>{strength[lang]}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                {ar
                  ? "أضف بيانات أكثر لإظهار نقاط القوة التحريرية."
                  : "Add more data to surface editorial strengths."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
