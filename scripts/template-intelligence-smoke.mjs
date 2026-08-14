import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`PASS ${message}`);
    return;
  }
  failures.push(message);
  console.error(`FAIL ${message}`);
}

async function assertNoGuestPersistence(page, label) {
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    indexedDb:
      typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((database) => database.name)
        : [],
    caches: "caches" in window ? await caches.keys() : [],
  }));
  const sensitive = [...storage.local, ...storage.session, ...storage.indexedDb, ...storage.caches]
    .filter(Boolean)
    .filter((key) => /resume|cv|guest|document|draft/i.test(key));
  assert(!sensitive.length, `${label}: intelligent guide creates no guest document persistence`);
}

async function runLocale({ lang, viewport, label }) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];

  page.on("request", (request) => {
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? "" });
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    await page.addInitScript((value) => localStorage.setItem("seerati.lang", value), lang);
    await page.goto(`${baseUrl}/templates`, { waitUntil: "networkidle", timeout: 30000 });

    const guide = page.getByTestId("template-intelligence-guide");
    await guide.waitFor({ state: "visible", timeout: 10000 });
    assert(await guide.isVisible(), `${label}: intelligent template guide is visible`);
    assert(
      await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
      `${label}: reduced-motion preference is honoured`,
    );
    assert(
      !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
      `${label}: no horizontal overflow`,
    );

    const goal = guide.getByRole("button", {
      name: lang === "ar" ? /مسار قيادي/ : /Leadership path/,
    });
    await goal.focus();
    assert(
      await goal.evaluate((element) => element === document.activeElement),
      `${label}: keyboard can focus a design goal`,
    );
    await goal.click();
    assert(
      await goal.getAttribute("aria-pressed").then((value) => value === "true"),
      `${label}: selected goal is announced`,
    );

    const recommend = guide.getByRole("button", {
      name: lang === "ar" ? /اعرض توصيات محلية/ : /Show local recommendations/,
    });
    await recommend.click();
    const picks = page.locator('[data-recommended="true"]');
    await picks.first().waitFor({ state: "visible", timeout: 10000 });
    assert(
      (await picks.count()) === 3,
      `${label}: exactly three ranked local template picks appear`,
    );
    assert(
      await guide
        .getByText(
          lang === "ar"
            ? /توصية محلية من خصائص القوالب/
            : /local template-property recommendation/i,
        )
        .isVisible(),
      `${label}: guide explains the non-guarantee boundary`,
    );

    await assertNoGuestPersistence(page, label);
    const suspicious = requests.filter((request) => {
      const mutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
      const persistence = /\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\/object/i.test(request.url);
      const sensitiveBody = /synthetic[._ -]?(name|email|phone)|resume|curriculum vitae/i.test(
        request.body,
      );
      return (mutation && persistence) || sensitiveBody;
    });
    assert(
      !suspicious.length,
      `${label}: guide causes no cloud persistence or personal-content request`,
    );
    assert(!consoleErrors.length, `${label}: no console errors`);
  } finally {
    await page.close();
    await context.close();
  }
}

try {
  await runLocale({ lang: "ar", viewport: { width: 390, height: 844 }, label: "ar-iphone" });
  await runLocale({ lang: "en", viewport: { width: 412, height: 915 }, label: "en-android" });
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Template intelligence smoke failed: ${failures.join("; ")}`);
  process.exit(1);
}

console.log(
  "Template intelligence smoke passed: local recommendations, mobile accessibility, and privacy boundaries.",
);
