import { z } from "zod";
import { defaultTemplates } from "@/lib/templates";
import type { TemplateDef } from "@/lib/types";

export const TemplateManifestSchema = z.object({
  id: z.string().trim().min(1).max(80),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  supportedLanguages: z.array(z.enum(["ar", "en"])).min(1),
  supportedDirections: z.array(z.enum(["rtl", "ltr"])).min(1),
  atsLevel: z.enum(["strict", "safe", "visual"]),
  pageRange: z
    .object({ min: z.number().int().positive(), max: z.number().int().positive() })
    .refine(
      (range) => range.max >= range.min,
      "pageRange.max must be greater than or equal to pageRange.min",
    ),
  supportedSections: z.array(z.string().min(1)).min(1),
  renderingStrategy: z.enum(["html", "canvas-free"]),
  printStrategy: z.enum(["browser", "pdf", "shared"]),
  thumbnail: z.string().optional(),
  accessibilityNotes: z.string().min(1).max(1000),
  license: z.string().min(1).max(200),
  checksum: z.string().regex(/^[a-f0-9]{8,128}$/),
});

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
export type TemplateRenderContext = {
  locale: "ar" | "en";
  direction: "rtl" | "ltr";
  templateId: string;
};
export type TemplateRenderer<TDocument = unknown, TOutput = unknown> = (
  document: TDocument,
  context: TemplateRenderContext,
) => TOutput;

export type TemplatePlugin<TDocument = unknown, TOutput = unknown> = {
  manifest: TemplateManifest;
  render: TemplateRenderer<TDocument, TOutput>;
  print: TemplateRenderer<TDocument, TOutput>;
};

export type TemplateValidationResult =
  { valid: true; manifest: TemplateManifest } | { valid: false; errors: string[] };

export function validateTemplateManifest(input: unknown): TemplateValidationResult {
  const parsed = TemplateManifestSchema.safeParse(input);
  if (parsed.success) return { valid: true, manifest: parsed.data };
  return {
    valid: false,
    errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
  };
}

function checksumForTemplate(template: TemplateDef): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(template)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0)
    .toString(16)
    .padStart(8, "0");
}

export function manifestFromTemplateDef(template: TemplateDef): TemplateManifest {
  return TemplateManifestSchema.parse({
    id: template.id,
    version: "1.0.0",
    supportedLanguages: ["ar", "en"],
    supportedDirections: template.supportsRTL ? ["rtl", "ltr"] : ["ltr"],
    atsLevel: template.atsFriendly ? "safe" : "visual",
    pageRange: { min: 1, max: 3 },
    supportedSections: [
      "summary",
      "experience",
      "education",
      "skills",
      "languages",
      "projects",
      "links",
    ],
    renderingStrategy: "html",
    printStrategy: "shared",
    accessibilityNotes:
      "Selectable text, ordered headings, and language-aware direction are required.",
    license: "Seerati Original — free template",
    checksum: checksumForTemplate(template),
  });
}

export const originalTemplateManifests = defaultTemplates.map(manifestFromTemplateDef);

export class TemplateRegistry<TDocument = unknown, TOutput = unknown> {
  private readonly plugins = new Map<string, TemplatePlugin<TDocument, TOutput>>();

  register(plugin: TemplatePlugin<TDocument, TOutput>): void {
    const result = validateTemplateManifest(plugin.manifest);
    if (!result.valid) throw new Error(`Invalid template manifest: ${result.errors.join("; ")}`);
    if (this.plugins.has(plugin.manifest.id))
      throw new Error(`Template already registered: ${plugin.manifest.id}`);
    this.plugins.set(plugin.manifest.id, plugin);
  }

  disable(id: string): boolean {
    return this.plugins.delete(id);
  }

  get(id: string): TemplatePlugin<TDocument, TOutput> | undefined {
    return this.plugins.get(id);
  }

  list(): TemplateManifest[] {
    return [...this.plugins.values()].map((plugin) => plugin.manifest);
  }
}
