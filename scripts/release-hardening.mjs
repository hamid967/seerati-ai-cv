import { mkdir, readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const ROOT = process.cwd();
const ARTIFACTS = path.join(ROOT, "artifacts", "release-hardening");
const BASELINES = path.join(ROOT, "tests", "release-baselines");
const UPDATE = process.env.UPDATE_RELEASE_BASELINE === "1";
const browsers = { chromium, firefox, webkit };
const capabilityHrefs = ["/import", "/ats", "/jobs", "/cover-letters", "/arabic-intelligence"];
const protectedCapabilityHrefs = new Set(["/jobs", "/cover-letters"]);
const failures = [];

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}
function pass(message) {
  console.log(`PASS ${message}`);
}
function warn(message) {
  console.warn(`WARN ${message}`);
}
async function ensureDirs() {
  await mkdir(ARTIFACTS, { recursive: true });
  await mkdir(BASELINES, { recursive: true });
}
async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
async function comparePng(actualPath, baselinePath, label, blocking = true) {
  if (UPDATE) {
    await import("node:fs/promises").then(({ copyFile }) => copyFile(actualPath, baselinePath));
    pass(`${label}: baseline saved for review`);
    return;
  }
  if (!(await exists(baselinePath))) {
    (blocking ? fail : warn)(
      `${label}: baseline missing; run UPDATE_RELEASE_BASELINE=1 once after review`,
    );
    return;
  }

  const actual = PNG.sync.read(await readFile(actualPath));
  const baseline = PNG.sync.read(await readFile(baselinePath));
  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    (blocking ? fail : warn)(
      `${label}: dimensions changed from ${baseline.width}x${baseline.height} to ${actual.width}x${actual.height}`,
    );
    return;
  }
  const diff = new PNG({ width: actual.width, height: actual.height });
  const different = pixelmatch(baseline.data, actual.data, diff.data, actual.width, actual.height, {
    threshold: 0.1,
  });
  const ratio = different / (actual.width * actual.height);
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(path.join(ARTIFACTS, `${label}-diff.png`), PNG.sync.write(diff)),
  );
  if (ratio > 0.01) {
    (blocking ? fail : warn)(`${label}: visual difference ${(ratio * 100).toFixed(2)}% exceeds 1%`);
  } else pass(`${label}: visual difference ${(ratio * 100).toFixed(2)}%`);
}
async function gotoAssistant(page, lang) {
  await page.addInitScript((value) => localStorage.setItem("seerati.lang", value), lang);
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await page.goto(`${BASE_URL}/assistant`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      if (page.url().includes("/assistant")) break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/NS_BINDING_ABORTED|frame was detached/i.test(message) || attempt === 3) throw error;
    }
    await page.waitForTimeout(attempt * 500);
  }
  if (!response || response.status() >= 400)
    throw new Error(`assistant returned ${response?.status()}`);
  await page.locator("#assistant-capabilities-title").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(600);
}
async function checkCapabilities(page, browserName) {
  for (const href of capabilityHrefs) {
    await page.goto(`${BASE_URL}/assistant`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator(`a[href="${href}"]`).waitFor({ state: "visible", timeout: 15000 });
    const link = page.locator(`a[href="${href}"]`).first();
    const name = (await link.innerText()).trim();
    if (!name) fail(`${browserName}: capability ${href} has no accessible text`);
    await link.click();
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(300);
    const body = await page.locator("body").innerText();
    const reachedTarget = page.url().includes(href);
    const expectedGuestAuthRedirect =
      protectedCapabilityHrefs.has(href) && page.url().includes("/auth");
    if (!reachedTarget && !expectedGuestAuthRedirect) {
      fail(`${browserName}: ${href} did not become the active route`);
    }
    if (/Internal Server Error|Application error|Cannot read properties/i.test(body)) {
      fail(`${browserName}: ${href} rendered an application error`);
    }
  }
  pass(`${browserName}: all assistant capability cards navigate successfully`);
}
async function checkKeyboard(page, browserName) {
  await gotoAssistant(page, "ar");
  const target = page.locator('a[href="/import"]').first();
  await target.focus();
  if (!(await target.evaluate((el) => el === document.activeElement)))
    fail(`${browserName}: import card cannot receive focus`);
  const visited = new Set();
  for (let i = 0; i < 24; i++) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      text: document.activeElement?.textContent?.trim().slice(0, 80),
    }));
    if (active.tag !== "BODY") visited.add(`${active.tag}:${active.text}`);
  }
  if (visited.size < 5)
    fail(`${browserName}: keyboard traversal reached fewer than 5 interactive elements`);
  else pass(`${browserName}: keyboard navigation reached ${visited.size} interactive elements`);
}
async function checkNetworkPrivacy(page) {
  const violations = [];
  page.on("request", (request) => {
    const url = request.url();
    const method = request.method();
    const body = request.postData() ?? "";
    const sensitive =
      /synthetic[._ -]?(name|email|phone)|prompt|response|address/i.test(body) ||
      (method !== "GET" && /resume|cv/i.test(url));
    const persistence =
      /\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\/object/i.test(url) && method !== "GET";
    const externalMutation = method !== "GET" && !url.startsWith(BASE_URL);
    if (sensitive) violations.push(`sensitive content in ${method} ${url}`);
    if (persistence) violations.push(`guest persistence endpoint ${method} ${url}`);
    if (externalMutation) violations.push(`external mutation ${method} ${url}`);
  });
  await gotoAssistant(page, "ar");
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  const unsafeKeys = [...storage.local, ...storage.session].filter((key) =>
    /resume|cv|guest|document|draft/i.test(key),
  );
  if (unsafeKeys.length)
    violations.push(`guest document keys found in browser storage: ${unsafeKeys.join(", ")}`);
  if (violations.length) violations.forEach((v) => fail(`Network Privacy: ${v}`));
  else
    pass(
      "Network Privacy: anonymous assistant journey has no unauthorized mutation or personal payload",
    );
}
async function checkAxeRoute(page, route, lang) {
  await page.addInitScript((value) => localStorage.setItem("seerati.lang", value), lang);
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(300);
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((v) => ["critical", "serious"].includes(v.impact));
  for (const violation of blocking) {
    fail(
      `axe ${lang} ${route}: ${violation.id} (${violation.impact}) ${violation.nodes.length} nodes`,
    );
  }
  if (!blocking.length) pass(`axe ${lang} ${route}: no critical or serious violations`);
}
async function checkAxe(page, lang) {
  await checkAxeRoute(page, "/assistant", lang);
}

async function checkVisuals(page, lang) {
  await gotoAssistant(page, lang);
  const screen = path.join(ARTIFACTS, `assistant-${lang}.png`);
  const base = path.join(BASELINES, `assistant-${lang}.png`);
  await page.screenshot({ path: screen, fullPage: false });
  await comparePng(screen, base, `assistant-${lang}`, false);
  await page.emulateMedia({ media: "print" });
  const print = path.join(ARTIFACTS, `assistant-${lang}-print.png`);
  const printBase = path.join(BASELINES, `assistant-${lang}-print.png`);
  await page.screenshot({ path: print, fullPage: false });
  await comparePng(print, printBase, `assistant-${lang}-print`);
  await page.emulateMedia({ media: "screen" });
  const pdf = path.join(ARTIFACTS, `assistant-${lang}.pdf`);
  await page.pdf({ path: pdf, format: "A4", printBackground: true, preferCSSPageSize: true });
  const text = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
  const expected =
    lang === "ar"
      ? ["مساعد سيرتي", "مركز مساعد سيرتي"]
      : ["Seerati Assistant", "Seerati assistant hub"];
  if (!expected.some((term) => text.includes(term)))
    fail(`PDF ${lang}: expected language text missing`);
  else pass(`PDF ${lang}: generated and contains expected language text`);
}
async function runBrowser(browserName) {
  const browser = await browsers[browserName].launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => fail(`${browserName}: pageerror ${error.message}`));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (/fonts\.gstatic\.com|fonts\.googleapis\.com/i.test(url)) {
      console.warn(`WARN ${browserName}: external font request unavailable; system fallback used`);
      return;
    }
    const failure = request.failure()?.errorText ?? "unknown request failure";
    if (/Load request cancelled|NS_BINDING_ABORTED|NS_ERROR_ABORT/i.test(failure)) return;
    fail(`${browserName}: request failed ${request.method()} ${url} (${failure})`);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // External Google font downloads are non-blocking because the app has a local system fallback.
    if (/downloadable font|fonts\.gstatic\.com/i.test(text)) {
      console.warn(`WARN ${browserName}: external font unavailable; system fallback used`);
      return;
    }
    fail(`${browserName}: console error ${text}`);
  });

  try {
    await checkCapabilities(page, browserName);
    await checkKeyboard(page, browserName);
    if (browserName === "chromium") {
      await checkNetworkPrivacy(page);
      await checkAxe(page, "ar");
      await checkAxe(page, "en");
      for (const route of ["/", "/templates", "/features", "/privacy"]) {
        await checkAxeRoute(page, route, "ar");
      }
      await checkVisuals(page, "ar");
      await checkVisuals(page, "en");
    }
  } catch (error) {
    fail(`${browserName}: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

await ensureDirs();
const selectedBrowsers = process.env.BROWSER_ONLY
  ? [process.env.BROWSER_ONLY]
  : ["chromium", "firefox", "webkit"];
for (const name of selectedBrowsers) await runBrowser(name);
if (UPDATE)
  pass("visual baselines generated; review them and rerun without UPDATE_RELEASE_BASELINE");
if (failures.length) {
  console.error(`Release Hardening failed with ${failures.length} blocking finding(s).`);
  process.exit(1);
}
console.log(
  "Release Hardening passed: E2E, Network Privacy, axe, keyboard, browser matrix, PDF, and print checks.",
);
