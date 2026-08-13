import { readFile, mkdir, writeFile } from "node:fs/promises";
import crypto from "node:crypto";

const datasetPath = "tests/fixtures/phase15/golden-dataset.json";
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const failures = [];
const requiredSections = new Set(["summary", "experience", "education", "skills"]);
const requiredLanguages = new Set(["ar", "en", "bilingual"]);
const requiredLevels = new Set(["student", "graduate", "early-career", "mid-career", "leadership"]);
const requiredSectors = new Set([
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
]);

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(dataset.version === "phase15-v1", "dataset version must be phase15-v1");
assert(dataset.generated === "deterministic", "dataset must be deterministic");
assert(dataset.count === 300, "dataset count must be 300");
assert(dataset.cases.length === 300, "cases array must contain 300 records");

const counts = (key) =>
  dataset.cases.reduce((result, item) => {
    result[item[key]] = (result[item[key]] ?? 0) + 1;
    return result;
  }, {});

for (const [key, allowed] of [
  ["language", requiredLanguages],
  ["level", requiredLevels],
  ["sector", requiredSectors],
]) {
  const values = counts(key);
  for (const value of allowed)
    assert(
      values[value] === (key === "language" ? 100 : key === "level" ? 60 : 30),
      `${key} distribution invalid for ${value}`,
    );
  assert(
    Object.keys(values).every((value) => allowed.has(value)),
    `${key} contains an unknown value`,
  );
}

for (const item of dataset.cases) {
  assert(/^p15-\d{4}$/.test(item.id), `${item.id}: invalid id`);
  assert(item.resumeInput.name.startsWith("Synthetic Candidate"), `${item.id}: non-synthetic name`);
  assert(item.factsMustPreserve.length >= 3, `${item.id}: missing fact anchors`);
  assert(item.missingFactsMustNotInvent.length >= 4, `${item.id}: missing anti-invention anchors`);
  assert(
    item.expectedSections.every((section) => requiredSections.has(section)),
    `${item.id}: unknown section`,
  );
  assert(item.forbiddenClaims.length >= 5, `${item.id}: insufficient forbidden claims`);
  assert(
    item.sensitivePersonalInformation.mustNotReachTelemetry === true,
    `${item.id}: sensitive telemetry guard missing`,
  );
  assert(
    item.expectedSafetyBehavior.refuseFabrication === true,
    `${item.id}: fabrication refusal missing`,
  );
}

const serialized = JSON.stringify(dataset);
const datasetHash = crypto.createHash("sha256").update(serialized).digest("hex");
const result = {
  datasetVersion: dataset.version,
  caseCount: dataset.cases.length,
  datasetHash,
  languageCounts: counts("language"),
  levelCounts: counts("level"),
  sectorCounts: counts("sector"),
  failures,
  status: failures.length === 0 ? "PASS" : "FAIL",
  note: "This is fixture/schema validation, not evidence of AI output quality or ATS accuracy.",
};

await mkdir("audit/phase15", { recursive: true });
await writeFile(
  "audit/phase15/evaluation-fixture-results.json",
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
