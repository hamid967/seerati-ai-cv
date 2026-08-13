import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const lighthouseDir = path.join(root, ".lighthouseci");
const publicDir = path.join(root, ".output", "public");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

const reports = [];
for (const file of (await readdir(lighthouseDir)).filter(
  (name) => name.endsWith(".json") && name.startsWith("lhr-"),
)) {
  const report = JSON.parse(await readFile(path.join(lighthouseDir, file), "utf8"));
  const audits = report.audits ?? {};
  const lcpElement = audits["largest-contentful-paint-element"]?.details?.items?.[0] ?? {};
  const domItem = audits["dom-size"]?.details?.items?.[0] ?? {};
  reports.push({
    url: report.requestedUrl,
    performance: report.categories?.performance?.score,
    lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
    lcpElement: lcpElement.node?.snippet ?? lcpElement.node?.selector ?? null,
    lcpPhaseMs: audits["lcp-breakdown"]?.details?.items?.[0] ?? null,
    tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
    scriptBootupMs: audits["bootup-time"]?.numericValue ?? null,
    domNodes: domItem.totalBodyElements ?? null,
    domDepth: domItem.maxDepth ?? null,
    domWidth: domItem.maxWidth ?? null,
    mainThreadMs: audits["mainthread-work-breakdown"]?.numericValue ?? null,
    renderBlocking:
      audits["render-blocking-resources"]?.details?.items?.map((item) => item.url) ?? [],
  });
}

const assets = [];
for (const file of await walk(publicDir)) {
  if (!/\.(js|css|jpg|jpeg|png|webp|woff2?)$/i.test(file)) continue;
  const info = await stat(file);
  assets.push({ path: path.relative(root, file), bytes: info.size });
}
assets.sort((a, b) => b.bytes - a.bytes);

const grouped = new Map();
for (const item of reports) {
  const route = new URL(item.url).pathname;
  const current = grouped.get(route) ?? [];
  current.push(item);
  grouped.set(route, current);
}

const summary = [...grouped.entries()].map(([route, items]) => ({
  route,
  runs: items.length,
  performance: items.map((item) => item.performance),
  lcpMs: items.map((item) => item.lcpMs),
  lcpElements: [...new Set(items.map((item) => item.lcpElement).filter(Boolean))],
  tbtMs: items.map((item) => item.tbtMs),
  scriptBootupMs: items.map((item) => item.scriptBootupMs),
  domNodes: items.map((item) => item.domNodes),
  domDepth: items.map((item) => item.domDepth),
  mainThreadMs: items.map((item) => item.mainThreadMs),
}));

console.log(
  JSON.stringify(
    { generatedAt: new Date().toISOString(), summary, topAssets: assets.slice(0, 40) },
    null,
    2,
  ),
);
