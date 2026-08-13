import { emptyResumeData, type ResumeData, type SectionKey } from "@/lib/types";
import {
  CareerProfileGraphSchema,
  type CareerFact,
  type CareerProfileGraph,
  type CareerSource,
  type CareerSensitivity,
} from "./schemas";

export type GraphLoss = {
  fieldPath: string;
  reason: "unsupported" | "empty";
};

export type ResumeToGraphResult = {
  graph: CareerProfileGraph;
  loss: GraphLoss[];
};

const now = () => new Date().toISOString();

function fact(args: {
  id: string;
  entity: CareerFact["entity"];
  fieldPath: string;
  value: string;
  language: CareerFact["language"];
  source?: CareerSource;
  sourceLabel?: string;
  sensitivity?: CareerSensitivity;
}): CareerFact {
  const timestamp = now();
  return {
    id: args.id,
    entity: args.entity,
    fieldPath: args.fieldPath,
    value: args.value,
    language: args.language,
    provenance: {
      source: args.source ?? "user_manual",
      sourceLabel: args.sourceLabel ?? "resume-editor",
      importedAt: timestamp,
      verifiedByUser: args.source !== "ai_suggestion",
    },
    sensitivity: args.sensitivity ?? "personal",
    createdAt: timestamp,
    updatedAt: timestamp,
    aiModificationHistory: [],
  };
}

function pushText(facts: CareerFact[], loss: GraphLoss[], args: Parameters<typeof fact>[0]) {
  if (args.value.trim()) facts.push(fact(args));
  else loss.push({ fieldPath: args.fieldPath, reason: "empty" });
}

export function fromResumeData(
  data: ResumeData,
  options: { graphId: string; language?: "ar" | "en" } = {
    graphId: "career-graph",
  },
): ResumeToGraphResult {
  const language = options.language ?? "ar";
  const facts: CareerFact[] = [];
  const loss: GraphLoss[] = [];

  pushText(facts, loss, {
    id: "identity.fullName",
    entity: "identity",
    fieldPath: "identity.fullName",
    value: data.personal.fullName,
    language,
    sensitivity: "personal",
  });
  pushText(facts, loss, {
    id: "identity.jobTitle",
    entity: "identity",
    fieldPath: "identity.jobTitle",
    value: data.personal.jobTitle,
    language,
  });
  for (const [field, value] of Object.entries(data.personal)) {
    if (field === "fullName" || field === "jobTitle" || field === "photoUrl") continue;
    pushText(facts, loss, {
      id: `contact.${field}`,
      entity: "contact",
      fieldPath: `contact.${field}`,
      value: String(value ?? ""),
      language,
      sensitivity: field === "email" || field === "phone" ? "sensitive" : "personal",
    });
  }

  pushText(facts, loss, {
    id: "summary.text",
    entity: "summary",
    fieldPath: "summary.text",
    value: data.summary,
    language,
  });
  pushText(facts, loss, {
    id: "targetRole.title",
    entity: "target_role",
    fieldPath: "targetRole.title",
    value: data.targetJob ?? "",
    language,
  });

  for (const item of data.experience) {
    pushText(facts, loss, {
      id: `experience.${item.id}.role`,
      entity: "experience",
      fieldPath: `experience.${item.id}.role`,
      value: item.role,
      language,
    });
    pushText(facts, loss, {
      id: `experience.${item.id}.company`,
      entity: "experience",
      fieldPath: `experience.${item.id}.company`,
      value: item.company,
      language,
    });
    item.bullets.forEach((bullet, index) =>
      pushText(facts, loss, {
        id: `experience.${item.id}.bullets.${index}`,
        entity: "achievement",
        fieldPath: `experience.${item.id}.bullets.${index}`,
        value: bullet,
        language,
      }),
    );
  }

  for (const item of data.education) {
    pushText(facts, loss, {
      id: `education.${item.id}.degree`,
      entity: "education",
      fieldPath: `education.${item.id}.degree`,
      value: item.degree,
      language,
    });
    pushText(facts, loss, {
      id: `education.${item.id}.school`,
      entity: "education",
      fieldPath: `education.${item.id}.school`,
      value: item.school,
      language,
    });
  }

  for (const item of data.skills) {
    pushText(facts, loss, {
      id: `skill.${item.id}`,
      entity: "skill",
      fieldPath: `skills.${item.id}.name`,
      value: item.name,
      language,
    });
  }
  for (const item of data.languages) {
    pushText(facts, loss, {
      id: `language.${item.id}`,
      entity: "language",
      fieldPath: `languages.${item.id}.name`,
      value: `${item.name} (${item.level})`,
      language,
    });
  }
  for (const item of data.links) {
    pushText(facts, loss, {
      id: `link.${item.id}`,
      entity: "link",
      fieldPath: `links.${item.id}.label`,
      value: `${item.label}: ${item.url}`,
      language,
      sensitivity: "public",
    });
  }

  const timestamp = now();
  const graph = CareerProfileGraphSchema.parse({
    id: options.graphId,
    version: 1,
    language,
    direction: language === "ar" ? "rtl" : "ltr",
    facts,
    consent: {
      aiProcessing: false,
      sessionRecovery: false,
      cloudPersistence: false,
      updatedAt: timestamp,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return { graph, loss };
}

function fieldValue(facts: CareerFact[], fieldPath: string): string {
  return facts.find((item) => item.fieldPath === fieldPath)?.value ?? "";
}

function groupedIds(facts: CareerFact[], prefix: string): string[] {
  return [
    ...new Set(
      facts
        .filter((item) => item.fieldPath.startsWith(prefix))
        .map((item) => item.fieldPath.split(".")[1])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}

export function toResumeData(graph: CareerProfileGraph): ResumeData {
  const data = emptyResumeData();
  data.personal.fullName = fieldValue(graph.facts, "identity.fullName");
  data.personal.jobTitle = fieldValue(graph.facts, "identity.jobTitle");
  for (const key of ["email", "phone", "city", "country", "nationality"] as const) {
    data.personal[key] = fieldValue(graph.facts, `contact.${key}`);
  }
  data.summary = fieldValue(graph.facts, "summary.text");
  data.targetJob = fieldValue(graph.facts, "targetRole.title");
  data.experience = groupedIds(graph.facts, "experience.").map((id) => ({
    id,
    role: fieldValue(graph.facts, `experience.${id}.role`),
    company: fieldValue(graph.facts, `experience.${id}.company`),
    bullets: graph.facts
      .filter((item) => item.fieldPath.startsWith(`experience.${id}.bullets.`))
      .sort((a, b) => a.fieldPath.localeCompare(b.fieldPath))
      .map((item) => item.value),
  }));
  data.education = groupedIds(graph.facts, "education.").map((id) => ({
    id,
    degree: fieldValue(graph.facts, `education.${id}.degree`),
    school: fieldValue(graph.facts, `education.${id}.school`),
  }));
  data.skills = graph.facts
    .filter((item) => item.entity === "skill")
    .map((item) => ({ id: item.id.replace(/^skill\./, ""), name: item.value }));
  data.links = graph.facts
    .filter((item) => item.entity === "link")
    .map((item) => {
      const separator = item.value.indexOf(": ");
      return {
        id: item.id.replace(/^link\./, ""),
        label: separator >= 0 ? item.value.slice(0, separator) : item.value,
        url: separator >= 0 ? item.value.slice(separator + 2) : "",
      };
    });
  data.sectionOrder = [...data.sectionOrder] as SectionKey[];
  return data;
}

export function roundTripResumeData(data: ResumeData, graphId = "round-trip") {
  const result = fromResumeData(data, { graphId, language: "ar" });
  return { ...result, data: toResumeData(result.graph) };
}
