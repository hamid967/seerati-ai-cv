export type TemplateCategory = "ats" | "modern" | "creative" | "executive" | "minimal";

export type TemplateDesign = {
  accent: string;
  headingFont: "sans" | "serif";
  spacing: "compact" | "normal" | "airy";
  sectionStyle: "line" | "bar" | "plain" | "caps";
  layout: "single" | "sidebar" | "sidebar-left";
  header: "stack" | "banner" | "centered" | "split";
  bullet: "disc" | "dash" | "square";
  supportsPhoto: boolean;
};

export type TemplateDef = {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  category: TemplateCategory;
  atsFriendly: boolean;
  supportsRTL: boolean;
  active: boolean;
  order: number;
  design: TemplateDesign;
};

/** Limited, safe design controls exposed to the end user inside the builder. */
export type ResumeUserDesign = {
  accent?: string;
  density?: "compact" | "normal" | "airy";
  showPhoto?: boolean;
};

export const ACCENT_PALETTE = [
  "#1e3a5f",
  "#0f766e",
  "#166534",
  "#7c2d12",
  "#4c1d95",
  "#111827",
  "#b45309",
  "#0369a1",
] as const;

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
  /** Target role this resume is tailored for (Phase 2: Job Target). */
  targetJob?: string;
  /** Pasted job description kept with the resume for ATS matching. */
  jobDescription?: string;
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
  hiddenSections?: SectionKey[];
  design?: ResumeUserDesign;
};

export type ResumeStatus = "draft" | "complete";

export type Resume = {
  id: string;
  ownerId: string;
  title: string;
  templateId: string;
  language: "ar" | "en";
  data: ResumeData;
  status: ResumeStatus;
  completionScore: number;
  atsScore: number;
  lastViewedAt?: string | null;
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
  targetJob: "",
  jobDescription: "",
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
