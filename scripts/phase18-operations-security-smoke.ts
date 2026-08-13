import assert from "node:assert/strict";
import { emptyResumeData } from "@/lib/types";
import { fromResumeData } from "@/modules/career";
import { generatePortfolio } from "@/modules/portfolio";
import { redactEvent } from "@/modules/observability";
import { createMetadataRegistry } from "@/modules/admin";

const data = emptyResumeData();
data.personal.fullName = "<script>alert(1)</script>";
data.personal.email = "synthetic@example.test";
const { graph } = fromResumeData(data, { graphId: "ops-fixture", language: "en" });
const portfolio = generatePortfolio(graph);
assert.equal(portfolio.staticHtml.includes("<script>"), false);
const event = redactEvent({
  route: "/assistant",
  durationMs: 120,
  success: true,
  releaseVersion: "phase18-test",
  name: "Do not log",
  email: "synthetic@example.test",
  resumeText: "secret",
  correlationId: "evt-safe123",
});
assert.equal("email" in event, false);
assert.equal("resumeText" in event, false);
assert.equal(event.route, "/assistant");
const registry = createMetadataRegistry();
registry.setFlag({
  id: "ai-write-summary",
  enabled: false,
  updatedAt: new Date().toISOString(),
  auditId: "audit-1",
});
registry.setProviderHealth({
  providerId: "mock-ai",
  status: "healthy",
  checkedAt: new Date().toISOString(),
  latencyMs: 1,
});
assert.equal(JSON.stringify(registry.snapshot()).includes("resume"), false);
console.log("Phase 18 operations/security smoke OK.");
