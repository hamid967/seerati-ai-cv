import type { ResumeUserDesign } from "@/lib/types";

export type ResumePageSize = "a4" | "letter";
export type FitTarget = 1 | 2;

const PX_PER_MM = 96 / 25.4;

export const PAGE_SIZES: Record<
  ResumePageSize,
  { widthMm: number; heightMm: number; label: string }
> = {
  a4: { widthMm: 210, heightMm: 297, label: "A4" },
  letter: { widthMm: 215.9, heightMm: 279.4, label: "US Letter" },
};

export const LAYOUT_LIMITS = {
  fontScale: { min: 0.84, max: 1.12, step: 0.02 },
  marginMm: { min: 8, max: 22, step: 1 },
  lineHeight: { min: 1.35, max: 1.9, step: 0.05 },
  columnWidth: { min: 24, max: 38, step: 1 },
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function normalizeResumeDesign(design?: ResumeUserDesign): Required<
  Pick<
    ResumeUserDesign,
    "pageSize" | "fontScale" | "marginMm" | "lineHeight" | "columnWidth"
  >
> &
  ResumeUserDesign {
  return {
    ...design,
    pageSize: design?.pageSize ?? "a4",
    fontScale: round(
      clamp(design?.fontScale ?? 1, LAYOUT_LIMITS.fontScale.min, LAYOUT_LIMITS.fontScale.max),
    ),
    marginMm: round(
      clamp(design?.marginMm ?? 10, LAYOUT_LIMITS.marginMm.min, LAYOUT_LIMITS.marginMm.max),
    ),
    lineHeight: round(
      clamp(design?.lineHeight ?? 1.65, LAYOUT_LIMITS.lineHeight.min, LAYOUT_LIMITS.lineHeight.max),
    ),
    columnWidth: round(
      clamp(
        design?.columnWidth ?? 28,
        LAYOUT_LIMITS.columnWidth.min,
        LAYOUT_LIMITS.columnWidth.max,
      ),
    ),
  };
}

export function getPageMetrics(pageSize: ResumePageSize) {
  const page = PAGE_SIZES[pageSize];
  return {
    ...page,
    widthPx: page.widthMm * PX_PER_MM,
    heightPx: page.heightMm * PX_PER_MM,
  };
}

/**
 * Layout presets deliberately stop at conservative readability limits.
 * Fit logic measures the real rendered document after every preset and never
 * removes or rewrites resume content.
 */
export function fitCandidates(
  target: FitTarget,
  current: ResumeUserDesign,
): ResumeUserDesign[] {
  const normalized = normalizeResumeDesign(current);
  const base = {
    ...current,
    pageSize: normalized.pageSize,
    columnWidth: normalized.columnWidth,
  } satisfies ResumeUserDesign;

  const presets =
    target === 1
      ? [
          { density: "compact" as const, fontScale: 0.98, marginMm: 10, lineHeight: 1.55 },
          { density: "compact" as const, fontScale: 0.94, marginMm: 9, lineHeight: 1.5 },
          { density: "compact" as const, fontScale: 0.9, marginMm: 8, lineHeight: 1.42 },
          { density: "compact" as const, fontScale: 0.86, marginMm: 8, lineHeight: 1.36 },
          { density: "compact" as const, fontScale: 0.84, marginMm: 8, lineHeight: 1.35 },
        ]
      : [
          { density: "normal" as const, fontScale: 1, marginMm: 12, lineHeight: 1.65 },
          { density: "compact" as const, fontScale: 0.98, marginMm: 11, lineHeight: 1.58 },
          { density: "compact" as const, fontScale: 0.94, marginMm: 10, lineHeight: 1.5 },
          { density: "compact" as const, fontScale: 0.9, marginMm: 9, lineHeight: 1.42 },
          { density: "compact" as const, fontScale: 0.86, marginMm: 8, lineHeight: 1.36 },
        ];

  return presets.map((preset) => ({ ...base, ...preset }));
}

export function pageCountFromHeight(heightPx: number, pageSize: ResumePageSize) {
  const { heightPx: pageHeightPx } = getPageMetrics(pageSize);
  return Math.max(1, Math.ceil(Math.max(0, heightPx - 1) / pageHeightPx));
}
