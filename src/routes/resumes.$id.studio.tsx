import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Expand, FileText, Gauge, Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ProfessionalResumePreview } from "@/components/professional-resume-preview";
import { ResumeAutoDesignPanel } from "@/components/resume-auto-design-panel";
import { getTemplate } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthGuard, useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import { adviseResumeStudio } from "@/lib/resume-studio";
import {
  fitCandidates,
  getPageMetrics,
  LAYOUT_LIMITS,
  normalizeResumeDesign,
  pageCountFromHeight,
  type FitTarget,
} from "@/lib/resume-layout";
import type { ResumeUserDesign } from "@/lib/types";
import type { ResumeDesignProposal } from "@/lib/resume-design-intelligence";

export const Route = createFileRoute("/resumes/$id/studio")({
  head: () => ({
    meta: [{ title: "Professional Layout Engine | سيرتي" }, { name: "robots", content: "noindex" }],
  }),
  component: ResumeStudioUltra,
});

const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

function ResumeStudioUltra() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, getResume, updateResume } = useStore();
  const resume = getResume(id);
  const [zoom, setZoom] = useState(82);
  const [fullscreen, setFullscreen] = useState(false);
  const [fitting, setFitting] = useState<FitTarget | null>(null);
  const [layout, setLayout] = useState<ResumeUserDesign>({});
  const [pageCount, setPageCount] = useState(1);
  const [designPreview, setDesignPreview] = useState<ResumeDesignProposal | null>(null);
  const [autoDesignUndo, setAutoDesignUndo] = useState<{
    templateId: string;
    design: ResumeUserDesign | undefined;
    sectionOrder: typeof resume.data.sectionOrder;
  } | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useAuthGuard();

  useEffect(() => {
    if (resume) setLayout(normalizeResumeDesign(resume.data.design));
  }, [resume?.id]);

  const workingResume = useMemo(
    () =>
      resume
        ? {
            ...resume,
            templateId: designPreview?.templateId ?? resume.templateId,
            data: {
              ...resume.data,
              sectionOrder: designPreview?.sectionOrder ?? resume.data.sectionOrder,
              design: {
                ...resume.data.design,
                ...layout,
                ...(designPreview?.design ?? {}),
              },
            },
          }
        : null,
    [resume, layout, designPreview],
  );

  const advice = useMemo(
    () => (workingResume ? adviseResumeStudio(workingResume, defaultTemplates) : null),
    [workingResume],
  );

  useEffect(() => {
    const root = previewRef.current;
    if (!root || !workingResume) return;
    const paper = root.querySelector(".paper") as HTMLElement | null;
    if (!paper) return;
    const measure = () =>
      setPageCount(
        pageCountFromHeight(
          paper.scrollHeight,
          normalizeResumeDesign(workingResume.data.design).pageSize,
        ),
      );
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(paper);
    return () => ro.disconnect();
  }, [workingResume, layout]);

  if (!ready) return null;
  if (!resume || !workingResume || !advice) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-bold">{ar ? "لم نجد هذه السيرة" : "Resume not found"}</p>
        <Button className="mt-5" asChild>
          <Link to="/dashboard">{ar ? "العودة" : "Back"}</Link>
        </Button>
      </div>
    );
  }

  const normalized = normalizeResumeDesign(layout);
  const metrics = getPageMetrics(normalized.pageSize);

  const saveLayout = async (next: ResumeUserDesign) => {
    setDesignPreview(null);
    const normalizedNext = normalizeResumeDesign(next);
    setLayout(normalizedNext);
    await updateResume(resume.id, {
      data: { ...resume.data, design: { ...resume.data.design, ...normalizedNext } },
    });
  };

  const patchLayout = (patch: Partial<ResumeUserDesign>) => {
    void saveLayout({ ...layout, ...patch });
  };

  const applyTemplate = async (templateId: string) => {
    setDesignPreview(null);
    await updateResume(resume.id, { templateId });
  };

  const measurePages = () => {
    const paper = previewRef.current?.querySelector(".paper") as HTMLElement | null;
    if (!paper) return Number.POSITIVE_INFINITY;
    return pageCountFromHeight(paper.scrollHeight, normalizeResumeDesign(layout).pageSize);
  };

  const fitToPages = async (target: FitTarget) => {
    setFitting(target);
    let selected: ResumeUserDesign | null = null;
    try {
      for (const candidate of fitCandidates(target, layout)) {
        setLayout(candidate);
        await nextFrame();
        const paper = previewRef.current?.querySelector(".paper") as HTMLElement | null;
        if (!paper) continue;
        const pages = pageCountFromHeight(
          paper.scrollHeight,
          normalizeResumeDesign(candidate).pageSize,
        );
        if (pages <= target) {
          selected = candidate;
          break;
        }
      }

      const candidates = fitCandidates(target, layout);
      const finalLayout = selected ?? candidates[candidates.length - 1]!;
      await saveLayout(finalLayout);
      await nextFrame();
      const finalPages = measurePages();
      if (finalPages <= target) {
        toast.success(
          ar
            ? `تم ضبط السيرة لتناسب ${target === 1 ? "صفحة واحدة" : "صفحتين"} بدون حذف المحتوى`
            : `Resume fitted to ${target} page${target === 1 ? "" : "s"} without deleting content`,
        );
      } else {
        toast.warning(
          ar
            ? `وصلنا للحد الأدنى الآمن للقراءة، والمحتوى ما زال يحتاج ${finalPages} صفحات. لم نحذف أي محتوى.`
            : `Safe readability limits reached; the resume still needs ${finalPages} pages. No content was deleted.`,
        );
      }
    } finally {
      setFitting(null);
    }
  };

  const applyAutoDesign = async (proposal: ResumeDesignProposal) => {
    setAutoDesignUndo({
      templateId: resume.templateId,
      design: resume.data.design,
      sectionOrder: [...resume.data.sectionOrder],
    });
    const nextDesign = normalizeResumeDesign(proposal.design);
    setLayout(nextDesign);
    setDesignPreview(null);
    await updateResume(resume.id, {
      templateId: proposal.templateId,
      data: {
        ...resume.data,
        sectionOrder: proposal.sectionOrder,
        design: { ...resume.data.design, ...proposal.design },
      },
    });
    toast.success(ar ? "تم اعتماد التصميم الذكي" : "Smart design applied");
  };

  const undoAutoDesign = async () => {
    if (!autoDesignUndo) return;
    setDesignPreview(null);
    setLayout(normalizeResumeDesign(autoDesignUndo.design));
    await updateResume(resume.id, {
      templateId: autoDesignUndo.templateId,
      data: {
        ...resume.data,
        sectionOrder: autoDesignUndo.sectionOrder,
        design: autoDesignUndo.design,
      },
    });
    setAutoDesignUndo(null);
    toast.success(ar ? "تم التراجع عن آخر تصميم ذكي" : "Last smart design reverted");
  };

  const currentTemplate = getTemplate(designPreview?.templateId ?? resume.templateId);

  return (
    <div
      className={fullscreen ? "fixed inset-0 z-[80] overflow-auto bg-background" : "min-h-screen"}
    >
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 py-3">
          <div className="me-3">
            <p className="font-extrabold">Professional Layout Engine</p>
            <p className="text-xs text-muted-foreground">{resume.title}</p>
          </div>

          <Select
            value={normalized.pageSize}
            onValueChange={(v) => patchLayout({ pageSize: v as "a4" | "letter" })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4</SelectItem>
              <SelectItem value="letter">US Letter</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(45, z - 10))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-14 text-center text-xs font-bold">{zoom}%</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <Badge variant={pageCount <= 2 ? "secondary" : "destructive"}>
            {pageCount}{" "}
            {ar ? (pageCount === 1 ? "صفحة" : "صفحات") : pageCount === 1 ? "page" : "pages"}
          </Badge>

          <Button variant="outline" onClick={() => setFullscreen((v) => !v)}>
            <Expand className="size-4" />
            {fullscreen ? (ar ? "إنهاء التركيز" : "Exit focus") : ar ? "وضع التركيز" : "Focus mode"}
          </Button>

          <Button variant="outline" asChild>
            <Link to="/resumes/$id/edit" params={{ id }}>
              <FileText className="size-4" />
              {ar ? "تحرير المحتوى" : "Edit content"}
            </Link>
          </Button>

          <Button className="ms-auto" asChild>
            <Link to="/resumes/$id/preview" params={{ id }}>
              {ar ? "معاينة وتنزيل" : "Preview & export"}
            </Link>
          </Button>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 xl:grid-cols-[330px_minmax(0,1fr)_170px]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <ResumeAutoDesignPanel
            resume={resume}
            measuredPages={pageCount}
            lang={lang}
            previewing={designPreview !== null}
            canUndo={autoDesignUndo !== null}
            onPreview={setDesignPreview}
            onCancelPreview={() => setDesignPreview(null)}
            onApply={(proposal) => void applyAutoDesign(proposal)}
            onUndo={() => void undoAutoDesign()}
          />

          <section className="seerati-panel p-4">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-emerald-accent" />
              <h2 className="font-bold">Smart Fit</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" disabled={fitting !== null} onClick={() => void fitToPages(1)}>
                {fitting === 1
                  ? ar
                    ? "يتم القياس…"
                    : "Measuring…"
                  : ar
                    ? "صفحة واحدة"
                    : "Fit 1 page"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={fitting !== null}
                onClick={() => void fitToPages(2)}
              >
                {fitting === 2
                  ? ar
                    ? "يتم القياس…"
                    : "Measuring…"
                  : ar
                    ? "صفحتان"
                    : "Fit 2 pages"}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {ar
                ? "يقيس الارتفاع الفعلي بعد كل إعداد، ولا يحذف أو يعيد كتابة أي معلومة."
                : "Measures actual rendered height after each preset and never deletes or rewrites information."}
            </p>
          </section>

          <section className="seerati-panel space-y-4 p-4">
            <h2 className="font-bold">{ar ? "إعدادات التخطيط" : "Layout controls"}</h2>
            <LayoutRange
              label={ar ? "حجم الخط" : "Font scale"}
              value={normalized.fontScale}
              min={LAYOUT_LIMITS.fontScale.min}
              max={LAYOUT_LIMITS.fontScale.max}
              step={LAYOUT_LIMITS.fontScale.step}
              display={`${Math.round(normalized.fontScale * 100)}%`}
              onChange={(value) => patchLayout({ fontScale: value })}
            />
            <LayoutRange
              label={ar ? "الهوامش" : "Margins"}
              value={normalized.marginMm}
              min={LAYOUT_LIMITS.marginMm.min}
              max={LAYOUT_LIMITS.marginMm.max}
              step={LAYOUT_LIMITS.marginMm.step}
              display={`${normalized.marginMm} mm`}
              onChange={(value) => patchLayout({ marginMm: value })}
            />
            <LayoutRange
              label={ar ? "ارتفاع السطر" : "Line height"}
              value={normalized.lineHeight}
              min={LAYOUT_LIMITS.lineHeight.min}
              max={LAYOUT_LIMITS.lineHeight.max}
              step={LAYOUT_LIMITS.lineHeight.step}
              display={normalized.lineHeight.toFixed(2)}
              onChange={(value) => patchLayout({ lineHeight: value })}
            />
            {currentTemplate.design.layout !== "single" ? (
              <LayoutRange
                label={ar ? "عرض العمود الجانبي" : "Sidebar width"}
                value={normalized.columnWidth}
                min={LAYOUT_LIMITS.columnWidth.min}
                max={LAYOUT_LIMITS.columnWidth.max}
                step={LAYOUT_LIMITS.columnWidth.step}
                display={`${normalized.columnWidth}%`}
                onChange={(value) => patchLayout({ columnWidth: value })}
              />
            ) : null}
          </section>

          <section className="seerati-panel p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-accent" />
              <h2 className="font-bold">{ar ? "مستشار التصميم" : "Design advisor"}</h2>
            </div>
            <div className="mt-3 space-y-2">
              {advice.reasons.map((r, i) => (
                <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                  • {r[lang]}
                </p>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {advice.recommendedTemplateIds.map((templateId) => {
                const tpl = getTemplate(templateId);
                return (
                  <button
                    key={templateId}
                    onClick={() => void applyTemplate(templateId)}
                    className={`w-full rounded-xl border p-3 text-start transition hover:border-emerald-accent ${resume.templateId === templateId ? "border-emerald-accent bg-emerald-accent/5" : "border-border"}`}
                  >
                    <span className="font-semibold">{tpl.name[lang]}</span>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {tpl.description[lang]}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="relative min-h-[80vh] overflow-auto rounded-3xl border border-border/60 bg-secondary/35 p-4 md:p-8">
          <div
            className="mx-auto origin-top transition-transform duration-200"
            style={{
              width: metrics.widthPx,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <ProfessionalResumePreview ref={previewRef} resume={workingResume} showPageBoundaries />
          </div>
        </section>

        <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
          <div className="seerati-panel p-3">
            <p className="text-xs font-bold">{ar ? "خريطة الصفحات" : "Page mini-map"}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {metrics.widthMm} × {metrics.heightMm} mm
            </p>
            <div className="mt-3 space-y-2">
              {Array.from({ length: Math.min(pageCount, 6) }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[1/1.414] rounded border border-border bg-white shadow-sm"
                >
                  <div className="p-2 text-[9px] text-slate-500">
                    {ar ? "صفحة" : "Page"} {index + 1}
                  </div>
                </div>
              ))}
            </div>
            {pageCount > 6 ? (
              <p className="mt-2 text-[10px] text-muted-foreground">+{pageCount - 6}</p>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
}

function LayoutRange({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span>{label}</span>
        <strong>{display}</strong>
      </span>
      <input
        className="w-full accent-current"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
