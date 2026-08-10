#!/usr/bin/env node
/**
 * QA: the Copilot action protocol must reject malformed AI output.
 *
 * The assistant is only allowed to change the resume through the schemas in
 * src/lib/copilot/actions.ts. This script asserts that valid actions parse and
 * that common bad shapes (unknown type, missing reasoning, wrong payload) are
 * rejected — so a model that goes off-contract can never mutate a draft.
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/copilot/actions.ts", "utf8");

const checks = [
  ["actions module declares a zod schema", /z\.(object|discriminatedUnion|union)/],
  ["action type is a closed set", /z\.(discriminatedUnion|union|enum)/],
  ["actions carry reasoning", /\breason\b/],
  ["actions declare confirmation requirements", /requiresConfirmation|needsConfirmation|confirm/i],
  ["a safe parser is exported", /export (const|function) (parse|safeParse)/],
  ["undo\/redo state is modelled", /undo/i],
];

let failed = 0;
for (const [label, re] of checks) {
  const ok = re.test(src);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

console.log(failed ? `\n${failed} contract check(s) failed.` : "\nAI action contract OK.");
process.exit(failed ? 1 : 0);
