/**
 * Resume version graph.
 *
 * Versions and job variants are snapshots in `resume_versions`, never new rows
 * in `resumes` — that is what keeps branching free of the 3-resume limit.
 *
 * Every write checks ownership of the parent resume before touching a snapshot,
 * on top of the RLS policies that already scope rows to `auth.uid()`.
 */
import { supabase } from "@/integrations/supabase/client";
import { listResumeVersions, type ResumeVersion } from "@/lib/career-facts";
import { describeDiff, diffResumeData } from "@/lib/resume-diff";
import type { ResumeData } from "@/lib/types";

export type { ResumeVersion };

export const BASE_LABEL = { ar: "النسخة الأساسية", en: "Base version" };

/** Auto-snapshots closer than this to the last one are skipped as noise. */
export const AUTO_SNAPSHOT_WINDOW_MS = 5 * 60 * 1000;

async function assertOwnsResume(resumeId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("resumes")
    .select("id,user_id")
    .eq("id", resumeId)
    .maybeSingle();
  return !!data && (data as { user_id: string }).user_id === userId;
}

export { listResumeVersions };

/** Create a snapshot of the current resume data under a readable label. */
export async function createVersionSnapshot(args: {
  userId: string;
  resumeId: string;
  label: string;
  summary?: string;
  snapshot: ResumeData;
  parentVersionId?: string | null;
  metadataJobId?: string;
}): Promise<ResumeVersion | null> {
  if (!(await assertOwnsResume(args.resumeId, args.userId))) return null;
  const payload = args.metadataJobId
    ? ({ ...args.snapshot, __jobId: args.metadataJobId } as unknown)
    : (args.snapshot as unknown);
  const { data, error } = await supabase
    .from("resume_versions")
    .insert({
      user_id: args.userId,
      resume_id: args.resumeId,
      parent_version_id: args.parentVersionId ?? null,
      label: args.label.trim() || "version",
      snapshot: payload as never,
      change_summary: args.summary ?? "",
    })
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as {
    id: string;
    resume_id: string;
    parent_version_id: string | null;
    label: string;
    snapshot: unknown;
    change_summary: string;
    created_at: string;
  };
  return {
    id: row.id,
    resumeId: row.resume_id,
    parentVersionId: row.parent_version_id,
    label: row.label,
    snapshot: row.snapshot,
    changeSummary: row.change_summary,
    createdAt: row.created_at,
  };
}

/** Branch a job-specific variant off the current state (no new resume row). */
export async function createJobVariantSnapshot(args: {
  userId: string;
  resumeId: string;
  snapshot: ResumeData;
  jobTitle: string;
  company?: string;
  jobId?: string;
  jobDescription?: string;
  parentVersionId?: string | null;
}): Promise<ResumeVersion | null> {
  const label = [args.jobTitle, args.company].filter(Boolean).join(" — ").slice(0, 90);
  const tailored: ResumeData = {
    ...args.snapshot,
    targetJob: args.jobTitle || args.snapshot.targetJob || "",
    ...(args.jobDescription ? { jobDescription: args.jobDescription } : {}),
  };
  return createVersionSnapshot({
    userId: args.userId,
    resumeId: args.resumeId,
    label: label || "job variant",
    summary: `variant:${args.jobId ?? "job"}`,
    snapshot: tailored,
    ...(args.parentVersionId ? { parentVersionId: args.parentVersionId } : {}),
    ...(args.jobId ? { metadataJobId: args.jobId } : {}),
  });
}

export async function renameResumeVersion(versionId: string, label: string): Promise<void> {
  const clean = label.trim();
  if (!clean) return;
  const { error } = await supabase
    .from("resume_versions")
    .update({ label: clean })
    .eq("id", versionId);
  if (error) throw new Error(error.message);
}

export type RestoreResult =
  | { ok: true; data: ResumeData; backupVersionId: string | null }
  | { ok: false; error: "not_owner" | "not_found" | "bad_snapshot" };

/**
 * Restore a snapshot into the live resume. The current state is snapshotted
 * first, so restoring is itself reversible.
 */
export async function restoreResumeVersion(args: {
  userId: string;
  resumeId: string;
  versionId: string;
  current: ResumeData;
  lang: "ar" | "en";
}): Promise<RestoreResult> {
  if (!(await assertOwnsResume(args.resumeId, args.userId)))
    return { ok: false, error: "not_owner" };
  const { data, error } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("id", args.versionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ok: false, error: "not_found" };
  const row = data as { resume_id: string; label: string; snapshot: unknown };
  if (row.resume_id !== args.resumeId) return { ok: false, error: "not_found" };
  const snapshot = asResumeData(row.snapshot);
  if (!snapshot) return { ok: false, error: "bad_snapshot" };

  const backup = await createVersionSnapshot({
    userId: args.userId,
    resumeId: args.resumeId,
    label: args.lang === "ar" ? "قبل الاستعادة" : "Before restore",
    summary: describeDiff(diffResumeData(args.current, snapshot), args.lang),
    snapshot: args.current,
  });

  return { ok: true, data: snapshot, backupVersionId: backup?.id ?? null };
}

/** Snapshot payloads are `unknown` in the DB; validate the shape before use. */
export function asResumeData(snapshot: unknown): ResumeData | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const s = snapshot as Record<string, unknown>;
  if (!s["personal"] || typeof s["personal"] !== "object") return null;
  if (!Array.isArray(s["experience"])) return null;
  const { __jobId: _ignored, ...rest } = s;
  return rest as unknown as ResumeData;
}

/** Job id a variant snapshot was created for, when it carries one. */
export function versionJobId(v: ResumeVersion): string | null {
  const s = v.snapshot;
  if (s && typeof s === "object" && !Array.isArray(s)) {
    const id = (s as Record<string, unknown>)["__jobId"];
    if (typeof id === "string" && id) return id;
  }
  const m = /^variant:(.+)$/.exec(v.changeSummary || "");
  return m && m[1] && m[1] !== "job" ? m[1] : null;
}

/**
 * Auto-snapshot before a large AI-approved mutation, unless an equivalent
 * snapshot already exists for this editing session.
 */
export async function ensureSessionSnapshot(args: {
  userId: string;
  resumeId: string;
  current: ResumeData;
  reason: string;
  lang: "ar" | "en";
  versions?: ResumeVersion[];
}): Promise<ResumeVersion | null> {
  const versions = args.versions ?? (await listResumeVersions(args.resumeId));
  const recent = versions.find(
    (v) =>
      Date.now() - new Date(v.createdAt).getTime() < AUTO_SNAPSHOT_WINDOW_MS &&
      v.changeSummary.startsWith("auto:"),
  );
  if (recent) return recent;
  return createVersionSnapshot({
    userId: args.userId,
    resumeId: args.resumeId,
    label: args.lang === "ar" ? "نسخة تلقائية قبل تعديل المساعد" : "Auto snapshot before AI edit",
    summary: `auto:${args.reason}`,
    snapshot: args.current,
  });
}
