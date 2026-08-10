import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Experience, Education, SkillItem, LanguageItem, LinkItem } from "./types";
import type { AgentId } from "./team";

/* ============================ Career Twin ============================ */

export type CareerTarget = {
  id: string;
  title: string;
  seniority?: string;
  industry?: string;
  cities?: string;
  workMode?: "onsite" | "hybrid" | "remote";
};

export type Achievement = {
  id: string;
  text: string;
  metric?: string;
  /** The user explicitly confirmed the figure/claim is accurate. */
  verified?: boolean;
  source?: string;
};

export type StarStory = {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  verified?: boolean;
};

export type CareerSkill = SkillItem & { evidence?: string; verified?: boolean };

export type CareerIdentity = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
};

export type CareerPreferences = {
  cities?: string;
  workMode?: "onsite" | "hybrid" | "remote";
  industries?: string;
  seniority?: string;
  noticePeriod?: string;
};

export type CareerTwin = {
  id: string;
  userId: string;
  identity: CareerIdentity;
  targets: CareerTarget[];
  workHistory: Experience[];
  achievements: Achievement[];
  education: Education[];
  certifications: Array<{ id: string; title: string; detail?: string }>;
  skills: CareerSkill[];
  languages: LanguageItem[];
  projects: Array<{ id: string; title: string; detail?: string }>;
  links: LinkItem[];
  preferences: CareerPreferences;
  storyBank: StarStory[];
  /** Map of fact key → user confirmation. */
  verifiedFacts: Record<string, boolean>;
  completionScore: number;
  updatedAt: string;
};

export const emptyIdentity = (): CareerIdentity => ({
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  city: "",
  summary: "",
});

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = <T,>(v: unknown, fallback: T): T =>
  v && typeof v === "object" && !Array.isArray(v) ? ({ ...fallback, ...(v as T) }) : fallback;

type TwinRow = {
  id: string;
  user_id: string;
  identity: unknown;
  targets: unknown;
  work_history: unknown;
  achievements: unknown;
  education: unknown;
  certifications: unknown;
  skills: unknown;
  languages: unknown;
  projects: unknown;
  links: unknown;
  preferences: unknown;
  story_bank: unknown;
  verified_facts: unknown;
  completion_score: number;
  updated_at: string;
};

const toTwin = (row: TwinRow): CareerTwin => ({
  id: row.id,
  userId: row.user_id,
  identity: obj<CareerIdentity>(row.identity, emptyIdentity()),
  targets: arr<CareerTarget>(row.targets),
  workHistory: arr<Experience>(row.work_history),
  achievements: arr<Achievement>(row.achievements),
  education: arr<Education>(row.education),
  certifications: arr<{ id: string; title: string; detail?: string }>(row.certifications),
  skills: arr<CareerSkill>(row.skills),
  languages: arr<LanguageItem>(row.languages),
  projects: arr<{ id: string; title: string; detail?: string }>(row.projects),
  links: arr<LinkItem>(row.links),
  preferences: obj<CareerPreferences>(row.preferences, {}),
  storyBank: arr<StarStory>(row.story_bank),
  verifiedFacts: obj<Record<string, boolean>>(row.verified_facts, {}),
  completionScore: row.completion_score ?? 0,
  updatedAt: row.updated_at,
});

/** Reads the signed-in user's Career Twin, creating an empty one on first use. */
export async function loadCareerTwin(userId: string): Promise<CareerTwin | null> {
  const { data } = await supabase.from("career_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (data) return toTwin(data as unknown as TwinRow);
  const { data: created } = await supabase
    .from("career_profiles")
    .insert({ user_id: userId })
    .select("*")
    .maybeSingle();
  return created ? toTwin(created as unknown as TwinRow) : null;
}

export type TwinPatch = Partial<Omit<CareerTwin, "id" | "userId" | "updatedAt">>;

export async function saveCareerTwin(userId: string, patch: TwinPatch): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.identity) row["identity"] = patch.identity;
  if (patch.targets) row["targets"] = patch.targets;
  if (patch.workHistory) row["work_history"] = patch.workHistory;
  if (patch.achievements) row["achievements"] = patch.achievements;
  if (patch.education) row["education"] = patch.education;
  if (patch.certifications) row["certifications"] = patch.certifications;
  if (patch.skills) row["skills"] = patch.skills;
  if (patch.languages) row["languages"] = patch.languages;
  if (patch.projects) row["projects"] = patch.projects;
  if (patch.links) row["links"] = patch.links;
  if (patch.preferences) row["preferences"] = patch.preferences;
  if (patch.storyBank) row["story_bank"] = patch.storyBank;
  if (patch.verifiedFacts) row["verified_facts"] = patch.verifiedFacts;
  if (typeof patch.completionScore === "number") row["completion_score"] = patch.completionScore;
  if (!Object.keys(row).length) return;
  await supabase.from("career_profiles").update(row as Record<string, Json>).eq("user_id", userId);
}

/** Section-by-section health of the Career Twin. Descriptive, not predictive. */
export type TwinSectionHealth = { key: string; label: { ar: string; en: string }; done: boolean; weight: number };

export function twinHealth(t: CareerTwin | null): { score: number; sections: TwinSectionHealth[] } {
  const sections: TwinSectionHealth[] = [
    { key: "identity", label: { ar: "الهوية ومعلومات الاتصال", en: "Identity & contact" }, weight: 15, done: !!(t?.identity.fullName && t?.identity.email) },
    { key: "summary", label: { ar: "الملخص المهني", en: "Professional summary" }, weight: 12, done: (t?.identity.summary?.length ?? 0) > 80 },
    { key: "targets", label: { ar: "الهدف المهني", en: "Career target" }, weight: 12, done: (t?.targets.length ?? 0) > 0 },
    { key: "work", label: { ar: "الخبرات العملية", en: "Work history" }, weight: 20, done: (t?.workHistory.length ?? 0) > 0 },
    { key: "achievements", label: { ar: "الإنجازات والأدلة", en: "Achievements & evidence" }, weight: 13, done: (t?.achievements.length ?? 0) > 1 },
    { key: "skills", label: { ar: "المهارات", en: "Skills" }, weight: 10, done: (t?.skills.length ?? 0) >= 4 },
    { key: "education", label: { ar: "التعليم", en: "Education" }, weight: 8, done: (t?.education.length ?? 0) > 0 },
    { key: "stories", label: { ar: "بنك قصص STAR", en: "STAR story bank" }, weight: 10, done: (t?.storyBank.length ?? 0) > 0 },
  ];
  const score = sections.reduce((s, x) => s + (x.done ? x.weight : 0), 0);
  return { score: Math.min(100, score), sections };
}

/* ========================== Job workspaces ========================== */

export const JOB_STATUSES = [
  "saved",
  "preparing",
  "applied",
  "interview",
  "offer",
  "rejected",
  "archived",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<JobStatus, { ar: string; en: string }> = {
  saved: { ar: "محفوظة", en: "Saved" },
  preparing: { ar: "قيد التجهيز", en: "Preparing" },
  applied: { ar: "تم التقديم", en: "Applied" },
  interview: { ar: "مقابلة", en: "Interview" },
  offer: { ar: "عرض", en: "Offer" },
  rejected: { ar: "مرفوضة", en: "Rejected" },
  archived: { ar: "مؤرشفة", en: "Archived" },
};

export type JobRequirements = {
  hardSkills: string[];
  softSkills: string[];
  responsibilities: string[];
  keywords: string[];
  years?: string;
  seniority?: string;
  language?: string;
  education: string[];
  /** Requirements the description never stated — shown honestly as unknown. */
  missing: string[];
};

export type GapKind = "skill" | "wording" | "evidence" | "info";

export type MatchGap = {
  id: string;
  kind: GapKind;
  label: string;
  hint: string;
};

export type MatchAnalysis = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  gaps: MatchGap[];
  /** Honest note about what this score can and cannot tell the user. */
  limitations: string[];
};

export type JobWorkspace = {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  location: string | null;
  jobUrl: string | null;
  jobDescription: string;
  salary: string | null;
  notes: string | null;
  status: JobStatus;
  requirements: JobRequirements | null;
  matchAnalysis: MatchAnalysis | null;
  matchScore: number;
  appliedAt: string | null;
  nextActionAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type JobRow = {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  location: string | null;
  job_url: string | null;
  job_description: string;
  salary: string | null;
  notes: string | null;
  status: string;
  requirements: unknown;
  match_analysis: unknown;
  match_score: number;
  applied_at: string | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
};

const hasKeys = (v: unknown) => !!v && typeof v === "object" && Object.keys(v as object).length > 0;

const toJob = (row: JobRow): JobWorkspace => ({
  id: row.id,
  userId: row.user_id,
  jobTitle: row.job_title,
  company: row.company,
  location: row.location,
  jobUrl: row.job_url,
  jobDescription: row.job_description ?? "",
  salary: row.salary,
  notes: row.notes,
  status: (JOB_STATUSES as readonly string[]).includes(row.status) ? (row.status as JobStatus) : "saved",
  requirements: hasKeys(row.requirements) ? (row.requirements as JobRequirements) : null,
  matchAnalysis: hasKeys(row.match_analysis) ? (row.match_analysis as MatchAnalysis) : null,
  matchScore: row.match_score ?? 0,
  appliedAt: row.applied_at,
  nextActionAt: row.next_action_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listJobs(userId: string): Promise<JobWorkspace[]> {
  const { data } = await supabase
    .from("job_workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as JobRow[]).map(toJob);
}

export async function getJob(id: string): Promise<JobWorkspace | null> {
  const { data } = await supabase.from("job_workspaces").select("*").eq("id", id).maybeSingle();
  return data ? toJob(data as unknown as JobRow) : null;
}

export type JobInput = {
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  jobDescription?: string;
  salary?: string;
  notes?: string;
  status?: JobStatus;
};

export async function createJob(userId: string, input: JobInput): Promise<JobWorkspace | null> {
  const { data, error } = await supabase
    .from("job_workspaces")
    .insert({
      user_id: userId,
      job_title: input.jobTitle,
      company: input.company,
      location: input.location ?? null,
      job_url: input.jobUrl ?? null,
      job_description: input.jobDescription ?? "",
      salary: input.salary ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "saved",
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return toJob(data as unknown as JobRow);
}

export async function updateJob(
  id: string,
  patch: Partial<
    Pick<
      JobWorkspace,
      | "jobTitle"
      | "company"
      | "location"
      | "jobUrl"
      | "jobDescription"
      | "salary"
      | "notes"
      | "status"
      | "requirements"
      | "matchAnalysis"
      | "matchScore"
      | "appliedAt"
      | "nextActionAt"
    >
  >,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.jobTitle !== undefined) row["job_title"] = patch.jobTitle;
  if (patch.company !== undefined) row["company"] = patch.company;
  if (patch.location !== undefined) row["location"] = patch.location;
  if (patch.jobUrl !== undefined) row["job_url"] = patch.jobUrl;
  if (patch.jobDescription !== undefined) row["job_description"] = patch.jobDescription;
  if (patch.salary !== undefined) row["salary"] = patch.salary;
  if (patch.notes !== undefined) row["notes"] = patch.notes;
  if (patch.status !== undefined) {
    row["status"] = patch.status;
    if (patch.status === "applied") row["applied_at"] = new Date().toISOString();
  }
  if (patch.requirements !== undefined) row["requirements"] = patch.requirements;
  if (patch.matchAnalysis !== undefined) row["match_analysis"] = patch.matchAnalysis;
  if (patch.matchScore !== undefined) row["match_score"] = patch.matchScore;
  if (patch.appliedAt !== undefined) row["applied_at"] = patch.appliedAt;
  if (patch.nextActionAt !== undefined) row["next_action_at"] = patch.nextActionAt;
  if (!Object.keys(row).length) return;
  await supabase.from("job_workspaces").update(row as Record<string, Json>).eq("id", id);
}

export async function deleteJob(id: string): Promise<void> {
  await supabase.from("job_workspaces").delete().eq("id", id);
}

/* ======================== Application assets ======================== */

export type AssetType = "resume" | "cover_letter" | "pitch" | "interview_pack" | "followup";

export type ApplicationAsset = {
  id: string;
  jobId: string;
  assetType: AssetType;
  resumeId: string | null;
  coverLetterId: string | null;
  content: Record<string, unknown>;
  createdAt: string;
};

export async function listAssets(jobId: string): Promise<ApplicationAsset[]> {
  const { data } = await supabase
    .from("application_assets")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r["id"]),
    jobId: String(r["job_id"]),
    assetType: r["asset_type"] as AssetType,
    resumeId: (r["resume_id"] as string | null) ?? null,
    coverLetterId: (r["cover_letter_id"] as string | null) ?? null,
    content: (r["content"] as Record<string, unknown>) ?? {},
    createdAt: String(r["created_at"]),
  }));
}

export async function saveAsset(
  userId: string,
  jobId: string,
  assetType: AssetType,
  content: Record<string, unknown>,
  refs?: { resumeId?: string; coverLetterId?: string },
): Promise<void> {
  await supabase.from("application_assets").insert({
    user_id: userId,
    job_id: jobId,
    asset_type: assetType,
    resume_id: refs?.resumeId ?? null,
    cover_letter_id: refs?.coverLetterId ?? null,
    content: content as Json,
  });
}

/* ============================== Tasks ============================== */

export type CareerTask = {
  id: string;
  jobId: string | null;
  title: string;
  notes: string | null;
  dueAt: string | null;
  done: boolean;
};

export async function listTasks(userId: string): Promise<CareerTask[]> {
  const { data } = await supabase
    .from("career_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("due_at", { ascending: true, nullsFirst: false });
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r["id"]),
    jobId: (r["job_id"] as string | null) ?? null,
    title: String(r["title"] ?? ""),
    notes: (r["notes"] as string | null) ?? null,
    dueAt: (r["due_at"] as string | null) ?? null,
    done: !!r["done"],
  }));
}

export async function addTask(
  userId: string,
  input: { title: string; jobId?: string; dueAt?: string; notes?: string },
): Promise<void> {
  await supabase.from("career_tasks").insert({
    user_id: userId,
    title: input.title,
    job_id: input.jobId ?? null,
    due_at: input.dueAt ?? null,
    notes: input.notes ?? null,
  });
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  await supabase.from("career_tasks").update({ done }).eq("id", id);
}

export async function deleteTask(id: string): Promise<void> {
  await supabase.from("career_tasks").delete().eq("id", id);
}

/* =========================== Agent activity =========================== */

export type AgentActivity = {
  id: string;
  agentId: AgentId;
  task: string;
  status: string;
  summary: string | null;
  jobId: string | null;
  createdAt: string;
};

/** Stores only a short, safe summary — never the raw prompt or answer. */
export async function logAgentActivity(
  userId: string,
  entry: { agentId: AgentId; task: string; status?: string; provider?: string; summary?: string; jobId?: string },
): Promise<void> {
  await supabase.from("agent_activity").insert({
    user_id: userId,
    agent_id: entry.agentId,
    task: entry.task,
    status: entry.status ?? "done",
    provider: entry.provider ?? null,
    summary: entry.summary?.slice(0, 160) ?? null,
    job_id: entry.jobId ?? null,
  });
}

export async function listAgentActivity(userId: string, limit = 12): Promise<AgentActivity[]> {
  const { data } = await supabase
    .from("agent_activity")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r["id"]),
    agentId: r["agent_id"] as AgentId,
    task: String(r["task"] ?? ""),
    status: String(r["status"] ?? ""),
    summary: (r["summary"] as string | null) ?? null,
    jobId: (r["job_id"] as string | null) ?? null,
    createdAt: String(r["created_at"]),
  }));
}
