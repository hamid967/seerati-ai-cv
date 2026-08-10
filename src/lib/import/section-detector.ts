/**
 * Import pipeline — section detection stage.
 *
 * Wraps the existing bilingual parser so the pipeline has one clear entry
 * point, and reports which sections were found plus a qualitative confidence
 * per section. Nothing is invented: an absent section stays absent.
 */
import { parseResumeText, type ParsedResume } from "../resume-import";
import { normalizeDocument, type NormalizedText } from "./normalizer";

export type DetectedSectionId =
  | "identity"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certificates"
  | "projects";

export type SectionConfidence = "high" | "medium" | "needs_review";

export const SECTION_LABEL: Record<DetectedSectionId, { ar: string; en: string }> = {
  identity: { ar: "الهوية والتواصل", en: "Identity & contact" },
  summary: { ar: "الملخص", en: "Summary" },
  experience: { ar: "الخبرات", en: "Experience" },
  education: { ar: "التعليم", en: "Education" },
  skills: { ar: "المهارات", en: "Skills" },
  languages: { ar: "اللغات", en: "Languages" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  projects: { ar: "المشاريع", en: "Projects" },
};

export const CONFIDENCE_LABEL: Record<SectionConfidence, { ar: string; en: string }> = {
  high: { ar: "ثقة عالية", en: "High" },
  medium: { ar: "متوسطة", en: "Medium" },
  needs_review: { ar: "تحتاج مراجعة", en: "Needs review" },
};

export type DetectedSection = {
  id: DetectedSectionId;
  confidence: SectionConfidence;
  count: number;
  /** Probable language of that section's content. */
  lang: "ar" | "en" | "mixed";
};

export type DetectionResult = {
  normalized: NormalizedText;
  parsed: ParsedResume;
  sections: DetectedSection[];
  docLang: "ar" | "en" | "mixed";
};

const AR_RE = /[\u0600-\u06FF]/g;
const EN_RE = /[A-Za-z]/g;

export function probableLanguage(text: string): "ar" | "en" | "mixed" {
  const ar = (text.match(AR_RE) ?? []).length;
  const en = (text.match(EN_RE) ?? []).length;
  if (!ar && !en) return "en";
  if (ar && en) {
    const ratio = ar / (ar + en);
    if (ratio > 0.7) return "ar";
    if (ratio < 0.3) return "en";
    return "mixed";
  }
  return ar ? "ar" : "en";
}

const conf = (count: number, strong: boolean): SectionConfidence => {
  if (!count) return "needs_review";
  if (strong && count >= 2) return "high";
  return count >= 1 && strong ? "high" : "medium";
};

/** Normalise → parse → report detected sections with qualitative confidence. */
export function detectSections(rawText: string): DetectionResult {
  const normalized = normalizeDocument(rawText);
  const docLang = probableLanguage(normalized.text);
  const parsed = parseResumeText(normalized.text, docLang === "ar" ? "ar" : "en");

  const sections: DetectedSection[] = [];
  const push = (id: DetectedSectionId, count: number, strong: boolean, sample: string) => {
    sections.push({ id, count, confidence: conf(count, strong), lang: probableLanguage(sample) });
  };

  const identityScore =
    (parsed.personal?.fullName ? 1 : 0) +
    (normalized.emails.length ? 1 : 0) +
    (normalized.phones.length ? 1 : 0);
  push(
    "identity",
    identityScore,
    identityScore >= 2,
    `${parsed.personal?.fullName ?? ""} ${parsed.personal?.jobTitle ?? ""}`,
  );
  push("summary", parsed.summary ? 1 : 0, (parsed.summary ?? "").length > 80, parsed.summary ?? "");
  const exp = parsed.experience ?? [];
  push(
    "experience",
    exp.length,
    exp.some((e) => e.company && e.bullets.length),
    exp.map((e) => `${e.role} ${e.company} ${e.bullets.join(" ")}`).join(" "),
  );
  const edu = parsed.education ?? [];
  push("education", edu.length, edu.some((e) => e.school), edu.map((e) => `${e.degree} ${e.school}`).join(" "));
  const skills = parsed.skills ?? [];
  push("skills", skills.length, skills.length >= 3, skills.map((s) => s.name).join(" "));
  const langs = parsed.languages ?? [];
  push("languages", langs.length, langs.length >= 1, langs.map((l) => l.name).join(" "));
  const certs = parsed.certificates ?? [];
  push("certificates", certs.length, certs.length >= 1, certs.map((c) => c.title).join(" "));
  const projects = parsed.projects ?? [];
  push("projects", projects.length, projects.length >= 1, projects.map((p) => p.title).join(" "));

  return { normalized, parsed, sections, docLang };
}
