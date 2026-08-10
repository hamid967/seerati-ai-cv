export type TemplateCategory = "ats" | "modern" | "creative" | "executive" | "minimal";

export type TemplateDef = {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  category: TemplateCategory;
  atsFriendly: boolean;
  supportsRTL: boolean;
  active: boolean;
  order: number;
  design: {
    accent: string;
    headingFont: "sans" | "serif";
    spacing: "compact" | "normal" | "airy";
    sectionStyle: "line" | "bar" | "plain";
    layout: "single" | "sidebar";
  };
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  location?: string;
  start?: string;
  end?: string;
  current?: boolean;
  bullets: string[];
};

export type Education = {
  id: string;
  degree: string;
  school: string;
  start?: string;
  end?: string;
  note?: string;
};

export type SimpleItem = { id: string; title: string; detail?: string };
export type SkillItem = { id: string; name: string; level?: number };
export type LanguageItem = { id: string; name: string; level: string };
export type LinkItem = { id: string; label: string; url: string };
export type CustomSection = { id: string; title: string; items: SimpleItem[] };

export type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certificates"
  | "projects"
  | "achievements"
  | "volunteering"
  | "links"
  | "references"
  | "custom";

export type ResumeData = {
  personal: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    nationality?: string;
    photoUrl?: string;
  };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: SkillItem[];
  languages: LanguageItem[];
  certificates: SimpleItem[];
  projects: SimpleItem[];
  achievements: SimpleItem[];
  volunteering: SimpleItem[];
  links: LinkItem[];
  references: SimpleItem[];
  custom: CustomSection[];
  sectionOrder: SectionKey[];
};

export type Resume = {
  id: string;
  ownerId: string;
  title: string;
  templateId: string;
  language: "ar" | "en";
  data: ResumeData;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  onboarded: boolean;
  targetRole?: string;
  yearsExperience?: string;
  industry?: string;
  createdAt: string;
};

export const RESUME_LIMIT = 3;

export const emptyResumeData = (): ResumeData => ({
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certificates: [],
  projects: [],
  achievements: [],
  volunteering: [],
  links: [],
  references: [],
  custom: [],
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "languages",
    "certificates",
    "projects",
    "achievements",
    "volunteering",
    "links",
    "references",
    "custom",
  ],
});

export const uid = () => Math.random().toString(36).slice(2, 10);
