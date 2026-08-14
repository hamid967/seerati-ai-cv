import type {
  ResumeData,
  SectionKey,
  SyntheticResumeMetadata as StoredSyntheticResumeMetadata,
  TemplateDef,
} from "@/lib/types";

export type SampleFieldStatus = "sample" | "user-confirmed";

export type SampleField = {
  value: string;
  status: SampleFieldStatus;
  source: "synthetic-template" | "synthetic-ai" | "user";
  requiresUserReview: boolean;
  exportApproved: boolean;
};

export const SYNTHETIC_SPECIALTY_IDS = [
  "software-development",
  "accounting",
  "civil-engineering",
  "human-resources",
  "nursing",
  "sales",
  "software-engineering",
  "data-analysis",
  "cybersecurity",
  "it-support",
  "network-engineering",
  "cloud-devops",
  "mobile-development",
  "ui-ux-design",
  "quality-assurance",
  "project-management",
  "mechanical-engineering",
  "electrical-engineering",
  "architecture",
  "supply-chain",
  "operations-management",
  "procurement",
  "financial-analysis",
  "banking",
  "internal-audit",
  "investment-analysis",
  "recruitment",
  "payroll",
  "organizational-development",
  "digital-marketing",
  "account-management",
  "business-development",
  "customer-service",
  "ecommerce",
  "pharmacy",
  "laboratory-science",
] as const;

export type SyntheticSpecialtyId = (typeof SYNTHETIC_SPECIALTY_IDS)[number];

export type SyntheticExperienceLevel =
  | "student"
  | "graduate"
  | "junior"
  | "mid"
  | "advanced"
  | "manager"
  | "executive"
  | "career-change"
  | "general";

export type SyntheticCareerGoal =
  | "job-application"
  | "graduate-program"
  | "internship"
  | "internal-promotion"
  | "career-change"
  | "public-sector"
  | "private-sector"
  | "leadership"
  | "general-use";

export type SyntheticSpecialty = {
  id: SyntheticSpecialtyId;
  group: { ar: string; en: string };
  name: { ar: string; en: string };
  searchTerms: string[];
  supportsCreativeTemplate?: boolean;
};

export type SyntheticTemplateOption = {
  template: TemplateDef;
  expectedPages: 1 | 2;
  atsFit: "high" | "medium" | "review";
  reason: { ar: string; en: string };
  strengths: { ar: string[]; en: string[] };
  limitations: { ar: string[]; en: string[] };
};

export type SyntheticReadinessState =
  | "fully-sample"
  | "editing-started"
  | "needs-review"
  | "core-reviewed"
  | "ready-for-check"
  | "ready-for-export";

export type SyntheticReadiness = {
  state: SyntheticReadinessState;
  sampleFieldsRemaining: number;
  confirmedFields: number;
  incompleteCoreSections: SectionKey[];
  nextSteps: { ar: string[]; en: string[] };
};

/** Shared with the in-memory Resume envelope; no runtime conversion is used. */
export type SyntheticResumeMetadata = StoredSyntheticResumeMetadata;

export type SyntheticCareerProfile = {
  resumeData: ResumeData;
  metadata: SyntheticResumeMetadata;
  templates: SyntheticTemplateOption[];
};

export type SyntheticGeneratorInput = {
  specialtyId: SyntheticSpecialtyId;
  experienceLevel: SyntheticExperienceLevel;
  language: "ar" | "en";
  goal: SyntheticCareerGoal;
};
