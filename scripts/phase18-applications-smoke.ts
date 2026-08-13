import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { createCareerApplicationWorkspace } from "@/modules/applications";
import { buildEvidenceCoverLetter } from "@/modules/cover-letter";
import { prepareInterview, buildStarPrompt } from "@/modules/interview";
import { generatePortfolio } from "@/modules/portfolio";

const data = emptyResumeData();
data.personal.fullName = "اسم اصطناعي <test>";
data.personal.email = "synthetic@example.test";
data.summary = "ملخص مهني اصطناعي.";
data.experience = [
  { id: "exp-1", role: "مهندس", company: "شركة", bullets: ["أنجزت نتيجة قابلة للمراجعة"] },
];
const { graph } = fromResumeData(data, { graphId: "applications-fixture", language: "ar" });
const workspace = createCareerApplicationWorkspace();
workspace.addJob({
  id: "job-1",
  title: "مهندس",
  company: "شركة اختبار",
  description: "وصف اصطناعي",
  language: "ar",
});
const application = workspace.createApplication({
  id: "application-1",
  jobTargetId: "job-1",
  stage: "saved",
});
assert.equal(workspace.moveApplication(application.id, "applied")?.stage, "applied");
workspace.addTask({
  id: "task-1",
  applicationId: application.id,
  title: "مراجعة",
  completed: false,
});
workspace.addNote({
  id: "note-1",
  applicationId: application.id,
  text: "ملاحظة اصطناعية",
  createdAt: new Date().toISOString(),
});
assert.match(workspace.exportJson(), /application-1/);
assert.equal(workspace.deleteApplication(application.id), true);
const letter = buildEvidenceCoverLetter({ graph, role: "مهندس", company: "شركة اختبار" });
assert.ok(letter.paragraphs.some((paragraph) => paragraph.evidenceFactIds.length > 0));
assert.equal(
  letter.paragraphs.every((paragraph) => paragraph.requiresApproval),
  true,
);
const interview = prepareInterview(graph, "قيادة حل المشكلات");
assert.ok(interview.questions.length > 0);
assert.deepEqual(buildStarPrompt(graph, interview.questions[0]).missing, ["task"]);
const portfolio = generatePortfolio(graph, { title: "ملفي" });
assert.equal(portfolio.privacy.publicPublishing, false);
assert.equal(portfolio.privacy.indexing, false);
assert.equal(portfolio.staticHtml.includes("&lt;test&gt;"), true);
console.log("Phase 18 applications smoke OK.");
