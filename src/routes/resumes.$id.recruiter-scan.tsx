import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RecruiterTenSecondPanel } from "@/components/recruiter-ten-second-panel";
import { Button } from "@/components/ui/button";
import { getTemplate } from "@/components/resume-preview";
import { emptyFactGraph, loadFactGraph, type FactGraph } from "@/lib/career-facts";
import { useI18n } from "@/lib/i18n";
import { buildRecruiterTenSecondScan } from "@/lib/recruiter-ten-second-scan";
import { useAuthGuard, useStore } from "@/lib/store";

export const Route = createFileRoute("/resumes/$id/recruiter-scan")({
  head: () => ({
    meta: [
      { title: "Recruiter 10-Second Scan | سيرتي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecruiterScanPage,
});

function RecruiterScanPage() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, user, getResume } = useStore();
  const resume = getResume(id);
  const [graph, setGraph] = useState<FactGraph>(() => emptyFactGraph());
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  useAuthGuard();

  useEffect(() => {
    if (!user?.id) {
      setGraph(emptyFactGraph());
      return;
    }
    let active = true;
    setEvidenceLoading(true);
    void loadFactGraph(user.id)
      .then((next) => {
        if (active) setGraph(next);
      })
      .catch(() => {
        if (active) setGraph(emptyFactGraph());
      })
      .finally(() => {
        if (active) setEvidenceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const scan = useMemo(
    () =>
      resume
        ? buildRecruiterTenSecondScan(resume, {
            graph,
            jobDescription: resume.data.jobDescription,
            template: getTemplate(resume.templateId),
          })
        : null,
    [resume, graph],
  );

  if (!ready) return null;
  if (!resume || !scan) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-bold">{ar ? "لم نجد هذه السيرة" : "Resume not found"}</p>
        <Button className="mt-5" asChild>
          <Link to="/dashboard">{ar ? "العودة" : "Back"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Stage 5I
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {ar ? "محاكاة قراءة مسؤول التوظيف" : "Recruiter scan simulation"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            {ar
              ? "نحلل ما يمكن أن يبرز خلال أول 10 ثوانٍ من قراءة السيرة، باستخدام قواعد ثابتة وبياناتك وأدلتك فقط. لا توجد توقعات قبول أو محاكاة لشخص حقيقي."
              : "We estimate what may stand out in the first 10 seconds using deterministic rules and only your resume/evidence data. This is not a hiring prediction or a real-person simulation."}
          </p>
          {evidenceLoading ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {ar ? "جارٍ تحميل خزانة الأدلة…" : "Loading evidence vault…"}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/resumes/$id/studio" params={{ id: resume.id }}>
              {ar ? "Studio" : "Studio"}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/resumes/$id/edit" params={{ id: resume.id }}>
              {ar ? "تحرير السيرة" : "Edit resume"}
            </Link>
          </Button>
        </div>
      </div>

      <RecruiterTenSecondPanel scan={scan} />
    </main>
  );
}
