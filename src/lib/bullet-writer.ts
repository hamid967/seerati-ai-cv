/**
 * Bullet writer helpers — Rezi-like achievement phrasing without inventing metrics.
 * Output is a suggestion only; the user must confirm before applying.
 */

const WEAK_AR = [/قمت ب/, /ساعدت في/, /عملت على/, /مسؤول عن/];
const WEAK_EN = [/\bhelped\b/i, /\bworked on\b/i, /\bresponsible for\b/i, /\bdid\b/i];

export type BulletSuggestion = {
  original: string;
  suggested: string;
  reason: { ar: string; en: string };
};

function tightenArabic(bullet: string) {
  let next = bullet.trim();
  next = next.replace(/^قمت بِ?/, "أنجزت ");
  next = next.replace(/^ساعدت في/, "ساهمت في");
  next = next.replace(/^عملت على/, "نفّذت");
  next = next.replace(/^مسؤول عن/, "قدت");
  if (!/[٠-٩0-9]/.test(next) && next.length > 12) {
    next = `${next.replace(/[۔.]$/, "")} مع قياس أثر واضح عند التوفر.`;
  }
  return next;
}

function tightenEnglish(bullet: string) {
  let next = bullet.trim();
  next = next.replace(/^helped\s+/i, "Contributed to ");
  next = next.replace(/^worked on\s+/i, "Delivered ");
  next = next.replace(/^responsible for\s+/i, "Owned ");
  next = next.replace(/^did\s+/i, "Completed ");
  if (!/\d/.test(next) && next.length > 12) {
    next = `${next.replace(/[.]$/, "")} with measurable impact when evidence exists.`;
  }
  // Capitalize first letter
  next = next.charAt(0).toUpperCase() + next.slice(1);
  return next;
}

export function suggestStrongerBullet(bullet: string, lang: "ar" | "en"): BulletSuggestion | null {
  const original = bullet.trim();
  if (original.length < 8) return null;
  const weak = lang === "ar" ? WEAK_AR : WEAK_EN;
  const isWeak = weak.some((re) => re.test(original));
  const hasMetric = /[٠-٩0-9]/.test(original);
  if (!isWeak && hasMetric) return null;

  const suggested = lang === "ar" ? tightenArabic(original) : tightenEnglish(original);
  if (suggested === original) return null;

  return {
    original,
    suggested,
    reason: {
      ar: isWeak
        ? "استبدل فعلاً ضعيفاً بصياغة إنجاز أوضح. لا تُضف أرقاماً إلا إن كانت موثّقة."
        : "أضف أثراً قابلاً للقياس فقط إذا كان لديك دليل — وإلا أبقِ الصياغة كما هي.",
      en: isWeak
        ? "Replace a weak verb with clearer ownership language. Never invent metrics."
        : "Add measurable impact only when you have evidence — otherwise keep the wording as-is.",
    },
  };
}

export function suggestStrongerBullets(bullets: string[], lang: "ar" | "en"): BulletSuggestion[] {
  return bullets
    .map((bullet) => suggestStrongerBullet(bullet, lang))
    .filter((item): item is BulletSuggestion => Boolean(item));
}
