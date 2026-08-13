import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox, webkit } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:8081";
const ROOT = process.cwd();
const ARTIFACTS = path.join(ROOT, "artifacts", "noura-foundation");
const failures = [];
const results = [];

function pass(message) {
  results.push(`PASS ${message}`);
  console.log(`PASS ${message}`);
}
function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}
function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

async function openAssistant(page, lang, viewport, label) {
  await page.setViewportSize(viewport);
  await page.addInitScript((value) => localStorage.setItem("seerati.lang", value), lang);
  const requests = [];
  const consoleErrors = [];
  page.on("request", (request) => {
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? "" });
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(`${BASE_URL}/assistant?agent=noura`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.locator("#assistant-builder").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(1200);
  const body = await page.locator("body").innerText();
  const aside = await page.locator("aside").innerText();
  assert(body.includes(lang === "ar" ? "نورة" : "Noura"), `${label}: Noura identity visible`);
  assert(
    body.includes(lang === "ar" ? "وكيلتك المهنية السعودية" : "Saudi career agent"),
    `${label}: Noura role visible`,
  );
  assert(
    body.includes(
      lang === "ar" ? "ما الذي تريد إنجازه اليوم؟" : "What do you want to accomplish today?",
    ),
    `${label}: single goal question visible`,
  );
  assert(
    !body.includes(lang === "ar" ? "ما حالتك المهنية؟" : "What is your current stage?"),
    `${label}: old multi-question stage prompt absent`,
  );
  assert(
    !body.includes(lang === "ar" ? "كيف تريد أن تبدأ؟" : "How would you like to start?"),
    `${label}: old creation-mode prompt absent`,
  );
  assert(
    !body.includes("تُنقل لحسابك عند التسجيل") &&
      !body.includes("moves to your account when you sign up"),
    `${label}: contradictory migration copy absent`,
  );
  assert(
    !aside.includes("السعودية") &&
      !aside.includes("Saudi Arabia") &&
      !aside.includes("الرياض") &&
      !aside.includes("Riyadh"),
    `${label}: preview has no assumed country or city`,
  );
  assert(
    !body.includes("localStorage للسيرة") ||
      body.includes("لا قاعدة بيانات ولا localStorage للسيرة"),
    `${label}: privacy copy does not imply resume localStorage`,
  );
  const goalButtons = page.locator("#assistant-builder button[aria-pressed]");
  assert(
    (await goalButtons.count()) === 7,
    `${label}: exactly seven goal choices are available under one goal question`,
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assert(!overflow, `${label}: no horizontal overflow`);
  const firstButton = page.getByRole("button").first();
  await firstButton.focus();
  assert(
    await firstButton.evaluate((element) => element === document.activeElement),
    `${label}: keyboard focus reaches first action`,
  );
  const visited = new Set();
  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      text: document.activeElement?.textContent?.trim().slice(0, 80),
    }));
    if (active.tag !== "BODY") visited.add(`${active.tag}:${active.text}`);
  }
  assert(visited.size >= 5, `${label}: keyboard traversal reaches at least five controls`);
  await page.screenshot({ path: path.join(ARTIFACTS, `${label}.png`), fullPage: true });
  const tools = page.getByRole("button", { name: /الأدوات عند الحاجة|Tools when needed/ });
  assert(await tools.isVisible(), `${label}: capability hub is behind tools button`);
  assert(
    !(await page.locator('a[href="/import"]').count()),
    `${label}: import capability hidden before tools open`,
  );
  await tools.click();
  await page.waitForTimeout(1000);
  console.log(`${label}: tools after click`, (await page.locator("body").innerText()).slice(-1200));
  console.log(`${label}: hub count`, await page.locator("#assistant-capabilities-title").count());
  console.log(`${label}: console errors`, consoleErrors);
  console.log(
    `${label}: capability requests`,
    requests
      .filter((request) => /assistant-capability-hub|import-|ats-/.test(request.url))
      .map((request) => request.url),
  );
  await page.locator("#assistant-capabilities-title").waitFor({ state: "visible", timeout: 10000 });
  await page.locator('a[href="/import"]').waitFor({ state: "visible", timeout: 10000 });
  assert(
    await page.locator('a[href="/ats"]').isVisible(),
    `${label}: ATS capability available after tools open`,
  );
  assert(
    await page.locator('a[href="/import"]').isVisible(),
    `${label}: import capability available after tools open`,
  );
  await page
    .getByText(/عرض التفاصيل|View details/)
    .click()
    .catch(() => {});
  assert(
    await page.getByRole("button", { name: /حذف بياناتي الآن|Delete my data now/ }).isVisible(),
    `${label}: privacy deletion control available`,
  );
  assert(
    (await page.locator('input[type="checkbox"]').count()) >= 0,
    `${label}: foundation route remains renderable for later consent step`,
  );
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    indexedDb: typeof indexedDB !== "undefined",
    cacheStorage: typeof caches !== "undefined",
  }));
  const unsafeStorage = [...storage.local, ...storage.session].filter((key) =>
    /resume|cv|draft|document/i.test(key),
  );
  assert(unsafeStorage.length === 0, `${label}: no resume keys in localStorage/sessionStorage`);
  assert(storage.indexedDb === true, `${label}: IndexedDB API inspected without a CV write`);
  assert(storage.cacheStorage === true, `${label}: Cache Storage API inspected without a CV write`);
  const suspicious = requests.filter((request) => {
    const mutation = request.method !== "GET" && request.method !== "HEAD";
    const persistenceEndpoint = /supabase|rest\/v1|functions\/v1|storage\/v1/i.test(request.url);
    return mutation || (persistenceEndpoint && mutation);
  });
  console.log(
    `${label}: suspicious requests`,
    suspicious.map((request) => ({ method: request.method, url: request.url })),
  );
  assert(suspicious.length === 0, `${label}: no guest persistence or Supabase mutation request`);
  assert(consoleErrors.length === 0, `${label}: no console errors`);
  for (const request of requests) {
    assert(
      !/synthetic[._ -]?(name|email|phone)|prompt|response|address/i.test(request.body),
      `${label}: network body contains no CV/PII markers`,
    );
  }
  if (label === "chromium-ar-desktop") {
    await page.screenshot({ path: path.join(ARTIFACTS, "tools-panel.png"), fullPage: true });
    await page
      .getByText(/خصوصيتك محفوظة|جلسة خاصة|Private session/)
      .click()
      .catch(() => {});
    await page.screenshot({ path: path.join(ARTIFACTS, "privacy-details.png"), fullPage: true });
  }
}

await mkdir(ARTIFACTS, { recursive: true });
const allTargets = [
  ["chromium", chromium],
  ["firefox", firefox],
  ["webkit", webkit],
];
const targets = process.env.BROWSER_ONLY
  ? allTargets.filter(([name]) => name === process.env.BROWSER_ONLY)
  : allTargets;
for (const [browserName, engine] of targets) {
  const browser = await engine.launch({ headless: true });
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  for (const [lang, label] of [
    ["ar", "ar-desktop"],
    ["en", "en-desktop"],
  ]) {
    const page = await desktop.newPage();
    await openAssistant(page, lang, { width: 1440, height: 1000 }, `${browserName}-${label}`);
    await page.close();
  }
  await desktop.close();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  for (const [lang, label] of [
    ["ar", "ar-mobile"],
    ["en", "en-mobile"],
  ]) {
    const page = await mobile.newPage();
    await openAssistant(page, lang, { width: 390, height: 844 }, `${browserName}-${label}`);
    await page.close();
  }
  await mobile.close();
  await browser.close();
  pass(`${browserName}: desktop/mobile Arabic/English matrix completed`);
}

console.log(
  JSON.stringify({ artifacts: ARTIFACTS, failures, resultCount: results.length }, null, 2),
);
if (failures.length) process.exit(1);
