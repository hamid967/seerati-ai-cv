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

export async function saveTemplate(tpl: TemplateDef) {
  const { error } = await supabase
    .from("templates")
    .update({
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
    })
    .eq("id", tpl.id);
  return error ? { error: error.message } : {};
}

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  targetRole: string | null;
  onboarded: boolean;
  createdAt: string;
  role: "admin" | "user";
  resumeCount: number;
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const [{ data: profiles }, { data: roles }, { data: resumes }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("resumes").select("user_id"),
  ]);
  const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
  const counts = new Map<string, number>();
  for (const r of resumes ?? []) counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name ?? "",
    targetRole: p.target_role,
    onboarded: p.onboarded,
    createdAt: p.created_at,
    role: adminIds.has(p.id) ? "admin" : "user",
    resumeCount: counts.get(p.id) ?? 0,
  }));
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
  createdAt: string;
};

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  const { data } = await supabase
    .from("admin_audit_logs")
    .select("id, action, target, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    target: a.target,
    createdAt: a.created_at,
  }));
}

export async function logAudit(action: string, target?: string, metadata?: Record<string, unknown>) {
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
