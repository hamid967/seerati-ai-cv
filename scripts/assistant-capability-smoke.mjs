import { readFile } from "node:fs/promises";

const component = await readFile("src/components/assistant-capability-hub.tsx", "utf8");
const route = await readFile("src/routes/assistant.tsx", "utf8");

const requiredLinks = [
  'href: "/import"',
  'href: "/ats"',
  'href: "/jobs"',
  'href: "/cover-letters"',
  'href: "/arabic-intelligence"',
];

for (const link of requiredLinks) {
  if (!component.includes(link)) throw new Error(`Missing assistant capability link: ${link}`);
}
if (!component.includes("AI مع مراجعة بشرية") || !component.includes("AI with human review")) {
  throw new Error("Assistant review disclosure is missing");
}
if (!route.includes("AssistantCapabilityHub") || !route.includes('id="assistant-builder"')) {
  throw new Error("Assistant capability hub is not mounted before the builder");
}

console.log("Assistant capability hub smoke checks OK.");
