import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const outputDir = process.env.LIGHTHOUSE_OUTPUT_DIR || "artifacts/lighthouse";
const routes = [
  "/",
  "/templates",
  "/features",
  "/privacy",
  "/assistant",
  "/jobs",
  "/cover-letters",
];
const numberOfRuns = 3;
const blockingCategories = new Map([
  ["accessibility", 0.9],
  ["best-practices", 0.9],
]);

await mkdir(outputDir, { recursive: true });

const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
});

const summary = [];
const warnings = [];
const failures = [];

try {
  for (const route of routes) {
    for (let run = 1; run <= numberOfRuns; run += 1) {
      const url = `${baseUrl}${route}`;
      const result = await lighthouse(
        url,
        {
          port: chrome.port,
          logLevel: "error",
          output: "json",
        },
        {
          extends: "lighthouse:default",
          settings: {
            onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
            formFactor: "desktop",
            screenEmulation: { disabled: true },
            throttlingMethod: "simulate",
          },
        },
      );

      if (!result?.lhr || typeof result.report !== "string") {
        throw new Error(`Lighthouse did not return a report for ${url}.`);
      }

      const lhr = result.lhr;
      const pathname = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      const filename = `${pathname}-run-${run}.report.json`;
      await writeFile(join(outputDir, filename), result.report);

      const metrics = {
        url,
        route,
        run,
        performance: lhr.categories.performance.score,
        accessibility: lhr.categories.accessibility.score,
        bestPractices: lhr.categories["best-practices"].score,
        seo: lhr.categories.seo.score,
        largestContentfulPaint: lhr.audits["largest-contentful-paint"].numericValue,
        cumulativeLayoutShift: lhr.audits["cumulative-layout-shift"].numericValue,
        interactive: lhr.audits.interactive.numericValue,
        report: filename,
      };
      summary.push(metrics);

      for (const [category, minimum] of blockingCategories) {
        const score = lhr.categories[category].score;
        if (score === null || score < minimum) {
          failures.push(
            `${route} run ${run}: ${category} score ${score ?? "null"} is below ${minimum}.`,
          );
        }
      }

      if (metrics.performance === null || metrics.performance < 0.8) {
        warnings.push(`${route} run ${run}: performance score below 0.80.`);
      }
      if (metrics.largestContentfulPaint === null || metrics.largestContentfulPaint > 4000) {
        warnings.push(`${route} run ${run}: LCP exceeds 4,000 ms.`);
      }
      if (metrics.cumulativeLayoutShift === null || metrics.cumulativeLayoutShift > 0.1) {
        warnings.push(`${route} run ${run}: CLS exceeds 0.10.`);
      }
      if (metrics.interactive === null || metrics.interactive > 5000) {
        warnings.push(`${route} run ${run}: interactive time exceeds 5,000 ms.`);
      }
      if (metrics.seo === null || metrics.seo < 0.9) {
        warnings.push(`${route} run ${run}: SEO score below 0.90.`);
      }
    }
  }
} finally {
  await chrome.kill();
}

const output = {
  baseUrl,
  numberOfRuns,
  generatedAt: new Date().toISOString(),
  results: summary,
  warnings,
  failures,
};
await writeFile(join(outputDir, "summary.json"), `${JSON.stringify(output, null, 2)}\n`);

for (const warning of warnings) {
  console.warn(`Lighthouse warning: ${warning}`);
}
for (const failure of failures) {
  console.error(`Lighthouse failure: ${failure}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
