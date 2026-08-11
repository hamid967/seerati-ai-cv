import type { FactGraph } from "@/lib/career-facts";
import { parseJobDescription } from "@/lib/job-match";
import { defaultTemplates } from "@/lib/templates";
import type { Resume } from "@/lib/types";

export type RequirementStatus = "matched" | "partial" | "missing" | "unverified";
export type RequirementKind = "hard-skill" | "soft-skill" | "keyword" | "education" | "language";
export type ReadinessBand = "ready" | "improve-first" | "not-ready";

export type LocalizedText = { ar: string; en: string };

export type RequirementMatch = {
  id: string;
  label: string;
  kind: RequirementKind;
  status: RequirementStatus;
  resumeEvidence: string[];
  graphEvidence: string[];
  explanation: LocalizedText;
};

export type ResumeVariantReadiness = {
  resumeId: string;
  title: string;
  score: number;
  requirementScore: number;
  roleAlignmentScore: number;
  atsScore: number;
  evidenceScore: number;
  completenessScore: number;
  templateId: string;
  templateName: LocalizedText;
  atsFriendly: boolean;
  statusCounts: Record<RequirementStatus, number>;
  requirements: RequirementMatch[];
  strengths: LocalizedText[];
  priorities: LocalizedText[];
};

export type ApplicationReadinessReport = {
  score: number;
  band: ReadinessBand;
  jobTitle: string;
  bestResumeId: string | null;
  variants: ResumeVariantReadiness[];
  requirementCounts: Record<RequirementStatus, number>;
  requirements: RequirementMatch[];
  strengths: LocalizedText[];
  priorities: LocalizedText[];
  disclaimer: LocalizedText;
};

const norm = (value: string) =>
  value
    .toLowerCase()
    .replace(/\u0640/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064b-\u065f]/g, "")
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (value: string) => norm(value).split(" ").filter((item) => item.length >= 2);

const unique = <T>(items: T[]) => [...new Set(items)];

function resumeCorpus(resume: Resume) {
  const data = resume.data;
  return norm(
    [
      data.personal.jobTitle,
      data.targetJob ?? "",
      data.summary,
      ...data.experience.flatMap((item) => [item.role, item.company, ...item.bullets]),
      ...data.education.flatMap((item) => [item.degree, item.school, item.note ?? ""]),
      ...data.skills.map((item) => item.name),
      ...data.languages.flatMap((item) => [item.name, item.level]),
      ...data.certificates.flatMap((item) => [item.title, item.detail ?? ""]),
      ...data.projects.flatMap((item) => [item.title, item.detail ?? ""]),
      ...data.achievements.flatMap((item) => [item.title, item.detail ?? ""]),
    ].join(" \n "),
  );
}

function graphCorpora(graph: FactGraph) {
  const verifiedFactIds = new Set(
    graph.evidence.filter((item) => item.verified && item.factId).map((item) => item.factId as string),
  );
  const verified = graph.facts
    .filter((fact) => fact.verificationStatus === "verified" || verifiedFactIds.has(fact.id))
    .flatMap((fact) => [fact.title, fact.value]);
  const review = graph.facts
    .filter((fact) => fact.verificationStatus !== "verified" && !verifiedFactIds.has(fact.id))
    .flatMap((fact) => [fact.title, fact.value]);
  const evidence = graph.evidence.flatMap((item) => [
    item.title,
    item.description,
    item.metricValue,
    item.metricUnit,
  ]);
  return {
    verified: norm(verified.join(" \n ")),
    review: norm(review.join(" \n ")),
    all: norm([...verified, ...review, ...evidence].join(" \n ")),
  };
}

function containsTerm(corpus: string, term: string) {
  const normalized = norm(term);
  if (!normalized) return false;
  return corpus.includes(normalized);
}

function partialTerm(corpus: string, term: string) {
  const parts = tokens(term);
  if (!parts.length) return false;
  const matched = parts.filter((part) => corpus.includes(part)).length;
  return matched >= Math.max(1, Math.ceil(parts.length * 0.6));
}

function evidenceSnippets(resume: Resume, term: string) {
  const needle = norm(term);
  if (!needle) return [];
  const lines = [
    resume.data.summary,
    ...resume.data.experience.flatMap((item) => [item.role, ...item.bullets]),
    ...resume.data.skills.map((item) => item.name),
    ...resume.data.projects.flatMap((item) => [item.title, item.detail ?? ""]),
    ...resume.data.achievements.flatMap((item) => [item.title, item.detail ?? ""]),
    ...resume.data.certificates.flatMap((item) => [item.title, item.detail ?? ""]),
  ].filter(Boolean);
  return lines.filter((line) => norm(line).includes(needle)).slice(0, 2);
}

function graphSnippets(graph: FactGraph, term: string) {
  const needle = norm(term);
  const matches = graph.facts
    .filter((fact) => norm(`${fact.title} ${fact.value}`).includes(needle))
    .map((fact) => `${fact.title}${fact.value ? ` — ${fact.value}` : ""}`);
  return matches.slice(0, 2);
}

function requirementStatus(
  resumeCorpusText: string,
  graph: ReturnType<typeof graphCorpora>,
  term: string,
): RequirementStatus {
  const inResume = containsTerm(resumeCorpusText, term);
  const verified = containsTerm(graph.verified, term);
  const inGraph = containsTerm(graph.all, term);

  if (inResume && verified) return "matched";
  if (inResume) return "unverified";
  if (verified) return "matched";
  if (inGraph) return "unverified";
  if (partialTerm(resumeCorpusText, term) || partialTerm(graph.all, term)) return "partial";
  return "missing";
}

function makeRequirement(
  resume: Resume,
  graphRaw: FactGraph,
  graph: ReturnType<typeof graphCorpora>,
  term: string,
  kind: RequirementKind,
  index: number,
): RequirementMatch {
  const corpus = resumeCorpus(resume);
  const status = requirementStatus(corpus, graph, term);
  const explanation: Record<RequirementStatus, LocalizedText> = {
    matched: {
      ar: "يوجد تطابق واضح ومدعوم في بيانات السيرة أو الأدلة الموثقة.",
      en: "A clear match is present in the resume or verified evidence.",
    },
    partial: {
      ar: "توجد إشارات مرتبطة، لكن المصطلح أو المتطلب ليس واضحًا بالكامل.",
      en: "Related signals exist, but the requirement is not fully explicit.",
    },
    unverified: {
      ar: "المتطلب ظاهر في السيرة أو سجل الحقائق، لكن لم نجد دليلًا موثقًا كافيًا له.",
      en: "The requirement appears in the resume or fact graph, but verified support is limited.",
    },
    missing: {
      ar: "لم نجد هذا المتطلب في السيرة أو سجل الحقائق. لا تضفه إلا إذا كان صحيحًا لديك.",
      en: "This requirement was not found in the resume or fact graph. Add it only if it is true for you.",
    },
  };

  return {
    id: `${kind}-${index}-${norm(term).replace(/\s+/g, "-").slice(0, 28)}`,
    label: term,
    kind,
    status,
    resumeEvidence: evidenceSnippets(resume, term),
    graphEvidence: graphSnippets(graphRaw, term),
    explanation: explanation[status],
  };
}

function roleAlignment(resume: Resume, jobTitle: string) {
  const roleText = norm(`${resume.data.targetJob ?? ""} ${resume.data.personal.jobTitle}`);
  const jobTokens = tokens(jobTitle).filter((token) => token.length >= 3);
  if (!jobTokens.length) return 50;
  const hit = jobTokens.filter((token) => roleText.includes(token)).length;
  return Math.round((hit / jobTokens.length) * 100);
}

function statusWeight(status: RequirementStatus) {
  if (status === "matched") return 1;
  if (status === "unverified") return 0.7;
  if (status === "partial") return 0.5;
  return 0;
}

function variantReadiness(
  resume: Resume,
  jobTitle: string,
  jobDescription: string,
  graphRaw: FactGraph,
): ResumeVariantReadiness {
  const req = parseJobDescription(jobDescription);
  const graph = graphCorpora(graphRaw);
  const rawRequirements: Array<[string, RequirementKind]> = [
    ...req.hardSkills.map((term) => [term, "hard-skill"] as [string, RequirementKind]),
    ...req.softSkills.map((term) => [term, "soft-skill"] as [string, RequirementKind]),
    ...req.education.map((term) => [term, "education"] as [string, RequirementKind]),
    ...(req.language ? [[req.language, "language"] as [string, RequirementKind]] : []),
    ...req.keywords.slice(0, 10).map((term) => [term, "keyword"] as [string, RequirementKind]),
  ];
  const seen = new Set<string>();
  const requirements = rawRequirements
    .filter(([term, kind]) => {
      const key = `${kind}:${norm(term)}`;
      if (!norm(term) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(([term, kind], index) => makeRequirement(resume, graphRaw, graph, term, kind, index));

  const weighted = requirements.reduce((sum, item) => sum + statusWeight(item.status), 0);
  const requirementScore = requirements.length
    ? Math.round((weighted / requirements.length) * 100)
    : 50;
  const roleAlignmentScore = roleAlignment(resume, jobTitle);
  const template = defaultTemplates.find((item) => item.id === resume.templateId) ?? defaultTemplates[0]!;
  const atsScore = template.atsFriendly ? 100 : 55;
  const verifiedCount = requirements.filter((item) => item.status === "matched").length;
  const claimCount = requirements.filter(
    (item) => item.status === "matched" || item.status === "unverified",
  ).length;
  const evidenceScore = claimCount ? Math.round((verifiedCount / claimCount) * 100) : 50;
  const completenessScore = Math.max(0, Math.min(100, resume.completionScore || 0));
  const score = Math.round(
    requirementScore * 0.48 +
      roleAlignmentScore * 0.16 +
      atsScore * 0.12 +
      evidenceScore * 0.14 +
      completenessScore * 0.1,
  );
  const statuses: RequirementStatus[] = ["matched", "partial", "missing", "unverified"];
  const statusCounts = Object.fromEntries(
    statuses.map((status) => [status, requirements.filter((item) => item.status === status).length]),
  ) as Record<RequirementStatus, number>;

  const strengths: LocalizedText[] = [];
  const priorities: LocalizedText[] = [];
  if (statusCounts.matched > 0) {
    strengths.push({
      ar: `${statusCounts.matched} متطلبات لها دعم موثق وواضح.`,
      en: `${statusCounts.matched} requirements have clear verified support.`,
    });
  }
  if (roleAlignmentScore >= 70) {
    strengths.push({ ar: "المسمى/الهدف المهني قريب من الدور المستهدف.", en: "The resume target/title aligns well with the role." });
  }
  if (template.atsFriendly) {
    strengths.push({ ar: "القالب الحالي من الخيارات المحافظة المتوافقة مع ATS داخل سيرتي.", en: "The current template is one of Seerati's conservative ATS-friendly options." });
  }
  if (statusCounts.missing > 0) {
    priorities.push({
      ar: `راجع ${statusCounts.missing} متطلبات غير موجودة؛ لا تضفها إلا إذا كانت صحيحة لديك.`,
      en: `Review ${statusCounts.missing} missing requirements; add them only when they are true for you.`,
    });
  }
  if (statusCounts.unverified > 0) {
    priorities.push({
      ar: `قوِّ الأدلة لـ${statusCounts.unverified} متطلبات موجودة لكن غير موثقة بما يكفي.`,
      en: `Strengthen evidence for ${statusCounts.unverified} present but insufficiently verified requirements.`,
    });
  }
  if (roleAlignmentScore < 60) {
    priorities.push({ ar: "وضّح المسمى أو الهدف المهني بما يعكس الدور الحقيقي الذي تستهدفه.", en: "Clarify the target/title so it reflects the actual role you are pursuing." });
  }

  return {
    resumeId: resume.id,
    title: resume.title,
    score,
    requirementScore,
    roleAlignmentScore,
    atsScore,
    evidenceScore,
    completenessScore,
    templateId: template.id,
    templateName: template.name,
    atsFriendly: template.atsFriendly,
    statusCounts,
    requirements,
    strengths,
    priorities,
  };
}

export function buildApplicationReadiness(args: {
  jobTitle: string;
  jobDescription: string;
  resumes: Resume[];
  graph: FactGraph;
}): ApplicationReadinessReport {
  const { jobTitle, jobDescription, resumes, graph } = args;
  const variants = resumes
    .map((resume) => variantReadiness(resume, jobTitle, jobDescription, graph))
    .sort((a, b) => b.score - a.score);
  const best = variants[0] ?? null;
  const requirements = best?.requirements ?? [];
  const statuses: RequirementStatus[] = ["matched", "partial", "missing", "unverified"];
  const requirementCounts = Object.fromEntries(
    statuses.map((status) => [status, requirements.filter((item) => item.status === status).length]),
  ) as Record<RequirementStatus, number>;
  const score = best?.score ?? 0;
  const band: ReadinessBand = score >= 82 ? "ready" : score >= 62 ? "improve-first" : "not-ready";
  const strengths = unique((best?.strengths ?? []).map((item) => JSON.stringify(item)))
    .map((item) => JSON.parse(item) as LocalizedText)
    .slice(0, 5);
  const priorities = unique((best?.priorities ?? []).map((item) => JSON.stringify(item)))
    .map((item) => JSON.parse(item) as LocalizedText)
    .slice(0, 6);

  return {
    score,
    band,
    jobTitle,
    bestResumeId: best?.resumeId ?? null,
    variants,
    requirementCounts,
    requirements,
    strengths,
    priorities,
    disclaimer: {
      ar: "الدرجة تقيس مدى تطابق المعلومات المتاحة في سيرك وملف الأدلة مع نص الوظيفة. لا تمثل احتمال القبول أو قرار جهة التوظيف، ولا تضيف أي مهارة أو خبرة غير موجودة لديك.",
      en: "This score measures how the information available in your resumes and evidence graph aligns with the pasted job text. It is not a hiring probability or employer decision and never adds skills or experience you do not have.",
    },
  };
}
