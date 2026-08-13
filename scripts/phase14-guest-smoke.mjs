import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4204";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const forbidden = [];
page.on("request", (request) => {
  const url = request.url();
  if (
    /supabase|google-analytics|segment|posthog/i.test(url) &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method())
  ) {
    forbidden.push({ method: request.method(), url });
  }
});

async function assertText(text) {
  await page
    .getByText(text, { exact: false })
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

try {
  await page.goto(`${base}/jobs`, { waitUntil: "networkidle" });
  await assertText(/طابق سيرتك مع وظيفة|Match your resume to a job/);
  const jobDescription =
    "Senior Data Analyst with 4 years experience. SQL, Power BI, Excel and communication skills required.";
  await page.locator("textarea").first().fill(jobDescription);
  await page.getByRole("button", { name: /حلّل محلياً|Analyze locally/ }).click();
  await assertText(/ملخص المطابقة|Match summary/);

  await page.goto(`${base}/cover-letters`, { waitUntil: "networkidle" });
  await assertText(/اكتب خطاب تقديم|Write a cover letter/);
  const coverInputs = page.locator("input");
  await coverInputs.nth(0).fill("Data Analyst");
  await coverInputs.nth(1).fill("Example Company");
  await page.getByRole("button", { name: /أنشئ مسودة محلية|Create local draft/ }).click();
  await assertText(/راجع المسودة|Review your draft/);

  await page.goto(`${base}/assistant?agent=noura`, { waitUntil: "networkidle" });
  await assertText(/ما الذي تريد إنجازه اليوم؟|What do you want to accomplish today\?/);
  const createGoal = page.getByRole("button", {
    name: /إنشاء سيرة من الصفر|Create a resume from scratch/,
  });
  await page.waitForTimeout(1000);
  await createGoal.click({ force: true });
  await page.waitForFunction(() => document.querySelector('button[aria-pressed="true"]') !== null);
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) => /التالي|Next/.test(button.textContent ?? "") && !button.disabled,
    ),
  );
  await page.getByRole("button", { name: /التالي|Next/ }).click();
  await assertText(/من أنت|About you/);

  if (forbidden.length)
    throw new Error(`Guest mutation requests detected: ${JSON.stringify(forbidden)}`);
  console.log("PASS guest parity: /jobs, /cover-letters, and /assistant render without account");
  console.log("PASS guest privacy: no Supabase/analytics mutation requests");
} finally {
  await browser.close();
}
