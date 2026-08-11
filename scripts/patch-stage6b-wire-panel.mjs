import fs from "node:fs";

const path = "src/routes/jobs.$id.tsx";
let source = fs.readFileSync(path, "utf8");

if (!source.includes('import { ApplicationReadinessPanel } from "@/components/application-readiness-panel";')) {
  throw new Error("ApplicationReadinessPanel import missing");
}

if (!source.includes("<ApplicationReadinessPanel")) {
  const marker = `            <Card>\n              <CardHeader>\n                <CardTitle className="text-base">{ar ? "حزمة طلبك" : "Application pack"}</CardTitle>`;
  if (!source.includes(marker)) throw new Error("Application pack marker missing");
  const panel = `            <ApplicationReadinessPanel\n              jobTitle={form.jobTitle}\n              jobDescription={form.jobDescription}\n              resumes={resumes}\n              graph={graph}\n              lang={lang}\n            />\n\n`;
  source = source.replace(marker, `${panel}${marker}`);
}

fs.writeFileSync(path, source);
