import { getTemplate } from "@/components/resume-preview";
import { analyzeResume, completeness } from "@/lib/ats";
import { emptyResumeData, type Resume, type ResumeData, type SectionKey } from "@/lib/types";

export type AssistantAnswers = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  city: string;
  years: string;
  industry: string;
  role: string;
  company: string;
  period: string;
  story: string;
  skills: string;
  degree: string;
  school: string;
};

export const emptyAssistantAnswers = (): AssistantAnswers => ({
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  city: "",
  years: "",
  industry: "",
  role: "",
  company: "",
  period: "",
  story: "",
  skills: "",
  degree: "",
  school: "",
});

const uid = () => Math.random().toString(36).slice(2, 10);

export function buildAssistantData(
  a: AssistantAnswers,
  lang: "ar" | "en",
  summary: string,
  bullets: string[],
  skills: string[],
): ResumeData {
  const base = emptyResumeData();
  const [start = "", end = ""] = a.period.split(/[-–—]/).map((s) => s.trim());
  return {
    ...base,
    personal: {
      ...base.personal,
      fullName: a.fullName,
      jobTitle: a.jobTitle,
      email: a.email,
      phone: a.phone,
      city: a.city,
      country: lang === "ar" ? "السعودية" : "Saudi Arabia",
    },
    summary,
    targetJob: a.jobTitle,
    experience: a.role
      ? [
          {
            id: uid(),
            role: a.role,
            company: a.company,
            start,
            end,
            bullets: bullets.length ? bullets : a.story ? [a.story] : [],
          },
        ]
      : [],
    education: a.degree ? [{ id: uid(), degree: a.degree, school: a.school }] : [],
    skills: skills.map((name) => ({ id: uid(), name })),
  };
}

/** Hide sections the assistant had no answers for so the editor opens clean. */
export function fillAssistantSections(data: ResumeData): ResumeData {
  const filled: Record<string, boolean> = {
    summary: data.summary.trim().length > 0,
    experience: data.experience.length > 0,
    education: data.education.length > 0,
    skills: data.skills.length > 0,
  };
  const optional: SectionKey[] = [
    "languages",
    "certificates",
    "projects",
    "achievements",
    "volunteering",
    "links",
    "references",
  ];
  const hidden = [...(Object.keys(filled) as SectionKey[]).filter((k) => !filled[k]), ...optional];
  return { ...data, hiddenSections: hidden };
}

export type CreateFilledResumeDeps = {
  createResume: (input: {
    title: string;
    templateId: string;
    language: "ar" | "en";
    jobTitle?: string;
  }) => Promise<Resume | null>;
  updateResume: (id: string, patch: Partial<Resume>) => Promise<boolean | void>;
};

export async function createFilledAssistantResume(
  deps: CreateFilledResumeDeps,
  opts: {
    answers: AssistantAnswers;
    templateId: string;
    language: "ar" | "en";
    summary: string;
    bullets: string[];
    skills: string[];
    titleFallback: string;
  },
): Promise<Resume> {
  const created = await deps.createResume({
    title: opts.answers.jobTitle || opts.titleFallback,
    templateId: opts.templateId,
    language: opts.language,
    jobTitle: opts.answers.jobTitle,
  });
  if (!created) throw new Error("create failed");

  const data = fillAssistantSections(
    buildAssistantData(opts.answers, opts.language, opts.summary, opts.bullets, opts.skills),
  );
  const filled: Resume = {
    ...created,
    templateId: opts.templateId,
    data,
    language: opts.language,
  };
  const template = getTemplate(opts.templateId);
  await deps.updateResume(created.id, {
    data,
    templateId: opts.templateId,
    language: opts.language,
    completionScore: completeness(filled),
    atsScore: analyzeResume(filled, template).score,
  });
  return { ...created, ...filled };
}
