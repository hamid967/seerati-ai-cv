#!/usr/bin/env node
/**
 * QA / pre-publish guard for browser Supabase configuration.
 *
 * A production build is valid when either:
 * 1) both public Supabase values are injected into the client bundle at build time, or
 * 2) the root route bootstraps those browser-safe values from the server runtime before
 *    StoreProvider touches the lazy Supabase client during hydration.
 *
 * Secret/service-role credentials must never be exposed by the runtime bootstrap.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const CANDIDATE_DIRS = process.env.QA_CLIENT_DIST
  ? [process.env.QA_CLIENT_DIST]
  : [".output/public", "dist/client", "dist"];

const ALLOW_MISSING = process.env.QA_ALLOW_MISSING_DIST === "1";
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
const expectedUrl = process.env.VITE_SUPABASE_URL ?? "";
const expectedKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const bundleHasUrl = Boolean(expectedUrl && bundled.includes(expectedUrl));
const bundleHasKey = Boolean(expectedKey && bundled.includes(expectedKey));
const buildTimeConfigured = bundleHasUrl && bundleHasKey;

console.log(`${bundleHasUrl ? "PASS" : "INFO"}  VITE_SUPABASE_URL present in ${dist}`);
console.log(`${bundleHasKey ? "PASS" : "INFO"}  VITE_SUPABASE_PUBLISHABLE_KEY present in ${dist}`);

const unresolved =
  bundled.includes('import.meta.env["VITE_SUPABASE_') ||
  bundled.includes("import.meta.env['VITE_SUPABASE_");
if (unresolved) {
  console.error("FAIL  unresolved import.meta.env bracket read for a Supabase variable");
  process.exit(1);
}
console.log("PASS  no unresolved Supabase env bracket reads in the client bundle");

const runtimeFnPath = "src/lib/public-runtime-config.functions.ts";
const clientPath = "src/integrations/supabase/client.ts";
const rootPath = "src/routes/__root.tsx";

let runtimeConfigured = false;
if (existsSync(runtimeFnPath) && existsSync(clientPath) && existsSync(rootPath)) {
  const runtimeFn = readFileSync(runtimeFnPath, "utf8");
  const client = readFileSync(clientPath, "utf8");
  const root = readFileSync(rootPath, "utf8");

  const runtimeReadsPublicOnly =
    runtimeFn.includes('process.env["SUPABASE_URL"]') &&
    runtimeFn.includes('process.env["SUPABASE_PUBLISHABLE_KEY"]') &&
    !/SERVICE_ROLE|SECRET_KEY|sb_secret_/i.test(runtimeFn);
  const clientConsumesRuntime =
    client.includes("setSupabaseRuntimeConfig") &&
    client.includes("runtimeConfig?.supabaseUrl") &&
    client.includes("runtimeConfig?.supabasePublishableKey");
  const rootBootstrapsBeforeStore =
    root.includes("loader: () => getPublicRuntimeConfig()") &&
    root.includes("setSupabaseRuntimeConfig(runtimeConfig)") &&
    root.indexOf("setSupabaseRuntimeConfig(runtimeConfig)") < root.indexOf("<StoreProvider>");

  runtimeConfigured = runtimeReadsPublicOnly && clientConsumesRuntime && rootBootstrapsBeforeStore;
}

console.log(
  `${runtimeConfigured ? "PASS" : "INFO"}  browser-safe server runtime Supabase bootstrap is ${runtimeConfigured ? "configured" : "not configured"}`,
);

if (!buildTimeConfigured && !runtimeConfigured) {
  console.error(
    `\nBlocked: ${dist} has no complete build-time Supabase configuration and no verified runtime bootstrap. ` +
      "Publishing this build could crash pages during hydration.",
  );
  process.exit(1);
}

console.log(
  `\nSupabase browser configuration guard passed via ${buildTimeConfigured ? "build-time injection" : "server runtime bootstrap"} (${files.length} files scanned in ${dist}).`,
);
