/**
 * Recruiter Snapshot — deterministic, explained, and never invented.
 *
 * This is NOT a simulated recruiter and it does not predict hiring outcomes. It
 * assembles what a reviewer can see in the first ten seconds using only data
 * the user already stored: the resume itself, verified facts/evidence, and the
 * job description when one exists. Every insight carries `source` so the UI can
 * show where it came from, and anything derived (like years of experience) is
 * omitted rather than guessed when the underlying data is not usable.
 */
import { verifiedFacts, evidenceForFact, type CareerFact, type FactGraph } from "./career-facts";
import { lintResume, type LintFinding } from "./resume-lint";
import type { Resume, ResumeData } from "./types";

export type InsightSource = "resume" | "evidence" | "job_description" | "lint" | "derived";

export type SnapshotInsight = {
  id: string;
  label: { ar: string; en: string };
  value: string;
  source: InsightSource;
  /** True when a verified fact/evidence row backs this line. */
  evidenceBacked?: boolean;
  detail?: { ar: string; en: string };
};

export type RecruiterSnapshot = {
  /** Headline the reviewer reads first — target title + contact readiness. */
  targetTitle: string;
  contact: { complete: boolean; missing: string[]; score: number };
  /** Only present when experience dates are parseable. */
  yearsExperience: number | null;
  yearsNote: { ar: string; en: string };
  topEvidence: SnapshotInsight[];
  matchingSkills: string[];
  missingSkills: string[];
  gaps: SnapshotInsight[];
  /** The single vaguest item, so the user knows exactly what to fix first. */
  vaguest: { text: string; where: string } | null;
  scanFlags: LintFinding[];
  qualityScore: number;
};

const MONTH_RE = /^(\d{4})(?:-(\d{1,2}))?$/;

/** Parse "2021", "2021-05" or an ISO date into a month index, else null. */
function toMonths(value?: string): number | null {
  if (!value) return null;
  const v = value.trim();
  const m = MONTH_RE.exec(v);
  if (m && m[1]) return Number(m[1]) * 12 + (m[2] ? Number(m[2]) - 1 : 0);
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.getFullYear() * 12 + d.getMonth();
  return null;
}

/**
 * Years of experience from real, non-overlapping date ranges. Returns null when
 * dates are missing or unparseable — an unknown number is better than a wrong
 * one on a document a recruiter reads.
 */
export function derivedYears(data: ResumeData): number | null {
  const now = new Date();
  const nowMonths = now.getFullYear() * 12 + now.getMonth();
  const ranges: Array<[number, number]> = [];
  for (const e of data.experience) {
    const start = toMonths(e.start);
    if (start === null) continue;
    const end = e.current ? nowMonths : toMonths(e.end);
    if (end === null || end < start) continue;
    ranges.push([start, end]);
  }
  if (!ranges.length) return null;
  ranges.sort((a, b) => a[0] - b[0]);
  let months = 0;
  let cursor = -Infinity;
  for (const [start, end] of ranges) {
    const from = Math.max(start, cursor);
    if (end > from) {
      months += end - from;
      cursor = end;
    }
  }
  return Math.round((months / 12) * 10) / 10;
}

const CONTACT_FIELDS: Array<{ key: keyof ResumeData["personal"]; ar: string; en: string }> = [
  { key: "fullName", ar: "الاسم", en: "Name" },
  { key: "jobTitle", ar: "المسمى الوظيفي", en: "Job title" },
  { key: "email", ar: "البريد الإلكتروني", en: "Email" },
  { key: "phone", ar: "الجوال", en: "Phone" },
  { key: "city", ar: "المدينة", en: "City" },
];

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .split(/[^\p{L}\p{N}+#.]+/u)
    .filter((t) => t.length > 2);

/** Skills present in the resume that the job description also asks for. */
function skillOverlap(data: ResumeData, jobDescription: string) {
  const jdTokens = new Set(tokenize(jobDescription));
  const matching: string[] = [];
  for (const s of data.skills) {
    const parts = tokenize(s.name);
    if (parts.length && parts.every((p) => jdTokens.has(p))) matching.push(s.name);
  }
  const resumeText = tokenize(
    [data.summary, ...data.skills.map((s) => s.name), ...data.experience.flatMap((e) => [e.role, ...e.bullets])].join(" "),
  );
  const resumeSet = new Set(resumeText);
  // Only multi-character, capital-ish or repeated JD terms are treated as skills.
  const missing = Array.from(jdTokens)
    .filter((t) => t.length > 3 && !resumeSet.has(t))
    .slice(0, 8);
  return { matching, missing };
}

function factLine(fact: CareerFact, graph: FactGraph): SnapshotInsight {
  const ev = evidenceForFact(graph, fact.id).filter((e) => e.verified);
  const metric = ev.map((e) => [e.metricValue, e.metricUnit].filter(Boolean).join(" ")).find(Boolean);
  return {
    id: `fact_${fact.id}`,
    label: { ar: "إنجاز موثّق", en: "Verified achievement" },
    value: [fact.title, fact.value].filter(Boolean).join(" — "),
    source: "evidence",
    evidenceBacked: true,
    ...(metric
      ? { detail: { ar: `الدليل: ${metric}`, en: `Evidence: ${metric}` } }
      : ev[0]
        ? { detail: { ar: `الدليل: ${ev[0].title}`, en: `Evidence: ${ev[0].title}` } }
        : {}),
  };
}

const VAGUE_MARKERS = [
  "مسؤول عن",
  "المساعدة في",
  "العمل على",
  "متعدد المهام",
  "responsible for",
  "worked on",
  "helped with",
  "various tasks",
  "team player",
];

/** The weakest, least specific line in the resume (no numbers, vague verb). */
function findVaguest(data: ResumeData): { text: string; where: string } | null {
  const candidates: Array<{ text: string; where: string; score: number }> = [];
  const consider = (text: string, where: string) => {
    const t = text.trim();
    if (t.length < 12) return;
    const lower = t.toLowerCase();
    let score = 0;
    if (VAGUE_MARKERS.some((m) => lower.includes(m))) score += 3;
    if (!/\d/.test(t)) score += 2;
    if (t.split(/\s+/).length < 6) score += 1;
    if (score >= 3) candidates.push({ text: t, where, score });
  };
  if (data.summary) consider(data.summary, "summary");
  for (const e of data.experience) {
    for (const b of e.bullets) consider(b, `${e.role || e.company || "experience"}`);
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  return top ? { text: top.text, where: top.where } : null;
}

export function buildRecruiterSnapshot(
  input: Resume | ResumeData,
  opts: { graph?: FactGraph; jobDescription?: string } = {},
): RecruiterSnapshot {
  const data = "data" in input ? input.data : input;
  const graph = opts.graph ?? { facts: [], evidence: [] };
  const report = lintResume(input, opts.graph);

  const missingContact = CONTACT_FIELDS.filter((f) => !String(data.personal[f.key] ?? "").trim());
  const years = derivedYears(data);

  const jd = (opts.jobDescription ?? data.jobDescription ?? "").trim();
  const overlap = jd ? skillOverlap(data, jd) : { matching: [], missing: [] };

  const topEvidence = verifiedFacts(graph)
    .filter((f) => f.type === "achievement" || f.type === "metric" || f.type === "project")
    .slice(0, 3)
    .map((f) => factLine(f, graph));

  const gaps: SnapshotInsight[] = [];
  if (missingContact.length) {
    gaps.push({
      id: "gap_contact",
      label: { ar: "بيانات تواصل ناقصة", en: "Incomplete contact details" },
      value: missingContact.map((f) => f.ar).join("، "),
      source: "resume",
      detail: {
        ar: "المراجع يحتاج طريقة للتواصل في أول نظرة.",
        en: "A reviewer needs a way to reach you at first glance.",
      },
    });
  }
  if (!topEvidence.length) {
    gaps.push({
      id: "gap_evidence",
      label: { ar: "لا إنجازات موثّقة", en: "No verified achievements" },
      value: "0",
      source: "evidence",
      detail: {
        ar: "أضف إنجازاً واحداً مع دليله في خزانة الأدلة.",
        en: "Add one achievement with its evidence in the vault.",
      },
    });
  }
  if (jd && overlap.missing.length) {
    gaps.push({
      id: "gap_keywords",
      label: { ar: "كلمات من الوصف الوظيفي غير موجودة", en: "Job keywords not present" },
      value: overlap.missing.slice(0, 5).join(", "),
      source: "job_description",
      detail: {
        ar: "أضِفها فقط إن كانت تصف خبرتك فعلاً.",
        en: "Add them only if they truly describe your experience.",
      },
    });
  }
  if (years === null) {
    gaps.push({
      id: "gap_dates",
      label: { ar: "تواريخ الخبرة غير مكتملة", en: "Experience dates incomplete" },
      value: "—",
      source: "derived",
      detail: {
        ar: "بدون تواريخ صالحة لا يمكن حساب سنوات الخبرة.",
        en: "Without valid dates, years of experience cannot be derived.",
      },
    });
  }

  return {
    targetTitle: (data.targetJob || data.personal.jobTitle || "").trim(),
    contact: {
      complete: missingContact.length === 0,
      missing: missingContact.map((f) => f.en),
      score: Math.round(((CONTACT_FIELDS.length - missingContact.length) / CONTACT_FIELDS.length) * 100),
    },
    yearsExperience: years,
    yearsNote:
      years === null
        ? { ar: "غير محسوبة — التواريخ ناقصة أو غير صالحة.", en: "Not derived — dates are missing or invalid." }
        : { ar: "محسوبة من تواريخ الخبرات فقط.", en: "Derived from experience dates only." },
    topEvidence,
    matchingSkills: overlap.matching,
    missingSkills: overlap.missing,
    gaps: gaps.slice(0, 4),
    vaguest: findVaguest(data),
    scanFlags: report.findings.filter(
      (f) => f.category === "readability" || f.category === "structure",
    ),
    qualityScore: report.score,
  };
}
