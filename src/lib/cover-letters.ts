/**
 * Evidence-grounded cover letters.
 *
 * A cover letter is the easiest place for a model to invent an employer, a job
 * title or a metric, so generation here is fenced twice:
 *  1. the model only ever receives `buildSafeAiEvidenceContext` output plus the
 *     job facts the user typed themselves — no chat history, no web data;
 *  2. before anything is saved, `checkCoverLetterClaims` re-reads the draft and
 *     reports every number, company and title that is NOT present in the
 *     resume, Career Twin or Evidence Vault, so the user must edit or prove it.
 */
import { supabase } from "@/integrations/supabase/client";
import { aiService } from "./ai-service";
import { buildSafeAiEvidenceContext, unsupportedFigures, type FactGraph } from "./career-facts";
import type { CareerTwin } from "./career";
import type { ResumeData } from "./types";

export type CoverLetter = {
  id: string;
  userId: string;
  jobId: string | null;
  resumeId: string | null;
  title: string;
  tone: string;
  language: string;
  opening: string;
  body: string;
  closing: string;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  user_id: string;
  job_id: string | null;
  resume_id: string | null;
  title: string;
  tone: string;
  language: string;
  opening: string;
  body: string;
  closing: string;
  created_at: string;
  updated_at: string;
};

const toLetter = (r: Row): CoverLetter => ({
  id: r.id,
  userId: r.user_id,
  jobId: r.job_id,
  resumeId: r.resume_id,
  title: r.title,
  tone: r.tone,
  language: r.language,
  opening: r.opening,
  body: r.body,
  closing: r.closing,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listCoverLetters(jobId: string): Promise<CoverLetter[]> {
  const { data } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => toLetter(r as Row));
}

export async function saveCoverLetter(
  userId: string,
  input: {
    id?: string;
    jobId?: string | null;
    resumeId?: string | null;
    title: string;
    tone?: string;
    language?: string;
    opening: string;
    body: string;
    closing: string;
  },
): Promise<CoverLetter | null> {
  const payload = {
    user_id: userId,
    job_id: input.jobId ?? null,
    resume_id: input.resumeId ?? null,
    title: input.title,
    tone: input.tone ?? "professional",
    language: input.language ?? "ar",
    opening: input.opening,
    body: input.body,
    closing: input.closing,
  };
  const query = input.id
    ? supabase.from("cover_letters").update(payload).eq("id", input.id).select("*").maybeSingle()
    : supabase.from("cover_letters").insert(payload).select("*").maybeSingle();
  const { data } = await query;
  return data ? toLetter(data as Row) : null;
}

/* ------------------------------ claims check ------------------------------ */

export type ClaimIssue = {
  kind: "number" | "company" | "title";
  value: string;
  note: { ar: string; en: string };
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Every company/title the user genuinely stored somewhere. */
function knownEntities(resume: ResumeData | null, twin: CareerTwin | null, jobCompany: string) {
  const companies = new Set<string>();
  const titles = new Set<string>();
  if (jobCompany.trim()) companies.add(norm(jobCompany));
  for (const e of resume?.experience ?? []) {
    if (e.company) companies.add(norm(e.company));
    if (e.role) titles.add(norm(e.role));
  }
  for (const e of twin?.workHistory ?? []) {
    if (e.company) companies.add(norm(e.company));
    if (e.role) titles.add(norm(e.role));
  }
  return { companies, titles };
}

/** Capitalised multi-word spans look like organisation names in Latin text. */
const LATIN_ENTITY_RE = /\b([A-Z][A-Za-z&.'-]+(?:\s+[A-Z][A-Za-z&.'-]+){0,3})\b/g;

export function checkCoverLetterClaims(args: {
  text: string;
  graph: FactGraph;
  resume: ResumeData | null;
  twin: CareerTwin | null;
  jobCompany: string;
}): ClaimIssue[] {
  const issues: ClaimIssue[] = [];

  for (const value of unsupportedFigures(args.text, args.graph)) {
    issues.push({
      kind: "number",
      value,
      note: {
        ar: "هذا الرقم غير مدعوم بدليل موثّق في خزانة الأدلة — عدّله أو أضف دليلاً له.",
        en: "This figure has no verified evidence in your vault — edit it or add evidence.",
      },
    });
  }

  const { companies, titles } = knownEntities(args.resume, args.twin, args.jobCompany);
  const seen = new Set<string>();
  for (const m of args.text.matchAll(LATIN_ENTITY_RE)) {
    const raw = (m[1] ?? "").trim();
    const key = norm(raw);
    if (!raw.includes(" ") || seen.has(key)) continue;
    seen.add(key);
    if (companies.has(key) || titles.has(key)) continue;
    issues.push({
      kind: "company",
      value: raw,
      note: {
        ar: "اسم غير موجود في سيرتك أو ملفك المهني — تأكد أنه صحيح قبل الإرسال.",
        en: "This name is not in your resume or career profile — confirm it before sending.",
      },
    });
  }

  return issues.slice(0, 12);
}

/* ------------------------------- generation ------------------------------- */

export type GeneratedLetter = { opening: string; body: string; closing: string };

/**
 * Draft a letter from stored evidence only. Returns the raw draft; the caller is
 * responsible for running `checkCoverLetterClaims` and getting user approval
 * before persisting anything.
 */
export async function generateCoverLetter(args: {
  graph: FactGraph;
  jobTitle: string;
  company: string;
  jobDescription: string;
  lang: "ar" | "en";
  tone?: string;
}): Promise<GeneratedLetter> {
  const evidence = buildSafeAiEvidenceContext(args.graph, {
    jobDescription: args.jobDescription,
  });
  const ar = args.lang === "ar";
  const prompt = [
    ar
      ? "اكتب خطاب تقديم مهنياً موجزاً بثلاثة أجزاء: افتتاحية، متن، خاتمة."
      : "Write a concise professional cover letter in three parts: opening, body, closing.",
    ar
      ? "استخدم فقط الحقائق المذكورة أدناه. لا تخترع أي رقم أو شركة أو مسمى وظيفي غير موجود."
      : "Use ONLY the facts listed below. Never invent a number, company or job title.",
    `${ar ? "الوظيفة" : "Role"}: ${args.jobTitle} — ${args.company}`,
    `${ar ? "حقائق موثقة" : "Verified facts"}:\n${evidence}`,
    args.jobDescription.trim()
      ? `${ar ? "الوصف الوظيفي" : "Job description"}:\n${args.jobDescription.slice(0, 1800)}`
      : "",
    ar
      ? "أعد النتيجة بثلاث فقرات مفصولة بسطر فارغ فقط."
      : "Return exactly three paragraphs separated by a blank line.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await aiService.run({
    task: "chat",
    text: prompt,
    language: args.lang,
    tone: args.tone,
  });
  const parts = (res.text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    opening: parts[0] ?? "",
    body: parts.slice(1, -1).join("\n\n") || parts[1] || "",
    closing: parts.length > 2 ? (parts[parts.length - 1] as string) : "",
  };
}
