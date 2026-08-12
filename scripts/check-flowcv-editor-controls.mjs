import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const templates = read("src/lib/templates.ts");
const editor = read("src/routes/resumes.$id.edit.tsx");
const controls = read("src/components/resume-editor-layout-controls.tsx");
const preview = read("src/components/resume-preview.tsx");
const professional = read("src/components/professional-resume-preview.tsx");
const types = read("src/lib/types.ts");

const failures = [];
function check(condition, label) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
  if (!condition) failures.push(label);
}

const templateCount = (templates.match(/\n\s*id: "[^"]+",/g) ?? []).length;
check(templateCount >= 15, `template library has at least 15 templates (found ${templateCount})`);
check(types.includes('layout?: TemplateDesign["layout"]'), "user design supports a non-destructive layout override");
check(preview.includes("layout: user.layout || tpl.design.layout"), "base renderer respects the layout override");
check(
  professional.includes("resume.data.design?.layout ?? template.design.layout"),
  "professional renderer measures the effective layout",
);
check(controls.includes("Page layout") && controls.includes("تخطيط الصفحة"), "bilingual page-layout control exists");
check(controls.includes("Font scale") && controls.includes("حجم الخط"), "font-scale control exists");
check(controls.includes("Page margin") && controls.includes("الهامش"), "page-margin control exists");
check(controls.includes("Line height") && controls.includes("تباعد الأسطر"), "line-height control exists");
check(controls.includes("Sidebar width") && controls.includes("عرض العمود الجانبي"), "sidebar-width control exists");
check(controls.includes("Section visibility") && controls.includes("إظهار وإخفاء الأقسام"), "section visibility control exists");
check(controls.includes("does not delete its content") && controls.includes("لا يحذف محتواه"), "hide/show is disclosed as non-destructive");
check(controls.includes("strict ATS submissions") && controls.includes("ATS صارم"), "two-column ATS caveat exists");
check(editor.includes("ResumeEditorLayoutControls"), "editor mounts precision layout controls");
check(editor.includes("ResumeSectionVisibilityControls"), "editor mounts section visibility controls");
check(editor.includes("data.hiddenSections = hiddenSections"), "section visibility is persisted in ResumeData");
check(editor.includes("ProfessionalResumePreview resume={draft}"), "editor preview uses the professional layout engine");
check(!controls.includes("updateResume("), "controls cannot bypass editor autosave/history pipeline");

if (failures.length) {
  console.error(`\nStage 11 FlowCV editor guard failed (${failures.length} check(s)).`);
  process.exit(1);
}

console.log("\nStage 11 FlowCV-class editor controls guard passed.");
