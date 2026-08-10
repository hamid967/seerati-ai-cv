/**
 * Turns extracted resume text into a reviewable import draft for the Career Twin.
 *
 * Nothing here writes to the database. Every field carries a confidence level
 * and stays editable/skippable; conflicts with existing Twin data are shown as
 * a keep/replace choice instead of overwriting silently.
 */
import { parseResumeText, type ParsedResume } from "./resume-import";
import { detectLanguage } from "./file-extract";
import type { CareerTwin, TwinPatch } from "./career";
import type { SourceType } from "./import-connectors";
import { uid } from "./types";
import type { Education, Experience, LanguageItem, SkillItem } from "./types";

export type Confidence = "high" | "medium" | "low";

export const CONFIDENCE_LABEL: Record<Confidence, { ar: string; en: string }> = {
  high: { ar: "ثقة عالية", en: "High confidence" },
  medium: { ar: "ثقة متوسطة", en: "Medium confidence" },
  low: { ar: "تحقق مطلوب", en: "Needs review" },
};

export type FieldKey =
  | "fullName"
  | "headline"
  | "email"
  | "phone"
  | "city"
  | "summary";

export type FieldCandidate = {
  key: FieldKey;
  label: { ar: string; en: string };
  value: string;
  confidence: Confidence;
  /** Existing Twin value that this candidate would replace, if any. */
  existing?: string;
  include: boolean;
};

export type ListKind = "experience" | "education" | "skills" | "languages" | "certificates" | "projects";

export type ListCandidate<T> = {
  id: string;
  kind: ListKind;
  value: T;
  confidence: Confidence;
  /** True when an equivalent entry already exists on the Twin (deduped). */
  duplicate: boolean;
  include: boolean;
};

export type ImportDraft = {
  sourceType: SourceType;
  sourceLabel: string;
  fileName?: string;
  detectedLanguage: "ar" | "en" | "mixed";
  textLength: number;
  fields: FieldCandidate[];
  experience: ListCandidate<Experience>[];
  education: ListCandidate<Education>[];
  skills: ListCandidate<SkillItem>[];
  languages: ListCandidate<LanguageItem>[];
  certificates: ListCandidate<{ id: string; title: string; detail?: string }>[];
  projects: ListCandidate<{ id: string; title: string; detail?: string }>[];
  /** Sections the source clearly did not contain — stated, never guessed. */
  missingSections: ListKind[];
};

const FIELD_LABEL: Record<FieldKey, { ar: string; en: string }> = {
  fullName: { ar: "الاسم الكامل", en: "Full name" },
  headline: { ar: "المسمى المهني", en: "Professional headline" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  phone: { ar: "رقم الجوال", en: "Phone" },
  city: { ar: "المدينة", en: "City" },
  summary: { ar: "الملخص المهني", en: "Professional summary" },
};

const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

function expConfidence(item: Experience): Confidence {
  const hasDates = !!(item.start || item.end);
  const hasBoth = !!(item.company && item.role);
  if (hasBoth && hasDates) return "high";
  if (hasBoth || hasDates) return "medium";
  return "low";
}

function eduConfidence(item: Education): Confidence {
  if (item.school && item.degree) return "high";
  if (item.school || item.degree) return "medium";
  return "low";
}

function listCandidate<T>(kind: ListKind, value: T, confidence: Confidence, duplicate: boolean): ListCandidate<T> {
  return { id: uid(), kind, value, confidence, duplicate, include: !duplicate };
}

/**
 * Builds the review draft. `twin` is used only to detect duplicates and
 * conflicts — it is never mutated here.
 */
export function buildImportDraft(args: {
  text: string;
  sourceType: SourceType;
  sourceLabel: string;
  fileName?: string;
  lang: "ar" | "en";
  twin: CareerTwin | null;
}): ImportDraft {
  const detectedLanguage = detectLanguage(args.text);
  const parseLang: "ar" | "en" = detectedLanguage === "mixed" ? args.lang : detectedLanguage;
  const parsed: ParsedResume = parseResumeText(args.text, parseLang);
  const identity = args.twin?.identity;

  const emails = parsed.contact.emails;
  const phones = parsed.contact.phones;

  const rawFields: Array<{ key: FieldKey; value: string; confidence: Confidence }> = [
    { key: "fullName", value: parsed.personal?.fullName ?? "", confidence: parsed.personal?.fullName ? "medium" : "low" },
    { key: "headline", value: parsed.personal?.jobTitle ?? "", confidence: parsed.personal?.jobTitle ? "medium" : "low" },
    { key: "email", value: emails[0] ?? "", confidence: emails.length === 1 ? "high" : emails.length ? "medium" : "low" },
    { key: "phone", value: phones[0] ?? "", confidence: phones.length === 1 ? "high" : phones.length ? "medium" : "low" },
    { key: "city", value: parsed.personal?.city ?? "", confidence: parsed.personal?.city ? "medium" : "low" },
    { key: "summary", value: parsed.summary ?? "", confidence: (parsed.summary?.length ?? 0) > 80 ? "high" : "medium" },
  ];

  const fields: FieldCandidate[] = rawFields
    .filter((f) => f.value.trim().length > 0)
    .map((f) => {
      const existing = (identity?.[f.key === "headline" ? "headline" : f.key] ?? "").trim();
      const conflicting = existing && norm(existing) !== norm(f.value);
      return {
        key: f.key,
        label: FIELD_LABEL[f.key],
        value: f.value.trim(),
        confidence: f.confidence,
        ...(conflicting ? { existing } : {}),
        // Never silently overwrite an existing value: default to keeping it.
        include: !conflicting,
      };
    });

  const existingExp = new Set((args.twin?.workHistory ?? []).map((e) => norm(`${e.company}|${e.role}`)));
  const experience = (parsed.experience ?? []).map((item) =>
    listCandidate<Experience>("experience", item, expConfidence(item), existingExp.has(norm(`${item.company}|${item.role}`))),
  );

  const existingEdu = new Set((args.twin?.education ?? []).map((e) => norm(`${e.school}|${e.degree}`)));
  const education = (parsed.education ?? []).map((item) =>
    listCandidate<Education>("education", item, eduConfidence(item), existingEdu.has(norm(`${item.school}|${item.degree}`))),
  );

  const existingSkills = new Set((args.twin?.skills ?? []).map((s) => norm(s.name)));
  const skills = (parsed.skills ?? []).map((item) =>
    listCandidate<SkillItem>("skills", item, item.name.length > 1 ? "high" : "low", existingSkills.has(norm(item.name))),
  );

  const existingLangs = new Set((args.twin?.languages ?? []).map((l) => norm(l.name)));
  const languages = (parsed.languages ?? []).map((item) =>
    listCandidate<LanguageItem>("languages", item, "medium", existingLangs.has(norm(item.name))),
  );

  const existingCerts = new Set((args.twin?.certifications ?? []).map((c) => norm(c.title)));
  const certificates = (parsed.certificates ?? []).map((item) =>
    listCandidate<{ id: string; title: string; detail?: string }>(
      "certificates",
      { id: uid(), title: item.title, ...(item.detail ? { detail: item.detail } : {}) },
      "medium",
      existingCerts.has(norm(item.title)),
    ),
  );

  const existingProjects = new Set((args.twin?.projects ?? []).map((p) => norm(p.title)));
  const projects = (parsed.projects ?? []).map((item) =>
    listCandidate<{ id: string; title: string; detail?: string }>(
      "projects",
      { id: uid(), title: item.title, ...(item.detail ? { detail: item.detail } : {}) },
      "medium",
      existingProjects.has(norm(item.title)),
    ),
  );

  const missingSections: ListKind[] = [];
  if (!experience.length) missingSections.push("experience");
  if (!education.length) missingSections.push("education");
  if (!skills.length) missingSections.push("skills");
  if (!languages.length) missingSections.push("languages");

  return {
    sourceType: args.sourceType,
    sourceLabel: args.sourceLabel,
    ...(args.fileName ? { fileName: args.fileName } : {}),
    detectedLanguage,
    textLength: args.text.length,
    fields,
    experience,
    education,
    skills,
    languages,
    certificates,
    projects,
    missingSections,
  };
}

export type ApplySummary = { patch: TwinPatch; sections: string[]; count: number };

/**
 * Converts the reviewed draft into a Twin patch. Only entries the user kept
 * (`include`) are applied, and list sections are appended, never replaced.
 */
export function draftToTwinPatch(draft: ImportDraft, twin: CareerTwin | null): ApplySummary {
  const sections: string[] = [];
  let count = 0;
  const patch: TwinPatch = {};

  const chosenFields = draft.fields.filter((f) => f.include && f.value.trim());
  if (chosenFields.length) {
    const identity = { ...(twin?.identity ?? { fullName: "", headline: "", email: "", phone: "", city: "", summary: "" }) };
    for (const field of chosenFields) {
      identity[field.key] = field.value.trim();
      count += 1;
    }
    patch.identity = identity;
    sections.push("identity");
  }

  const pick = <T,>(list: ListCandidate<T>[]) => list.filter((x) => x.include).map((x) => x.value);

  const exp = pick(draft.experience);
  if (exp.length) {
    patch.workHistory = [...(twin?.workHistory ?? []), ...exp];
    sections.push("workHistory");
    count += exp.length;
  }

  const edu = pick(draft.education);
  if (edu.length) {
    patch.education = [...(twin?.education ?? []), ...edu];
    sections.push("education");
    count += edu.length;
  }

  const skills = pick(draft.skills);
  if (skills.length) {
    patch.skills = [...(twin?.skills ?? []), ...skills];
    sections.push("skills");
    count += skills.length;
  }

  const langs = pick(draft.languages);
  if (langs.length) {
    patch.languages = [...(twin?.languages ?? []), ...langs];
    sections.push("languages");
    count += langs.length;
  }

  const certs = pick(draft.certificates);
  if (certs.length) {
    patch.certifications = [...(twin?.certifications ?? []), ...certs];
    sections.push("certifications");
    count += certs.length;
  }

  const projects = pick(draft.projects);
  if (projects.length) {
    patch.projects = [...(twin?.projects ?? []), ...projects];
    sections.push("projects");
    count += projects.length;
  }

  return { patch, sections, count };
}
