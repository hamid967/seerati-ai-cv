#!/usr/bin/env node
/**
 * QA: authenticated in-app routes must live inside the AppShell.
 *
 * The AppShell is applied by src/routes/__root.tsx for the prefixes listed in
 * APP_PREFIXES. A route that renders the marketing <SiteHeader />/<SiteFooter />
 * would produce a second, website-style chrome inside the app, so it fails here.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";

const APP_ROUTES = [
  "/dashboard",
  "/account",
  "/career-twin",
  "/career-evidence",
  "/jobs",
  "/resumes",
  "/import",
  "/admin",
  "/privacy-center",
  "/cover-letters",
  "/keyword-scanner",
];

const root = readFileSync("src/routes/__root.tsx", "utf8");
const prefixes = (root.match(/APP_PREFIXES\s*=\s*\[([^\]]*)\]/s)?.[1] ?? "")
  .split(",")
  .map((s) => s.trim().replace(/^["'`]|["'`]$/g, ""))
  .filter(Boolean);

const routeFiles = readdirSync("src/routes").filter((f) => /\.tsx$/.test(f));

let failed = 0;
const fail = (msg) => {
  failed++;
  console.log(`FAIL  ${msg}`);
};

for (const route of APP_ROUTES) {
  if (!prefixes.includes(route)) {
    fail(`${route} is not registered in APP_PREFIXES (no AppShell)`);
    continue;
  }
  console.log(`PASS  ${route} wrapped by AppShell`);

  // Every route file that serves this prefix must not render marketing chrome.
  const base = route.slice(1);
  const matches = routeFiles.filter(
    (f) => f === `${base}.tsx` || f.startsWith(`${base}.`) || f === `${base}/index.tsx`,
  );
  if (!matches.length && !existsSync(`src/routes/${base}`)) {
    fail(`${route} has no route file`);
    continue;
  }
  for (const file of matches) {
    const src = readFileSync(`src/routes/${file}`, "utf8");
    if (/<SiteHeader|<SiteFooter/.test(src)) {
      fail(`src/routes/${file} renders marketing chrome inside the app shell`);
    } else {
      console.log(`PASS  src/routes/${file} shell-clean`);
    }
  }
}

console.log(failed ? `\n${failed} shell check(s) failed.` : "\nApp shell wiring OK.");
process.exit(failed ? 1 : 0);
