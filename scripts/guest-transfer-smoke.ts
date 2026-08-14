import {
  buildGuestExport,
  buildGuestMigrationPreview,
  buildGuestPlainText,
} from "../src/lib/guest-transfer";
import { emptyResumeData, type Resume } from "../src/lib/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const data = emptyResumeData();
data.personal = {
  ...data.personal,
  fullName: "SYNTHETIC_TRANSFER_PERSON",
  jobTitle: "Product Analyst",
};
data.summary = "Synthetic local export fixture.";
data.skills = [{ id: "skill-1", name: "SQL", level: "Advanced" }];

const guestResume: Resume = {
  id: "guest-synthetic-transfer",
  ownerId: "guest",
  title: "SYNTHETIC_TRANSFER_RESUME",
  templateId: "classic-ats",
  language: "en",
  data,
  status: "draft",
  completionScore: 42,
  atsScore: 67,
  lastViewedAt: null,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

const exported = buildGuestExport([guestResume], new Date("2026-08-14T01:02:03.000Z"));
assert(exported.schemaVersion === "1.0", "guest export must declare a stable schema version");
assert(exported.storage === "guest-memory-session", "guest export must label its local origin");
assert(exported.resumes.length === 1, "guest export must include the current local resume");
assert(
  exported.resumes[0]?.title === guestResume.title,
  "guest export must preserve resume content",
);
const serialized = JSON.stringify(exported);
assert(
  !serialized.includes(guestResume.id),
  "portable export must omit the local guest identifier",
);
assert(!serialized.includes('"ownerId"'), "portable export must omit owner/session metadata");
assert(
  !serialized.includes("seerati.session-recovery"),
  "portable export must omit recovery metadata",
);

const text = buildGuestPlainText([guestResume]);
assert(text.includes("SYNTHETIC_TRANSFER_RESUME"), "ATS export must include the resume heading");
assert(text.includes("Product Analyst"), "ATS export must include current resume content");

const ready = buildGuestMigrationPreview([guestResume], 1, 3);
assert(ready.reason === "ready", "migration preview must be ready when account capacity exists");
assert(
  ready.transferable.length === 1 && ready.blocked.length === 0,
  "preview must identify exact transferable resumes",
);

const limited = buildGuestMigrationPreview([guestResume], 3, 3);
assert(
  limited.reason === "account_limit",
  "migration preview must block copies when account capacity is exhausted",
);
assert(
  limited.transferable.length === 0 && limited.blocked.length === 1,
  "blocked data must remain visible for review",
);

const empty = buildGuestMigrationPreview([], 0, 3);
assert(empty.reason === "no_guest_data", "migration preview must not create an empty transfer");

console.log(
  "Guest transfer smoke passed: portable export shape, ATS text, and review-first migration limits.",
);
