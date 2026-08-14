import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
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
  await page.getByRole("button", { name: /إنشاء وفتح المحرر|Create and open editor/i }).click();
  await page.waitForURL(/\/resumes\/guest-[^/]+\/edit/);
  assert(!page.url().includes("/auth"), "guest resume creation must not redirect to auth");

  await page.evaluate(() => {
    window.history.pushState({}, "", "/ats");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.getByText(/فحص سيرتك في هذه الجلسة|Checking your resume in this session/i).waitFor();
  assert(!page.url().includes("/auth"), "guest ATS must remain public");

  console.log("Guest-first browser smoke passed: Noura CTA, guest editor, and session ATS.");
} finally {
  await browser.close();
}
