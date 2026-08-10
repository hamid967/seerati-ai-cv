import type { Resume, ResumeData } from "./types";

export type AtsCheck = {
  id: string;
  label: { ar: string; en: string };
  passed: boolean;
  weight: number;
  hint: { ar: string; en: string };
};

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function runAtsChecks(data: ResumeData, templateAtsFriendly = true): AtsCheck[] {
  const p = data.personal;
  const bullets = data.experience.flatMap((e) => e.bullets.filter(Boolean));
  const numeric = bullets.filter((b) => /\d/.test(b)).length;

  return [
    {
      id: "contact",
      label: { ar: "معلومات الاتصال مكتملة", en: "Contact details complete" },
      passed: Boolean(p.fullName && p.email && p.phone && p.city),
      weight: 15,
      hint: { ar: "أضف الاسم والبريد والجوال والمدينة.", en: "Add name, email, phone and city." },
    },
    {
      id: "title",
      label: { ar: "مسمى وظيفي واضح", en: "Clear job title" },
      passed: Boolean(p.jobTitle && p.jobTitle.length > 2),
      weight: 10,
      hint: { ar: "اكتب المسمى المستهدف مثل «محلل بيانات».", en: "State a target title, e.g. “Data Analyst”." },
    },
    {
      id: "summary",
      label: { ar: "ملخص مهني بين ٣٠ و٩٠ كلمة", en: "Summary between 30 and 90 words" },
      passed: words(data.summary) >= 30 && words(data.summary) <= 90,
      weight: 15,
      hint: { ar: "اجعل الملخص موجزاً ومحدداً بالنتائج.", en: "Keep the summary concise and results-focused." },
    },
    {
      id: "experience",
      label: { ar: "خبرة عملية واحدة على الأقل", en: "At least one experience entry" },
      passed: data.experience.length > 0,
      weight: 15,
      hint: { ar: "أضف خبراتك بترتيب زمني عكسي.", en: "Add experience in reverse-chronological order." },
    },
    {
      id: "bullets",
      label: { ar: "٣ نقاط إنجاز أو أكثر", en: "Three or more achievement bullets" },
      passed: bullets.length >= 3,
      weight: 10,
      hint: { ar: "حوّل المهام إلى إنجازات قابلة للقياس.", en: "Turn duties into measurable achievements." },
    },
    {
      id: "metrics",
      label: { ar: "أرقام ونِسب في الإنجازات", en: "Numbers or percentages in bullets" },
      passed: numeric >= 1,
      weight: 10,
      hint: { ar: "أضف أرقاماً مثل «خفّضت الوقت ٢٠٪».", en: "Add figures such as “reduced time by 20%”." },
    },
    {
      id: "education",
      label: { ar: "قسم التعليم موجود", en: "Education section present" },
      passed: data.education.length > 0,
      weight: 10,
      hint: { ar: "أضف مؤهلك الأخير.", en: "Add your latest qualification." },
    },
    {
      id: "skills",
      label: { ar: "٥ مهارات أو أكثر", en: "Five or more skills" },
      passed: data.skills.length >= 5,
      weight: 10,
      hint: { ar: "أضف مهارات مطابقة لوصف الوظيفة.", en: "Add skills matching the job description." },
    },
    {
      id: "template",
      label: { ar: "القالب متوافق مع ATS", en: "Template is ATS friendly" },
      passed: templateAtsFriendly,
      weight: 5,
      hint: { ar: "استخدم قالباً بعمود واحد للتقديم الإلكتروني.", en: "Use a single-column template for online applications." },
    },
  ];
}

export function atsScore(checks: AtsCheck[]) {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  return Math.round((got / total) * 100);
}

export function completeness(resume: Resume) {
  const d = resume.data;
  const filled = [
    Boolean(d.personal.fullName),
    Boolean(d.personal.email),
    Boolean(d.personal.phone),
    Boolean(d.personal.jobTitle),
    d.summary.length > 20,
    d.experience.length > 0,
    d.education.length > 0,
    d.skills.length > 0,
    d.languages.length > 0,
    d.links.length > 0,
  ];
  return Math.round((filled.filter(Boolean).length / filled.length) * 100);
}

export function keywordGaps(jobDescription: string, data: ResumeData) {
  const stop = new Set([
    "the","and","for","with","you","our","are","from","that","this","will","have","has","not","all",
    "في","من","على","إلى","عن","مع","التي","الذي","أو","و","ما","لا","هذا","هذه",
  ]);
  const tokens = Array.from(
    new Set(
      jobDescription
        .toLowerCase()
        .split(/[^\p{L}\p{N}+#.]+/u)
        .filter((t) => t.length > 2 && !stop.has(t)),
    ),
  );
  const haystack = JSON.stringify(data).toLowerCase();
  const missing = tokens.filter((t) => !haystack.includes(t));
  return { matched: tokens.length - missing.length, total: tokens.length, missing: missing.slice(0, 20) };
}

export function toPlainText(resume: Resume) {
  const d = resume.data;
  const L: string[] = [];
  L.push(d.personal.fullName || resume.title);
  if (d.personal.jobTitle) L.push(d.personal.jobTitle);
  L.push([d.personal.email, d.personal.phone, [d.personal.city, d.personal.country].filter(Boolean).join(", ")].filter(Boolean).join(" | "));
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
    L.push("", c.title.toUpperCase());
    c.items.forEach((i) => L.push(`- ${i.title}${i.detail ? `: ${i.detail}` : ""}`));
  });
  return L.join("\n");
}
