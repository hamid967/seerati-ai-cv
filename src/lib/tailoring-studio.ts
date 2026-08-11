import { buildApplicationReadiness, type RequirementMatch } from "@/lib/application-readiness";
import type { FactGraph } from "@/lib/career-facts";
import { defaultTemplates } from "@/lib/templates";
import type { Experience, Resume, ResumeData, SectionKey } from "@/lib/types";

export type TailoringChangeKind =
  | "target-role"
  | "skills-order"
  | "experience-order"
  | "bullet-order"
  | "section-order"
  | "template";

export type TailoringChange = {
  id: string;
  kind: TailoringChangeKind;
  title: { ar: string; en: string };
  reason: { ar: string; en: string };
  before: string;
  after: string;
};

export type TailoringProposal = {
  resumeId: string;
  resumeTitle: string;
  currentTemplateId: string;
  recommendedTemplateId: string;
  changes: TailoringChange[];
  matchedRequirements: number;
  missingRequirements: number;
  disclaimer: { ar: string; en: string };
};

export type TailoringApplyResult = {
  data: ResumeData;
  templateId: string;
  appliedIds: string[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\u0640/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064b-\u065f]/g, "")
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2);

function requirementTerms(requirements: RequirementMatch[]) {
  return [...new Set(requirements.filter((item) => item.status !== "missing").map((item) => item.label))];
}

function relevance(text: string, terms: string[]) {
  const corpus = normalize(text);
  if (!corpus) return 0;
  return terms.reduce((score, term) => {
    const normalized = normalize(term);
    if (!normalized) return score;
    if (corpus.includes(normalized)) return score + 6;
    const parts = tokens(normalized);
    return score + parts.filter((part) => corpus.includes(part)).length;
  }, 0);
}

function stableSortByRelevance<T>(items: T[], text: (item: T) => string, terms: string[]) {
  return items
    .map((item, index) => ({ item, index, score: relevance(text(item), terms) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

function sameOrder<T>(a: T[], b: T[], key: (item: T) => string) {
  return a.length === b.length && a.every((item, index) => key(item) === key(b[index]!));
}

function professionalText(data: ResumeData) {
  return [
    data.summary,
    ...data.experience.flatMap((item) => [item.role, item.company, item.location ?? "", ...item.bullets]),
    ...data.education.flatMap((item) => [item.degree, item.school, item.note ?? ""]),
    ...data.skills.map((item) => item.name),
    ...data.certificates.flatMap((item) => [item.title, item.detail ?? ""]),
    ...data.projects.flatMap((item) => [item.title, item.detail ?? ""]),
    ...data.achievements.flatMap((item) => [item.title, item.detail ?? ""]),
  ].join(" \n ");
}

function numberBag(data: ResumeData) {
  return [...professionalText(data).matchAll(/[+-]?\d+(?:[.,]\d+)?%?/g)]
    .map((match) => match[0])
    .sort();
}

function assertNumbersPreserved(before: ResumeData, after: ResumeData) {
  const a = numberBag(before);
  const b = numberBag(after);
  if (a.length !== b.length || a.some((token, index) => token !== b[index])) {
    throw new Error("tailoring_numeric_integrity_failed");
  }
}

function reorderBullets(experience: Experience[], terms: string[]) {
  return experience.map((item) => ({
    ...item,
    bullets: stableSortByRelevance(item.bullets, (bullet) => bullet, terms),
  }));
}

function changedBulletOrder(before: Experience[], after: Experience[]) {
  return before.some((item, index) => {
    const next = after[index];
    if (!next || item.id !== next.id) return false;
    return !sameOrder(item.bullets, next.bullets, (bullet) => bullet);
  });
}

const preferredSectionOrder: SectionKey[] = [
  "summary",
  "experience",
  "skills",
  "education",
  "certificates",
  "projects",
  "achievements",
  "languages",
  "volunteering",
  "links",
  "references",
  "custom",
];

function describeList(items: string[], max = 5) {
  if (!items.length) return "—";
  const visible = items.slice(0, max);
  return `${visible.join(" · ")}${items.length > max ? ` +${items.length - max}` : ""}`;
}

export function buildTailoringProposal(args: {
  resumes: Resume[];
  graph: FactGraph;
  jobTitle: string;
  jobDescription: string;
}): TailoringProposal | null {
  const readiness = buildApplicationReadiness(args);
  const bestId = readiness.bestResumeId;
  const resume = args.resumes.find((item) => item.id === bestId) ?? args.resumes[0] ?? null;
  if (!resume || !args.jobTitle.trim() || !args.jobDescription.trim()) return null;

  const variant = readiness.variants.find((item) => item.resumeId === resume.id) ?? readiness.variants[0];
  const requirements = variant?.requirements ?? [];
  const terms = requirementTerms(requirements);
  const changes: TailoringChange[] = [];

  if ((resume.data.targetJob ?? "").trim() !== args.jobTitle.trim()) {
    changes.push({
      id: "target-role",
      kind: "target-role",
      title: { ar: "تحديد الهدف الوظيفي", en: "Set the target role" },
      reason: {
        ar: "يربط هذه النسخة بالوظيفة الحالية دون تغيير خبرتك أو مسماك الفعلي.",
        en: "Links this version to the current job without changing your real experience or title.",
      },
      before: resume.data.targetJob?.trim() || "—",
      after: args.jobTitle.trim(),
    });
  }

  const sortedSkills = stableSortByRelevance(resume.data.skills, (item) => item.name, terms);
  if (!sameOrder(resume.data.skills, sortedSkills, (item) => item.id)) {
    changes.push({
      id: "skills-order",
      kind: "skills-order",
      title: { ar: "ترتيب المهارات حسب الصلة", en: "Prioritize relevant skills" },
      reason: {
        ar: "يقدّم المهارات الموجودة أصلًا والأقرب للوصف الوظيفي؛ لا يضيف أي مهارة جديدة.",
        en: "Moves existing skills that are closest to the job description upward; no new skill is added.",
      },
      before: describeList(resume.data.skills.map((item) => item.name)),
      after: describeList(sortedSkills.map((item) => item.name)),
    });
  }

  const sortedExperience = stableSortByRelevance(
    resume.data.experience,
    (item) => `${item.role} ${item.company} ${item.bullets.join(" ")}`,
    terms,
  );
  if (!sameOrder(resume.data.experience, sortedExperience, (item) => item.id)) {
    changes.push({
      id: "experience-order",
      kind: "experience-order",
      title: { ar: "تقديم الخبرات الأكثر صلة", en: "Prioritize relevant experience" },
      reason: {
        ar: "يعيد ترتيب نفس الخبرات فقط حتى يرى مسؤول التوظيف الأكثر صلة أولًا.",
        en: "Reorders the same experience entries so the most relevant appears first.",
      },
      before: describeList(resume.data.experience.map((item) => item.role)),
      after: describeList(sortedExperience.map((item) => item.role)),
    });
  }

  const bulletsAfter = reorderBullets(resume.data.experience, terms);
  if (changedBulletOrder(resume.data.experience, bulletsAfter)) {
    changes.push({
      id: "bullet-order",
      kind: "bullet-order",
      title: { ar: "ترتيب نقاط الإنجاز", en: "Prioritize achievement bullets" },
      reason: {
        ar: "يقدّم النقاط الحالية الأكثر ارتباطًا بالوظيفة دون إعادة صياغتها أو تغيير أرقامها.",
        en: "Moves the most relevant existing bullets upward without rewriting them or changing numbers.",
      },
      before: resume.data.experience.length ? "1 → 2 → 3" : "—",
      after: resume.data.experience.length ? "الأكثر صلة أولًا" : "—",
    });
  }

  const existingSections = resume.data.sectionOrder.filter((key) => preferredSectionOrder.includes(key));
  const remaining = resume.data.sectionOrder.filter((key) => !preferredSectionOrder.includes(key));
  const sortedSections = [
    ...preferredSectionOrder.filter((key) => existingSections.includes(key)),
    ...remaining,
  ];
  if (!sameOrder(resume.data.sectionOrder, sortedSections, (item) => item)) {
    changes.push({
      id: "section-order",
      kind: "section-order",
      title: { ar: "ترتيب الأقسام لمسح أسرع", en: "Reorder sections for faster scanning" },
      reason: {
        ar: "يقدّم الملخص والخبرة والمهارات قبل الأقسام الثانوية، مع إبقاء جميع الأقسام والمحتوى.",
        en: "Moves summary, experience and skills before secondary sections while preserving every section and item.",
      },
      before: resume.data.sectionOrder.join(" → "),
      after: sortedSections.join(" → "),
    });
  }

  const currentTemplate = defaultTemplates.find((item) => item.id === resume.templateId);
  const recommendedTemplate = currentTemplate?.atsFriendly
    ? currentTemplate
    : defaultTemplates.find((item) => item.id === "classic-ats") ?? defaultTemplates[0]!;
  if (recommendedTemplate.id !== resume.templateId) {
    changes.push({
      id: "template",
      kind: "template",
      title: { ar: "استخدام قالب ATS محافظ", en: "Use a conservative ATS template" },
      reason: {
        ar: "يقترح قالبًا أحادي العمود أكثر تحفظًا لهذه النسخة فقط؛ لا يغيّر المحتوى.",
        en: "Suggests a more conservative single-column template for this version only; content is unchanged.",
      },
      before: currentTemplate?.name.ar ?? resume.templateId,
      after: recommendedTemplate.name.ar,
    });
  }

  return {
    resumeId: resume.id,
    resumeTitle: resume.title,
    currentTemplateId: resume.templateId,
    recommendedTemplateId: recommendedTemplate.id,
    changes,
    matchedRequirements: requirements.filter((item) => item.status === "matched").length,
    missingRequirements: requirements.filter((item) => item.status === "missing").length,
    disclaimer: {
      ar: "التخصيص يعيد ترتيب ما هو موجود فقط. المتطلبات المفقودة لا تُضاف تلقائيًا، وهذه ليست درجة احتمال توظيف.",
      en: "Tailoring only reorganizes existing content. Missing requirements are never auto-added, and this is not a hiring-probability score.",
    },
  };
}

export function applyTailoringChanges(args: {
  resume: Resume;
  proposal: TailoringProposal;
  selectedIds: string[];
  jobTitle: string;
  jobDescription: string;
}): TailoringApplyResult {
  const selected = new Set(args.selectedIds);
  const source = args.resume.data;
  let data: ResumeData = {
    ...source,
    personal: { ...source.personal },
    experience: source.experience.map((item) => ({ ...item, bullets: [...item.bullets] })),
    education: source.education.map((item) => ({ ...item })),
    skills: source.skills.map((item) => ({ ...item })),
    languages: source.languages.map((item) => ({ ...item })),
    certificates: source.certificates.map((item) => ({ ...item })),
    projects: source.projects.map((item) => ({ ...item })),
    achievements: source.achievements.map((item) => ({ ...item })),
    volunteering: source.volunteering.map((item) => ({ ...item })),
    links: source.links.map((item) => ({ ...item })),
    references: source.references.map((item) => ({ ...item })),
    custom: source.custom.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
    sectionOrder: [...source.sectionOrder],
    ...(source.hiddenSections ? { hiddenSections: [...source.hiddenSections] } : {}),
    ...(source.design ? { design: { ...source.design } } : {}),
  };

  const variant = buildApplicationReadiness({
    jobTitle: args.jobTitle,
    jobDescription: args.jobDescription,
    resumes: [args.resume],
    graph: { facts: [], evidence: [] },
  }).variants[0];
  const terms = requirementTerms(variant?.requirements ?? []);

  if (selected.has("target-role")) {
    data = { ...data, targetJob: args.jobTitle.trim(), jobDescription: args.jobDescription };
  }
  if (selected.has("skills-order")) {
    data = { ...data, skills: stableSortByRelevance(data.skills, (item) => item.name, terms) };
  }
  if (selected.has("experience-order")) {
    data = {
      ...data,
      experience: stableSortByRelevance(
        data.experience,
        (item) => `${item.role} ${item.company} ${item.bullets.join(" ")}`,
        terms,
      ),
    };
  }
  if (selected.has("bullet-order")) {
    data = { ...data, experience: reorderBullets(data.experience, terms) };
  }
  if (selected.has("section-order")) {
    const remaining = data.sectionOrder.filter((key) => !preferredSectionOrder.includes(key));
    data = {
      ...data,
      sectionOrder: [
        ...preferredSectionOrder.filter((key) => data.sectionOrder.includes(key)),
        ...remaining,
      ],
    };
  }

  assertNumbersPreserved(source, data);

  return {
    data,
    templateId: selected.has("template")
      ? args.proposal.recommendedTemplateId
      : args.resume.templateId,
    appliedIds: args.proposal.changes
      .filter((change) => selected.has(change.id))
      .map((change) => change.id),
  };
}
