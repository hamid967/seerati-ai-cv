import assert from "node:assert/strict";
import { buildAssistantData, emptyAssistantAnswers } from "@/lib/assistant-create";
import { NOURA_GOALS, NOURA_PROFILE, NouraAgentProfileSchema } from "@/modules/noura";

const profile = NouraAgentProfileSchema.parse(NOURA_PROFILE);
assert.equal(profile.id, "noura");
assert.equal(profile.version, "0.1.0");
assert.equal(profile.supportedGoals.length, 7);
assert.ok(profile.prohibited.includes("automatic_apply"));
assert.ok(profile.prohibited.includes("unconsented_ai_transmission"));
assert.equal(NOURA_GOALS.length, 7);
assert.equal(new Set(NOURA_GOALS.map((goal) => goal.id)).size, 7);

const answers = emptyAssistantAnswers();
answers.fullName = "Synthetic Candidate";
answers.jobTitle = "Data Analyst";
answers.city = "Riyadh";
const data = buildAssistantData(answers, "en", "Evidence-backed summary", [], []);
assert.equal(data.personal.country, "");
assert.equal(data.personal.city, "Riyadh");

console.log("Noura foundation smoke OK.");
