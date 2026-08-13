import { mkdir } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:8081";
const ARTIFACTS = path.join(process.cwd(), "artifacts", "noura-foundation");
const failures = [];
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => {
  failures.push(message);
  console.error(`FAIL ${message}`);
};

await mkdir(ARTIFACTS, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
for (const lang of ["ar", "en"]) {
  const page = await context.newPage();
  await page.addInitScript((value) => localStorage.setItem("seerati.lang", value), lang);
  await page.goto(`${BASE_URL}/assistant?agent=noura`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.locator("#assistant-builder").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(800);
  const routes = ["/import", "/ats", "/templates", "/privacy-center", "/resumes/new"];
  for (const route of routes) {
    const response = await page.request.get(`${BASE_URL}${route}`);
    if (response.status() < 400) pass(`${lang}: route ${route} reachable (${response.status()})`);
    else fail(`${lang}: route ${route} returned ${response.status()}`);
  }
  const pdfPath = path.join(ARTIFACTS, `noura-${lang}.pdf`);
  await page.emulateMedia({ media: "print" });
  await page.screenshot({ path: path.join(ARTIFACTS, `noura-${lang}-print.png`), fullPage: true });
  const printState = await page.locator("#print-area").evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      text: element.textContent?.slice(0, 240),
      visibility: style.visibility,
      display: style.display,
      width: rect.width,
      height: rect.height,
    };
  });
  console.log(`${lang}: print-area state`, printState);
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true });
  const text = execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
  const expected = lang === "ar" ? ["اسمك الكامل"] : ["Your name"];
  if (expected.some((term) => text.includes(term)))
    pass(`${lang}: PDF contains resume preview text`);
  else fail(`${lang}: PDF resume preview text missing`);
  await page.close();
}
await context.close();
await browser.close();
console.log(JSON.stringify({ failures, artifacts: ARTIFACTS }, null, 2));
if (failures.length) process.exit(1);
