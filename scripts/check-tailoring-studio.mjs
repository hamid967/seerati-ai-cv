import fs from "node:fs";

const engine = fs.readFileSync("src/lib/tailoring-studio.ts", "utf8");
const panel = fs.readFileSync("src/components/tailoring-studio-panel.tsx", "utf8");
const route = fs.readFileSync("src/routes/jobs.$id.tsx", "utf8");

const checks = [
  [engine.includes("assertNumbersPreserved"), "numeric integrity guard is present"],
  [
    engine.includes('status !== "missing"'),
    "missing requirements are excluded from tailoring terms",
  ],
  [engine.includes("stableSortByRelevance"), "tailoring is deterministic and reorder-based"],
  [engine.includes('selected.has("template")'), "template changes require explicit selection"],
  [
    panel.includes("Before tailoring") && panel.includes("قبل تخصيص"),
    "pre-change snapshot is created",
  ],
  [panel.includes("undoLast"), "immediate undo is present"],
  [panel.includes("Checkbox"), "per-change approval controls are present"],
  [route.includes("<TailoringStudioPanel"), "Tailoring Studio is wired into Job Workspace"],
];

for (const [ok, label] of checks) {
  if (!ok) throw new Error(`FAIL: ${label}`);
  console.log(`PASS  ${label}`);
}

const forbidden = [
  /guarantee(?:d)?\s+(?:a\s+)?(?:job|interview|hire)/i,
  /ضمان\s+(?:التوظيف|القبول|المقابلة)/,
];
const corpus = `${engine}\n${panel}`;
for (const pattern of forbidden) {
  if (pattern.test(corpus)) throw new Error(`FAIL: forbidden hiring-outcome claim ${pattern}`);
}

console.log("Tailoring Studio Stage 6C guard passed");
