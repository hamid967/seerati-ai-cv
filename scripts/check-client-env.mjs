#!/usr/bin/env node
/**
 * QA / pre-publish guard: the built client bundle MUST contain the public
 * backend connection values (VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY).
 * If they are missing, hydration throws "Missing Supabase environment
 * variable(s)" and every page falls back to the error screen — while SSR,
 * TypeScript and the build itself all stay green.
 *
 * Runs automatically as `postbuild` (strict) and inside `bun run qa`
 * (skips when no build output exists yet).
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const CANDIDATE_DIRS = process.env.QA_CLIENT_DIST
  ? [process.env.QA_CLIENT_DIST]
  : [".output/public", "dist/client", "dist"];

const ALLOW_MISSING = process.env.QA_ALLOW_MISSING_DIST === "1";

const NEEDLES = [
  { label: "VITE_SUPABASE_URL", needle: "ywqufkamftsacnzxvjsr.supabase.co" },
  { label: "VITE_SUPABASE_PUBLISHABLE_KEY", needle: "sb_publishable_" },
];

const dist = CANDIDATE_DIRS.find((dir) => existsSync(dir));

if (!dist) {
  const message = `No client build output found (checked: ${CANDIDATE_DIRS.join(", ")}).`;
  if (ALLOW_MISSING) {
    console.log(`SKIP  ${message} Run the production build first.`);
    process.exit(0);
  }
  console.error(`FAIL  ${message}`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(?:js|mjs|cjs|html)$/.test(full)) out.push(full);
  }
  return out;
}

const files = walk(dist);
const bundled = files.map((file) => readFileSync(file, "utf8")).join("\n");

let failed = 0;
for (const { label, needle } of NEEDLES) {
  const ok = bundled.includes(needle);
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} present in ${dist}`);
}

const unresolved =
  bundled.includes('import.meta.env["VITE_SUPABASE_') ||
  bundled.includes("import.meta.env['VITE_SUPABASE_");
if (unresolved) {
  failed += 1;
  console.log("FAIL  unresolved import.meta.env bracket read for a Supabase variable");
} else {
  console.log("PASS  no unresolved Supabase env reads in the client bundle");
}

if (failed) {
  console.error(
    `\nBlocked: client bundle in ${dist} is missing backend connection value(s). ` +
      `Publishing this build would crash every page on hydration.`,
  );
  process.exit(1);
}

console.log(
  `\nClient bundle carries the backend connection values (${files.length} files scanned in ${dist}).`,
);
