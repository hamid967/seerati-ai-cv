import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4202";
const routes = ["/", "/templates", "/assistant"];
const output = process.env.OUTPUT ?? "/tmp/phase14-assistant-profile.json";

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const resources = [];
    const longTasks = [];
    page.on("response", async (response) => {
      const request = response.request();
      if (request.resourceType() === "script" || request.resourceType() === "stylesheet") {
        resources.push({
          url: response.url(),
          type: request.resourceType(),
          status: response.status(),
          size: Number(response.headers()["content-length"] ?? 0),
        });
      }
    });
    await page.addInitScript(() => {
      window.__phase14LongTasks = [];
      window.__phase14Lcp = null;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__phase14LongTasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((list) => {
        const entry = list.getEntries().at(-1);
        if (entry)
          window.__phase14Lcp = {
            startTime: entry.startTime,
            element: entry.element?.tagName ?? null,
            text: entry.element?.textContent?.trim().slice(0, 100) ?? null,
          };
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => {
      const lcp = performance.getEntriesByType("largest-contentful-paint").at(-1);
      const cls = performance
        .getEntriesByType("layout-shift")
        .reduce((sum, entry) => sum + (entry.hadRecentInput ? 0 : entry.value), 0);
      const scripts = [...document.scripts].map((script) => script.src).filter(Boolean);
      return {
        route: location.pathname,
        title: document.title,
        lcp:
          window.__phase14Lcp ??
          (lcp
            ? {
                startTime: lcp.startTime,
                element: lcp.element?.tagName ?? null,
                text: lcp.element?.textContent?.trim().slice(0, 100) ?? null,
              }
            : null),
        domNodes: document.querySelectorAll("*").length,
        interactiveElements: document.querySelectorAll(
          'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])',
        ).length,
        scripts,
        visibleText: document.body.innerText.slice(0, 240),
        longTasks: window.__phase14LongTasks ?? [],
      };
    });
    results.push({ ...metrics, resources, longTasks: metrics.longTasks });
    await page.close();
  }
} finally {
  await browser.close();
}
await mkdir(new URL(".", `file://${output}`).pathname, { recursive: true }).catch(() => {});
await writeFile(
  output,
  JSON.stringify({ base, generatedAt: new Date().toISOString(), results }, null, 2),
);
console.log(`Wrote ${output}`);
for (const result of results) {
  console.log(
    `${result.route}: LCP=${result.lcp?.startTime ?? "n/a"}ms DOM=${result.domNodes} interactive=${result.interactiveElements} scripts=${result.resources.filter((r) => r.type === "script").length}`,
  );
}
