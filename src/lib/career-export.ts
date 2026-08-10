/**
 * Career data export — user-owned data only, produced in the browser from rows
 * the signed-in user can already read under RLS.
 *
 * Never included: service keys, other users' rows, internal AI prompts, or
 * anything the user did not create. `source_url` / `file_ref` values are copied
 * as stored (private references) and are not turned into public links.
 */

import { supabase } from "@/integrations/supabase/client";

export const EXPORT_SCHEMA_VERSION = "1.0";

export type CareerExport = {
  schema_version: string;
  generated_at: string;
  product: "seerati";
  user: { id: string; email: string };
  sections: Record<string, unknown>;
};

const rows = async (table: string, userId: string, column = "user_id") => {
  const { data, error } = await supabase.from(table as never).select("*").eq(column, userId);
  if (error) return { error: error.message, rows: [] as unknown[] };
  return { rows: (data as unknown[]) ?? [] };
};

/** Builds the full export document for the signed-in user. */
export async function buildCareerExport(user: { id: string; email: string }): Promise<CareerExport> {
  const [profile, twin, resumes, versions, facts, evidence, terms, jobs, events, assets, tasks, usage] =
    await Promise.all([
      rows("profiles", user.id, "id"),
      rows("career_profiles", user.id),
      rows("resumes", user.id),
      rows("resume_versions", user.id),
      rows("career_facts", user.id),
      rows("career_evidence", user.id),
      rows("protected_terms", user.id),
      rows("job_workspaces", user.id),
      rows("job_application_events", user.id),
      rows("application_assets", user.id),
      rows("career_tasks", user.id),
      rows("ai_usage", user.id),
    ]);

  return {
    schema_version: EXPORT_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    product: "seerati",
    user: { id: user.id, email: user.email },
    sections: {
      profile: profile.rows,
      career_twin: twin.rows,
      resumes: resumes.rows,
      resume_versions: versions.rows,
      career_facts: facts.rows,
      career_evidence: evidence.rows,
      protected_terms: terms.rows,
      job_workspaces: jobs.rows,
      job_application_events: events.rows,
      application_assets: assets.rows,
      career_tasks: tasks.rows,
      ai_usage_metadata: usage.rows,
    },
  };
}

export function downloadJson(doc: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------ deletion tools ----------------------------- */

/** Clears import provenance from the Career Twin without touching the content. */
export async function clearImportProvenance(userId: string): Promise<void> {
  const { error } = await supabase
    .from("career_profiles")
    .update({ import_meta: {} })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/** Deletes AI usage metadata rows (task + token counters only). */
export async function clearAiUsage(userId: string): Promise<{ deleted: boolean; reason?: string }> {
  const { error } = await supabase.from("ai_usage").delete().eq("user_id", userId);
  // ai_usage is append-only by policy; report honestly instead of pretending.
  if (error) return { deleted: false, reason: error.message };
  return { deleted: true };
}

/** Deletes the Career Twin row. Resumes are kept — they are separate documents. */
export async function deleteCareerTwin(userId: string): Promise<void> {
  const { error } = await supabase.from("career_profiles").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteFactsBulk(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("career_facts").delete().in("id", ids);
  if (error) throw new Error(error.message);
}

export async function deleteEvidenceBulk(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("career_evidence").delete().in("id", ids);
  if (error) throw new Error(error.message);
}
