#!/usr/bin/env node
import { readFileSync } from "node:fs";

const css = readFileSync("src/premium-theme.css", "utf8");
const shell = readFileSync("src/components/app/app-shell.tsx", "utf8");
const header = readFileSync("src/components/site-header.tsx", "utf8");

const failures = [];
const requireText = (source, token, label) => {
  if (!source.includes(token)) failures.push(label);
};

requireText(css, "perspective:", "3D theme must define perspective");
requireText(css, "transform-style: preserve-3d", "3D theme must preserve nested depth");
requireText(css, "@media (prefers-reduced-motion: reduce)", "3D theme must support reduced motion");
requireText(css, "@media print", "3D theme must define print cleanup");
requireText(
  css,
  "transform: none !important",
  "print/reduced-motion cleanup must flatten transforms",
);
requireText(css, ".surface-ink", "landing hero depth styles missing");
requireText(css, ".seerati-app-3d", "app shell depth styles missing");
requireText(css, ".seerati-logo-cube", "premium logo depth styles missing");
requireText(shell, "seerati-app-3d", "AppShell has not activated premium 3D class");
requireText(shell, "seerati-app-stage", "AppShell stage class missing");
requireText(header, "seerati-site-header", "SiteHeader premium class missing");
requireText(header, "seerati-logo-cube", "SiteHeader logo depth class missing");

const printBlock = css.match(/@media print\s*\{([\s\S]*)\}\s*$/)?.[1] ?? "";
if (!printBlock.includes(".paper"))
  failures.push("print cleanup must explicitly cover resume paper");
if (!printBlock.includes("box-shadow: none"))
  failures.push("print cleanup must remove screen shadows");

if (failures.length) {
  for (const failure of failures) console.error(`FAIL  ${failure}`);
  console.error(`\n${failures.length} premium 3D guard(s) failed.`);
  process.exit(1);
}

console.log("PASS  premium 3D perspective system present");
console.log("PASS  reduced-motion fallback present");
console.log("PASS  print/PDF flattening present");
console.log("PASS  landing, app shell, and site header classes wired");
console.log("\nPremium 3D quality guard OK.");
