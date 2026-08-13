import assert from "node:assert/strict";
import { graphFromCareerTwin, resumeDataFromCareerTwin } from "@/modules/career";
import type { CareerTwin } from "@/lib/career";

const twin: CareerTwin = {
  id: "twin-fixture",
  userId: "user-fixture",
  identity: {
    fullName: "اختبار",
    headline: "مهندس",
    email: "synthetic@example.test",
    phone: "",
    city: "الرياض",
    summary: "ملخص اصطناعي",
  },
  targets: [{ id: "target-1", title: "مهندس برمجيات" }],
  workHistory: [{ id: "work-1", role: "مهندس", company: "شركة اختبار", bullets: ["أنجزت خدمة"] }],
  achievements: [{ id: "achievement-1", text: "خفضت زمن المعالجة", metric: "20%", verified: true }],
  education: [],
  certifications: [],
  skills: [{ id: "skill-1", name: "TypeScript", verified: true }],
  languages: [],
  projects: [],
  links: [],
  preferences: {},
  storyBank: [],
  verifiedFacts: { "achievement-1": true },
  importHistory: [],
  completionScore: 80,
  updatedAt: new Date().toISOString(),
};
const data = resumeDataFromCareerTwin(twin);
assert.equal(data.personal.fullName, "اختبار");
assert.equal(data.targetJob, "مهندس برمجيات");
assert.equal(data.experience[0]?.company, "شركة اختبار");
assert.equal(data.achievements[0]?.detail, "20%");
const graph = graphFromCareerTwin(twin, "ar");
assert.equal(graph.id, "career-twin-twin-fixture");
assert.ok(graph.facts.some((fact) => fact.value.includes("شركة اختبار")));
console.log("Phase 18 twin adapter smoke OK.");
