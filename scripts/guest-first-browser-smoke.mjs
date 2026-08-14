import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const syntheticMarker = "TEST_PERSON_001";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();
const violations = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function inspectGuestRequest(request) {
  const url = request.url();
  const method = request.method();
  const body = request.postData() ?? "";
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isPersistenceEndpoint = /\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\/object/i.test(url);
  const isAnalyticsEndpoint = /google-analytics|segment|posthog/i.test(url);
  const exposesSyntheticData = url.includes(syntheticMarker) || body.includes(syntheticMarker);

  if (exposesSyntheticData)
    violations.push(`synthetic guest CV value appeared in ${method} ${new URL(url).origin}`);
  if (isMutation && (isPersistenceEndpoint || isAnalyticsEndpoint))
    violations.push(`guest mutation reached ${new URL(url).origin}`);
  if (isMutation && !url.startsWith(baseUrl))
    violations.push(`guest external mutation reached ${new URL(url).origin}`);
}

async function navigateWithinApp(path) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

try {
  page.on("request", inspectGuestRequest);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const start = page
    .getByRole("link", { name: /ابدأ سيرتك مجانًا|Start your resume free/i })
    .first();
  await start.waitFor();
  const href = await start.getAttribute("href");
  assert(
    href?.includes("/assistant") && href.includes("agent=noura"),
    "home CTA must point directly to Noura",
  );

  await page.goto(`${baseUrl}/resumes/new`, { waitUntil: "networkidle" });
  await page.locator("#title").fill(`${syntheticMarker} resume`);
  await page.getByRole("button", { name: /إنشاء وفتح المحرر|Create and open editor/i }).click();
  await page.waitForURL(/\/resumes\/guest-[^/]+\/edit/);
  assert(!page.url().includes("/auth"), "guest resume creation must not redirect to auth");

  await navigateWithinApp("/ats");
  await page.getByText(/فحص سيرتك في هذه الجلسة|Checking your resume in this session/i).waitFor();
  assert(!page.url().includes("/auth"), "guest ATS must remain public");

  await navigateWithinApp("/import");
  await page.getByText(/مركز الاستيراد|Import center/i).waitFor();
  await page.getByRole("button", { name: /^(الصق النص|Paste text)$/i }).click();
  await page.locator("textarea").first().fill(`
${syntheticMarker}
Product Analyst
Experience: Evidence Co — Product Analyst
Skills: SQL, analytics, research
Professional summary: Synthetic local import fixture for privacy verification.
`);
  await page.getByRole("button", { name: /تحليل النص|Analyse text/i }).click();
  await page.getByText(/راجع ما استخرجناه|Review what we extracted/i).waitFor();
  await page.getByRole("button", { name: /اعتماد وفتح المحرر|Approve and open editor/i }).click();
  await page.waitForURL(/\/resumes\/guest-[^/]+\/edit/);

  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    indexedDb:
      typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((db) => db.name)
        : [],
    caches: "caches" in window ? await caches.keys() : [],
  }));
  const persistedKeys = [
    ...storage.local,
    ...storage.session,
    ...storage.indexedDb,
    ...storage.caches,
  ].filter((key) => /resume|cv|guest|document|draft|test_person_001/i.test(key ?? ""));
  assert(
    !persistedKeys.length,
    `guest resume data must not persist in browser storage: ${persistedKeys.join(", ")}`,
  );

  await page.locator("details > summary").first().click();
  await page.getByRole("button", { name: /حذف بياناتي الآن|Delete my data now/i }).click();
  await navigateWithinApp("/ats");
  await page.getByText(/مثال على سيرة تجريبية|Example: demo resume/i).waitFor();

  assert(!violations.length, `guest privacy violations: ${violations.join("; ")}`);
  console.log(
    "Guest-first browser smoke passed: CTA, local create/import/ATS, explicit deletion, browser storage, and network privacy.",
  );
} finally {
  await browser.close();
}
