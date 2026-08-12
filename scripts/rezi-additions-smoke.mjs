#!/usr/bin/env node
/**
 * Smoke tests for Rezi-like keyword scanner + bullet writer helpers.
 */
import { readFileSync } from "node:fs";

const scannerSrc = readFileSync("src/lib/keyword-scanner.ts", "utf8");
const bulletSrc = readFileSync("src/lib/bullet-writer.ts", "utf8");
const templatesSrc = readFileSync("src/lib/templates.ts", "utf8");

let failed = 0;
const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => {
  failed++;
  console.log(`FAIL  ${msg}`);
};

if (scannerSrc.includes("export function scanKeywords")) pass("scanKeywords exported");
else fail("scanKeywords missing");

if (scannerSrc.includes("open-tailoring") && scannerSrc.includes("add-skills"))
  pass("scanner actions include tailoring + skills");
else fail("scanner actions incomplete");

if (bulletSrc.includes("export function suggestStrongerBullet")) pass("bullet writer exported");
else fail("bullet writer missing");

if (bulletSrc.includes("never invent") || bulletSrc.includes("Never invent"))
  pass("bullet writer refuses invented metrics in copy");
else fail("bullet writer missing anti-invention copy");

const newIds = ["healthcare", "education", "hospitality", "operations"];
for (const id of newIds) {
  if (templatesSrc.includes(`id: "${id}"`)) pass(`template ${id} registered`);
  else fail(`template ${id} missing`);
}

const coverRoute = readFileSync("src/routes/cover-letters.tsx", "utf8");
const keywordRoute = readFileSync("src/routes/keyword-scanner.tsx", "utf8");
if (coverRoute.includes('createFileRoute("/cover-letters")')) pass("cover-letters route present");
else fail("cover-letters route missing");
if (keywordRoute.includes('createFileRoute("/keyword-scanner")'))
  pass("keyword-scanner route present");
else fail("keyword-scanner route missing");

console.log(failed ? `\n${failed} check(s) failed.` : "\nRezi-like additions smoke OK.");
process.exit(failed ? 1 : 0);
