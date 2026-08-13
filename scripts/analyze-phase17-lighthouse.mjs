import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dir = process.argv[2] ?? "artifacts/lighthouse";
const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
const grouped = new Map();
for (const file of files) {
  const report = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  const url = new URL(report.finalDisplayedUrl ?? report.finalUrl ?? "http://localhost/");
  const route = url.pathname || "/";
  const entry = grouped.get(route) ?? {
    lcp: [],
    cls: [],
    performance: [],
    accessibility: [],
    bestPractices: [],
    seo: [],
  };
  entry.lcp.push(report.audits?.["largest-contentful-paint"]?.numericValue ?? NaN);
  entry.cls.push(report.audits?.["cumulative-layout-shift"]?.numericValue ?? NaN);
  entry.performance.push((report.categories?.performance?.score ?? 0) * 100);
  entry.accessibility.push((report.categories?.accessibility?.score ?? 0) * 100);
  entry.bestPractices.push((report.categories?.["best-practices"]?.score ?? 0) * 100);
  entry.seo.push((report.categories?.seo?.score ?? 0) * 100);
  grouped.set(route, entry);
}
const median = (values) => {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
};
const round = (value, digits = 2) => (value == null ? null : Number(value.toFixed(digits)));
const rows = [...grouped.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([route, values]) => ({
    route,
    runs: values.lcp.length,
    medianLcpMs: round(median(values.lcp), 0),
    medianCls: round(median(values.cls), 3),
    medianPerformance: round(median(values.performance), 0),
    medianAccessibility: round(median(values.accessibility), 0),
    medianBestPractices: round(median(values.bestPractices), 0),
    medianSeo: round(median(values.seo), 0),
  }));
console.table(rows);
await writeFile(
  "audit/phase17/lighthouse-summary.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2) + "\n",
);
