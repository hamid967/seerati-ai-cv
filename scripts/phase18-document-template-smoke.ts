import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { buildResumeDocument, detectOverflow } from "@/modules/document";
import {
  TemplateRegistry,
  manifestFromTemplateDef,
  originalTemplateManifests,
  validateTemplateManifest,
} from "@/modules/templates";
import { defaultTemplates } from "@/lib/templates";

const data = emptyResumeData();
data.personal.fullName = "سارة اختبار";
data.summary = "ملخص مهني اصطناعي للاختبار فقط.";
data.experience = [
  {
    id: "exp-1",
    role: "مهندسة برمجيات",
    company: "شركة تجريبية",
    bullets: ["بنتت خدمة محلية قابلة للاختبار."],
  },
];
const { graph } = fromResumeData(data, { graphId: "document-fixture", language: "ar" });
const options = { templateId: "classic-ats", pageSize: "a4" as const, atsSafe: true };
const first = buildResumeDocument(graph, options);
const second = buildResumeDocument(graph, options);
assert.deepEqual(first, second);
assert.equal(first.direction, "rtl");
assert.equal(first.pageSettings.pageSize, "a4");
assert.equal(first.accessibility.selectableText, true);
assert.equal(first.atsMetadata.plainTextReady, true);
assert.equal(detectOverflow(first).overflow, false);

const invalid = validateTemplateManifest({ id: "bad" });
assert.equal(invalid.valid, false);
assert.equal(originalTemplateManifests.length, 24);
assert.equal(new Set(originalTemplateManifests.map((manifest) => manifest.id)).size, 24);

const registry = new TemplateRegistry<typeof first, typeof first>();
const manifest = manifestFromTemplateDef(defaultTemplates[0]);
const plugin = {
  manifest,
  render: (document: typeof first) => document,
  print: (document: typeof first) => document,
};
registry.register(plugin);
assert.equal(registry.get(manifest.id)?.manifest.id, manifest.id);
assert.throws(() => registry.register(plugin));
assert.equal(registry.disable(manifest.id), true);
assert.equal(registry.get(manifest.id), undefined);

console.log("Phase 18 document/template smoke OK.");
