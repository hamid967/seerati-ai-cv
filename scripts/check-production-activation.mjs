#!/usr/bin/env node

import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260811065800_stage9_revoke_anon_privacy_metrics.sql",
  "utf8",
);
const stage6f = fs.readFileSync(
  "supabase/migrations/20260811034000_stage6f_private_career_content.sql",
  "utf8",
);

const failures = [];
const check = (condition, label) => {
  if (condition) console.log(`PASS  ${label}`);
  else {
    failures.push(label);
    console.error(`FAIL  ${label}`);
  }
};

check(
  migration.includes("revoke execute on function public.admin_career_privacy_metrics() from public") &&
    migration.includes("revoke execute on function public.admin_career_privacy_metrics() from anon") &&
    migration.includes("grant execute on function public.admin_career_privacy_metrics() to authenticated"),
  "anonymous execution of privacy metrics is explicitly revoked",
);

for (const marker of [
  'create policy "owner reads career facts"',
  'create policy "owner reads career evidence"',
  'create policy "owner reads agent activity"',
  'create policy "owner reads resume versions"',
]) {
  check(stage6f.includes(marker), `owner-only raw career policy retained: ${marker}`);
}

if (failures.length) {
  console.error(`\nStage 9 production activation guard failed (${failures.length} check(s)).`);
  process.exit(1);
}

console.log("\nStage 9 production activation static guard passed.");
console.log("NOTE: this guard does not prove that the production migration was applied.");
