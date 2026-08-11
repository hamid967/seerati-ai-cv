#!/usr/bin/env node
/**
 * QA: the built client bundle MUST contain the public backend connection values.
 * If they are missing, hydration throws "Missing Supabase environment variable(s)"
 * and every page falls back to the error screen — while SSR, TypeScript and the
 * build itself all stay green. Run after `bun run build`.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = process.env.QA_CLIENT_DIST ?? "dist/client";
const NEEDLES = ["ywqufkamftsacnzxvjsr.supabase.co", "sb_publishable_"];

if (!existsSync(DIST)) {
  console.log(`SKIP  ${DIST} not found — run the production build first.`);
  process.exit(0);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = walk(DIST);
const missing = NEEDLES.filter(
  (needle) => !files.some((file) => readFileSync(file, "utf8").includes(needle)),
);

for (const needle of NEEDLES) {
  console.log(`${missing.includes(needle) ? "FAIL" : "PASS"}  ${needle}`);
}

if (missing.length) {
  console.log(
    `\nClient bundle is missing ${missing.length} backend connection value(s). ` +
      `The published site will crash on hydration.`,
  );
  process.exit(1);
}

console.log(`\nClient bundle carries the backend connection values (${files.length} JS files scanned).`);
