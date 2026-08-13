import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const routes = ["/", "/templates", "/assistant"];

const browser = await chromium.launch({ headless: true });
const results = [];
for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => {
    window.__phase13Lcp = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__phase13Lcp.push({
            startTime: entry.startTime,
            size: entry.size,
            element: entry.element?.tagName ?? null,
            id: entry.element?.id ?? null,
            className:
              typeof entry.element?.className === "string" ? entry.element.className : null,
            text: entry.element?.textContent?.slice(0, 120) ?? null,
          });
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}
  });
  const started = performance.now();
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const result = await page.evaluate(() => {
    const resources = performance.getEntriesByType("resource");
    const longTasks = performance.getEntriesByType("longtask");
    const navigation = performance.getEntriesByType("navigation")[0];
    return {
      domNodes: document.querySelectorAll("*").length,
      domDepth: (() => {
        let max = 0;
        const walk = (node, depth) => {
          max = Math.max(max, depth);
          for (const child of node.children ?? []) walk(child, depth + 1);
        };
        walk(document.documentElement, 0);
        return max;
      })(),
      textLength: document.body?.innerText?.length ?? 0,
      scripts: [...document.scripts].map((script) => script.src).filter(Boolean),
      resourceCount: resources.length,
      resourceTransferBytes: resources.reduce((sum, item) => sum + (item.transferSize || 0), 0),
      jsResourceCount: resources.filter((item) => item.name.includes(".js")).length,
      jsTransferBytes: resources
        .filter((item) => item.name.includes(".js"))
        .reduce((sum, item) => sum + (item.transferSize || 0), 0),
      longTaskCount: longTasks.length,
      longTaskMs: longTasks.reduce((sum, item) => sum + item.duration, 0),
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
      loadMs: navigation?.loadEventEnd ?? null,
      lcpEntries: window.__phase13Lcp ?? [],
      hydrationMarkers: document.querySelectorAll("[data-hydrated], [data-reactroot]").length,
    };
  });
  results.push({ route, wallMs: Math.round(performance.now() - started), ...result });
  await page.close();
}
await browser.close();
console.log(JSON.stringify({ baseUrl, results }, null, 2));
