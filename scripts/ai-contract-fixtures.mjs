#!/usr/bin/env node
/**
 * QA: the Copilot action contract must reject untrusted model output.
 *
 * Runs the real validator from src/lib/copilot/actions.ts against fixtures that
 * a misbehaving model could produce. Anything that is not a fully-formed,
 * confirmation-respecting action must be rejected before it can reach a write.
 */
import { pathToFileURL } from "node:url";

const mod = await import(pathToFileURL("src/lib/copilot/actions.ts").href).catch((err) => {
  console.error(
    "Could not load the action module. Run with a TypeScript-capable Node (>=22):\n" +
      "  node --experimental-strip-types scripts/ai-contract-fixtures.mjs\n",
    err.message,
  );
  process.exit(1);
});

const { parseCopilotAction } = mod;

const valid = {
  type: "update_summary",
  reason: "Sharpen the opening line around the target role.",
  evidenceUsed: ["fact_1"],
  payload: { original: "Sales person.", suggested: "Sales lead for the central region." },
};

const cases = [
  { name: "valid update_summary is accepted", input: valid, expect: "accept" },
  { name: "invalid JSON string is rejected", input: "{not json", expect: "reject" },
  {
    name: "unknown action type is rejected",
    input: { ...valid, type: "drop_table" },
    expect: "reject",
  },
  {
    name: "mutation with requiresConfirmation:false is rejected",
    input: { ...valid, requiresConfirmation: false },
    expect: "reject",
  },
  {
    name: "missing payload is rejected",
    input: { type: "add_skill", reason: "why" },
    expect: "reject",
  },
  {
    name: "missing reason is rejected",
    input: { type: "add_skill", payload: { name: "Power BI" } },
    expect: "reject",
  },
  {
    name: "wrong payload shape is rejected",
    input: { type: "replace_bullet", reason: "why", payload: { experienceId: "e1" } },
    expect: "reject",
  },
  {
    name: "empty suggested text is rejected",
    input: { ...valid, payload: { original: "x", suggested: "  " } },
    expect: "reject",
  },
  { name: "null is rejected", input: null, expect: "reject" },
  { name: "array is rejected", input: [valid], expect: "reject" },
];

let failed = 0;
for (const c of cases) {
  const res = parseCopilotAction(c.input);
  const got = res.ok ? "accept" : "reject";
  const ok = got === c.expect;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}${res.ok ? "" : `  (${res.error})`}`);
}

console.log(
  failed
    ? `\n${failed} contract fixture(s) failed.`
    : `\nAll ${cases.length} contract fixtures OK.`,
);
process.exit(failed ? 1 : 0);
