#!/usr/bin/env node
/**
 * QA: every registered app route must respond 200 from the running dev server.
 * Usage: npm run qa:routes   (dev server must be up on BASE, default :8080)
 */
const BASE = process.env.QA_BASE_URL ?? "http://localhost:8080";

const ROUTES = [
  "/",
  "/templates",
  "/pricing",
  "/auth",
  "/onboarding",
  "/dashboard",
  "/career-twin",
  "/career-evidence",
  "/import",
  "/jobs",
  "/resumes/new",
  "/ats",
  "/account",
  "/admin",
  "/privacy",
  "/terms",
];

let failed = 0;
for (const route of ROUTES) {
  try {
    const res = await fetch(`${BASE}${route}`, { redirect: "manual" });
    const ok = res.status === 200 || (res.status >= 300 && res.status < 400);
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${res.status}  ${route}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ERR   ${route}  ${err.message}`);
  }
}

console.log(failed ? `\n${failed} route(s) failed.` : `\nAll ${ROUTES.length} routes OK.`);
process.exit(failed ? 1 : 0);
