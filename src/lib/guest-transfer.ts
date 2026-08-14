import { toPlainText } from "./ats";
import type { Resume, ResumeData } from "./types";

export const GUEST_EXPORT_SCHEMA_VERSION = "1.0";

export type GuestResumeExport = {
  title: string;
  templateId: string;
  language: "ar" | "en";
  status: Resume["status"];
  completionScore: number;
  atsScore: number;
  createdAt: string;
  updatedAt: string;
  data: ResumeData;
};

export type GuestExportDocument = {
  schemaVersion: typeof GUEST_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  storage: "guest-memory-session";
  notice: string;
  resumes: GuestResumeExport[];
};

export type GuestMigrationPreview = {
  requested: number;
  transferable: Resume[];
  blocked: Resume[];
  availableSlots: number;
  reason: "ready" | "account_limit" | "no_guest_data";
};

/**
 * Builds a portable browser-only export. It intentionally contains no session
 * identifiers, recovery consent, account profile data, analytics, or cloud metadata.
 */
export function buildGuestExport(resumes: Resume[], now = new Date()): GuestExportDocument {
  return {
    schemaVersion: GUEST_EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    storage: "guest-memory-session",
    notice:
      "This export was produced locally from an anonymous session. It does not create, update, or connect an account.",
    resumes: resumes.map((resume) => ({
      title: resume.title,
      templateId: resume.templateId,
      language: resume.language,
      status: resume.status,
      completionScore: resume.completionScore,
      atsScore: resume.atsScore,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
      data: structuredClone(resume.data),
    })),
  };
}

/** A plain-text ATS export for every current anonymous resume. */
export function buildGuestPlainText(resumes: Resume[]): string {
  return resumes
    .map((resume, index) => {
      const heading = `${resume.title}\n${"=".repeat(Math.max(8, resume.title.length))}`;
      return `${heading}\n${toPlainText(resume)}`;
    })
    .join("\n\n");
}

/**
 * Computes, but does not execute, the exact set that could be copied to an
 * authenticated account. The caller must show this preview and obtain a new,
 * explicit confirmation before a cloud mutation is allowed.
 */
export function buildGuestMigrationPreview(
  guestResumes: Resume[],
  accountResumeCount: number,
  accountLimit: number,
): GuestMigrationPreview {
  const availableSlots = Math.max(0, accountLimit - accountResumeCount);
  const transferable = guestResumes.slice(0, availableSlots);
  const blocked = guestResumes.slice(availableSlots);
  return {
    requested: guestResumes.length,
    transferable,
    blocked,
    availableSlots,
    reason:
      guestResumes.length === 0
        ? "no_guest_data"
        : transferable.length === 0
          ? "account_limit"
          : "ready",
  };
}

/** Browser-only file download; callers decide the user-triggered action. */
export function downloadLocalFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Let the browser resolve the user-initiated Blob download before cleanup.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
