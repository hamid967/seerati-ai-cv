import { forwardRef, useMemo } from "react";
import { ResumePreview } from "@/components/resume-preview";
import { getPageMetrics, normalizeResumeDesign } from "@/lib/resume-layout";
import type { Resume } from "@/lib/types";
import "@/resume-layout.css";

export const ProfessionalResumePreview = forwardRef<
  HTMLDivElement,
  { resume: Resume; className?: string; showPageBoundaries?: boolean }
>(function ProfessionalResumePreview({ resume, className, showPageBoundaries = false }, ref) {
  const design = normalizeResumeDesign(resume.data.design);
  const metrics = getPageMetrics(design.pageSize);
  const sidebarWidth = `${design.columnWidth}%`;
  const cssVars = {
    "--resume-page-width": `${metrics.widthMm}mm`,
    "--resume-page-height": `${metrics.heightMm}mm`,
    "--resume-margin": `${design.marginMm}mm`,
    "--resume-font-scale": design.fontScale,
    "--resume-line-height": design.lineHeight,
    "--resume-sidebar-width": sidebarWidth,
  } as React.CSSProperties;

  const boundaries = useMemo(() => [1, 2, 3], []);

  return (
    <div
      ref={ref}
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
