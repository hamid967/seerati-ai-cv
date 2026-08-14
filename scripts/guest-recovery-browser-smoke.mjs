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

const guestNotice = page.getByTestId("guest-notice");

async function openGuestNotice() {
  await guestNotice.waitFor({ state: "visible", timeout: 10_000 });
  const expanded = await guestNotice.evaluate((element) => element.open);
  if (!expanded) await guestNotice.locator("summary").click();
  await guestNotice
    .getByRole("button", {
      name: /حفظ هذه الجلسة|Remember this tab|إيقاف استعادة هذه الجلسة|Stop remembering this tab/i,
    })
    .waitFor({ state: "visible", timeout: 10_000 });
}

async function clickConsentControl(name) {
  const control = guestNotice.getByRole("button", { name });
  await control.waitFor({ state: "visible", timeout: 10_000 });
  await control.click({ timeout: 5_000 });
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
  await guestNotice
    .getByRole("button", { name: /إيقاف استعادة هذه الجلسة|Stop remembering this tab/i })
    .waitFor({ state: "visible", timeout: 10_000 });
  assert(!page.url().includes("/auth"), "consented recovery must restore without auth");

  await clickConsentControl(/إيقاف استعادة هذه الجلسة|Stop remembering this tab/i);
  await expectRecoveryStorage(false);

  await clickConsentControl(/حفظ هذه الجلسة في علامة التبويب|Remember this tab/i);
  await expectRecoveryStorage(true);
  await guestNotice
    .getByRole("button", { name: /حذف بياناتي الآن|Delete my data now/i })
    .click({ timeout: 5_000 });
  await expectRecoveryStorage(false);
  assert(!violations.length, `recovery must not create cloud mutations: ${violations.join(", ")}`);

  console.log(
    "Guest recovery browser smoke passed: explicit opt-in, reload, opt-out, and deletion.",
  );
} finally {
  await browser.close();
}
