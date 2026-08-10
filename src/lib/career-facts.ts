/**
 * Career Fact Graph — the evidence layer the whole product trusts.
 *
 * Everything the assistant is allowed to state about the user must exist here
 * as a fact, and every number must be backed by an evidence row the user
 * marked as verified. Nothing in this module invents content: it only reads,
 * writes and filters what the user entered or explicitly approved.
 *
 * All reads/writes go through the browser Supabase client, so RLS scopes every
 * row to the signed-in owner (admins get read-only visibility via has_role).
 */
import { supabase } from "@/integrations/supabase/client";

/* --------------------------------- types ---------------------------------- */

export const FACT_TYPES = [
  "achievement",
  "skill",
  "metric",
  "project",
  "certificate",
  "star_story",
] as const;
export type FactType = (typeof FACT_TYPES)[number];

export const FACT_TYPE_LABEL: Record<FactType, { ar: string; en: string }> = {
  achievement: { ar: "إنجاز", en: "Achievement" },
  skill: { ar: "مهارة", en: "Skill" },
  metric: { ar: "رقم/مؤشر", en: "Metric" },
  project: { ar: "مشروع", en: "Project" },
  certificate: { ar: "شهادة", en: "Certificate" },
  star_story: { ar: "قصة STAR", en: "STAR story" },
};

export type VerificationStatus = "verified" | "needs_review";

export const VERIFICATION_LABEL: Record<VerificationStatus, { ar: string; en: string }> = {
  verified: { ar: "موثّق", en: "Verified" },
  needs_review: { ar: "يحتاج مراجعة", en: "Needs review" },
};

export type CareerFact = {
  id: string;
  userId: string;
  type: FactType;
  title: string;
  value: string;
  metadata: Record<string, unknown>;
  sourceType: string;
  sourceLabel: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
};

export const EVIDENCE_TYPES = ["metric", "document", "link", "reference", "note"] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, { ar: string; en: string }> = {
  metric: { ar: "رقم قابل للقياس", en: "Measurable metric" },
  document: { ar: "مستند", en: "Document" },
  link: { ar: "رابط", en: "Link" },
  reference: { ar: "تزكية/شخص", en: "Reference" },
  note: { ar: "ملاحظة", en: "Note" },
};

export type CareerEvidence = {
  id: string;
  userId: string;
  factId: string | null;
  evidenceType: EvidenceType;
  title: string;
  description: string;
  metricValue: string;
  metricUnit: string;
  sourceUrl: string;
  fileRef: string | null;
  verified: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProtectedTerm = {
  id: string;
  term: string;
  translationPolicy: "keep_as_is" | "transliterate" | "translate";
  notes: string;
  createdAt: string;
};

export type ResumeVersion = {
  id: string;
  resumeId: string;
  parentVersionId: string | null;
  label: string;
  snapshot: unknown;
  changeSummary: string;
  createdAt: string;
};

/* ------------------------------- row mapping ------------------------------ */

const asObject = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const asFactType = (v: string): FactType =>
  (FACT_TYPES as readonly string[]).includes(v) ? (v as FactType) : "achievement";

const asEvidenceType = (v: string): EvidenceType =>
  (EVIDENCE_TYPES as readonly string[]).includes(v) ? (v as EvidenceType) : "note";

type FactRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  value: string;
  metadata: unknown;
  source_type: string;
  source_label: string | null;
  verification_status: string;
  created_at: string;
  updated_at: string;
};

const toFact = (row: FactRow): CareerFact => ({
  id: row.id,
  userId: row.user_id,
  type: asFactType(row.type),
  title: row.title,
  value: row.value,
  metadata: asObject(row.metadata),
  sourceType: row.source_type,
  sourceLabel: row.source_label ?? "",
  verificationStatus: row.verification_status === "verified" ? "verified" : "needs_review",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type EvidenceRow = {
  id: string;
  user_id: string;
  fact_id: string | null;
  evidence_type: string;
  title: string;
  description: string;
  metric_value: string | null;
  metric_unit: string | null;
  source_url: string | null;
  file_ref: string | null;
  verified: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

const toEvidence = (row: EvidenceRow): CareerEvidence => ({
  id: row.id,
  userId: row.user_id,
  factId: row.fact_id,
  evidenceType: asEvidenceType(row.evidence_type),
  title: row.title,
  description: row.description,
  metricValue: row.metric_value ?? "",
  metricUnit: row.metric_unit ?? "",
  sourceUrl: row.source_url ?? "",
  fileRef: row.file_ref,
  verified: row.verified,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/* ---------------------------------- facts --------------------------------- */

export type FactInput = {
  type: FactType;
  title: string;
  value?: string;
  metadata?: Record<string, unknown>;
  sourceType?: string;
  sourceLabel?: string;
  verificationStatus?: VerificationStatus;
};

export async function listFacts(userId: string): Promise<CareerFact[]> {
  const { data, error } = await supabase
    .from("career_facts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as FactRow[] | null) ?? []).map(toFact);
}

export async function createFact(userId: string, input: FactInput): Promise<CareerFact | null> {
  const { data, error } = await supabase
    .from("career_facts")
    .insert({
      user_id: userId,
      type: input.type,
      title: input.title.trim(),
      value: (input.value ?? "").trim(),
      metadata: (input.metadata ?? {}) as never,
      source_type: input.sourceType ?? "manual",
      source_label: input.sourceLabel ?? null,
      verification_status: input.verificationStatus ?? "needs_review",
    })
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toFact(data as FactRow) : null;
}

export async function updateFact(id: string, patch: Partial<FactInput>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.type) row["type"] = patch.type;
  if (patch.title !== undefined) row["title"] = patch.title.trim();
  if (patch.value !== undefined) row["value"] = patch.value.trim();
  if (patch.metadata) row["metadata"] = patch.metadata;
  if (patch.sourceType) row["source_type"] = patch.sourceType;
  if (patch.sourceLabel !== undefined) row["source_label"] = patch.sourceLabel;
  if (patch.verificationStatus) row["verification_status"] = patch.verificationStatus;
  if (!Object.keys(row).length) return;
  const { error } = await supabase
    .from("career_facts")
    .update(row as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteFact(id: string): Promise<void> {
  const { error } = await supabase.from("career_facts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* -------------------------------- evidence -------------------------------- */

export type EvidenceInput = {
  factId?: string | null;
  evidenceType: EvidenceType;
  title: string;
  description?: string;
  metricValue?: string;
  metricUnit?: string;
  sourceUrl?: string;
  verified?: boolean;
  metadata?: Record<string, unknown>;
};

export async function listEvidence(userId: string): Promise<CareerEvidence[]> {
  const { data, error } = await supabase
    .from("career_evidence")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as EvidenceRow[] | null) ?? []).map(toEvidence);
}

export async function createEvidence(
  userId: string,
  input: EvidenceInput,
): Promise<CareerEvidence | null> {
  const { data, error } = await supabase
    .from("career_evidence")
    .insert({
      user_id: userId,
      fact_id: input.factId ?? null,
      evidence_type: input.evidenceType,
      title: input.title.trim(),
      description: (input.description ?? "").trim(),
      metric_value: input.metricValue?.trim() || null,
      metric_unit: input.metricUnit?.trim() || null,
      source_url: input.sourceUrl?.trim() || null,
      verified: input.verified ?? false,
      metadata: (input.metadata ?? {}) as never,
    })
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toEvidence(data as EvidenceRow) : null;
}

export async function updateEvidence(id: string, patch: Partial<EvidenceInput>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.factId !== undefined) row["fact_id"] = patch.factId;
  if (patch.evidenceType) row["evidence_type"] = patch.evidenceType;
  if (patch.title !== undefined) row["title"] = patch.title.trim();
  if (patch.description !== undefined) row["description"] = patch.description.trim();
  if (patch.metricValue !== undefined) row["metric_value"] = patch.metricValue.trim() || null;
  if (patch.metricUnit !== undefined) row["metric_unit"] = patch.metricUnit.trim() || null;
  if (patch.sourceUrl !== undefined) row["source_url"] = patch.sourceUrl.trim() || null;
  if (patch.verified !== undefined) row["verified"] = patch.verified;
  if (patch.metadata) row["metadata"] = patch.metadata;
  if (!Object.keys(row).length) return;
  const { error } = await supabase
    .from("career_evidence")
    .update(row as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteEvidence(id: string): Promise<void> {
  const { error } = await supabase.from("career_evidence").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ----------------------------- protected terms ---------------------------- */

export async function listProtectedTerms(userId: string): Promise<ProtectedTerm[]> {
  const { data, error } = await supabase
    .from("protected_terms")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    (data as Array<{
      id: string;
      term: string;
      translation_policy: string;
      notes: string | null;
      created_at: string;
    }> | null) ?? []
  ).map((r) => ({
    id: r.id,
    term: r.term,
    translationPolicy:
      r.translation_policy === "transliterate" || r.translation_policy === "translate"
        ? r.translation_policy
        : "keep_as_is",
    notes: r.notes ?? "",
    createdAt: r.created_at,
  }));
}

export async function addProtectedTerm(
  userId: string,
  term: string,
  policy: ProtectedTerm["translationPolicy"] = "keep_as_is",
): Promise<void> {
  const clean = term.trim();
  if (!clean) return;
  const { error } = await supabase
    .from("protected_terms")
    .insert({ user_id: userId, term: clean, translation_policy: policy });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function deleteProtectedTerm(id: string): Promise<void> {
  const { error } = await supabase.from("protected_terms").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ----------------------------- resume versions ---------------------------- */

export async function listResumeVersions(resumeId: string): Promise<ResumeVersion[]> {
  const { data, error } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    (data as Array<{
      id: string;
      resume_id: string;
      parent_version_id: string | null;
      label: string;
      snapshot: unknown;
      change_summary: string;
      created_at: string;
    }> | null) ?? []
  ).map((r) => ({
    id: r.id,
    resumeId: r.resume_id,
    parentVersionId: r.parent_version_id,
    label: r.label,
    snapshot: r.snapshot,
    changeSummary: r.change_summary,
    createdAt: r.created_at,
  }));
}

/** Snapshot a resume before a risky edit so the change is reversible later. */
export async function snapshotResume(args: {
  userId: string;
  resumeId: string;
  label: string;
  snapshot: unknown;
  changeSummary?: string;
  parentVersionId?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("resume_versions")
    .insert({
      user_id: args.userId,
      resume_id: args.resumeId,
      parent_version_id: args.parentVersionId ?? null,
      label: args.label,
      snapshot: args.snapshot as never,
      change_summary: args.changeSummary ?? "",
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { id: string } | null)?.id ?? null;
}

/* ------------------------- AI-safe context building ----------------------- */

/** A number-like token that a bullet claims. */
const NUMBER_RE = /\d[\d,.]*\s*%?/g;

export type FactGraph = {
  facts: CareerFact[];
  evidence: CareerEvidence[];
};

/** A graph with no stored data — used by public/demo surfaces. */
export const emptyFactGraph = (): FactGraph => ({ facts: [], evidence: [] });

export async function loadFactGraph(userId: string): Promise<FactGraph> {
  const [facts, evidence] = await Promise.all([listFacts(userId), listEvidence(userId)]);
  return { facts, evidence };
}

export const verifiedFacts = (g: FactGraph): CareerFact[] =>
  g.facts.filter((f) => f.verificationStatus === "verified");

export const evidenceForFact = (g: FactGraph, factId: string): CareerEvidence[] =>
  g.evidence.filter((e) => e.factId === factId);

/** Facts without any evidence row — the assistant must ask, never assume. */
export const factsMissingEvidence = (g: FactGraph): CareerFact[] =>
  g.facts.filter((f) => !g.evidence.some((e) => e.factId === f.id));

/**
 * Evidence relevant to one job description: keyword overlap only, so nothing is
 * pulled in that the user did not already record.
 */
export function gatherEvidenceForJob(
  g: FactGraph,
  jobDescription: string,
  limit = 8,
): Array<{ fact: CareerFact | null; evidence: CareerEvidence }> {
  const tokens = new Set(
    jobDescription
      .toLowerCase()
      .split(/[^\p{L}\p{N}+#.]+/u)
      .filter((t) => t.length > 2),
  );
  const scored = g.evidence.map((e) => {
    const hay = `${e.title} ${e.description} ${e.metricUnit}`.toLowerCase();
    let score = 0;
    tokens.forEach((t) => {
      if (hay.includes(t)) score += 1;
    });
    if (e.verified) score += 2;
    return { e, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({
      fact: g.facts.find((f) => f.id === s.e.factId) ?? null,
      evidence: s.e,
    }));
}

/**
 * The minimum viable context handed to the model: only user-approved facts,
 * trimmed and without identifiers, chat history or raw files.
 */
export function buildAiFactContext(
  g: FactGraph,
  opts: { jobDescription?: string; max?: number } = {},
): string {
  const max = opts.max ?? 12;
  const lines: string[] = [];
  for (const f of verifiedFacts(g).slice(0, max)) {
    const ev = evidenceForFact(g, f.id)
      .filter((e) => e.verified)
      .map((e) => [e.metricValue, e.metricUnit].filter(Boolean).join(" ") || e.title)
      .slice(0, 2);
    lines.push(
      `- [${f.type}] ${f.title}${f.value ? `: ${f.value}` : ""}${ev.length ? ` (evidence: ${ev.join("; ")})` : ""}`,
    );
  }
  if (opts.jobDescription) {
    for (const { evidence } of gatherEvidenceForJob(g, opts.jobDescription, 5)) {
      const label = [evidence.metricValue, evidence.metricUnit].filter(Boolean).join(" ");
      lines.push(`- [job-relevant] ${evidence.title}${label ? `: ${label}` : ""}`);
    }
  }
  if (!lines.length) return "NO_VERIFIED_FACTS";
  return lines.join("\n");
}

/**
 * Stage 2 name for the same guarantee: the ONLY professional context an AI
 * feature may see is the user's own verified facts and evidence.
 */
export const buildSafeAiEvidenceContext = buildAiFactContext;

/**
 * Truth guardrail: any number in AI text that is not backed by a verified
 * evidence row is flagged so the UI can ask the user to confirm it instead of
 * silently publishing an invented figure.
 */
export function unsupportedFigures(text: string, g: FactGraph): string[] {
  const claimed = Array.from(new Set((text.match(NUMBER_RE) ?? []).map((n) => n.trim())));
  if (!claimed.length) return [];
  const supported = new Set<string>();
  for (const e of g.evidence) {
    if (!e.verified) continue;
    for (const n of `${e.metricValue} ${e.description} ${e.title}`.match(NUMBER_RE) ?? []) {
      supported.add(n.trim());
    }
  }
  for (const f of verifiedFacts(g)) {
    for (const n of `${f.title} ${f.value}`.match(NUMBER_RE) ?? []) supported.add(n.trim());
  }
  // Years such as "2019" and tiny counts are not treated as performance claims.
  return claimed.filter(
    (n) => !supported.has(n) && !/^(19|20)\d{2}$/.test(n) && n.replace(/\D/g, "").length > 1,
  );
}

/** Descriptive readiness of the vault — never a fake precision score. */
export function describeVault(
  g: FactGraph,
  lang: "ar" | "en",
): { headline: string; items: string[] } {
  const ar = lang === "ar";
  const v = verifiedFacts(g).length;
  const missing = factsMissingEvidence(g).length;
  const items: string[] = [];
  if (!g.facts.length) {
    items.push(
      ar
        ? "لا توجد حقائق بعد — ابدأ بإضافة إنجاز واحد."
        : "No facts yet — start with one achievement.",
    );
  } else {
    items.push(
      ar ? `${v} حقيقة موثّقة من ${g.facts.length}.` : `${v} of ${g.facts.length} facts verified.`,
    );
    if (missing) {
      items.push(
        ar ? `نحتاج دليلاً لـ ${missing} حقيقة.` : `${missing} facts still need evidence.`,
      );
    }
  }
  return {
    headline: ar ? "خزانة الأدلة" : "Evidence vault",
    items,
  };
}
