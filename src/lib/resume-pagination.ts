import type { SectionKey } from "@/lib/types";

export type PaginationWarningType =
  "section-split" | "item-split" | "widow-heading" | "oversized-item";

export type PaginationWarning = {
  id: string;
  type: PaginationWarningType;
  page: number;
  sectionKey?: SectionKey;
  severity: "info" | "warning";
  message: { ar: string; en: string };
};

const pageIndex = (value: number, pageHeight: number) =>
  Math.max(0, Math.floor(Math.max(0, value) / pageHeight));

export function analyzeResumePagination(
  root: HTMLElement,
  pageHeightCssPx: number,
): PaginationWarning[] {
  const paper = root.querySelector(".paper") as HTMLElement | null;
  if (!paper || pageHeightCssPx <= 0) return [];

  const paperRect = paper.getBoundingClientRect();
  const scale = paper.offsetWidth > 0 ? paperRect.width / paper.offsetWidth : 1;
  const pageHeight = pageHeightCssPx * (Number.isFinite(scale) && scale > 0 ? scale : 1);
  const warnings: PaginationWarning[] = [];

  const relativeBox = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top - paperRect.top,
      bottom: rect.bottom - paperRect.top,
      height: rect.height,
    };
  };

  const sections = Array.from(
    paper.querySelectorAll<HTMLElement>("[data-cv-section][data-cv-section-key]"),
  );

  for (const section of sections) {
    const sectionKey = section.dataset.cvSectionKey as SectionKey | undefined;
    const box = relativeBox(section);
    const start = pageIndex(box.top, pageHeight);
    const end = pageIndex(Math.max(box.top, box.bottom - 1), pageHeight);

    if (end > start) {
      warnings.push({
        id: `section-${sectionKey ?? "unknown"}-${start}`,
        type: "section-split",
        page: start + 1,
        ...(sectionKey ? { sectionKey } : {}),
        severity: "info",
        message: {
          ar: `قسم ${sectionKey ?? ""} يمتد بين الصفحتين ${start + 1} و${end + 1}.`,
          en: `The ${sectionKey ?? "section"} section spans pages ${start + 1}–${end + 1}.`,
        },
      });
    }

    const heading = section.querySelector("h3") as HTMLElement | null;
    const firstContent = heading?.nextElementSibling as HTMLElement | null;
    if (heading && firstContent) {
      const headingBox = relativeBox(heading);
      const contentBox = relativeBox(firstContent);
      const headingPage = pageIndex(headingBox.top, pageHeight);
      const contentPage = pageIndex(contentBox.top, pageHeight);
      const remaining = pageHeight - (headingBox.bottom % pageHeight);
      if (contentPage > headingPage || (end > start && remaining < 72 * scale)) {
        warnings.push({
          id: `widow-${sectionKey ?? "unknown"}-${headingPage}`,
          type: "widow-heading",
          page: headingPage + 1,
          ...(sectionKey ? { sectionKey } : {}),
          severity: "warning",
          message: {
            ar: "عنوان قسم قريب جدًا من نهاية الصفحة وقد ينفصل عن محتواه.",
            en: "A section heading is too close to the page edge and may separate from its content.",
          },
        });
      }
    }
  }

  const items = Array.from(paper.querySelectorAll<HTMLElement>("[data-cv-item]"));
  items.forEach((item, index) => {
    const box = relativeBox(item);
    const start = pageIndex(box.top, pageHeight);
    const end = pageIndex(Math.max(box.top, box.bottom - 1), pageHeight);
    if (box.height > pageHeight) {
      warnings.push({
        id: `oversized-${index}-${start}`,
        type: "oversized-item",
        page: start + 1,
        severity: "warning",
        message: {
          ar: "عنصر واحد أطول من الصفحة؛ لا يمكن إبقاؤه كاملًا دون تقسيم المحتوى نفسه.",
          en: "One item is taller than a full page, so it cannot remain intact without editing the content itself.",
        },
      });
    } else if (end > start) {
      warnings.push({
        id: `item-${index}-${start}`,
        type: "item-split",
        page: start + 1,
        severity: "warning",
        message: {
          ar: `عنصر مهني ينقسم بين الصفحتين ${start + 1} و${end + 1}.`,
          en: `A resume item splits across pages ${start + 1}–${end + 1}.`,
        },
      });
    }
  });

  return warnings.filter(
    (warning, index, all) => all.findIndex((candidate) => candidate.id === warning.id) === index,
  );
}
