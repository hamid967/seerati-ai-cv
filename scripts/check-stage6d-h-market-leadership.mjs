import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const passport = read("src/lib/career-passport.ts");
const passportRoute = read("src/routes/career-passport.tsx");
const arabic = read("src/lib/arabic-career-intelligence.ts");
const arabicRoute = read("src/routes/arabic-intelligence.tsx");
const nav = read("src/lib/app-navigation.ts");
const privacy = read("supabase/migrations/20260811034000_stage6f_private_career_content.sql");
const shell = read("src/components/app/app-shell.tsx");
const accessibility = read("src/accessibility-performance.css");
const analytics = read("src/lib/product-analytics.ts");
const bridge = read("src/components/app/product-analytics-bridge.tsx");
const guides = read("src/routes/career-guides.tsx");
const sitemap = read("src/routes/sitemap[.]xml.ts");
const scorecard = read("docs/SAUDI_LAUNCH_SCORECARD.md");

const checks = [
  [passport.includes("normalizeSaudiPhone"), "6D Saudi phone normalization exists"],
  [passport.includes('format: "seerati-career-passport-v1"'), "6D portable passport export contract exists"],
  [passportRoute.includes("لا يتصل تلقائيًا بأي منصة حكومية"), "6D government-integration disclaimer exists"],
  [nav.includes('id: "career-passport"') && nav.includes('to: "/career-passport"'), "6D navigation is wired"],
  [arabic.includes("Never invent numbers") || arabic.includes("Never invent"), "6E anti-fabrication guidance exists"],
  [arabic.includes("mixedScriptNoise") && arabic.includes("duplicate-skills"), "6E bilingual and skill-quality checks exist"],
  [arabicRoute.includes("not a hiring score") || arabicRoute.includes("ليس تقييم توظيف"), "6E explicitly avoids hiring-score claims"],
  [nav.includes('id: "arabic-intelligence"') && nav.includes('to: "/arabic-intelligence"'), "6E navigation is wired"],
  [privacy.includes('drop policy if exists "own facts select"'), "6F historical Career Facts admin read policy is removed"],
  [privacy.includes('drop policy if exists "own evidence select"'), "6F historical Career Evidence admin read policy is removed"],
  [privacy.includes('drop policy if exists "own activity select"'), "6F historical Agent Activity admin read policy is removed"],
  [privacy.includes('drop policy if exists "own versions select"'), "6F historical Resume Versions admin read policy is removed"],
  [(privacy.match(/using \(user_id = auth\.uid\(\)\);/g) ?? []).length >= 4, "6F raw-content SELECT policies are owner-only"],
  [privacy.includes("admin_career_privacy_metrics"), "6F aggregate-only admin metrics function exists"],
  [shell.includes('href="#app-main-content"') && shell.includes('tabIndex={-1}'), "6G keyboard skip target is wired"],
  [accessibility.includes(":focus-visible") && accessibility.includes("prefers-reduced-motion"), "6G focus and reduced-motion safeguards exist"],
  [accessibility.includes("pointer: coarse") && accessibility.includes("content-visibility: auto"), "6G mobile touch and off-screen rendering safeguards exist"],
  [analytics.includes("FORBIDDEN_KEYS") && analytics.includes("sanitizeAnalyticsProperties"), "6H analytics payload sanitizer exists"],
  [bridge.includes("trackProductEvent") && bridge.includes("authenticated_surface"), "6H coarse app analytics bridge is active"],
  [guides.includes("No resume formula can guarantee") || guides.includes("لا توجد صيغة واحدة تضمن"), "6H public guidance avoids employment guarantees"],
  [sitemap.includes('/career-guides'), "6H career guide hub is indexed in sitemap"],
  [scorecard.includes("manual WCAG 2.2 audit") && scorecard.includes("legal review"), "6H launch scorecard preserves manual/legal gates"],
];

for (const [ok, label] of checks) {
  if (!ok) throw new Error(`FAIL: ${label}`);
  console.log(`PASS  ${label}`);
}

const forbiddenAnalytics = ["fullName", "email", "phone", "summary", "jobDescription", "evidenceText"];
for (const key of forbiddenAnalytics) {
  if (bridge.includes(`${key}:`)) throw new Error(`FAIL: analytics bridge includes sensitive property ${key}`);
}

console.log("Stage 6D-H Saudi market leadership guard passed");
