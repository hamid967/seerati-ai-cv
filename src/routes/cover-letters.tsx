import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Mail, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { listAllCoverLetters, type CoverLetter } from "@/lib/cover-letters";
import { useAuthGuard, useStore } from "@/lib/store";

export const Route = createFileRoute("/cover-letters")({
  head: () => ({
    meta: [
      { title: "خطابات التقديم | سيرتي — Cover Letters" },
      {
        name: "description",
        content: "أنشئ وادِر خطابات تقديم مبنية على أدلتك المهنية المرتبطة بكل وظيفة.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoverLettersPage,
});

function CoverLettersPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, ready } = useStore();
  useAuthGuard();
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    void listAllCoverLetters().then((rows) => {
      if (!active) return;
      setLetters(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [ready, user]);

  const sorted = useMemo(
    () => [...letters].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [letters],
  );

  if (!ready || !user || loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {ar ? "أدوات التقديم" : "Application tools"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {ar ? "خطابات التقديم" : "Cover letters"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ar
              ? "خطابات مبنية على أدلتك المهنية ومرتبطة بمساحات الوظائف. لا يُحفظ أي ادّعاء غير مدعوم دون مراجعتك."
              : "Evidence-grounded letters linked to your job workspaces. Unsupported claims stay visible until you review them."}
          </p>
        </div>
        <Button asChild>
          <Link to="/jobs">
            <Plus className="size-4" />
            {ar ? "افتح مساحة وظيفة" : "Open a job workspace"}
          </Link>
        </Button>
      </div>

      <Card className="border-emerald-accent/20 bg-emerald-accent/5">
        <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm">
          <Sparkles className="size-4 text-emerald-accent" />
          <span>
            {ar
              ? "التوليد يتم داخل مساحة الوظيفة مع فحص الادّعاءات قبل الحفظ — مثل أدوات Rezi لكن مع قيد الأدلة."
              : "Generation happens inside a job workspace with a claims check before save — Rezi-like speed with evidence guards."}
          </span>
        </CardContent>
      </Card>

      {!sorted.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4" />
              {ar ? "لا توجد خطابات بعد" : "No cover letters yet"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {ar
                ? "أنشئ مساحة وظيفة، الصق الوصف، ثم ولّد خطاب تقديم من لوحة الوظيفة."
                : "Create a job workspace, paste the description, then generate a cover letter from the job panel."}
            </p>
            <Button variant="secondary" asChild>
              <Link to="/jobs">{ar ? "الذهاب إلى الوظائف" : "Go to jobs"}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((letter) => (
            <Card key={letter.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{letter.title}</CardTitle>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{letter.language === "en" ? "EN" : "AR"}</Badge>
                    <Badge variant="outline">{letter.tone}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {[letter.opening, letter.body].filter(Boolean).join(" ")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {letter.jobId ? (
                    <Button size="sm" asChild>
                      <Link to="/jobs/$id" params={{ id: letter.jobId }}>
                        <FileText className="size-3.5" />
                        {ar ? "فتح مساحة الوظيفة" : "Open job workspace"}
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" asChild>
                      <Link to="/jobs">{ar ? "ربط بوظيفة" : "Link to a job"}</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
