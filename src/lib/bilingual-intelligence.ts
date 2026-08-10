/**
 * Bilingual career intelligence.
 *
 * Seerati is Arabic-first but most Gulf hiring flows are bilingual. Translating
 * a resume must never damage proper nouns: company names, product names,
 * universities, certificates and personal names. This module gives the builder
 * and the copilot deterministic tools for that — the user owns the rules through
 * the `protected_terms` table (Stage 1).
 */

import type { ProtectedTerm } from "./career-facts";
import type { ResumeData, SectionKey } from "./types";
import { foldText } from "./saudi-career-taxonomy";

export type TranslationPolicy = ProtectedTerm["translationPolicy"];

export const POLICY_LABEL: Record<TranslationPolicy, { ar: string; en: string }> = {
  keep_as_is: { ar: "يبقى كما هو", en: "Keep as-is" },
  transliterate: { ar: "يُكتب صوتياً", en: "Transliterate" },
  translate: { ar: "يُترجم", en: "Translate" },
};

export const POLICY_HINT: Record<TranslationPolicy, { ar: string; en: string }> = {
  keep_as_is: {
    ar: "يُنسخ المصطلح حرفياً في كل اللغات (أسماء الشركات والمنتجات والشهادات).",
    en: "Copied verbatim in every language (companies, products, certificates).",
  },
  transliterate: {
    ar: "يُكتب بأحرف اللغة الأخرى دون ترجمة معناه.",
    en: "Rendered in the other script without translating the meaning.",
  },
  translate: { ar: "يُسمح بترجمته ترجمة كاملة.", en: "Full translation is allowed." },
};

/* --------------------------- protected term rules -------------------------- */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type ProtectedTermApplication = {
  text: string;
  /** Terms whose spelling was restored to the user's canonical form. */
  restored: string[];
  /** keep_as_is terms present in the source but missing from the result. */
  missing: string[];
};

/**
 * Post-processes AI output so that every `keep_as_is` term appears exactly as
 * the user spelled it, and reports terms the model dropped. Nothing is ever
 * silently invented: only spelling of existing occurrences is corrected.
 */
export function applyProtectedTerms(
  text: string,
  terms: ProtectedTerm[],
  source?: string,
): ProtectedTermApplication {
  let out = text;
  const restored: string[] = [];
  const missing: string[] = [];

  for (const t of terms) {
    const term = t.term.trim();
    if (!term) continue;
    if (t.translationPolicy === "translate") continue;

    const re = new RegExp(escapeRe(term), "gi");
    if (re.test(out)) {
      const before = out;
      out = out.replace(new RegExp(escapeRe(term), "gi"), term);
      if (before !== out) restored.push(term);
      continue;
    }
    if (
      t.translationPolicy === "keep_as_is" &&
      source &&
      new RegExp(escapeRe(term), "i").test(source)
    ) {
      missing.push(term);
    }
  }

  return { text: out, restored, missing };
}

/** Compact instruction block passed to the AI as action context. */
export function protectedTermsPrompt(terms: ProtectedTerm[], lang: "ar" | "en" = "ar"): string {
  const usable = terms.filter((t) => t.translationPolicy !== "translate");
  if (!usable.length) return "";
  const lines = usable.map((t) => `- "${t.term}" → ${POLICY_LABEL[t.translationPolicy].en}`);
  const head =
    lang === "ar"
      ? "مصطلحات محمية يجب احترام سياستها بدقة (لا تترجمها ولا تعد صياغتها):"
      : "Protected terms — respect each policy exactly (do not translate or reword):";
  return `${head}\n${lines.join("\n")}`;
}

/**
 * Latin brand-like tokens (ARAMCO, SAP S/4HANA, KPMG…) that exist in the source
 * but vanished from the translation. Purely mechanical: any capitalised or
 * mixed-case Latin token of 2+ chars, minus a small stop list.
 */
const BRAND_STOP = new Set([
  "AND",
  "THE",
  "FOR",
  "WITH",
  "OF",
  "IN",
  "AT",
  "TO",
  "CV",
  "KSA",
  "UAE",
  "AR",
  "EN",
]);

export function preserveBrandEntities(
  original: string,
  translated: string,
  terms: ProtectedTerm[] = [],
): { missing: string[] } {
  const tokens = original.match(/\b[A-Za-z][A-Za-z0-9&./+-]{1,}\b/g) ?? [];
  const protectedSet = new Set(
    terms.filter((t) => t.translationPolicy !== "translate").map((t) => t.term.toLowerCase()),
  );
  const missing = new Set<string>();

  for (const raw of tokens) {
    const isBrandish =
      raw === raw.toUpperCase() || /[a-z][A-Z]/.test(raw) || protectedSet.has(raw.toLowerCase());
    if (!isBrandish) continue;
    if (BRAND_STOP.has(raw.toUpperCase())) continue;
    if (!new RegExp(escapeRe(raw), "i").test(translated)) missing.add(raw);
  }
  return { missing: [...missing] };
}

/* ---------------------------- punctuation hygiene -------------------------- */

/**
 * Fixes mixed Arabic/Latin punctuation without touching proper nouns:
 * Arabic comma/question mark in Arabic runs, Latin punctuation in Latin runs,
 * spacing around punctuation, and collapsed whitespace. Letters, digits and
 * casing are never altered, so names stay intact.
 */
export function normalizeArabicEnglishPunctuation(input: string, lang: "ar" | "en"): string {
  let out = input.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ");

  if (lang === "ar") {
    // Latin punctuation → Arabic equivalents, only when the neighbour is Arabic.
    out = out.replace(/([\u0600-\u06FF])\s*,\s*/g, "$1، ");
    out = out.replace(/([\u0600-\u06FF])\s*;\s*/g, "$1؛ ");
    out = out.replace(/([\u0600-\u06FF])\s*\?/g, "$1؟");
  } else {
    out = out.replace(/([A-Za-z0-9])\s*،\s*/g, "$1, ");
    out = out.replace(/([A-Za-z0-9])\s*؛\s*/g, "$1; ");
    out = out.replace(/([A-Za-z0-9])\s*؟/g, "$1?");
  }

  return out
    .replace(/\s+([،؛,.;:!؟])/g, "$1")
    .replace(/([،؛,;:])(?=\S)/g, "$1 ")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
}

/* --------------------------- bilingual sync status ------------------------- */

export type SyncStatus = "in_sync" | "only_primary" | "only_secondary" | "length_gap" | "empty";

export type SectionSync = { key: SectionKey; status: SyncStatus };

const sectionWeight = (data: ResumeData, key: SectionKey): number => {
  switch (key) {
    case "summary":
      return data.summary.trim().length;
    case "experience":
      return data.experience.reduce(
        (n, e) => n + e.role.length + e.company.length + e.bullets.join(" ").length,
        0,
      );
    case "education":
      return data.education.reduce((n, e) => n + e.degree.length + e.school.length, 0);
    case "skills":
      return data.skills.reduce((n, s) => n + s.name.length, 0);
    case "languages":
      return data.languages.reduce((n, l) => n + l.name.length, 0);
    case "links":
      return data.links.reduce((n, l) => n + l.label.length, 0);
    case "custom":
      return data.custom.reduce(
        (n, c) => n + c.title.length + c.items.reduce((m, i) => m + i.title.length, 0),
        0,
      );
    default: {
      const list = (data as unknown as Record<string, Array<{ title: string }>>)[key];
      return Array.isArray(list) ? list.reduce((n, i) => n + (i.title?.length ?? 0), 0) : 0;
    }
  }
};

/**
 * Compares an Arabic resume with its English counterpart section by section.
 * Advisory only — Seerati never forces the user to translate anything.
 */
export function detectUnsyncedSections(primary: ResumeData, secondary: ResumeData): SectionSync[] {
  const keys = Array.from(new Set([...primary.sectionOrder, ...secondary.sectionOrder]));
  return keys.map((key) => {
    const a = sectionWeight(primary, key);
    const b = sectionWeight(secondary, key);
    if (!a && !b) return { key, status: "empty" as SyncStatus };
    if (a && !b) return { key, status: "only_primary" as SyncStatus };
    if (!a && b) return { key, status: "only_secondary" as SyncStatus };
    const ratio = Math.min(a, b) / Math.max(a, b);
    return { key, status: ratio < 0.55 ? ("length_gap" as SyncStatus) : ("in_sync" as SyncStatus) };
  });
}

export const SYNC_LABEL: Record<SyncStatus, { ar: string; en: string }> = {
  in_sync: { ar: "متوافق", en: "In sync" },
  only_primary: { ar: "موجود بالعربية فقط", en: "Arabic only" },
  only_secondary: { ar: "موجود بالإنجليزية فقط", en: "English only" },
  length_gap: { ar: "فرق كبير في المحتوى", en: "Content gap" },
  empty: { ar: "فارغ في النسختين", en: "Empty in both" },
};

/** True when two strings differ only by protected-term spelling / punctuation. */
export function isCosmeticChange(a: string, b: string): boolean {
  return foldText(a) === foldText(b);
}
