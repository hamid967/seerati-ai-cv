import type { Resume, ResumeData, TemplateDef } from "./types";

/**
 * ATS Engine V2 — a transparent, rule based readiness estimate.
 * The result is advisory only: no ATS vendor is being queried and no hiring
 * outcome is implied.
 */

export type BuilderStep =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "extras"
  | "design";

export type AtsCategoryId =
  | "completeness"
  | "contact"
  | "summary"
  | "experience"
  | "achievements"
  | "skills"
  | "formatting"
  | "keywords";

export type AtsTip = { ar: string; en: string; step: BuilderStep };

export type AtsCategory = {
  id: AtsCategoryId;
  label: { ar: string; en: string };
  earned: number;
  max: number;
  step: BuilderStep;
  tips: AtsTip[];
};

export type AtsReport = {
  score: number;
  categories: AtsCategory[];
  keywords: {
    total: number;
    matched: string[];
    missing: string[];
    coverage: number;
  } | null;
};

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));

const STOP_WORDS = new Set([
  "the","and","for","with","you","our","are","from","that","this","will","have","has","not","all",
  "your","their","who","what","when","work","role","team","must","able","also","other","more","than",
  "في","من","على","إلى","عن","مع","التي","الذي","أو","و","ما","لا","هذا","هذه","ذلك","كما","حسب",
  "العمل","الوظيفة","المهام","القدرة","لدى","يكون","يجب","ضمن","خلال","عبر","بشكل",
]);

export function extractKeywords(text: string, limit = 30): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}+#.]+/u)) {
    const t = raw.replace(/^[.]+|[.]+$/g, "");
    if (t.length < 3 || STOP_WORDS.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([t]) => t);
}

export function keywordCoverage(jobDescription: string, data: ResumeData) {
  const tokens = extractKeywords(jobDescription);
  if (!tokens.length) return null;
  const haystack = JSON.stringify(data).toLowerCase();
  const matched = tokens.filter((t) => haystack.includes(t));
  const missing = tokens.filter((t) => !haystack.includes(t));
  return {
    total: tokens.length,
    matched,
    missing,
    coverage: Math.round((matched.length / tokens.length) * 100),
  };
}

export function analyzeResume(
  resume: Resume,
  template?: Pick<TemplateDef, "atsFriendly" | "design">,
  jobDescription?: string,
): AtsReport {
  const d = resume.data;
  const p = d.personal;
  const bullets = d.experience.flatMap((e) => e.bullets.filter((b) => b.trim()));
  const measurable = bullets.filter((b) => /\d/.test(b) || /[٠-٩]/.test(b));
  const summaryWords = words(d.summary);
  const jd = (jobDescription ?? d.jobDescription ?? "").trim();
  const keywords = jd ? keywordCoverage(jd, d) : null;
  const atsFriendly = template?.atsFriendly ?? true;

  const categories: AtsCategory[] = [];

  /* ---------------------------- contact — 10 ---------------------------- */
  const contactBits = [p.fullName, p.email, p.phone, p.city].filter(Boolean).length;
  const contactExtra = [p.jobTitle, d.links.length ? "l" : ""].filter(Boolean).length;
  categories.push({
    id: "contact",
    label: { ar: "معلومات الاتصال", en: "Contact details" },
    earned: clamp(Math.round((contactBits / 4) * 8) + contactExtra, 10),
    max: 10,
    step: "personal",
    tips:
      contactBits === 4 && contactExtra === 2
        ? []
        : [
            {
              ar: "أضف الاسم الكامل والمسمى الوظيفي والبريد والجوال والمدينة ورابطاً مهنياً واحداً.",
              en: "Add full name, job title, email, phone, city and one professional link.",
              step: "personal",
            },
          ],
  });

  /* ---------------------------- summary — 15 ---------------------------- */
  let summaryScore = 0;
  const summaryTips: AtsTip[] = [];
  if (summaryWords >= 30 && summaryWords <= 90) summaryScore += 9;
  else if (summaryWords >= 15) summaryScore += 5;
  if (summaryWords) {
    if (/\d|[٠-٩]/.test(d.summary)) summaryScore += 3;
    else
      summaryTips.push({
        ar: "أضف رقماً واحداً على الأقل في الملخص (سنوات الخبرة أو حجم الأثر).",
        en: "Include at least one figure in the summary (years of experience or scale of impact).",
        step: "summary",
      });
    const target = (d.targetJob || p.jobTitle || "").toLowerCase().slice(0, 6);
    if (target && d.summary.toLowerCase().includes(target)) summaryScore += 3;
    else
      summaryTips.push({
        ar: "اذكر الوظيفة المستهدفة صريحاً داخل الملخص.",
        en: "Mention the target job explicitly inside the summary.",
        step: "summary",
      });
  }
  if (summaryWords < 30 || summaryWords > 90) {
    summaryTips.unshift({
      ar: "اجعل طول الملخص بين ٣٠ و٩٠ كلمة.",
      en: "Keep the summary between 30 and 90 words.",
      step: "summary",
    });
  }
  categories.push({
    id: "summary",
    label: { ar: "الملخص المهني", en: "Professional summary" },
    earned: clamp(summaryScore, 15),
    max: 15,
    step: "summary",
    tips: summaryTips,
  });

  /* --------------------------- experience — 25 -------------------------- */
  let expScore = 0;
  const expTips: AtsTip[] = [];
  if (d.experience.length >= 1) expScore += 6;
  if (d.experience.length >= 2) expScore += 2;
  if (d.experience.every((e) => e.role && e.company)) expScore += 2;
  if (d.experience.some((e) => e.start)) expScore += 2;
  if (bullets.length >= 3) expScore += 4;
  if (bullets.length >= 6) expScore += 3;
  const ratio = bullets.length ? measurable.length / bullets.length : 0;
  expScore += Math.round(clamp(ratio * 2, 1) * 6);
  if (!d.experience.length)
    expTips.push({
      ar: "أضف خبرة عملية واحدة على الأقل بترتيب زمني عكسي.",
      en: "Add at least one role in reverse-chronological order.",
      step: "experience",
    });
  if (bullets.length < 3)
    expTips.push({
      ar: "اكتب ٣ نقاط إنجاز أو أكثر لكل خبرة رئيسية.",
      en: "Write three or more achievement bullets for each main role.",
      step: "experience",
    });
  if (ratio < 0.5)
    expTips.push({
      ar: "حوّل المهام إلى إنجازات بأرقام: «خفّضت زمن المعالجة ٢٥٪».",
      en: "Turn duties into quantified achievements: “cut processing time by 25%”.",
      step: "experience",
    });
  if (!atsFriendly)
    expTips.push({
      ar: "هذا القالب أقل ملاءمة لبعض أنظمة ATS. استخدم «كلاسيكي ATS» أو «مبسّط» للتقديم الإلكتروني.",
      en: "This template is less ATS-safe. Use Classic ATS or Minimal for online applications.",
      step: "design",
    });
  categories.push({
    id: "experience",
    label: { ar: "الخبرات العملية", en: "Work experience" },
    earned: clamp(expScore, 25),
    max: 25,
    step: "experience",
    tips: expTips,
  });

  /* ----------------------------- skills — 20 ---------------------------- */
  let skillScore = d.skills.length >= 10 ? 12 : d.skills.length >= 8 ? 10 : d.skills.length >= 5 ? 7 : d.skills.length >= 3 ? 4 : 0;
  if (d.languages.length >= 1) skillScore += 4;
  if (d.languages.length >= 2) skillScore += 2;
  if (d.certificates.length || d.projects.length) skillScore += 2;
  const skillTips: AtsTip[] = [];
  if (d.skills.length < 8)
    skillTips.push({
      ar: "أضف ٨ مهارات أو أكثر مطابقة لمصطلحات الوظيفة المستهدفة.",
      en: "List eight or more skills that mirror the target job's terminology.",
      step: "skills",
    });
  if (!d.languages.length)
    skillTips.push({
      ar: "أضف اللغات ومستوى الإتقان (العربية والإنجليزية على الأقل).",
      en: "Add languages with proficiency (at least Arabic and English).",
      step: "skills",
    });
  categories.push({
    id: "skills",
    label: { ar: "المهارات واللغات", en: "Skills & languages" },
    earned: clamp(skillScore, 20),
    max: 20,
    step: "skills",
    tips: skillTips,
  });

  /* --------------------------- education — 10 --------------------------- */
  let eduScore = 0;
  if (d.education.length >= 1) eduScore += 6;
  if (d.education.every((e) => e.degree && e.school)) eduScore += 2;
  if (d.education.some((e) => e.end || e.start)) eduScore += 2;
  categories.push({
    id: "education",
    label: { ar: "التعليم", en: "Education" },
    earned: d.education.length ? clamp(eduScore, 10) : 0,
    max: 10,
    step: "education",
    tips: d.education.length
      ? eduScore >= 10
        ? []
        : [
            {
              ar: "أكمل بيانات المؤهل: الدرجة، الجهة التعليمية، وسنة التخرج.",
              en: "Complete each qualification: degree, institution and graduation year.",
              step: "education",
            },
          ]
      : [
          {
            ar: "أضف مؤهلك التعليمي الأعلى.",
            en: "Add your highest qualification.",
            step: "education",
          },
        ],
  });

  /* --------------------------- keywords — 20 ---------------------------- */
  categories.push({
    id: "keywords",
    label: { ar: "تغطية كلمات الوظيفة", en: "Job-description keywords" },
    earned: keywords ? Math.round((keywords.coverage / 100) * 20) : 0,
    max: 20,
    step: "skills",
    tips: !keywords
      ? [
          {
            ar: "الصق وصف الوظيفة لقياس تغطية الكلمات المفتاحية.",
            en: "Paste a job description to measure keyword coverage.",
            step: "skills",
          },
        ]
      : keywords.coverage >= 70
        ? []
        : [
            {
              ar: `أضف الكلمات الناقصة إلى المهارات والخبرات: ${keywords.missing.slice(0, 6).join(", ")}`,
              en: `Add the missing terms to your skills and experience: ${keywords.missing.slice(0, 6).join(", ")}`,
              step: "skills",
            },
          ],
  });

  const max = categories.reduce((s, c) => s + c.max, 0);
  const earned = categories.reduce((s, c) => s + c.earned, 0);
  return { score: Math.round((earned / max) * 100), categories, keywords };
}

/** Content completion percentage shown on cards and the builder checklist. */
export type ChecklistItem = { id: string; label: { ar: string; en: string }; done: boolean; step: BuilderStep };

export function checklist(resume: Resume): ChecklistItem[] {
  const d = resume.data;
  return [
    { id: "name", label: { ar: "الاسم الكامل", en: "Full name" }, done: Boolean(d.personal.fullName), step: "personal" },
    { id: "title", label: { ar: "المسمى الوظيفي", en: "Job title" }, done: Boolean(d.personal.jobTitle), step: "personal" },
    { id: "contact", label: { ar: "البريد والجوال", en: "Email & phone" }, done: Boolean(d.personal.email && d.personal.phone), step: "personal" },
    { id: "summary", label: { ar: "ملخص مهني", en: "Professional summary" }, done: words(d.summary) >= 30, step: "summary" },
    { id: "experience", label: { ar: "خبرة عملية", en: "Work experience" }, done: d.experience.length > 0, step: "experience" },
    { id: "bullets", label: { ar: "٣ نقاط إنجاز", en: "Three achievement bullets" }, done: d.experience.flatMap((e) => e.bullets.filter(Boolean)).length >= 3, step: "experience" },
    { id: "education", label: { ar: "مؤهل تعليمي", en: "Education entry" }, done: d.education.length > 0, step: "education" },
    { id: "skills", label: { ar: "٥ مهارات", en: "Five skills" }, done: d.skills.length >= 5, step: "skills" },
    { id: "languages", label: { ar: "اللغات", en: "Languages" }, done: d.languages.length > 0, step: "skills" },
    { id: "links", label: { ar: "رابط مهني", en: "Professional link" }, done: d.links.length > 0, step: "extras" },
  ];
}

export function completeness(resume: Resume) {
  const items = checklist(resume);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

export function resumeStatus(resume: Resume): "draft" | "complete" {
  return completeness(resume) >= 80 ? "complete" : "draft";
}

/* --------------------------- plain-text ATS export -------------------------- */

export function toPlainText(resume: Resume) {
  const d = resume.data;
  const L: string[] = [];
  L.push(d.personal.fullName || resume.title);
  if (d.personal.jobTitle) L.push(d.personal.jobTitle);
  L.push(
    [d.personal.email, d.personal.phone, [d.personal.city, d.personal.country].filter(Boolean).join(", ")]
      .filter(Boolean)
      .join(" | "),
  );
  if (d.summary) L.push("", "SUMMARY", d.summary);
  if (d.experience.length) {
    L.push("", "EXPERIENCE");
    d.experience.forEach((e) => {
      L.push(`${e.role} — ${e.company} (${e.start || ""} - ${e.current ? "present" : e.end || ""})`);
      e.bullets.filter(Boolean).forEach((b) => L.push(`- ${b}`));
    });
  }
  if (d.education.length) {
    L.push("", "EDUCATION");
    d.education.forEach((e) => L.push(`${e.degree} — ${e.school} (${e.start || ""} - ${e.end || ""})`));
  }
  if (d.skills.length) L.push("", "SKILLS", d.skills.map((s) => s.name).join(", "));
  if (d.languages.length) L.push("", "LANGUAGES", d.languages.map((l) => `${l.name} (${l.level})`).join(", "));
  (["certificates", "projects", "achievements", "volunteering", "references"] as const).forEach((k) => {
    const items = d[k];
    if (items.length) {
      L.push("", k.toUpperCase());
      items.forEach((i) => L.push(`- ${i.title}${i.detail ? `: ${i.detail}` : ""}`));
    }
  });
  if (d.links.length) L.push("", "LINKS", d.links.map((l) => `${l.label}: ${l.url}`).join(" | "));
  d.custom.forEach((c) => {
    L.push("", (c.title || "SECTION").toUpperCase());
    c.items.forEach((i) => L.push(`- ${i.title}${i.detail ? `: ${i.detail}` : ""}`));
  });
  return L.join("\n");
}
