import { supabase } from "@/integrations/supabase/client";
import { baseDesign, defaultTemplates } from "./templates";
import type { TemplateDef } from "./types";

/** Cloud reads/writes for templates, admin users, settings and the audit log. */

type TemplateRow = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  category: string;
  thumbnail_url: string | null;
  supports_rtl: boolean;
  ats_friendly: boolean;
  active: boolean;
  display_order: number;
  design: unknown;
};

export const rowToTemplate = (row: TemplateRow): TemplateDef => {
  const seed = defaultTemplates.find((t) => t.id === row.id);
  return {
    id: row.id,
    name: { ar: row.name_ar, en: row.name_en },
    description: { ar: row.description_ar ?? "", en: row.description_en ?? "" },
    category: row.category as TemplateDef["category"],
    supportsRTL: row.supports_rtl,
    atsFriendly: row.ats_friendly,
    active: row.active,
    order: row.display_order,
    design: {
      ...baseDesign,
      ...(seed?.design ?? {}),
      ...((row.design as Partial<TemplateDef["design"]>) ?? {}),
    },
  };
};

export async function fetchTemplates(includeInactive = false): Promise<TemplateDef[]> {
  let query = supabase.from("templates").select("*").order("display_order");
  if (!includeInactive) query = query.eq("active", true);
  const { data } = await query;
  return ((data as TemplateRow[] | null) ?? []).map(rowToTemplate);
}

const templateColumns = (tpl: TemplateDef) => ({
  name_ar: tpl.name.ar,
  name_en: tpl.name.en,
  description_ar: tpl.description.ar,
  description_en: tpl.description.en,
  category: tpl.category,
  supports_rtl: tpl.supportsRTL,
  ats_friendly: tpl.atsFriendly,
  active: tpl.active,
  display_order: tpl.order,
  design: tpl.design as never,
});

export async function saveTemplate(tpl: TemplateDef) {
  const { error } = await supabase.from("templates").update(templateColumns(tpl)).eq("id", tpl.id);
  return error ? { error: error.message } : {};
}

export async function createTemplate(tpl: TemplateDef) {
  const { error } = await supabase
    .from("templates")
    .insert({ id: tpl.id, ...templateColumns(tpl) });
  return error ? { error: error.message } : {};
}

/** Deletes a template only when unused; otherwise deactivates it. */
export async function deleteOrDeactivateTemplate(
  id: string,
): Promise<{ deleted: boolean; error?: string }> {
  const { count } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("template_id", id);
  if ((count ?? 0) > 0) {
    const { error } = await supabase.from("templates").update({ active: false }).eq("id", id);
    return { deleted: false, ...(error ? { error: error.message } : {}) };
  }
  const { error } = await supabase.from("templates").delete().eq("id", id);
  return { deleted: !error, ...(error ? { error: error.message } : {}) };
}

export async function templateUsage(): Promise<Record<string, number>> {
  const { data } = await supabase.from("resumes").select("template_id");
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    const key = r.template_id ?? "—";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export async function setUserRole(userId: string, role: "admin" | "user") {
  const { error } = await supabase.rpc("admin_set_user_role", {
    target_user_id: userId,
    new_role: role,
  });
  return error ? { error: error.message } : {};
}

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  targetRole: string | null;
  yearsExperience: string | null;
  industry: string | null;
  onboarded: boolean;
  createdAt: string;
  role: "admin" | "user";
  resumeCount: number;
  lastActivity: string | null;
  resumeMeta: {
    id: string;
    title: string;
    status: string;
    completion: number;
    ats: number;
    updatedAt: string;
  }[];
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const [{ data: profiles }, { data: roles }, { data: resumes }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase
      .from("resumes")
      .select("id, user_id, title, status, completion_score, ats_score, updated_at")
      .order("updated_at", { ascending: false }),
  ]);
  const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
  const byUser = new Map<string, AdminUser["resumeMeta"]>();
  for (const r of resumes ?? []) {
    const list = byUser.get(r.user_id) ?? [];
    list.push({
      id: r.id,
      title: r.title,
      status: r.status,
      completion: r.completion_score,
      ats: r.ats_score,
      updatedAt: r.updated_at,
    });
    byUser.set(r.user_id, list);
  }
  return (profiles ?? []).map((p) => {
    const meta = byUser.get(p.id) ?? [];
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name ?? "",
      targetRole: p.target_role,
      yearsExperience: p.years_experience,
      industry: p.industry,
      onboarded: p.onboarded,
      createdAt: p.created_at,
      role: adminIds.has(p.id) ? "admin" : ("user" as const),
      resumeCount: meta.length,
      lastActivity: meta[0]?.updatedAt ?? null,
      resumeMeta: meta,
    };
  });
}

export type AdminStats = {
  totalUsers: number;
  newUsers30d: number;
  totalResumes: number;
  avgResumesPerUser: number;
  drafts: number;
  complete: number;
  aiTotal: number;
  ai30d: number;
  templateRanking: { id: string; count: number }[];
  recentSignups: { id: string; email: string; fullName: string; createdAt: string }[];
};

export async function fetchAdminStats(): Promise<AdminStats> {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [profiles, newProfiles, resumes, aiAll, ai30, signups] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("resumes").select("status, template_id"),
    supabase.from("ai_usage").select("id", { count: "exact", head: true }),
    supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rows = resumes.data ?? [];
  const ranking = new Map<string, number>();
  for (const r of rows)
    ranking.set(r.template_id ?? "—", (ranking.get(r.template_id ?? "—") ?? 0) + 1);
  const totalUsers = profiles.count ?? 0;

  return {
    totalUsers,
    newUsers30d: newProfiles.count ?? 0,
    totalResumes: rows.length,
    avgResumesPerUser: totalUsers ? Math.round((rows.length / totalUsers) * 10) / 10 : 0,
    drafts: rows.filter((r) => r.status !== "complete").length,
    complete: rows.filter((r) => r.status === "complete").length,
    aiTotal: aiAll.count ?? 0,
    ai30d: ai30.count ?? 0,
    templateRanking: [...ranking.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    recentSignups: (signups.data ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name ?? "",
      createdAt: p.created_at,
    })),
  };
}

export type ResumeMeta = {
  id: string;
  templateId: string | null;
  language: string;
  updatedAt: string;
};

export async function fetchResumeMeta(): Promise<ResumeMeta[]> {
  const { data } = await supabase
    .from("resumes")
    .select("id, template_id, language, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((r) => ({
    id: r.id,
    templateId: r.template_id,
    language: r.language,
    updatedAt: r.updated_at,
  }));
}

export type AuditEntry = {
  id: string;
  action: string;
  target: string | null;
  actorId: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export async function fetchAuditLog(limit = 200): Promise<AuditEntry[]> {
  const [{ data }, { data: profiles }] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select("id, action, target, actor_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("profiles").select("id, email"),
  ]);
  const emails = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  return (data ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    target: a.target,
    actorId: a.actor_id,
    actorEmail: a.actor_id ? (emails.get(a.actor_id) ?? null) : null,
    metadata: (a.metadata as Record<string, unknown> | null) ?? null,
    createdAt: a.created_at,
  }));
}

export async function logAudit(
  action: string,
  target?: string,
  metadata?: Record<string, unknown>,
) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("admin_audit_logs").insert({
    actor_id: data.user.id,
    action,
    target: target ?? null,
    metadata: (metadata ?? null) as never,
  });
}

export async function logAiUsage(task: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("ai_usage").insert({ user_id: data.user.id, task });
}

export type AppSettings = {
  id: string;
  siteName: string;
  logoUrl: string | null;
  defaultLanguage: "ar" | "en";
  maxResumes: number;
  maintenance: boolean;
  aiMode: string;
  aiProvider: string | null;
};

type AppSettingsRow = {
  id: string;
  site_name: string;
  logo_url: string | null;
  default_language: string;
  max_resumes: number;
  maintenance: boolean;
  ai_mode: string;
  ai_provider: string | null;
};

export async function fetchAppSettings(): Promise<AppSettings | null> {
  // Full configuration (including internal AI/maintenance fields) is admin-only and
  // guarded server-side; regular users may only read the public columns.
  const { data: rows } = await supabase.rpc("admin_get_app_settings");
  const data = (rows as AppSettingsRow[] | null)?.[0];
  if (!data) return null;


  return {
    id: data.id,
    siteName: data.site_name,
    logoUrl: data.logo_url,
    defaultLanguage: data.default_language === "en" ? "en" : "ar",
    maxResumes: data.max_resumes,
    maintenance: data.maintenance,
    aiMode: data.ai_mode,
    aiProvider: data.ai_provider,
  };
}

export async function saveAppSettings(patch: Partial<AppSettings> & { id: string }) {
  const { error } = await supabase
    .from("app_settings")
    .update({
      ...(patch.siteName !== undefined ? { site_name: patch.siteName } : {}),
      ...(patch.logoUrl !== undefined ? { logo_url: patch.logoUrl } : {}),
      ...(patch.defaultLanguage !== undefined ? { default_language: patch.defaultLanguage } : {}),
      ...(patch.maxResumes !== undefined ? { max_resumes: patch.maxResumes } : {}),
      ...(patch.maintenance !== undefined ? { maintenance: patch.maintenance } : {}),
      ...(patch.aiMode !== undefined ? { ai_mode: patch.aiMode } : {}),
      ...(patch.aiProvider !== undefined ? { ai_provider: patch.aiProvider } : {}),
    })
    .eq("id", patch.id);
  return error ? { error: error.message } : {};
}
