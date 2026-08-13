import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";
import type { ResumeDocument } from "@/modules/document";
import type { PDFProvider, PdfRequest } from "@/modules/providers";

export const PrintModelSchema = z.object({
  locale: z.enum(["ar", "en"]),
  direction: z.enum(["rtl", "ltr"]),
  pageSize: z.enum(["a4", "letter"]),
  title: z.string(),
  sections: z.array(z.object({ title: z.string(), blocks: z.array(z.string()) })),
});
export type PrintModel = z.infer<typeof PrintModelSchema>;

export function createPrintModel(document: ResumeDocument): PrintModel {
  return PrintModelSchema.parse({
    locale: document.locale,
    direction: document.direction,
    pageSize: document.pageSettings.pageSize,
    title:
      document.sections[0]?.blocks.find((block) => block.kind === "heading")?.content ?? "Resume",
    sections: document.sections.map((section) => ({
      title: section.title,
      blocks: section.blocks.map((block) => block.content),
    })),
  });
}

export function exportPlainText(document: ResumeDocument): string {
  return document.sections
    .map(
      (section) =>
        `${section.title}\n${section.blocks.map((block) => `- ${block.content}`).join("\n")}`,
    )
    .join("\n\n");
}

export function exportStructuredJson(document: ResumeDocument): string {
  return JSON.stringify(document, null, 2);
}

export async function exportPdf(
  provider: PDFProvider,
  graph: CareerProfileGraph,
  request: Omit<PdfRequest, "graph">,
) {
  return provider.export({ ...request, graph });
}
