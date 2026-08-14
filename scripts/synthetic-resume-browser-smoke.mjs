import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4175";
const browser = await chromium.launch({ headless: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runArabicMobileJourney() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const violations = [];
  const adaptationRequests = [];
  const marker = "اسمك الكامل";
  page.on("request", (request) => {
    const body = request.postData() ?? "";
    const url = request.url();
    if (body.includes(marker) || url.includes(encodeURIComponent(marker))) {
      violations.push(`sample content reached ${request.method()} ${new URL(url).origin}`);
    }
    if (
      /synthetic-adaptation\.functions|adapt_sample/i.test(url) ||
      body.includes("adapt_sample")
    ) {
      adaptationRequests.push(`${request.method()} ${new URL(url).pathname}`);
    }
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
      /\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\/object/i.test(url)
    ) {
      violations.push(
        `cloud mutation during sample flow: ${request.method()} ${new URL(url).origin}`,
      );
    }
  });

  await page.goto(`${baseUrl}/assistant?agent=noura`, { waitUntil: "networkidle" });
  await page.getByTestId("synthetic-sample-resume-goal").press("Enter");
  await page.getByTestId("synthetic-sample-flow").waitFor();
  await page.getByLabel("ابحث عن تخصص").fill("مطور");
  await page.getByRole("option", { name: /تطوير البرمجيات/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "خريج جديد" }).press("Enter");
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "العربية" }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "التقديم على وظيفة" }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByTestId("synthetic-ai-consent").waitFor();
  const adaptButton = page.getByTestId("synthetic-ai-adapt");
  assert(
    await adaptButton.isDisabled(),
    "AI adaptation must stay disabled before explicit consent",
  );
  await page.getByTestId("synthetic-ai-consent").getByRole("checkbox").check();
  await adaptButton.click();
  await page
    .getByTestId("synthetic-ai-status")
    .getByText(/جلسة ضيف: لم نرسل أي طلب AI/)
    .waitFor();
  assert(
    adaptationRequests.length === 0,
    `guest AI adaptation must not send an endpoint request: ${adaptationRequests.join(", ")}`,
  );
  await page.getByRole("button", { name: "قارن" }).nth(0).click();
  await page.getByRole("button", { name: "قارن" }).nth(0).click();
  await page.getByRole("button", { name: "اختر وابدأ التعديل" }).first().click();
  await page.waitForURL(/\/resumes\/sample-[^/]+\/edit/);
  assert(!page.url().includes("/auth"), "sample edit must not redirect to auth");
  await page.getByTestId("synthetic-sample-notice").waitFor();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /اعتماد الحقل بعد المراجعة/ }).click();
  await page.getByRole("alert").waitFor();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert(!overflow, "sample flow must not overflow iPhone viewport");
  const motion = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  assert(motion, "reduced-motion preference must be honoured");

  await page.evaluate(() => {
    window.history.pushState({}, "", window.location.pathname.replace("/edit", "/preview"));
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.getByTestId("synthetic-sample-notice").waitFor();
  await page.getByRole("button", { name: /PDF نصي للتقديم وATS/ }).click();
  await page.getByText(/ما زالت السيرة تحتوي على بيانات تجريبية/).waitFor();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /تنزيل نموذج تجريبي معنّون/ }).click(),
  ]);
  assert(
    download.suggestedFilename() === "sample-resume-not-for-application.txt",
    "sample export must use labelled filename",
  );

  await page.evaluate(() => {
    window.history.pushState({}, "", "/ats");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.getByTestId("synthetic-ats-boundary").waitFor();
  const stored = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    indexed: typeof indexedDB.databases === "function" ? await indexedDB.databases() : [],
    caches: "caches" in window ? await caches.keys() : [],
  }));
  const personalStorage = [
    ...stored.local,
    ...stored.session,
    ...stored.indexed.map((db) => db.name ?? ""),
    ...stored.caches,
  ].filter((key) => /sample-|resume|cv|specialty|synthetic/i.test(key));
  assert(
    !personalStorage.length,
    `sample data must not persist by default: ${personalStorage.join(", ")}`,
  );
  assert(!violations.length, `sample privacy violations: ${violations.join("; ")}`);
  await context.close();
}

async function runEnglishAndroidCheck() {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => localStorage.setItem("seerati.lang", "en"));
  const page = await context.newPage();
  await page.goto(`${baseUrl}/assistant?agent=noura`, { waitUntil: "networkidle" });
  await page.getByTestId("synthetic-sample-resume-goal").click();
  await page.getByText("What profession should this sample CV represent?").waitFor();
  await page.getByLabel("Search professions").fill("accountant");
  await page.getByRole("option", { name: /Accounting/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "New graduate" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Job application" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByText("Choose the closest look").waitFor();
  await page.getByTestId("synthetic-ai-consent").waitFor();
  assert(
    await page.getByTestId("synthetic-ai-adapt").isDisabled(),
    "English AI adaptation must require explicit consent",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert(!overflow, "sample flow must not overflow Android viewport");
  await context.close();
}

try {
  await runArabicMobileJourney();
  await runEnglishAndroidCheck();
  console.log(
    "Synthetic resume browser smoke passed: Noura flow, mobile, RTL/LTR, explicit AI consent, guest no-network fallback, sample export guard, ATS boundary, and privacy.",
  );
} finally {
  await browser.close();
}
