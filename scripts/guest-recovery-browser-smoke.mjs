import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();
const violations = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

page.on("request", (request) => {
  const url = request.url();
  const mutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method());
  if (
    mutation &&
    (/\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\/object/i.test(url) || !url.startsWith(baseUrl))
  ) {
    violations.push(`${request.method()} ${new URL(url).origin}`);
  }
});

async function expectRecoveryStorage(expected) {
  await page.waitForFunction((enabled) => {
    const consent = sessionStorage.getItem("seerati.session-recovery-consent");
    const payload = sessionStorage.getItem("seerati.session-recovery");
    return enabled ? consent === "true" && Boolean(payload) : consent === null && payload === null;
  }, expected);
}

async function openGuestNotice() {
  const notice = page.locator("details").filter({
    hasText: /حفظ هذه الجلسة|Remember this tab|حذف بياناتي الآن|Delete my data now/i,
  });
  await notice.first().waitFor({ state: "attached", timeout: 5_000 });
  await notice.first().evaluate((element) => {
    element.open = true;
  });
}

async function clickConsentControl(name) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const control = page.getByRole("button", { name });
    try {
      await control.waitFor({ state: "visible", timeout: 2_000 });
      await control.click({ force: true, timeout: 2_000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(150);
    }
  }
  throw lastError;
}

try {
  await page.goto(`${baseUrl}/resumes/new`, { waitUntil: "networkidle" });
  await page.locator("#title").fill("Synthetic recovery resume");
  await page.getByRole("button", { name: /إنشاء وفتح المحرر|Create and open editor/i }).click();
  await page.waitForURL(/\/resumes\/guest-[^/]+\/edit/);

  await openGuestNotice();
  await clickConsentControl(/حفظ هذه الجلسة في علامة التبويب|Remember this tab/i);
  await expectRecoveryStorage(true);

  await page.reload({ waitUntil: "networkidle" });
  await openGuestNotice();
  await page
    .getByRole("button", { name: /إيقاف استعادة هذه الجلسة|Stop remembering this tab/i })
    .waitFor();
  assert(!page.url().includes("/auth"), "consented recovery must restore without auth");

  await clickConsentControl(/إيقاف استعادة هذه الجلسة|Stop remembering this tab/i);
  await expectRecoveryStorage(false);

  await clickConsentControl(/حفظ هذه الجلسة في علامة التبويب|Remember this tab/i);
  await expectRecoveryStorage(true);
  await page.getByRole("button", { name: /حذف بياناتي الآن|Delete my data now/i }).click();
  await expectRecoveryStorage(false);
  assert(!violations.length, `recovery must not create cloud mutations: ${violations.join(", ")}`);

  console.log(
    "Guest recovery browser smoke passed: explicit opt-in, reload, opt-out, and deletion.",
  );
} finally {
  await browser.close();
}
