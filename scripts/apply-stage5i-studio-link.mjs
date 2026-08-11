import fs from "node:fs";

const path = "src/routes/resumes.$id.studio.tsx";
let source = fs.readFileSync(path, "utf8");
const marker = `          <div className="me-3">\n            <p className="font-extrabold">Professional Layout Engine</p>\n            <p className="text-xs text-muted-foreground">{resume.title}</p>\n          </div>\n\n          <Select`;
const replacement = `          <div className="me-3">\n            <p className="font-extrabold">Professional Layout Engine</p>\n            <p className="text-xs text-muted-foreground">{resume.title}</p>\n          </div>\n\n          <Button variant="outline" size="sm" asChild>\n            <Link to="/resumes/$id/recruiter-scan" params={{ id: resume.id }}>\n              {ar ? "فحص 10 ثوانٍ" : "10-second scan"}\n            </Link>\n          </Button>\n\n          <Select`;
if (!source.includes(marker)) throw new Error("Stage 5I Studio link insertion marker not found");
source = source.replace(marker, replacement);
fs.writeFileSync(path, source);
