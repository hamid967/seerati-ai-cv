import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { analyzeCareerGraph } from "@/modules/ats";

const data = emptyResumeData();
data.personal.email = "synthetic@example.test";
data.summary = "خبرة في إدارة المنتجات التقنية.";
data.achievements = [{ id: "achievement-1", title: "خفض زمن الإطلاق", detail: "تحسينات مثبتة" }];
const { graph } = fromResumeData(data, { graphId: "ats-fixture", language: "ar" });
const report = analyzeCareerGraph(graph, "نبحث عن مدير منتجات تقنية");
assert.equal(report.version, "0.1.0");
assert.ok(report.evidence.length > 0);
assert.ok(report.passedRules.includes("contact.email.present"));
assert.equal(report.disclaimer.includes("ضماناً"), true);
assert.equal(
  report.failedRules.some((rule) => rule.ruleId === "contact.email.present"),
  false,
);
console.log("Phase 18 ATS smoke OK.");
