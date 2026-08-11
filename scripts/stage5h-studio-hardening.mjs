import { readFileSync, writeFileSync } from "node:fs";

const path = "src/routes/resumes.$id.studio.tsx";
let source = readFileSync(path, "utf8");

function replaceOnce(before, after, label) {
  if (!source.includes(before)) throw new Error(`Stage5H hardening target missing: ${label}`);
  source = source.replace(before, after);
}

replaceOnce(
  'import type { ResumeUserDesign } from "@/lib/types";',
  'import type { ResumeUserDesign, SectionKey } from "@/lib/types";',
  "SectionKey import",
);
replaceOnce(
  '    sectionOrder: typeof resume.data.sectionOrder;',
  '    sectionOrder: SectionKey[];',
  "undo section type",
);
replaceOnce(
  '  const normalized = normalizeResumeDesign(layout);',
  '  const normalized = normalizeResumeDesign(workingResume.data.design);',
  "preview-aware normalized design",
);
replaceOnce(
  '    return pageCountFromHeight(paper.scrollHeight, normalizeResumeDesign(layout).pageSize);',
  '    return pageCountFromHeight(\n      paper.scrollHeight,\n      normalizeResumeDesign(workingResume.data.design).pageSize,\n    );',
  "preview-aware measured page size",
);
replaceOnce(
  '  const fitToPages = async (target: FitTarget) => {\n    setFitting(target);',
  '  const fitToPages = async (target: FitTarget) => {\n    setDesignPreview(null);\n    setFitting(target);',
  "clear auto design preview before Smart Fit",
);

writeFileSync(path, source);
console.log("Stage 5H Studio hardening patch applied.");
