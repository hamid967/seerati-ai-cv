import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";
import { PAGE_SIZES, type ResumePageSize } from "@/lib/resume-layout";

const DocumentBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["heading", "text", "item", "link"]),
  content: z.string(),
  factIds: z.array(z.string()),
});

const DocumentSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  entity: z.string(),
  blocks: z.array(DocumentBlockSchema),
});

export const ResumeDocumentSchema = z.object({
  metadata: z.object({ id: z.string(), version: z.literal(1), templateId: z.string() }),
  locale: z.enum(["ar", "en"]),
  direction: z.enum(["rtl", "ltr"]),
  pageSettings: z.object({
    pageSize: z.enum(["a4", "letter"]),
    widthMm: z.number(),
    heightMm: z.number(),
    marginMm: z.number().positive(),
  }),
  sections: z.array(DocumentSectionSchema),
  blocks: z.array(DocumentBlockSchema),
  typography: z.object({ scale: z.number().positive(), lineHeight: z.number().positive() }),
  theme: z.object({ accent: z.string(), headingFont: z.enum(["sans", "serif"]) }),
  links: z.array(z.object({ label: z.string(), url: z.string() })),
  accessibility: z.object({
    selectableText: z.literal(true),
    headingOrder: z.literal(true),
    languageTagged: z.literal(true),
  }),
  atsMetadata: z.object({ atsSafe: z.boolean(), plainTextReady: z.literal(true) }),
});

export type DocumentBlock = z.infer<typeof DocumentBlockSchema>;
export type DocumentSection = z.infer<typeof DocumentSectionSchema>;
export type ResumeDocument = z.infer<typeof ResumeDocumentSchema>;

export type DocumentOptions = {
  templateId: string;
  pageSize?: ResumePageSize;
  marginMm?: number;
  fontScale?: number;
  lineHeight?: number;
  accent?: string;
  headingFont?: "sans" | "serif";
  atsSafe?: boolean;
};

const sectionOrder = [
  "identity",
  "contact",
  "summary",
  "target_role",
  "experience",
  "achievement",
  "education",
  "skill",
  "language",
  "certification",
  "project",
  "volunteer_experience",
  "link",
];
const sectionTitles: Record<string, { ar: string; en: string }> = {
  identity: { ar: "الملف المهني", en: "Profile" },
  contact: { ar: "التواصل", en: "Contact" },
  summary: { ar: "الملخص المهني", en: "Professional Summary" },
  target_role: { ar: "الدور المستهدف", en: "Target Role" },
  experience: { ar: "الخبرة", en: "Experience" },
  achievement: { ar: "الإنجازات", en: "Achievements" },
  education: { ar: "التعليم", en: "Education" },
  skill: { ar: "المهارات", en: "Skills" },
  language: { ar: "اللغات", en: "Languages" },
  certification: { ar: "الشهادات", en: "Certifications" },
  project: { ar: "المشاريع", en: "Projects" },
  volunteer_experience: { ar: "التطوع", en: "Volunteering" },
  link: { ar: "الروابط", en: "Links" },
};

export function buildResumeDocument(
  graph: CareerProfileGraph,
  options: DocumentOptions,
): ResumeDocument {
  const pageSize = options.pageSize ?? "a4";
  const page = PAGE_SIZES[pageSize];
  const language = graph.language;
  const grouped = new Map<string, DocumentBlock[]>();
  for (const fact of [...graph.facts].sort(
    (a, b) => a.fieldPath.localeCompare(b.fieldPath) || a.id.localeCompare(b.id),
  )) {
    const kind =
      fact.entity === "link"
        ? "link"
        : fact.fieldPath.endsWith(".role") || fact.fieldPath.endsWith(".school")
          ? "heading"
          : "text";
    const block: DocumentBlock = { id: fact.id, kind, content: fact.value, factIds: [fact.id] };
    const current = grouped.get(fact.entity) ?? [];
    current.push(block);
    grouped.set(fact.entity, current);
  }
  const sections = [...grouped.entries()]
    .sort(([a], [b]) => sectionOrder.indexOf(a) - sectionOrder.indexOf(b))
    .map(([entity, blocks]) => ({
      id: `section-${entity}`,
      title: sectionTitles[entity]?.[language] ?? entity,
      entity,
      blocks,
    }));
  const blocks = sections.flatMap((section) => section.blocks);
  return ResumeDocumentSchema.parse({
    metadata: { id: graph.id, version: 1, templateId: options.templateId },
    locale: language,
    direction: graph.direction,
    pageSettings: {
      pageSize,
      widthMm: page.widthMm,
      heightMm: page.heightMm,
      marginMm: options.marginMm ?? 10,
    },
    sections,
    blocks,
    typography: { scale: options.fontScale ?? 1, lineHeight: options.lineHeight ?? 1.65 },
    theme: { accent: options.accent ?? "#1e3a5f", headingFont: options.headingFont ?? "sans" },
    links: graph.facts
      .filter((fact) => fact.entity === "link")
      .map((fact) => ({ label: fact.fieldPath, url: fact.value.split(": ").slice(1).join(": ") })),
    accessibility: { selectableText: true, headingOrder: true, languageTagged: true },
    atsMetadata: { atsSafe: options.atsSafe ?? true, plainTextReady: true },
  });
}

export function estimateDocumentCharacters(document: ResumeDocument): number {
  return document.blocks.reduce((total, block) => total + block.content.length, 0);
}

export function detectOverflow(
  document: ResumeDocument,
  charsPerPage = 3200,
): { pageCount: number; overflow: boolean } {
  const pageCount = Math.max(1, Math.ceil(estimateDocumentCharacters(document) / charsPerPage));
  return { pageCount, overflow: pageCount > 2 };
}
