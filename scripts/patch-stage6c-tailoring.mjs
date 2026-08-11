import fs from "node:fs";

const path = "src/routes/jobs.$id.tsx";
let source = fs.readFileSync(path, "utf8");

const importMarker = 'import { ApplicationReadinessPanel } from "@/components/application-readiness-panel";';
if (!source.includes('import { TailoringStudioPanel } from "@/components/tailoring-studio-panel";')) {
  source = source.replace(
    importMarker,
    `${importMarker}\nimport { TailoringStudioPanel } from "@/components/tailoring-studio-panel";`,
  );
}

if (!source.includes("<TailoringStudioPanel")) {
  const marker = `            <ApplicationReadinessPanel\n              jobTitle={form.jobTitle}\n              jobDescription={form.jobDescription}\n              resumes={resumes}\n              graph={graph}\n              lang={lang}\n            />\n\n`;
  if (!source.includes(marker)) throw new Error("ApplicationReadinessPanel marker missing");
  const panel = `${marker}            <TailoringStudioPanel\n              userId={user.id}\n              jobId={job.id}\n              jobTitle={form.jobTitle}\n              company={form.company}\n              jobDescription={form.jobDescription}\n              resumes={resumes}\n              graph={graph}\n              lang={lang}\n              onUpdateResume={updateResume}\n              onChanged={() => setReload((n) => n + 1)}\n            />\n\n`;
  source = source.replace(marker, panel);
}

fs.writeFileSync(path, source);
