import {
  applicationChecklist,
  applicationChecklistProgress,
  applicationLaunchpadPrivacyCopy,
} from "../src/lib/application-launchpad";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const ar = applicationChecklist("ar");
const en = applicationChecklist("en");

assert(ar.length === 5, "Arabic checklist must contain five review steps");
assert(en.length === 5, "English checklist must contain five review steps");
assert(
  new Set(ar.map((item) => item.id)).size === ar.length,
  "Checklist identifiers must be unique",
);
assert(ar[0]?.id === "target", "Checklist must begin with the job target");
assert(ar.at(-1)?.id === "review", "Checklist must end with final review");

const empty = applicationChecklistProgress(new Set(), "ar");
assert(empty.completed === 0 && empty.total === 5 && !empty.ready, "Empty checklist is not ready");

const partial = applicationChecklistProgress(new Set(["target", "resume"]), "en");
assert(
  partial.completed === 2 && partial.total === 5 && !partial.ready,
  "Partial checklist reports progress",
);

const complete = applicationChecklistProgress(new Set(en.map((item) => item.id)), "en");
assert(complete.completed === 5 && complete.ready, "Complete checklist is ready for review");

const privacyAr = applicationLaunchpadPrivacyCopy("ar");
const privacyEn = applicationLaunchpadPrivacyCopy("en");
assert(privacyAr.includes("لا تحفظ"), "Arabic disclosure must state that content is not saved");
assert(
  privacyEn.includes("does not save"),
  "English disclosure must state that content is not saved",
);
assert(
  !privacyAr.includes("localStorage"),
  "Guest disclosure must not imply persistent guest storage",
);

console.log(
  "Phase 21 application center smoke passed: checklist, progress, bilingual copy, and local privacy boundary.",
);
