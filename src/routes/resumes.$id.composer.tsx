import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Layers3,
  LockKeyhole,
  RotateCcw,
  SplitSquareVertical,
} from "lucide-react";
import { ProfessionalResumePreview } from "@/components/professional-resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthGuard, useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getPageMetrics, normalizeResumeDesign, pageCountFromHeight } from "@/lib/resume-layout";
import { analyzeResumePagination, type PaginationWarning } from "@/lib/resume-pagination";
import type { ResumeUserDesign, SectionKey } from "@/lib/types";

export const Route = createFileRoute("/resumes/$id/composer")({
  head: () => ({
    meta: [{ title: "Smart Page Composer | سيرتي" }, { name: "robots", content: "noindex" }],
  }),
  component: SmartPageComposer,
});

const SECTION_LABELS: Record<SectionKey, { ar: string; en: string }> = {
  summary: { ar: "الملخص المهني", en: "Professional summary" },
  experience: { ar: "الخبرات", en: "Experience" },
  education: { ar: "التعليم", en: "Education" },
  skills: { ar: "المهارات", en: "Skills" },
  languages: { ar: "اللغات", en: "Languages" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  projects: { ar: "المشاريع", en: "Projects" },
  achievements: { ar: "الإنجازات", en: "Achievements" },
  volunteering: { ar: "التطوع", en: "Volunteering" },
  links: { ar: "الروابط", en: "Links" },
  references: { ar: "المراجع", en: "References" },
  custom: { ar: "قسم مخصص", en: "Custom section" },
};

function SmartPageComposer() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, getResume, updateResume } = useStore();
  const resume = getResume(id);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [warnings, setWarnings] = useState<PaginationWarning[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(74);

  useAuthGuard({ allowGuest: true });

  const design = useMemo(() => normalizeResumeDesign(resume?.data.design), [resume?.data.design]);
  const metrics = getPageMetrics(design.pageSize);

  useEffect(() => {
    const root = previewRef.current;
    if (!root || !resume) return;
    const paper = root.querySelector(".paper") as HTMLElement | null;
    if (!paper) return;

    const measure = () => {
      const pages = pageCountFromHeight(paper.scrollHeight, design.pageSize);
      setPageCount(pages);
      setWarnings(analyzeResumePagination(root, metrics.heightPx));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [resume, design.pageSize, metrics.heightPx]);

  if (!ready) return null;
  if (!resume) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-bold">{ar ? "لم نجد هذه السيرة" : "Resume not found"}</p>
        <Button className="mt-5" asChild>
          <Link to="/dashboard">{ar ? "العودة" : "Back"}</Link>
        </Button>
      </div>
    );
  }

  const hidden = new Set(resume.data.hiddenSections ?? []);
  const visibleSections = resume.data.sectionOrder.filter((key) => !hidden.has(key));
  const manualBreaks = new Set(resume.data.design?.pageBreakBefore ?? []);
  const keepTogether = new Set(resume.data.design?.keepTogetherSections ?? []);

  const savePagination = async (patch: Partial<ResumeUserDesign>) => {
    await updateResume(resume.id, {
      data: {
        ...resume.data,
        design: { ...resume.data.design, ...patch },
      },
    });
  };

  const toggleBreak = async (key: SectionKey) => {
    const next = new Set(manualBreaks);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    await savePagination({ pageBreakBefore: [...next] });
  };

  const toggleKeep = async (key: SectionKey) => {
    const next = new Set(keepTogether);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    await savePagination({ keepTogetherSections: [...next] });
  };

  const resetPagination = async () => {
    await savePagination({ pageBreakBefore: [], keepTogetherSections: [] });
  };

  const warningCount = warnings.filter((warning) => warning.severity === "warning").length;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-3 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="size-5 text-emerald-accent" />
              <h1 className="font-extrabold">
                {ar ? "مؤلف الصفحات الذكي" : "Smart Page Composer"}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{resume.title}</p>
          </div>
          <Badge variant={warningCount ? "destructive" : "secondary"}>
            {warningCount
              ? ar
                ? `${warningCount} تنبيه تخطيط`
                : `${warningCount} layout warning${warningCount === 1 ? "" : "s"}`
              : ar
                ? "التوزيع سليم"
                : "Layout looks clean"}
          </Badge>
          <Badge variant="outline">
            {pageCount}{" "}
            {ar ? (pageCount === 1 ? "صفحة" : "صفحات") : pageCount === 1 ? "page" : "pages"}
          </Badge>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => setZoom((value) => Math.max(45, value - 10))}>
              −
            </Button>
            <span className="min-w-12 text-center text-xs font-bold">{zoom}%</span>
            <Button variant="outline" onClick={() => setZoom((value) => Math.min(120, value + 10))}>
              +
            </Button>
            <Button variant="outline" asChild>
              <Link to="/resumes/$id/studio" params={{ id }}>
                <ArrowLeft className="size-4" />
                {ar ? "الاستوديو" : "Studio"}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/resumes/$id/preview" params={{ id }}>
                <FileText className="size-4" />
                {ar ? "معاينة وتنزيل" : "Preview & export"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1700px] gap-5 px-4 py-5 xl:grid-cols-[360px_minmax(0,1fr)_260px]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="seerati-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-bold">{ar ? "تركيب الصفحات" : "Page composition"}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {ar
                    ? "أضف فاصل صفحة قبل قسم أو اطلب إبقاء القسم كاملًا عندما تسمح المساحة. لا يتم حذف أو إعادة كتابة أي محتوى."
                    : "Add a page break before a section or prefer keeping a section together when it fits. Content is never deleted or rewritten."}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void resetPagination()}
                title={ar ? "إعادة الضبط" : "Reset"}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {visibleSections.map((key, index) => {
                const canBreak = index > 0;
                const breakActive = manualBreaks.has(key);
                const keepActive = keepTogether.has(key);
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-border/70 bg-background/70 p-3"
                  >
                    <p className="text-sm font-semibold">{SECTION_LABELS[key][lang]}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={breakActive ? "default" : "outline"}
                        disabled={!canBreak}
                        onClick={() => void toggleBreak(key)}
                      >
                        <SplitSquareVertical className="size-3.5" />
                        {ar ? "فاصل قبله" : "Break before"}
                      </Button>
                      <Button
                        size="sm"
                        variant={keepActive ? "default" : "outline"}
                        onClick={() => void toggleKeep(key)}
                      >
                        <LockKeyhole className="size-3.5" />
                        {ar ? "ابقه كاملًا" : "Keep together"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="relative min-h-[82vh] overflow-auto rounded-3xl border border-border/60 bg-secondary/45 p-4 md:p-8">
          <div
            className="mx-auto origin-top transition-transform duration-200"
            style={{
              width: metrics.widthPx,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <ProfessionalResumePreview ref={previewRef} resume={resume} showPageBoundaries />
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="seerati-panel p-4">
            <h2 className="font-bold">{ar ? "تشخيص الصفحات" : "Pagination diagnostics"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {ar
                ? "تحليل مبني على القياس الفعلي للمستند."
                : "Based on the actual rendered document measurement."}
            </p>
            <div className="mt-4 space-y-2">
              {warnings.length ? (
                warnings.slice(0, 10).map((warning) => (
                  <div
                    key={warning.id}
                    className="rounded-xl border border-border/70 bg-background/75 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`size-4 ${warning.severity === "warning" ? "text-destructive" : "text-muted-foreground"}`}
                      />
                      <span className="text-xs font-bold">
                        {ar ? `صفحة ${warning.page}` : `Page ${warning.page}`}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {warning.message[lang]}
                    </p>
                    {warning.sectionKey ? (
                      <p className="mt-1 text-[10px] font-medium text-foreground/70">
                        {SECTION_LABELS[warning.sectionKey][lang]}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-emerald-accent/25 bg-emerald-accent/5 p-3 text-xs leading-relaxed">
                  {ar
                    ? "لا توجد انقسامات مقلقة في القياس الحالي. راجع النتيجة بصريًا قبل التصدير."
                    : "No concerning splits detected at the current measurement. Review visually before export."}
                </div>
              )}
            </div>
          </section>

          <section className="seerati-panel p-4">
            <h2 className="font-bold">{ar ? "خريطة الصفحات" : "Page map"}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Array.from({ length: Math.min(pageCount, 8) }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[1/1.414] rounded-md border border-border bg-white shadow-sm"
                >
                  <div className="flex h-full items-center justify-center text-[10px] font-bold text-slate-500">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
