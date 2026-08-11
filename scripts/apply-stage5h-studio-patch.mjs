import { readFileSync, writeFileSync } from "node:fs";

const path = "src/routes/resumes.$id.studio.tsx";
let source = readFileSync(path, "utf8");

function replaceOnce(before, after, label) {
  if (!source.includes(before)) throw new Error(`Stage5H patch target missing: ${label}`);
  source = source.replace(before, after);
}

replaceOnce(
  'import { ProfessionalResumePreview } from "@/components/professional-resume-preview";\n',
  'import { ProfessionalResumePreview } from "@/components/professional-resume-preview";\nimport { ResumeAutoDesignPanel } from "@/components/resume-auto-design-panel";\n',
  "auto design panel import",
);

replaceOnce(
  'import type { ResumeUserDesign } from "@/lib/types";\n',
  'import type { ResumeUserDesign } from "@/lib/types";\nimport type { ResumeDesignProposal } from "@/lib/resume-design-intelligence";\n',
  "proposal type import",
);

replaceOnce(
  '  const [layout, setLayout] = useState<ResumeUserDesign>({});\n  const [pageCount, setPageCount] = useState(1);\n',
  '  const [layout, setLayout] = useState<ResumeUserDesign>({});\n  const [pageCount, setPageCount] = useState(1);\n  const [designPreview, setDesignPreview] = useState<ResumeDesignProposal | null>(null);\n  const [autoDesignUndo, setAutoDesignUndo] = useState<{\n    templateId: string;\n    design: ResumeUserDesign | undefined;\n    sectionOrder: typeof resume.data.sectionOrder;\n  } | null>(null);\n',
  "Stage5H state",
);

replaceOnce(
  `  const workingResume = useMemo(\n    () =>\n      resume\n        ? {\n            ...resume,\n            data: { ...resume.data, design: { ...resume.data.design, ...layout } },\n          }\n        : null,\n    [resume, layout],\n  );\n`,
  `  const workingResume = useMemo(\n    () =>\n      resume\n        ? {\n            ...resume,\n            templateId: designPreview?.templateId ?? resume.templateId,\n            data: {\n              ...resume.data,\n              sectionOrder: designPreview?.sectionOrder ?? resume.data.sectionOrder,\n              design: {\n                ...resume.data.design,\n                ...layout,\n                ...(designPreview?.design ?? {}),\n              },\n            },\n          }\n        : null,\n    [resume, layout, designPreview],\n  );\n`,
  "preview working resume",
);

replaceOnce(
  '    const measure = () =>\n      setPageCount(pageCountFromHeight(paper.scrollHeight, normalizeResumeDesign(layout).pageSize));\n',
  '    const measure = () =>\n      setPageCount(\n        pageCountFromHeight(\n          paper.scrollHeight,\n          normalizeResumeDesign(workingResume.data.design).pageSize,\n        ),\n      );\n',
  "measured preview page size",
);

replaceOnce(
  '  const saveLayout = async (next: ResumeUserDesign) => {\n',
  '  const saveLayout = async (next: ResumeUserDesign) => {\n    setDesignPreview(null);\n',
  "clear preview on saved layout",
);

replaceOnce(
  '  const applyTemplate = async (templateId: string) => {\n    await updateResume(resume.id, { templateId });\n  };\n',
  '  const applyTemplate = async (templateId: string) => {\n    setDesignPreview(null);\n    await updateResume(resume.id, { templateId });\n  };\n',
  "clear preview on template",
);

replaceOnce(
  '  const currentTemplate = getTemplate(resume.templateId);\n',
  `  const applyAutoDesign = async (proposal: ResumeDesignProposal) => {\n    setAutoDesignUndo({\n      templateId: resume.templateId,\n      design: resume.data.design,\n      sectionOrder: [...resume.data.sectionOrder],\n    });\n    const nextDesign = normalizeResumeDesign(proposal.design);\n    setLayout(nextDesign);\n    setDesignPreview(null);\n    await updateResume(resume.id, {\n      templateId: proposal.templateId,\n      data: {\n        ...resume.data,\n        sectionOrder: proposal.sectionOrder,\n        design: { ...resume.data.design, ...proposal.design },\n      },\n    });\n    toast.success(ar ? "تم اعتماد التصميم الذكي" : "Smart design applied");\n  };\n\n  const undoAutoDesign = async () => {\n    if (!autoDesignUndo) return;\n    setDesignPreview(null);\n    setLayout(normalizeResumeDesign(autoDesignUndo.design));\n    await updateResume(resume.id, {\n      templateId: autoDesignUndo.templateId,\n      data: {\n        ...resume.data,\n        sectionOrder: autoDesignUndo.sectionOrder,\n        design: autoDesignUndo.design,\n      },\n    });\n    setAutoDesignUndo(null);\n    toast.success(ar ? "تم التراجع عن آخر تصميم ذكي" : "Last smart design reverted");\n  };\n\n  const currentTemplate = getTemplate(designPreview?.templateId ?? resume.templateId);\n`,
  "apply and undo handlers",
);

replaceOnce(
  '        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">\n          <section className="seerati-panel p-4">\n',
  `        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">\n          <ResumeAutoDesignPanel\n            resume={resume}\n            measuredPages={pageCount}\n            lang={lang}\n            previewing={designPreview !== null}\n            canUndo={autoDesignUndo !== null}\n            onPreview={setDesignPreview}\n            onCancelPreview={() => setDesignPreview(null)}\n            onApply={(proposal) => void applyAutoDesign(proposal)}\n            onUndo={() => void undoAutoDesign()}\n          />\n\n          <section className="seerati-panel p-4">\n`,
  "auto design panel placement",
);

writeFileSync(path, source);
console.log("Stage 5H Studio patch applied.");
