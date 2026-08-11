import type { CareerTwin } from "@/lib/career";
import type { Resume } from "@/lib/types";

export type ArabicIssueLevel = "info" | "warning" | "strong";

export type ArabicCareerIssue = {
  id: string;
  level: ArabicIssueLevel;
  area: "headline" | "summary" | "experience" | "achievement" | "skills" | "bilingual";
  title: { ar: string; en: string };
  detail: { ar: string; en: string };
  sample?: string;
};

export type ArabicCareerReport = {
  score: number;
  arabicRatio: number;
  issues: ArabicCareerIssue[];
  strengths: Array<{ ar: string; en: string }>;
};

const ARABIC_RE = /[\u0600-\u06FF]/g;
const LATIN_RE = /[A-Za-z]/g;

const weakOpeners = [
  "مسؤول عن",
  "قمت ب",
  "القيام ب",
  "عملت على",
  "ساعدت في",
  "was responsible for",
  "worked on",
  "helped with",
];

const achievementVerbs = [
  "حققت",
  "خفضت",
  "رفعت",
  "طورت",
  "قدت",
  "أطلقت",
  "حسنت",
  "أنجزت",
  "نفذت",
  "بنيت",
  "increased",
  "reduced",
  "led",
  "launched",
  "built",
  "improved",
  "delivered",
];

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

function languageRatio(text: string) {
  const ar = (text.match(ARABIC_RE) ?? []).length;
  const en = (text.match(LATIN_RE) ?? []).length;
  const total = ar + en;
  return total ? Math.round((ar / total) * 100) : 0;
}

function mixedScriptNoise(text: string) {
  const chunks = text
    .replaceAll("[", " ")
    .replaceAll("]", " ")
    .split(/[\s،,;:(){}]+/)
    .filter(Boolean);
  return chunks.filter((chunk) => ARABIC_RE.test(chunk) && LATIN_RE.test(chunk));
}

function hasActionVerb(text: string) {
  const normalized = text.toLowerCase();
  return achievementVerbs.some((verb) => normalized.includes(verb.toLowerCase()));
}

function startsWeak(text: string) {
  const normalized = normalize(text).toLowerCase();
  return weakOpeners.some((phrase) => normalized.startsWith(phrase.toLowerCase()));
}

function hasMetric(text: string) {
  return /\d|%|٪|ريال|sar|مليون|ألف|k\b|m\b/i.test(text);
}

export function analyzeArabicCareer(args: { twin: CareerTwin | null; resumes: Resume[] }): ArabicCareerReport {
  const { twin, resumes } = args;
  const issues: ArabicCareerIssue[] = [];
  const strengths: ArabicCareerReport["strengths"] = [];
  const primaryResume = resumes.find((resume) => resume.language === "ar") ?? resumes[0] ?? null;
  const headline = twin?.identity.headline || primaryResume?.data.personal.jobTitle || "";
  const summary = twin?.identity.summary || primaryResume?.data.summary || "";
  const experience = twin?.workHistory.length ? twin.workHistory : primaryResume?.data.experience ?? [];
  const achievements = [
    ...(twin?.achievements.map((item) => item.text) ?? []),
    ...experience.flatMap((item) => item.bullets),
  ];
  const skills =
    twin?.skills.map((item) => item.name) ?? primaryResume?.data.skills.map((item) => item.name) ?? [];
  const corpus = [headline, summary, ...achievements, ...skills].filter(Boolean).join(" \n ");
  const arabicRatio = languageRatio(corpus);

  if (!headline.trim()) {
    issues.push({
      id: "headline-missing",
      level: "strong",
      area: "headline",
      title: { ar: "المسمى المهني غير واضح", en: "Professional headline is missing" },
      detail: {
        ar: "أضف مسمى مهنيًا واضحًا يصف تخصصك بدل عبارة عامة.",
        en: "Add a clear professional headline that describes your discipline rather than a generic phrase.",
      },
    });
  } else if (headline.length > 90) {
    issues.push({
      id: "headline-long",
      level: "warning",
      area: "headline",
      title: { ar: "المسمى طويل", en: "Headline is long" },
      detail: {
        ar: "اختصر المسمى ليكون سريع القراءة في نتائج البحث وأنظمة التوظيف.",
        en: "Shorten the headline for faster scanning in search results and recruiting systems.",
      },
      sample: headline,
    });
  } else {
    strengths.push({ ar: "المسمى المهني موجود وواضح.", en: "A professional headline is present." });
  }

  if (summary.trim().length < 80) {
    issues.push({
      id: "summary-thin",
      level: "warning",
      area: "summary",
      title: { ar: "الملخص يحتاج عمقًا", en: "Summary needs more depth" },
      detail: {
        ar: "اجعل الملخص يوضح المجال، سنوات/نوع الخبرة، نقاط القوة والهدف المهني بدون مبالغة.",
        en: "Use the summary to cover domain, experience type, strengths and career target without exaggeration.",
      },
    });
  } else {
    strengths.push({
      ar: "الملخص يحتوي مادة مهنية كافية للمراجعة.",
      en: "The summary contains enough professional substance for review.",
    });
  }

  const weakBullets = achievements.filter(startsWeak);
  if (weakBullets.length) {
    issues.push({
      id: "weak-openers",
      level: "warning",
      area: "achievement",
      title: { ar: "بعض النقاط تبدأ بصياغة ضعيفة", en: "Some bullets start weakly" },
      detail: {
        ar: `وجدنا ${weakBullets.length} نقاط تبدأ بصياغات مثل «مسؤول عن». ابدأ بفعل مهني دقيق عندما يكون ذلك صحيحًا.`,
        en: `${weakBullets.length} bullets start with phrases such as “responsible for”. Lead with a precise action verb when accurate.`,
      },
      sample: weakBullets[0],
    });
  }

  const actionBullets = achievements.filter(hasActionVerb).length;
  if (achievements.length && actionBullets / achievements.length >= 0.5) {
    strengths.push({
      ar: "نسبة جيدة من نقاط الخبرة تبدأ بأفعال إنجاز واضحة.",
      en: "A healthy share of experience bullets use clear action verbs.",
    });
  }

  const metricBullets = achievements.filter(hasMetric).length;
  if (achievements.length >= 3 && metricBullets === 0) {
    issues.push({
      id: "no-metrics",
      level: "info",
      area: "achievement",
      title: { ar: "لا توجد نتائج كمية واضحة", en: "No quantified outcomes found" },
      detail: {
        ar: "إذا كانت لديك أرقام صحيحة ويمكن إثباتها، أضف أثرًا كميًا لبعض الإنجازات. لا تخترع أرقامًا لرفع الدرجة.",
        en: "If you have accurate, supportable figures, add quantified impact to selected achievements. Never invent numbers to improve a score.",
      },
    });
  }

  const mixed = mixedScriptNoise(corpus);
  if (mixed.length) {
    issues.push({
      id: "mixed-script-noise",
      level: "info",
      area: "bilingual",
      title: { ar: "مزج عربي/إنجليزي داخل بعض الكلمات", en: "Mixed Arabic/English inside some tokens" },
      detail: {
        ar: "راجع الكلمات المختلطة حرفيًا. أسماء التقنيات والمنتجات الإنجليزية طبيعية، لكن الدمج داخل الكلمة قد يسبب تشوهًا بصريًا.",
        en: "Review mixed-script tokens. English product and technology names are normal, but mixing scripts inside one token can hurt readability.",
      },
      sample: mixed.slice(0, 3).join("، "),
    });
  }

  const duplicatedSkills = skills.filter(
    (skill, index) =>
      skills.findIndex((other) => other.trim().toLowerCase() === skill.trim().toLowerCase()) !== index,
  );
  if (duplicatedSkills.length) {
    issues.push({
      id: "duplicate-skills",
      level: "warning",
      area: "skills",
      title: { ar: "مهارات مكررة", en: "Duplicate skills" },
      detail: {
        ar: "وحّد المهارات المكررة حتى تبقى القائمة مركزة وسهلة المسح.",
        en: "Merge duplicate skills so the list remains focused and scannable.",
      },
      sample: [...new Set(duplicatedSkills)].slice(0, 4).join("، "),
    });
  }

  if (arabicRatio >= 65) {
    strengths.push({
      ar: "المحتوى العربي هو اللغة الغالبة في النسخة العربية.",
      en: "Arabic is the dominant language in the Arabic-oriented content.",
    });
  } else if (primaryResume?.language === "ar") {
    issues.push({
      id: "arabic-ratio",
      level: "info",
      area: "bilingual",
      title: { ar: "النسخة العربية تحتوي إنجليزية كثيرة", en: "Arabic resume contains substantial English text" },
      detail: {
        ar: "هذا ليس خطأ بحد ذاته، خصوصًا للمصطلحات التقنية، لكن راجع الاتساق اللغوي للعناوين والجمل الوصفية.",
        en: "This is not inherently wrong, especially for technical terms, but review language consistency in headings and descriptive sentences.",
      },
    });
  }

  let score = 100;
  for (const issue of issues) {
    score -= issue.level === "strong" ? 16 : issue.level === "warning" ? 9 : 4;
  }
  score = Math.max(0, Math.min(100, score));

  return { score, arabicRatio, issues, strengths };
}
