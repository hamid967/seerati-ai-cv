import { readFile } from "node:fs/promises";
const files = process.argv.slice(2);
for (const file of files) {
  const report = JSON.parse(await readFile(file, "utf8"));
  const audits = report.audits ?? {};
  const score = (id) =>
    report.categories?.[id]?.score == null ? null : Math.round(report.categories[id].score * 100);
  const numeric = (id) =>
    audits[id]?.numericValue == null ? null : Math.round(audits[id].numericValue);
  console.log(
    JSON.stringify({
      file,
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
      lcp: numeric("largest-contentful-paint"),
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      tbt: numeric("total-blocking-time"),
      interactive: numeric("interactive"),
      lcpElement: audits["largest-contentful-paint"]?.details?.items?.[0]?.node?.snippet ?? null,
    }),
  );
}
