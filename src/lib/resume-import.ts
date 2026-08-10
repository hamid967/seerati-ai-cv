/**
 * Heuristic, dependency-free resume text parser.
 *
 * Given raw pasted resume text (Arabic or English), this tries to detect the
 * common section headings and split the content into a `Partial<ResumeData>`
 * that the UI can show for review before anything is saved.
 *
 * This is intentionally simple: it never invents content, it only reorganises
 * whatever text the user pasted. The user always reviews and edits the result
 * before it is persisted (see `resume-import.tsx`).
 */
import { uid } from "./types";
import type { Education, Experience, LanguageItem, ResumeData, SimpleItem, SkillItem } from "./types";

export type ParsedResume = Partial<ResumeData> & {
  /** Contact details extracted from the free text, kept separately for review. */
  contact: { emails: string[]; phones: string[]; links: string[] };
};

type SectionId =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certificates"
  | "projects";

// Bilingual heading synonyms. Matching is case-insensitive and diacritics-agnostic.
const HEADINGS: Record<SectionId, RegExp> = {
  summary: /^(الملخص|نبذة|نبذة عني|ملخص|about me|profile|summary)\s*:?$/i,
  experience: /^(الخبرة|الخبرات|الخبرة العملية|experience|work experience|employment)\s*:?$/i,
  education: /^(التعليم|المؤهلات العلمية|education|academic background)\s*:?$/i,
  skills: /^(المهارات|skills|technical skills)\s*:?$/i,
  languages: /^(اللغات|languages)\s*:?$/i,
  certificates: /^(الدورات|الشهادات|الدورات والشهادات|courses|certificates|certifications)\s*:?$/i,
  projects: /^(المشاريع|projects)\s*:?$/i,
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Saudi/Gulf-friendly phone matcher: optional +country code, groups of digits/spaces/dashes.
const PHONE_RE = /(\+?\d[\d\s()-]{6,}\d)/g;
const LINK_RE = /((https?:\/\/|www\.)[^\s,؛]+)/gi;

/** Splits a text block into clean bullet lines, stripping common bullet markers. */
function toBullets(block: string): string[] {
  return block
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*\u2022▪◦·]\s*/, "").trim())
    .filter(Boolean);
}

/** Removes any line that only contains a heading we matched, keeping section bodies pure. */
function isHeadingLine(line: string): SectionId | null {
  const trimmed = line.trim();
  for (const key of Object.keys(HEADINGS) as SectionId[]) {
    if (HEADINGS[key].test(trimmed)) return key;
  }
  return null;
}

export function parseResumeText(text: string, lang: "ar" | "en"): ParsedResume {
  const cleanText = text.replace(/\r\n/g, "\n").trim();

  const emails = Array.from(new Set(cleanText.match(EMAIL_RE) ?? []));
  const phones = Array.from(new Set(cleanText.match(PHONE_RE) ?? [])).map((p) => p.trim());
  const links = Array.from(new Set(cleanText.match(LINK_RE) ?? []));

  const lines = cleanText.split("\n");
  const sections: Partial<Record<SectionId, string[]>> = {};
  let current: SectionId | null = null;

  for (const rawLine of lines) {
    const heading = isHeadingLine(rawLine);
    if (heading) {
      current = heading;
      sections[heading] = sections[heading] ?? [];
      continue;
    }
    if (current) {
      sections[current] = sections[current] ?? [];
      sections[current]!.push(rawLine);
    }
  }

  const result: ParsedResume = { contact: { emails, phones, links } };

  if (sections.summary?.length) {
    result.summary = toBullets(sections.summary.join("\n")).join(" ").trim();
  }

  if (sections.experience?.length) {
    // We cannot reliably split raw text into company/role/dates, so each
    // non-empty paragraph becomes one experience entry the user can edit,
    // with its lines kept as responsibility bullets.
    const paragraphs = sections.experience
      .join("\n")
      .split(/\n\s*\n/)
      .map((p) => toBullets(p))
      .filter((p) => p.length);
    result.experience = (paragraphs.length ? paragraphs : [toBullets(sections.experience.join("\n"))])
      .filter((p) => p.length)
      .map<Experience>((p) => ({
        id: uid(),
        role: "",
        company: "",
        bullets: p,
      }));
  }

  if (sections.education?.length) {
    result.education = toBullets(sections.education.join("\n")).map<Education>((line) => ({
      id: uid(),
      degree: line,
      school: "",
    }));
  }

  if (sections.skills?.length) {
    const raw = sections.skills.join("\n");
    const items = raw.includes(",") || raw.includes("،")
      ? raw.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
      : toBullets(raw);
    result.skills = items.map<SkillItem>((name) => ({ id: uid(), name }));
  }

  if (sections.languages?.length) {
    const raw = sections.languages.join("\n");
    const items = raw.includes(",") || raw.includes("،")
      ? raw.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
      : toBullets(raw);
    result.languages = items.map<LanguageItem>((name) => ({
      id: uid(),
      name,
      level: lang === "ar" ? "متوسط" : "Intermediate",
    }));
  }

  if (sections.certificates?.length) {
    result.certificates = toBullets(sections.certificates.join("\n")).map<SimpleItem>((line) => ({
      id: uid(),
      title: line,
    }));
  }

  if (sections.projects?.length) {
    result.projects = toBullets(sections.projects.join("\n")).map<SimpleItem>((line) => ({
      id: uid(),
      title: line,
    }));
  }

  return result;
}
