import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CLIENT = path.join(ROOT, "src/integrations/supabase/client.ts");
const VITE = path.join(ROOT, "vite.config.ts");
const DIST = path.join(ROOT, "dist");

const SENTINEL_URL = "https://ci-supabase.invalid";
const SENTINEL_KEY = "sb_publishable_ci_bundle_guard";
const failures = [];

const read = (file) => fs.readFileSync(file, "utf8");
const client = read(CLIENT);
const vite = read(VITE);

function check(condition, message) {
  if (condition) {
    console.log(`PASS  ${message}`);
  } else {
    failures.push(message);
    console.error(`FAIL  ${message}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

check(
  client.includes("import.meta.env.VITE_SUPABASE_URL"),
  "Supabase URL uses Vite dot-access so production replacement can run",
);
check(
  client.includes("import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"),
  "Supabase publishable key uses Vite dot-access so production replacement can run",
);
check(
  !client.includes('import.meta.env["VITE_SUPABASE_') &&
    !client.includes("import.meta.env['VITE_SUPABASE_"),
  "no bracket-access Supabase Vite env remains",
);
check(
  !vite.includes("inlineViteEnvBracketAccess") && !vite.includes("inline-vite-env-bracket-access"),
  "obsolete bracket-access rewrite plugin is removed",
);

const bundleFiles = walk(DIST).filter((file) => /\.(?:js|mjs|cjs|html)$/.test(file));
const bundled = bundleFiles.map(read).join("\n");

check(bundleFiles.length > 0, "production build output exists");
check(
  bundled.includes(SENTINEL_URL),
  "production bundle contains injected VITE_SUPABASE_URL sentinel",
);
check(
  bundled.includes(SENTINEL_KEY),
  "production bundle contains injected VITE_SUPABASE_PUBLISHABLE_KEY sentinel",
);
check(
  !bundled.includes('import.meta.env["VITE_SUPABASE_') &&
    !bundled.includes("import.meta.env['VITE_SUPABASE_"),
  "production bundle contains no unresolved bracket-access Supabase env reads",
);

if (failures.length) {
  console.error(`\nProduction env bundle guard failed (${failures.length} check(s)).`);
  process.exit(1);
}

console.log("\nProduction env bundle guard passed.");
