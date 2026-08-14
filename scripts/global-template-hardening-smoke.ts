import { logServerFailure } from "../src/lib/safe-server-log";
import { getPrimaryTemplateSignals, getTemplateSignals } from "../src/lib/template-signals";
import { defaultTemplates } from "../src/lib/templates";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const classic = defaultTemplates.find((template) => template.id === "classic-ats");
const creative = defaultTemplates.find((template) => template.id === "creative");
assert(classic, "classic template fixture must exist");
assert(creative, "creative template fixture must exist");

const classicSignals = getTemplateSignals(classic);
assert(
  classicSignals.some((signal) => signal.id === "ats"),
  "ATS-friendly template must expose a structured-reading signal",
);
assert(
  classicSignals.some((signal) => signal.id === "global"),
  "RTL-supporting template must expose a direction-ready signal",
);
assert(
  classicSignals.some((signal) => signal.id === "document"),
  "single-column template must expose a focused-document signal",
);

const creativeSignals = getTemplateSignals(creative);
assert(
  creativeSignals.some((signal) => signal.id === "visual"),
  "sidebar template must expose a visual-hierarchy signal",
);
assert(
  creativeSignals.some((signal) => signal.id === "photo"),
  "photo-capable template must expose an optional-photo signal",
);
assert(
  getPrimaryTemplateSignals(creative, 3).length === 3,
  "primary template signals must honour the requested display limit",
);

const originalError = console.error;
const logs: string[] = [];
console.error = (...values: unknown[]) => logs.push(values.map(String).join(" "));
try {
  logServerFailure("ai.usage_counter", new Error("resume text: private@example.com"));
} finally {
  console.error = originalError;
}

assert(logs.length === 1, "safe server logger must emit one operational record");
assert(logs[0]?.includes('"event":"server_failure"'), "safe logger must emit a stable event");
assert(logs[0]?.includes("ai.usage_counter"), "safe logger must retain the safe scope");
assert(
  !/private@example\.com|resume text/i.test(logs[0] ?? ""),
  "safe logger must never include the original error message or private content",
);

console.log(
  "Global template hardening smoke passed: explainable local signals and safe error logging.",
);
