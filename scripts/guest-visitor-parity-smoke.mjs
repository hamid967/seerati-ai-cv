import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const marker = "TEST_VISITOR_PARITY_001";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();
const violations = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function recordRequest(request) {
  const url = request.url();
  const method = request.method();
  const body = request.postData() ?? "";
  const mutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const persistence = /\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\/object/i.test(url);
  const analytics = /google-analytics|segment|posthog/i.test(url);
  if (url.includes(marker) || body.includes(marker))
    violations.push(`synthetic content reached ${method} ${new URL(url).origin}`);
  if (mutation && (persistence || analytics || !url.startsWith(baseUrl)))
    violations.push(`guest mutation reached ${method} ${new URL(url).origin}`);
}

async function navigateWithinApp(path) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

async function expectGuestStorageEmpty() {
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    indexedDb:
      typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((db) => db.name)
        : [],
    caches: "caches" in window ? await caches.keys() : [],
  }));
  const persisted = [
    ...storage.local,
    ...storage.session,
    ...storage.indexedDb,
    ...storage.caches,
  ].filter((key) => /resume|cv|guest|document|draft|test_visitor_parity_001/i.test(key ?? ""));
  assert(
    !persisted.length,
    `guest data must not persist in browser storage: ${persisted.join(", ")}`,
  );
}

try {
  page.on("request", recordRequest);

  await page.goto(`${baseUrl}/assistant?agent=noura`, { waitUntil: "networkidle" });
  await page
    .getByText(/ما الذي تريد إنجازه اليوم؟|What do you want to accomplish today/i)
    .waitFor();

  await page.goto(`${baseUrl}/templates`, { waitUntil: "networkidle" });
  await page
    .getByRole("heading", {
      name: /اختر القالب كما لو كنت تمسكه بيدك|Choose a template as if it were in your hands/i,
    })
    .waitFor();

  await page.goto(`${baseUrl}/resumes/new`, { waitUntil: "networkidle" });
  await page.locator("#title").fill(`${marker} resume`);
  await page.getByRole("button", { name: /إنشاء وفتح المحرر|Create and open editor/i }).click();
  await page.waitForURL(/\/resumes\/guest-[^/]+\/edit/);
  const editorUrl = new URL(page.url());
  const resumeId = editorUrl.pathname.split("/")[2];
  assert(resumeId?.startsWith("guest-"), "visitor resume must use the local guest identifier");
  assert(!page.url().includes("/auth"), "guest editor must not redirect to auth");

  await navigateWithinApp(`/resumes/${resumeId}/preview`);
  await page.getByRole("heading", { name: `${marker} resume` }).waitFor();
  await page
    .getByRole("button", { name: /PDF نصي للتقديم وATS|Text PDF for applications \/ ATS/i })
    .waitFor();

  await navigateWithinApp("/ats");
  await page.getByText(/فحص سيرتك في هذه الجلسة|Checking your resume in this session/i).waitFor();

  await navigateWithinApp("/import");
  await page.getByText(/مركز الاستيراد|Import center/i).waitFor();
  await page.getByRole("button", { name: /^(الصق النص|Paste text)$/i }).click();
  await page.locator("textarea").first().fill(`
${marker}
Product Analyst
Experience: Evidence Co — Product Analyst
Skills: SQL, analytics, research
Professional summary: Synthetic visitor parity fixture.
`);
  await page.getByRole("button", { name: /تحليل النص|Analyse text/i }).click();
  await page.getByText(/راجع ما استخرجناه|Review what we extracted/i).waitFor();
  await page.getByRole("button", { name: /اعتماد وفتح المحرر|Approve and open editor/i }).click();
  await page.waitForURL(/\/resumes\/guest-[^/]+\/edit/);

  await navigateWithinApp("/jobs");
  await page.getByText(/طابق سيرتك مع وظيفة|Match your resume to a job/i).waitFor();
  await page
    .locator("textarea")
    .first()
    .fill(
      "Senior Product Analyst role requiring SQL, analytics, stakeholder communication, and research.",
    );
  await page.getByRole("button", { name: /حلّل محلياً|Analyze locally/i }).click();
  await page.getByText(/ملخص المطابقة|Match summary/i).waitFor();

  await navigateWithinApp("/cover-letters");
  await page.getByText(/اكتب خطاب تقديم|Write a cover letter/i).waitFor();
  await page.getByRole("textbox", { name: /المسمى الوظيفي|Job title/i }).fill("Product Analyst");
  await page.getByRole("textbox", { name: /الشركة|Company/i }).fill("Evidence Co");
  await page
    .getByRole("textbox", { name: /الوصف الوظيفي|Job description/i })
    .fill("Synthetic job description for a local cover-letter draft.");
  await page.getByRole("button", { name: /أنشئ مسودة محلية|Create local draft/i }).click();
  await page.getByText(/راجع المسودة|Review your draft/i).waitFor();

  await expectGuestStorageEmpty();
  await navigateWithinApp(`/resumes/${resumeId}/edit`);
  await page.locator("details > summary").first().waitFor();
  await page.locator("details > summary").first().click();
  await page.getByRole("button", { name: /حذف بياناتي الآن|Delete my data now/i }).click();
  await navigateWithinApp("/ats");
  await page.getByText(/مثال على سيرة تجريبية|Example: demo resume/i).waitFor();

  assert(!violations.length, `visitor parity network/privacy violations: ${violations.join("; ")}`);
  console.log(
    "Guest visitor parity passed: Noura, templates, local resume, preview/print, ATS, import, jobs, cover letters, deletion, storage, and network boundaries.",
  );
} finally {
  await browser.close();
}
