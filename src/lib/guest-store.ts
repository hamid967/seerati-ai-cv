import { emptyResumeData, type Resume, type ResumeData } from "./types";

/**
 * Anonymous resume storage is intentionally memory-only by default.
 * No CV content is written to localStorage, cookies, analytics, or remote storage.
 */
export const GUEST_RESUME_LIMIT = 1;
export const GUEST_OWNER = "guest";
export const ANONYMOUS_SESSION_TIMEOUT_MINUTES = 20;
export const ANONYMOUS_SESSION_TIMEOUT_MS = ANONYMOUS_SESSION_TIMEOUT_MINUTES * 60 * 1000;
const CONSENT_KEY = "seerati.session-recovery-consent";
const RECOVERY_KEY = "seerati.session-recovery";

let memoryResumes: Resume[] = [];

function normalize(list: Resume[]): Resume[] {
  return list.slice(0, GUEST_RESUME_LIMIT).map((resume) => ({
    ...resume,
    ownerId: GUEST_OWNER,
    data: { ...emptyResumeData(), ...((resume.data as ResumeData) ?? {}) },
  }));
}

export function readGuestResumes(): Resume[] {
  return normalize(memoryResumes);
}

export function writeGuestResumes(list: Resume[]) {
  memoryResumes = normalize(list);
}

export function clearGuestResumes() {
  memoryResumes = [];
  clearConsentedSessionRecovery();
}

/** Session recovery is opt-in and never enabled implicitly. */
export function hasSessionRecoveryConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(CONSENT_KEY) === "true";
}

export function setSessionRecoveryConsent(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) window.sessionStorage.setItem(CONSENT_KEY, "true");
  else window.sessionStorage.removeItem(CONSENT_KEY);
}

export function saveConsentedSessionRecovery(list: Resume[]) {
  if (typeof window === "undefined" || !hasSessionRecoveryConsent()) return;
  try {
    window.sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(normalize(list)));
  } catch {
    // Private browsing and quota restrictions must not interrupt editing.
  }
}

export function readConsentedSessionRecovery(): Resume[] {
  if (typeof window === "undefined" || !hasSessionRecoveryConsent()) return [];
  try {
    const raw = window.sessionStorage.getItem(RECOVERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Resume[];
    return Array.isArray(parsed) ? normalize(parsed) : [];
  } catch {
    return [];
  }
}

export function clearConsentedSessionRecovery() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RECOVERY_KEY);
  window.sessionStorage.removeItem(CONSENT_KEY);
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
