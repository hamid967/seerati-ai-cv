import { parseAiRequest } from "../src/lib/ai-validate";

let failures = 0;

function pass(label: string) {
  console.log(`PASS ${label}`);
}

function fail(label: string) {
  failures += 1;
  console.error(`FAIL ${label}`);
}

function expectValue(label: string, run: () => boolean) {
  try {
    if (run()) pass(label);
    else fail(label);
  } catch {
    fail(label);
  }
}

function expectThrow(label: string, run: () => unknown) {
  try {
    run();
    fail(label);
  } catch {
    pass(label);
  }
}

const normalized = parseAiRequest({
  task: "summary",
  lang: "en",
  input: "Rewrite this professional summary.",
  context: {
    targetRole: "Product manager",
    personal: { jobTitle: "Product analyst", fullName: "Synthetic Person" },
    answers: { years: "three", industry: "software" },
    jobDescription: "Coordinate a roadmap and improve product discovery.",
    hiddenResumePayload: "must not cross the boundary",
  },
});

expectValue(
  "keeps allowlisted target role",
  () => normalized.context?.targetRole === "Product manager",
);
expectValue(
  "keeps only the personal job title",
  () => normalized.context?.personal?.jobTitle === "Product analyst",
);
expectValue(
  "drops non-allowlisted resume fields",
  () => !JSON.stringify(normalized.context).includes("Synthetic Person"),
);
expectValue(
  "drops arbitrary context properties",
  () => !JSON.stringify(normalized.context).includes("must not cross the boundary"),
);
expectThrow("rejects nested personal fields with a non-string job title", () =>
  parseAiRequest({
    task: "summary",
    lang: "ar",
    input: "نص",
    context: { personal: { jobTitle: 7 } },
  }),
);
expectThrow("rejects an oversized job description", () =>
  parseAiRequest({
    task: "summary",
    lang: "ar",
    input: "نص",
    context: { jobDescription: "a".repeat(1501) },
  }),
);
expectThrow("rejects an unstructured answer map", () =>
  parseAiRequest({ task: "summary", lang: "ar", input: "نص", context: { answers: ["bad"] } }),
);
expectThrow("rejects too many answer fields", () =>
  parseAiRequest({
    task: "summary",
    lang: "ar",
    input: "نص",
    context: {
      answers: Object.fromEntries(Array.from({ length: 13 }, (_, index) => [`item${index}`, "x"])),
    },
  }),
);

console.log(
  failures
    ? `AI request validation smoke failed with ${failures} failure(s).`
    : "AI request validation smoke passed: bounded allowlisted context only.",
);
process.exit(failures ? 1 : 0);
