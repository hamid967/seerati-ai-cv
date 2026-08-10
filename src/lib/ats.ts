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
  const keywords = jobDescription?.trim() ? keywordCoverage(jobDescription, d) : null;
  const atsFriendly = template?.atsFriendly ?? true;
  const singleColumn = (template?.design.layout ?? "single") === "single";

  const categories: AtsCategory[] = [];

  /* completeness — 15 */
  const filled = [
    Boolean(p.fullName),
    Boolean(p.jobTitle),
    d.summary.length > 20,
    d.experience.length > 0,
    d.education.length > 0,
    d.skills.length > 0,
    d.languages.length > 0,
  ];
  categories.push({
    id: "completeness",
    label: { ar: "اكتمال الأقسام", en: "Section completeness" },
    earned: Math.round((filled.filter(Boolean).length / filled.length) * 15),
    max: 15,
    step: "personal",
    tips: filled.every(Boolean)
      ? []
      : [
          {
            ar: "أكمل الأقسام الأساسية: الملخص، الخبرة، التعليم، المهارات واللغات.",
            en: "Complete the core sections: summary, experience, education, skills and languages.",
            step: "summary",
          },
        ],
  });

  /* contact — 12 */
  const contactBits = [p.fullName, p.email, p.phone, p.city].filter(Boolean).length;
  categories.push({
    id: "contact",
    label: { ar: "معلومات الاتصال", en: "Contact details" },
    earned: Math.round((contactBits / 4) * 12),
    max: 12,
    step: "personal",
    tips:
      contactBits === 4
        ? []
        : [
            {
              ar: "أضف الاسم الكامل والبريد ورقم الجوال والمدينة في أعلى السيرة.",
              en: "Add full name, email, phone and city at the top of the resume.",
              step: "personal",
            },
          ],
  });

  /* summary — 15 */
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
    if (p.jobTitle && d.summary.toLowerCase().includes(p.jobTitle.toLowerCase().slice(0, 6))) summaryScore += 3;
    else
      summaryTips.push({
        ar: "اذكر المسمى المستهدف صريحاً داخل الملخص.",
        en: "Mention the target job title explicitly inside the summary.",
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

  /* experience — 18 */
  let expScore = 0;
  const expTips: AtsTip[] = [];
  if (d.experience.length >= 1) expScore += 6;
  if (d.experience.length >= 2) expScore += 2;
  const dated = d.experience.filter((e) => e.start && (e.end || e.current)).length;
  if (d.experience.length && dated === d.experience.length) expScore += 4;
  else if (d.experience.length)
    expTips.push({
      ar: "أضف تواريخ البداية والنهاية لكل خبرة (أو حدّد «أعمل هنا حالياً»).",
      en: "Add start and end dates for every role (or mark it as current).",
      step: "experience",
    });
  if (bullets.length >= 3) expScore += 4;
  if (bullets.length >= 6) expScore += 2;
  if (bullets.length < 3)
    expTips.push({
      ar: "اكتب ٣ نقاط إنجاز أو أكثر لكل خبرة رئيسية.",
      en: "Write three or more achievement bullets for each main role.",
      step: "experience",
    });
  if (!d.experience.length)
    expTips.push({
      ar: "أضف خبرة عملية واحدة على الأقل بترتيب زمني عكسي.",
      en: "Add at least one role in reverse-chronological order.",
      step: "experience",
    });
  categories.push({
    id: "experience",
    label: { ar: "الخبرات العملية", en: "Work experience" },
    earned: clamp(expScore, 18),
    max: 18,
    step: "experience",
    tips: expTips,
  });

  /* measurable achievements — 12 */
  const ratio = bullets.length ? measurable.length / bullets.length : 0;
  categories.push({
    id: "achievements",
    label: { ar: "إنجازات قابلة للقياس", en: "Measurable achievements" },
    earned: Math.round(clamp(ratio * 2, 1) * 12),
    max: 12,
    step: "experience",
    tips:
      ratio >= 0.5
        ? []
        : [
            {
              ar: "حوّل المهام إلى إنجازات بأرقام: «خفّضت زمن المعالجة ٢٥٪».",
              en: "Turn duties into quantified achievements: “cut processing time by 25%”.",
              step: "experience",
            },
          ],
  });

  /* skills — 10 */
  const skillScore = d.skills.length >= 8 ? 10 : d.skills.length >= 5 ? 7 : d.skills.length >= 3 ? 4 : 0;
  categories.push({
    id: "skills",
    label: { ar: "المهارات واللغات", en: "Skills & languages" },
    earned: skillScore + (d.languages.length ? 0 : 0),
    max: 10,
    step: "skills",
    tips:
      d.skills.length >= 8
        ? []
        : [
            {
              ar: "أضف ٨ مهارات أو أكثر مطابقة لمصطلحات الوظيفة المستهدفة.",
              en: "List eight or more skills that mirror the target job's terminology.",
              step: "skills",
            },
          ],
  });

  /* formatting — 8 */
  let fmt = 0;
  const fmtTips: AtsTip[] = [];
  if (atsFriendly) fmt += 4;
  else
    fmtTips.push({
      ar: "هذا القالب أقل ملاءمة لبعض أنظمة ATS. استخدم «كلاسيكي ATS» أو «مبسّط» للتقديم الإلكتروني.",
      en: "This template is less ATS-safe. Use Classic ATS or Minimal for online applications.",
      step: "design",
    });
  if (singleColumn) fmt += 2;
  if (d.sectionOrder[0] === "summary") fmt += 2;
  else
    fmtTips.push({
      ar: "ابدأ السيرة بالملخص المهني ثم الخبرات.",
      en: "Start the resume with the summary, then experience.",
      step: "design",
    });
  categories.push({
    id: "formatting",
    label: { ar: "التنسيق وملاءمة القالب", en: "Formatting & template fit" },
    earned: clamp(fmt, 8),
    max: 8,
    step: "design",
    tips: fmtTips,
  });

  /* job-description keywords — 10 */
  categories.push({
    id: "keywords",
    label: { ar: "تغطية كلمات الوظيفة", en: "Job-description keywords" },
    earned: keywords ? Math.round((keywords.coverage / 100) * 10) : 0,
    max: 10,
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
