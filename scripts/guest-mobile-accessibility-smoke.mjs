import { chromium, firefox, webkit } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const browsers = { chromium, firefox, webkit };
const browserNames = process.env.BROWSER_ONLY ? [process.env.BROWSER_ONLY] : Object.keys(browsers);
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`PASS ${message}`);
    return;
  }
  failures.push(message);
  console.error(`FAIL ${message}`);
}

async function inspectStorage(page, label) {
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    indexedDb:
      typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((database) => database.name)
        : [],
    caches: "caches" in window ? await caches.keys() : [],
  }));
  const sensitiveKeys = [
    ...storage.local,
    ...storage.session,
    ...storage.indexedDb,
    ...storage.caches,
  ]
    .filter(Boolean)
    .filter((key) => /resume|cv|guest|document|draft/i.test(key));
  assert(!sensitiveKeys.length, `${label}: no resume content is persisted in browser storage`);
}

async function exerciseGuestNavigation(page, target) {
  const { browserName, device, lang } = target;
  const label = `${browserName}-${device.name}-${lang}`;
  const requests = [];
  const consoleErrors = [];
  page.on("request", (request) => {
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? "" });
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.addInitScript((value) => localStorage.setItem("seerati.lang", value), lang);
  await page.goto(`${baseUrl}/assistant?agent=noura`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.locator("#assistant-builder").waitFor({ state: "visible", timeout: 15000 });

  const navigation = page.getByTestId("guest-mobile-navigation");
  await navigation.waitFor({ state: "visible", timeout: 10000 });
  assert(await navigation.isVisible(), `${label}: guest navigation is visible`);
  assert(
    !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
    `${label}: no horizontal overflow`,
  );
  assert(
    await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
    `${label}: reduced-motion preference is active`,
  );

  const assistantLink = page.getByTestId("guest-mobile-nav-assistant");
  await assistantLink.focus();
  assert(
    await assistantLink.evaluate((element) => element === document.activeElement),
    `${label}: keyboard can focus the Noura navigation item`,
  );
  const focusOutline = await assistantLink.evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  assert(focusOutline !== "none", `${label}: focused mobile navigation has a visible outline`);

  await page.getByTestId("guest-mobile-nav-ats").click();
  await page.waitForURL(/\/ats/);
  await page
    .getByText(
      /فحص سيرتك في هذه الجلسة|Checking your resume in this session|مثال على سيرة تجريبية|Example: demo resume/i,
    )
    .waitFor();
  assert(!page.url().includes("/auth"), `${label}: ATS remains available without registration`);
  assert(await navigation.isVisible(), `${label}: guest navigation remains available on ATS`);

  const more = page.getByTestId("guest-mobile-nav-more");
  await more.focus();
  assert(
    await more.evaluate((element) => element === document.activeElement),
    `${label}: keyboard can focus the more-tools trigger`,
  );
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: /أدوات الضيف|Guest tools/i }).waitFor();
  assert(
    await page
      .getByText(/تبقى بيانات السيرة في ذاكرة هذا التبويب|remains in this tab’s memory/i)
      .isVisible(),
    `${label}: more-tools panel explains memory-only guest data`,
  );
  await page.getByRole("link", { name: /استيراد|Import/i }).click();
  await page.waitForURL(/\/import/);
  await page.getByText(/مركز الاستيراد|Import center/i).waitFor();
  assert(!page.url().includes("/auth"), `${label}: import remains available without registration`);
  assert(await navigation.isVisible(), `${label}: guest navigation remains available on import`);

  await page.getByTestId("guest-mobile-nav-jobs").click();
  await page.waitForURL(/\/jobs/);
  await page.getByText(/طابق سيرتك مع وظيفة|Match your resume to a job/i).waitFor();
  assert(
    !page.url().includes("/auth"),
    `${label}: job matching remains available without registration`,
  );

  await inspectStorage(page, label);
  const suspiciousRequests = requests.filter((request) => {
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const persistence = /\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\/object/i.test(request.url);
    const documentValue = /synthetic[._ -]?(name|email|phone)|resume|curriculum vitae/i.test(
      request.body,
    );
    return (mutation && persistence) || documentValue;
  });
  assert(
    suspiciousRequests.length === 0,
    `${label}: navigation causes no guest cloud persistence or document-content request`,
  );
  assert(consoleErrors.length === 0, `${label}: no console errors`);
}

const targets = [
  {
    name: "iphone",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    lang: "ar",
  },
  {
    name: "android",
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    lang: "en",
  },
];

for (const browserName of browserNames) {
  const engine = browsers[browserName];
  if (!engine) throw new Error(`Unsupported browser: ${browserName}`);
  const browser = await engine.launch({ headless: true });
  try {
    for (const device of targets) {
      const context = await browser.newContext({
        viewport: device.viewport,
        ...(browserName === "firefox"
          ? {}
          : { isMobile: device.isMobile, hasTouch: device.hasTouch }),
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      await exerciseGuestNavigation(page, { browserName, device, lang: device.lang });
      await page.close();
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

if (failures.length) {
  console.error(`Guest mobile accessibility smoke failed: ${failures.join("; ")}`);
  process.exit(1);
}

console.log("Guest mobile accessibility smoke passed across requested mobile browser targets.");
