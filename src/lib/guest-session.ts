import type { Resume } from "./types";
import { ANONYMOUS_SESSION_TIMEOUT_MS } from "./guest-store";

export type GuestResumeSession = {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  locale: "ar" | "en";
  direction: "rtl" | "ltr";
  currentJourney: "noura" | "builder" | "import" | "ats" | "jobs" | "cover-letter";
  currentStep: number;
  careerProfile: null;
  resumeDocument: Resume | null;
  selectedTemplate: string | null;
  acceptedSuggestions: string[];
  undoStack: unknown[];
  redoStack: unknown[];
  consentState: { aiProcessing: boolean };
  privacyState: "memory-only";
};

let session: GuestResumeSession | null = null;

function randomSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `guest-${Math.random().toString(36).slice(2, 12)}`;
}

export function createGuestResumeSession(locale: "ar" | "en" = "ar"): GuestResumeSession {
  const createdAt = new Date().toISOString();
  return {
    sessionId: randomSessionId(),
    createdAt,
    expiresAt: new Date(Date.now() + ANONYMOUS_SESSION_TIMEOUT_MS).toISOString(),
    locale,
    direction: locale === "ar" ? "rtl" : "ltr",
    currentJourney: "builder",
    currentStep: 0,
    careerProfile: null,
    resumeDocument: null,
    selectedTemplate: null,
    acceptedSuggestions: [],
    undoStack: [],
    redoStack: [],
    consentState: { aiProcessing: false },
    privacyState: "memory-only",
  };
}

export function readGuestResumeSession(): GuestResumeSession | null {
  return session;
}

export function upsertGuestResumeSession(
  resume: Resume | null,
  options: Partial<Pick<GuestResumeSession, "locale" | "currentJourney" | "currentStep">> = {},
): GuestResumeSession {
  const locale = options.locale ?? resume?.language ?? session?.locale ?? "ar";
  const previous = session ?? createGuestResumeSession(locale);
  session = {
    ...previous,
    locale,
    direction: locale === "ar" ? "rtl" : "ltr",
    currentJourney: options.currentJourney ?? previous.currentJourney,
    currentStep: options.currentStep ?? previous.currentStep,
    resumeDocument: resume,
    selectedTemplate: resume?.templateId ?? previous.selectedTemplate,
    expiresAt: new Date(Date.now() + ANONYMOUS_SESSION_TIMEOUT_MS).toISOString(),
  };
  return session;
}

export function clearGuestResumeSession() {
  session = null;
}
