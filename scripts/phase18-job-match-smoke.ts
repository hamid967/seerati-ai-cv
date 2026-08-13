import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { matchCareerToJob } from "@/modules/matching";

const data = emptyResumeData();
data.skills = [{ id: "skill-1", name: "Software engineering" }];
data.experience = [
  {
    id: "exp-1",
    role: "Software engineer",
    company: "Synthetic Co",
    bullets: ["Built tested services"],
  },
];
const { graph } = fromResumeData(data, { graphId: "match-fixture", language: "en" });
const report = matchCareerToJob(graph, "Software engineer product manager security", {
  requiredTerms: ["software", "security"],
  preferredTerms: ["quantum"],
});
assert.equal(report.version, "0.1.0");
assert.ok(report.strongMatches.some((item) => item.term === "software"));
assert.ok(report.unverifiedMatches.some((item) => item.term === "security"));
assert.ok(report.missingEvidence.some((item) => item.term === "quantum"));
assert.ok(report.suggestedQuestions.length > 0);
assert.equal(report.disclaimer.includes("تضمن"), true);
console.log("Phase 18 job match smoke OK.");
