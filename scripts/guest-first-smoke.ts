import {
  clearGuestResumeSession,
  createGuestResumeSession,
  readGuestResumeSession,
  upsertGuestResumeSession,
} from "../src/lib/guest-session";
import { draftToGuestResumeData, type ImportDraft } from "../src/lib/import-map";
import { emptyResumeData } from "../src/lib/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

clearGuestResumeSession();
assert(readGuestResumeSession() === null, "guest session must start empty");
const created = createGuestResumeSession("en");
assert(created.privacyState === "memory-only", "guest session must default to memory-only");
assert(created.resumeDocument === null, "guest session must not invent a resume document");
assert(created.direction === "ltr", "English guest session must use LTR");
assert(Date.parse(created.expiresAt) > Date.parse(created.createdAt), "guest session must expire");

const resume = {
  id: "guest-test",
  ownerId: "guest",
  title: "Imported Product Analyst resume",
  templateId: "classic-ats",
  language: "en" as const,
  data: emptyResumeData(),
  status: "draft" as const,
  completionScore: 0,
  atsScore: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const synced = upsertGuestResumeSession(resume, { currentJourney: "import", currentStep: 2 });
assert(
  synced.resumeDocument?.id === "guest-test",
  "guest session must reference the local resume only",
);
assert(synced.currentJourney === "import", "guest journey state must remain local");
clearGuestResumeSession();
assert(
  readGuestResumeSession() === null,
  "session delete must remove metadata and resume reference",
);

const draft: ImportDraft = {
  sourceType: "device_txt",
  sourceLabel: "Synthetic file",
  detectedLanguage: "en",
  textLength: 200,
  fields: [
    {
      key: "fullName",
      label: { ar: "الاسم الكامل", en: "Full name" },
      value: "TEST_PERSON_001",
      confidence: "high",
      include: true,
    },
    {
      key: "email",
      label: { ar: "البريد", en: "Email" },
      value: "test.person@example.test",
      confidence: "high",
      include: false,
    },
    {
      key: "headline",
      label: { ar: "المسمى", en: "Headline" },
      value: "Product Analyst",
      confidence: "high",
      include: true,
    },
  ],
  experience: [
    {
      id: "exp-1",
      kind: "experience",
      value: { id: "exp-1", role: "Product Analyst", company: "Evidence Co", bullets: [] },
      confidence: "high",
      duplicate: false,
      include: true,
    },
  ],
  education: [],
  skills: [
    {
      id: "skill-1",
      kind: "skills",
      value: { id: "skill-1", name: "SQL" },
      confidence: "high",
      duplicate: false,
      include: true,
    },
  ],
  languages: [],
  certificates: [],
  projects: [],
  missingSections: ["education"],
};
const data = draftToGuestResumeData(draft);
assert(
  data.personal.fullName === "TEST_PERSON_001",
  "approved imported name must be local resume data",
);
assert(data.personal.email === "", "unapproved imported email must not enter the local resume");
assert(
  data.personal.jobTitle === "Product Analyst",
  "approved headline must set the local job title",
);
assert(data.targetJob === "Product Analyst", "approved headline must set the local target role");
assert(
  data.experience.length === 1 && data.skills.length === 1,
  "approved list candidates must be preserved",
);

console.log(
  "Guest-first smoke passed: memory session, deletion, and approved local import mapping.",
);
