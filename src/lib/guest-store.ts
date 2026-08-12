import { emptyResumeData, type Resume, type ResumeData } from "./types";

/**
 * Guest (no-account) resume storage. Visitors can build and export one resume
 * entirely on their own device; signing up later migrates it to the cloud.
 */
export const GUEST_RESUME_LIMIT = 1;
const KEY = "seerati.guest.resumes";

export const GUEST_OWNER = "guest";

export function readGuestResumes(): Resume[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Resume[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, GUEST_RESUME_LIMIT).map((r) => ({
      ...r,
      ownerId: GUEST_OWNER,
      data: { ...emptyResumeData(), ...((r.data as ResumeData) ?? {}) },
    }));
  } catch {
    return [];
  }
}

export function writeGuestResumes(list: Resume[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, GUEST_RESUME_LIMIT)));
  } catch {
    // Storage can be full or blocked (private mode); guest data is best-effort.
  }
}

export function clearGuestResumes() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function makeGuestResume(input: {
  title: string;
  templateId: string;
  language: "ar" | "en";
  data: ResumeData;
}): Resume {
  const now = new Date().toISOString();
  return {
    id: `guest-${Math.random().toString(36).slice(2, 10)}`,
    ownerId: GUEST_OWNER,
    title: input.title,
    templateId: input.templateId,
    language: input.language,
    data: input.data,
    status: "draft",
    completionScore: 0,
    atsScore: 0,
    lastViewedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export const isGuestResumeId = (id: string) => id.startsWith("guest-");
