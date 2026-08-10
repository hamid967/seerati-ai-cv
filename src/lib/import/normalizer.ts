/**
 * Import pipeline — normalizer stage.
 *
 * Cleans up whitespace, Arabic/English punctuation, digits, dates, phones,
 * emails and URLs so downstream detection works the same for both languages.
 * It never rewrites meaning; only formatting is touched.
 */

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toLatinDigits = (s: string) =>
  s.replace(/[٠-٩۰-۹]/g, (d) => {
    const ar = ARABIC_DIGITS.indexOf(d);
    if (ar >= 0) return String(ar);
    return String(PERSIAN_DIGITS.indexOf(d));
  });

const PUNCT_MAP: Record<string, string> = {
  "،": ",",
  "؛": ";",
  "٪": "%",
  ـ: "",
  "–": "-",
  "—": "-",
  "‐": "-",
  "‑": "-",
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
};

export type NormalizedText = {
  text: string;
  emails: string[];
  phones: string[];
  links: string[];
};

export const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;
export const PHONE_RE = /(?:\+|00)?\d[\d\s()-]{7,17}\d/g;
export const LINK_RE = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w./#?=&%-]*)?/gi;

/** Whitespace + punctuation + digit normalisation, safe for RTL text. */
export function normalizeText(raw: string): string {
  let out = raw.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
  out = out.replace(/[\u200b-\u200f\u202a-\u202e]/g, "");
  out = toLatinDigits(out);
  out = out.replace(/[،؛٪ـ–—‐‑“”‘’]/g, (c) => PUNCT_MAP[c] ?? c);
  out = out
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/** Normalise a date-ish token to `YYYY-MM` when the parts are unambiguous. */
export function normalizeDate(raw: string): string {
  const v = toLatinDigits(raw).trim();
  const MONTHS: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
    يناير: 1,
    فبراير: 2,
    مارس: 3,
    أبريل: 4,
    ابريل: 4,
    مايو: 5,
    يونيو: 6,
    يوليو: 7,
    أغسطس: 8,
    اغسطس: 8,
    سبتمبر: 9,
    أكتوبر: 10,
    اكتوبر: 10,
    نوفمبر: 11,
    ديسمبر: 12,
  };
  const iso = v.match(/(\d{4})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(Number(iso[2])).padStart(2, "0")}`;
  const named = v.match(/([A-Za-z\u0600-\u06FF]+)\s*(\d{4})/);
  if (named) {
    const key = named[1]!.toLowerCase().slice(0, 3);
    const month =
      MONTHS[named[1]!.toLowerCase()] ??
      Object.entries(MONTHS).find(([k]) => k.startsWith(key))?.[1];
    if (month) return `${named[2]}-${String(month).padStart(2, "0")}`;
    return named[2]!;
  }
  const year = v.match(/(19|20)\d{2}/);
  return year ? year[0] : "";
}

/** Keep only digits and a leading +, so `05 0 123` and `+966...` compare equal. */
export function normalizePhone(raw: string): string {
  const v = toLatinDigits(raw).replace(/[^\d+]/g, "");
  return v.startsWith("00") ? `+${v.slice(2)}` : v;
}

export function normalizeUrl(raw: string): string {
  const v = raw.trim().replace(/[),.]+$/, "");
  if (!v) return "";
  return v.startsWith("http") ? v : `https://${v}`;
}

/** Full normalisation pass with the contact channels extracted. */
export function normalizeDocument(raw: string): NormalizedText {
  const text = normalizeText(raw);
  const emails = Array.from(new Set(text.match(EMAIL_RE) ?? []));
  const phones = Array.from(
    new Set(
      (text.match(PHONE_RE) ?? [])
        .map(normalizePhone)
        .filter((p) => p.replace(/\D/g, "").length >= 8),
    ),
  );
  const links = Array.from(new Set(text.match(LINK_RE) ?? []))
    .filter((l) => !l.includes("@") && !emails.some((e) => e.endsWith(l)))
    .map(normalizeUrl);
  return { text, emails, phones, links };
}
