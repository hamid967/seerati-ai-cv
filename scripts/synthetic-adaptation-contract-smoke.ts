import {
  buildSyntheticAdaptationPrompt,
  validateSyntheticAdaptationOutput,
} from "../src/lib/ai-prompts.server";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const request = {
  consent: true as const,
  specialtyId: "data-analysis" as const,
  experienceLevel: "graduate" as const,
  language: "en" as const,
};

const prompt = buildSyntheticAdaptationPrompt(request);
assert(prompt.prompt.includes("data-analysis"), "prompt must contain the selected specialty ID");
assert(
  !/resume text|email|phone|custom specialty/i.test(prompt.prompt),
  "prompt must not introduce personal resume inputs",
);

const valid = validateSyntheticAdaptationOutput(
  JSON.stringify({
    summary: "Fictional sample profile focused on organised analytical work and review.",
    responsibilities: [
      "Organised fictional data-review tasks for a sample workflow.",
      "Prepared fictional notes for internal sample discussion.",
      "Collaborated with a fictional team on a sample handover.",
    ],
    skills: ["Sample analysis", "Sample documentation", "Sample review", "Sample teamwork"],
    project: "Sample project: fictional analysis workflow",
    certificate: "Sample fictional learning certificate",
  }),
);
assert(valid.skills.length === 4, "safe adaptation must preserve four skills");
assert(valid.responsibilities.length === 3, "safe adaptation must preserve three responsibilities");

let rejectedUnsafeOutput = false;
try {
  validateSyntheticAdaptationOutput(
    JSON.stringify({
      summary: "Worked at Example Company with a verified result.",
      responsibilities: ["One", "Two", "Three"],
      skills: ["One", "Two", "Three", "Four"],
      project: "Sample project",
      certificate: "Sample certificate",
    }),
  );
} catch {
  rejectedUnsafeOutput = true;
}
assert(rejectedUnsafeOutput, "adaptation validation must reject employer-like output");

console.log(
  "Synthetic adaptation contract smoke passed: restricted input, schema, and safety validation.",
);
