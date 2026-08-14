import {
  SYNTHETIC_SPECIALTY_TAXONOMY,
  createSyntheticCareerProfile,
  hasUnapprovedSampleData,
  searchSyntheticSpecialties,
  syntheticReadiness,
  updateSyntheticFieldMetadata,
  type SyntheticExperienceLevel,
} from "../src/modules/synthetic-resume";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const levels: SyntheticExperienceLevel[] = ["student", "graduate", "mid", "manager"];

assert(
  SYNTHETIC_SPECIALTY_TAXONOMY.length === 6,
  "initial taxonomy must contain exactly six scoped specialties",
);
assert(
  searchSyntheticSpecialties("محاسب").some((specialty) => specialty.id === "accounting"),
  "Arabic specialty search must find accounting",
);
assert(
  searchSyntheticSpecialties("developer").some(
    (specialty) => specialty.id === "software-development",
  ),
  "English specialty search must find software development",
);

for (const specialty of SYNTHETIC_SPECIALTY_TAXONOMY) {
  for (const language of ["ar", "en"] as const) {
    for (const level of levels) {
      const profile = createSyntheticCareerProfile({
        specialtyId: specialty.id,
        experienceLevel: level,
        language,
        goal: "job-application",
      });
      assert(
        profile.templates.length === 4,
        `${specialty.id}/${level} must return four template options`,
      );
      assert(
        profile.resumeData.personal.email === "example@email.com",
        "sample must use documented example email",
      );
      assert(
        profile.resumeData.personal.phone === "05XXXXXXXX",
        "sample must use masked phone placeholder",
      );
      assert(
        profile.resumeData.personal.fullName.includes(language === "ar" ? "اسمك" : "Your"),
        "sample name must be an explicit placeholder",
      );
      assert(
        Object.keys(profile.metadata.fieldMap).length > 8,
        "all material sample fields need review metadata",
      );
      assert(hasUnapprovedSampleData(profile.metadata), "new sample must never be export-approved");
      assert(
        syntheticReadiness(profile.metadata).state === "fully-sample",
        "new sample must start fully sample",
      );
    }
  }
}

const profile = createSyntheticCareerProfile({
  specialtyId: "software-development",
  experienceLevel: "graduate",
  language: "en",
  goal: "job-application",
});
const firstCore = profile.metadata.coreFieldPaths[0]!;
const confirmed = updateSyntheticFieldMetadata(
  profile.metadata,
  firstCore,
  "Verified example value",
);
assert(
  confirmed.fieldMap[firstCore]?.status === "user-confirmed",
  "field confirmation must be explicit",
);
assert(confirmed.fieldMap[firstCore]?.source === "user", "confirmed field must report user source");
assert(confirmed.fieldMap[firstCore]?.exportApproved, "confirmed field can be export-approved");
assert(
  hasUnapprovedSampleData(confirmed),
  "one confirmed field must not silently approve the remaining sample data",
);

const serialized = JSON.stringify(profile);
assert(
  !/Saudi Aramco|King Saud University|example-company\.com/i.test(serialized),
  "synthetic library must not claim real employers, universities, or active company links",
);
console.log(
  "Synthetic resume smoke passed: taxonomy, deterministic profiles, review metadata, template options, and export safety.",
);
