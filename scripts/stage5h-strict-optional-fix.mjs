import { readFileSync, writeFileSync } from "node:fs";

const path = "src/routes/resumes.$id.studio.tsx";
let source = readFileSync(path, "utf8");

const before = `    await updateResume(resume.id, {\n      templateId: autoDesignUndo.templateId,\n      data: {\n        ...resume.data,\n        sectionOrder: autoDesignUndo.sectionOrder,\n        design: autoDesignUndo.design,\n      },\n    });`;
const after = `    const { design: _currentDesign, ...dataWithoutDesign } = resume.data;\n    const restoredData =\n      autoDesignUndo.design === undefined\n        ? { ...dataWithoutDesign, sectionOrder: autoDesignUndo.sectionOrder }\n        : {\n            ...resume.data,\n            sectionOrder: autoDesignUndo.sectionOrder,\n            design: autoDesignUndo.design,\n          };\n    await updateResume(resume.id, {\n      templateId: autoDesignUndo.templateId,\n      data: restoredData,\n    });`;

if (!source.includes(before)) throw new Error("Stage 5H strict optional undo target missing");
source = source.replace(before, after);
writeFileSync(path, source);
console.log("Stage 5H strict optional Studio fix applied.");
