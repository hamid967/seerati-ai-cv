#!/usr/bin/env node
import { readFileSync } from "node:fs";

const route = readFileSync("src/routes/templates.tsx", "utf8");
const component = readFileSync("src/components/template-gallery-3d.tsx", "utf8");
const css = readFileSync("src/template-gallery-3d.css", "utf8");

const failures = [];
const requireText = (source, token, message) => {
  if (!source.includes(token)) failures.push(message);
};

requireText(route, "TemplateGallery3D", "templates route must render the 3D gallery");
requireText(component, "MAX_COMPARE = 3", "comparison must stay capped at three templates");
requireText(component, "previewLanguage", "gallery must support Arabic/English preview switching");
requireText(component, "onPointerMove", "gallery must expose pointer-based depth interaction");
requireText(component, "pointerType === \"touch\"", "touch devices must avoid pointer tilt calculations");
requireText(component, "sample data", "gallery must disclose sample preview data in English");
requireText(component, "بيانات نموذجية", "gallery must disclose sample preview data in Arabic");
requireText(css, "perspective:", "gallery CSS must define perspective depth");
requireText(css, "@media (prefers-reduced-motion: reduce)", "gallery must support reduced motion");
requireText(css, "@media print", "gallery must define print cleanup");
requireText(css, "@media (max-width: 767px)", "gallery must include a mobile-specific fallback");
requireText(css, "[dir=\"rtl\"]", "gallery must include RTL-specific transform handling");
requireText(css, ".seerati-compare-dock", "comparison dock styles are missing");
requireText(css, ".seerati-cinematic-preview", "cinematic preview styles are missing");

if (failures.length) {
  for (const failure of failures) console.error(`FAIL  ${failure}`);
  console.error(`\n${failures.length} gallery guard(s) failed.`);
  process.exit(1);
}

console.log("PASS  3D template gallery is wired to /templates");
console.log("PASS  comparison is capped at three templates");
console.log("PASS  Arabic/English preview controls are present");
console.log("PASS  pointer depth has touch/mobile fallbacks");
console.log("PASS  reduced-motion, RTL and print safeguards are present");
console.log("PASS  sample preview data is disclosed in Arabic and English");
console.log("\n3D template gallery quality guard OK.");
