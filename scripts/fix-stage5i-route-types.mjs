import fs from "node:fs";

const path = "src/routes/resumes.$id.recruiter-scan.tsx";
let source = fs.readFileSync(path, "utf8");
const before = `        ? buildRecruiterTenSecondScan(resume, {\n            graph,\n            jobDescription: resume.data.jobDescription,\n            template: getTemplate(resume.templateId),\n          })`;
const after = `        ? buildRecruiterTenSecondScan(resume, {\n            graph,\n            ...(resume.data.jobDescription ? { jobDescription: resume.data.jobDescription } : {}),\n            template: getTemplate(resume.templateId),\n          })`;
if (!source.includes(before)) throw new Error("Stage 5I optional jobDescription marker not found");
source = source.replace(before, after);
fs.writeFileSync(path, source);
