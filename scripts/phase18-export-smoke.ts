import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { buildResumeDocument } from "@/modules/document";
import {
  createPrintModel,
  exportPdf,
  exportPlainText,
  exportStructuredJson,
} from "@/modules/export";
import { MockPDFProvider } from "@/modules/providers";

const data = emptyResumeData();
data.personal.fullName = "اختبار تصدير";
data.summary = "محتوى عربي قابل للبحث.";
const { graph } = fromResumeData(data, { graphId: "export-fixture", language: "ar" });
const document = buildResumeDocument(graph, { templateId: "classic-ats", pageSize: "a4" });
const print = createPrintModel(document);
assert.equal(print.direction, "rtl");
assert.equal(print.pageSize, "a4");
assert.match(exportPlainText(document), /محتوى عربي/);
assert.match(exportStructuredJson(document), /selectableText/);
const pdf = await exportPdf(new MockPDFProvider(), graph, {
  requestId: "export-request",
  locale: "ar",
  timeoutMs: 1000,
  sensitivity: "personal",
  templateId: "classic-ats",
  direction: "rtl",
  format: "visual",
});
assert.equal("bytes" in pdf ? pdf.mimeType : "unexpected", "application/pdf");
console.log("Phase 18 export smoke OK.");
