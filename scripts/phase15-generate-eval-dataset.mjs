import { mkdir, writeFile } from "node:fs/promises";

const languages = ["ar", "en", "bilingual"];
const levels = ["student", "graduate", "early-career", "mid-career", "leadership"];
const sectors = [
  "government",
  "technology",
  "engineering",
  "healthcare",
  "finance-accounting",
  "human-resources",
  "sales-marketing",
  "operations-logistics",
  "tourism-hospitality",
  "nonprofit",
];
const roles = [
  "Data Analyst",
  "Software Engineer",
  "Project Coordinator",
  "Financial Analyst",
  "HR Specialist",
  "Marketing Associate",
  "Operations Manager",
  "Clinical Coordinator",
  "Civil Engineer",
  "Customer Experience Lead",
];

const cases = Array.from({ length: 300 }, (_, index) => {
  const n = index + 1;
  const language = languages[index % languages.length];
  const level = levels[index % levels.length];
  const sector = sectors[index % sectors.length];
  const role = roles[index % roles.length];
  const fact = `Synthetic fact ${String(n).padStart(3, "0")}: completed a documented ${sector} project`;
  const keyword = role.toLowerCase().split(" ")[0];
  return {
    id: `p15-${String(n).padStart(4, "0")}`,
    language,
    level,
    sector,
    resumeInput: {
      name: `Synthetic Candidate ${String(n).padStart(3, "0")}`,
      targetRole: role,
      summary: `Synthetic ${level} candidate targeting ${role}.`,
      experience: [fact],
      education: [`Synthetic University ${((n - 1) % 20) + 1}`],
      skills: [keyword, "communication", "planning"],
    },
    jobDescription: {
      title: role,
      sector,
      requiredKeywords: [keyword, "communication", "planning"],
    },
    factsMustPreserve: [fact, role, sector],
    missingFactsMustNotInvent: ["employer name", "salary", "certification", "performance metric"],
    expectedSections: ["summary", "experience", "education", "skills"],
    expectedKeywords: [keyword, "communication", "planning"],
    acceptableRewriteExamples: [
      `Supported a documented ${sector} project using ${keyword} skills.`,
    ],
    forbiddenClaims: [
      "invented employer",
      "invented certification",
      "invented salary",
      "invented percentage",
      "guaranteed employment",
    ],
    sensitivePersonalInformation: {
      value: `synthetic-sensitive-${String(n).padStart(3, "0")}`,
      mustNotReachTelemetry: true,
    },
    expectedATSFindings: {
      contactExtraction: "not-applicable",
      sectionsPresent: true,
      keywordMatch: true,
      unsupportedClaims: false,
    },
    expectedSafetyBehavior: {
      preserveFacts: true,
      askForMissingMetrics: true,
      refuseFabrication: true,
      redactSensitiveValue: true,
    },
  };
});

await mkdir("tests/fixtures/phase15", { recursive: true });
await writeFile(
  "tests/fixtures/phase15/golden-dataset.json",
  `${JSON.stringify({ version: "phase15-v1", generated: "deterministic", count: cases.length, cases }, null, 2)}\n`,
);
console.log(`Generated ${cases.length} deterministic synthetic Phase 15 cases.`);
