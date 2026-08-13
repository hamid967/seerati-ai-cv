import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";

export const PortfolioSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  blocks: z.array(z.object({ id: z.string(), content: z.string(), factIds: z.array(z.string()) })),
});
export const PortfolioPackageSchema = z.object({
  version: z.literal("0.1.0"),
  locale: z.enum(["ar", "en"]),
  title: z.string(),
  sections: z.array(PortfolioSectionSchema),
  staticHtml: z.string(),
  qrPayload: z.string().optional(),
  privacy: z.object({ publicPublishing: z.literal(false), indexing: z.literal(false) }),
});
export type PortfolioPackage = z.infer<typeof PortfolioPackageSchema>;

export function generatePortfolio(
  graph: CareerProfileGraph,
  options: { title?: string; includeEntities?: string[]; qrPayload?: string } = {},
): PortfolioPackage {
  const include = options.includeEntities ? new Set(options.includeEntities) : null;
  const sections = [...new Set(graph.facts.map((fact) => fact.entity))]
    .filter((entity) => !include || include.has(entity))
    .map((entity) => ({
      id: `portfolio-${entity}`,
      title: entity,
      blocks: graph.facts
        .filter((fact) => fact.entity === entity)
        .map((fact) => ({ id: fact.id, content: fact.value, factIds: [fact.id] })),
    }));
  const staticHtml = `<main lang="${graph.language}" dir="${graph.direction}">${sections.map((section) => `<section><h2>${section.title}</h2>${section.blocks.map((block) => `<p>${escapeHtml(block.content)}</p>`).join("")}</section>`).join("")}</main>`;
  return PortfolioPackageSchema.parse({
    version: "0.1.0",
    locale: graph.language,
    title: options.title ?? "Portfolio",
    sections,
    staticHtml,
    ...(options.qrPayload ? { qrPayload: options.qrPayload } : {}),
    privacy: { publicPublishing: false, indexing: false },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
