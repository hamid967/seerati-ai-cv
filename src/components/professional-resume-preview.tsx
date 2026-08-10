import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { ResumePreview, getTemplate } from "@/components/resume-preview";
import { getPageMetrics, normalizeResumeDesign } from "@/lib/resume-layout";
import type { Resume, SectionKey } from "@/lib/types";
import "@/resume-layout.css";

const sidebarKeys = new Set<SectionKey>(["skills", "languages", "links", "certificates"]);

function renderedSectionOrder(resume: Resume): SectionKey[] {
  const template = getTemplate(resume.templateId);
  const hidden = new Set(resume.data.hiddenSections ?? []);
  const visible = resume.data.sectionOrder.filter((key) => !hidden.has(key));
  if (template.design.layout === "single") return visible;

  const aside = visible.filter((key) => sidebarKeys.has(key));
  const main = visible.filter((key) => !sidebarKeys.has(key));
  return template.design.layout === "sidebar-left" ? [...aside, ...main] : [...main, ...aside];
}

export const ProfessionalResumePreview = forwardRef<
  HTMLDivElement,
  { resume: Resume; className?: string; showPageBoundaries?: boolean }
>(function ProfessionalResumePreview({ resume, className, showPageBoundaries = false }, ref) {
  const design = normalizeResumeDesign(resume.data.design);
  const metrics = getPageMetrics(design.pageSize);
  const sidebarWidth = `${design.columnWidth}%`;
  const rootRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement, []);

  const cssVars = {
    "--resume-page-width": `${metrics.widthMm}mm`,
    "--resume-page-height": `${metrics.heightMm}mm`,
    "--resume-margin": `${design.marginMm}mm`,
    "--resume-font-scale": design.fontScale,
    "--resume-line-height": design.lineHeight,
    "--resume-sidebar-width": sidebarWidth,
  } as React.CSSProperties;

  const boundaries = useMemo(() => [1, 2, 3, 4, 5, 6], []);

  useEffect(() => {
    const root = rootRef.current;
    const paper = root?.querySelector(".paper") as HTMLElement | null;
    if (!paper) return;

    const sections = Array.from(paper.querySelectorAll<HTMLElement>("[data-cv-section]"));
    const keys = renderedSectionOrder(resume);
    const manualBreaks = new Set(resume.data.design?.pageBreakBefore ?? []);
    const keepTogether = new Set(resume.data.design?.keepTogetherSections ?? []);

    sections.forEach((section, index) => {
      const key = keys[index];
      if (!key) return;
      section.dataset.cvSectionKey = key;
      section.dataset.manualBreak = manualBreaks.has(key) ? "true" : "false";
      section.dataset.keepTogether = keepTogether.has(key) ? "true" : "false";
      section.style.breakBefore = manualBreaks.has(key) ? "page" : "auto";
      section.style.pageBreakBefore = manualBreaks.has(key) ? "always" : "auto";
      section.style.breakInside = keepTogether.has(key) ? "avoid" : "auto";
      section.style.pageBreakInside = keepTogether.has(key) ? "avoid" : "auto";
    });
  }, [resume]);

  return (
    <div
      ref={rootRef}
      className={`professional-resume-page relative ${className ?? ""}`}
      style={cssVars}
      data-resume-page-size={design.pageSize}
      data-resume-page-height-px={metrics.heightPx}
    >
      <ResumePreview resume={resume} />
      {showPageBoundaries
        ? boundaries.map((page) => (
            <span
              key={page}
              aria-hidden
              className="resume-page-boundary"
              style={{ top: metrics.heightPx * page }}
            />
          ))
        : null}
    </div>
  );
});
