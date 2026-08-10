import type { CareerTwin, JobRequirements, MatchAnalysis, MatchGap } from "./career";

/**
 * Deterministic, local job-description parsing and matching.
 *
 * This is intentionally rule-based: it only reports what the pasted text and
 * the user's own Career Twin actually contain. The AI specialists can enrich
 * the result later, but the baseline never invents requirements or skills.
 */

const uid = () => Math.random().toString(36).slice(2, 10);

const SKILL_DICTIONARY = [
  "excel","power bi","tableau","sql","python","r","sas","spss","java","javascript","typescript","react","node",
  "azure","aws","gcp","docker","kubernetes","git","figma","photoshop","illustrator","autocad","revit","sap",
  "oracle","erp","crm","salesforce","hubspot","seo","sem","google analytics","jira","confluence","scrum","agile",
  "pmp","prince2","six sigma","lean","ifrs","gaap","cpa","cma","cfa","budgeting","forecasting","reconciliation",
  "audit","risk","compliance","aml","kyc","payroll","recruitment","onboarding","training","okr","kpi",
  "محاسبة","تدقيق","ميزانية","مبيعات","تسويق","موارد بشرية","مشتريات","لوجستيات","سلسلة الإمداد","خدمة العملاء",
  "إدارة مشاريع","تحليل بيانات","جودة","سلامة","صيانة","تخطيط","تدريب","تطوير أعمال","علاقات حكومية","توظيف",
];

const SOFT_DICTIONARY = [
  "communication","leadership","teamwork","problem solving","time management","negotiation","presentation",
  "attention to detail","stakeholder management","ownership","adaptability",
  "تواصل","قيادة","عمل جماعي","حل المشكلات","إدارة الوقت","تفاوض","عرض تقديمي","دقة","مبادرة","مرونة","تنظيم",
];

const EDU_HINTS = [
  "bachelor","master","mba","diploma","degree","phd",
  "بكالوريوس","ماجستير","دبلوم","دكتوراه","شهادة",
];

const SENIORITY = [
  { re: /\b(intern|trainee|متدرب)\b/i, ar: "متدرب", en: "Intern" },
  { re: /\b(junior|entry[- ]level|مبتدئ|حديث التخرج)\b/i, ar: "مبتدئ", en: "Junior" },
  { re: /\b(senior|أول|خبير)\b/i, ar: "أول/خبير", en: "Senior" },
  { re: /\b(lead|team lead|رئيس فريق)\b/i, ar: "قائد فريق", en: "Lead" },
  { re: /\b(manager|مدير)\b/i, ar: "مدير", en: "Manager" },
  { re: /\b(director|head of|مدير عام|رئيس)\b/i, ar: "مدير تنفيذي", en: "Director" },
];

const YEARS_RE =
  /(\d{1,2})\s*(?:\+|\s*-\s*\d{1,2})?\s*(?:years?|yrs?|سنة|سنوات|أعوام)/i;

const STOP_WORDS = new Set([
  "the","and","for","with","from","this","that","will","you","your","are","our","have","has","must","should",
  "في","من","على","إلى","عن","مع","التي","الذي","هذا","هذه","يجب","لدى","أو","ما","كل",
]);

const norm = (s: string) => s.toLowerCase().replace(/[\u0640\u064B-\u0652]/g, "").trim();

function bulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*\u2022▪◦·\d.)]+\s*/, "").trim())
    .filter((l) => l.length > 12);
}

/** Extracts requirements from a pasted job description. Text only — no fetching. */
export function parseJobDescription(text: string): JobRequirements {
  const t = norm(text);
  const lines = bulletLines(text);

  const hardSkills = SKILL_DICTIONARY.filter((s) => t.includes(norm(s)));
  const softSkills = SOFT_DICTIONARY.filter((s) => t.includes(norm(s)));

  const yearsMatch = text.match(YEARS_RE);
  const years = yearsMatch?.[1] ? `${yearsMatch[1]}+` : undefined;

  const seniorityHit = SENIORITY.find((s) => s.re.test(text));

  const language =
    /\b(arabic and english|bilingual)\b/i.test(text) || (/عربي/.test(text) && /إنجليز/.test(text))
      ? "ar+en"
      : /إنجليز|english/i.test(text)
        ? "en"
        : /عربي|arabic/i.test(text)
          ? "ar"
          : undefined;

  const education = EDU_HINTS.filter((e) => t.includes(norm(e)));

  const responsibilities = lines
    .filter((l) => /^(?:manage|lead|develop|build|support|prepare|analy|coordinate|إدارة|تطوير|إعداد|تحليل|متابعة|تنسيق|دعم)/i.test(l))
    .slice(0, 10);

  const freq = new Map<string, number>();
  for (const word of t.split(/[^\p{L}\p{N}+#.]+/u)) {
    if (word.length < 4 || STOP_WORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([w]) => w);

  const missing: string[] = [];
  if (!years) missing.push("سنوات الخبرة المطلوبة غير مذكورة في النص");
  if (!seniorityHit) missing.push("مستوى الوظيفة غير واضح في النص");
  if (!education.length) missing.push("المؤهل التعليمي غير مذكور في النص");
  if (!language) missing.push("لغة العمل غير محددة في النص");

  return {
    hardSkills,
    softSkills,
    responsibilities,
    keywords,
    ...(years ? { years } : {}),
    ...(seniorityHit ? { seniority: seniorityHit.ar } : {}),
    ...(language ? { language } : {}),
    education,
    missing,
  };
}

/** Everything the Career Twin says about the user, as one searchable blob. */
function twinCorpus(twin: CareerTwin): string {
  const parts: string[] = [
    twin.identity.headline,
    twin.identity.summary,
    ...twin.skills.map((s) => s.name),
    ...twin.workHistory.flatMap((w) => [w.role, w.company, ...(w.bullets ?? [])]),
    ...twin.achievements.map((a) => `${a.text} ${a.metric ?? ""}`),
    ...twin.certifications.map((c) => `${c.title} ${c.detail ?? ""}`),
    ...twin.projects.map((p) => `${p.title} ${p.detail ?? ""}`),
    ...twin.education.map((e) => `${e.degree} ${e.school}`),
  ];
  return norm(parts.filter(Boolean).join(" \n "));
}

/**
 * Compares the Career Twin with a parsed job. Gaps are classified so the user
 * knows whether they need a real new skill, better wording, or just evidence —
 * we never suggest claiming a skill the user does not have.
 */
export function matchTwinToJob(twin: CareerTwin | null, req: JobRequirements): MatchAnalysis {
  const limitations = [
    "هذه المقارنة تعتمد على النص الذي أدخلته وعلى ملفك المهني فقط، وليست تقييماً من جهة التوظيف.",
    "غياب كلمة في ملفك لا يعني غياب المهارة؛ قد تحتاج صياغة أوضح فقط.",
  ];

  if (!twin) {
    return { score: 0, matchedSkills: [], missingSkills: req.hardSkills, gaps: [], limitations };
  }

  const corpus = twinCorpus(twin);
  const matchedSkills = req.hardSkills.filter((s) => corpus.includes(norm(s)));
  const missingSkills = req.hardSkills.filter((s) => !corpus.includes(norm(s)));
  const matchedSoft = req.softSkills.filter((s) => corpus.includes(norm(s)));
  const matchedKeywords = req.keywords.filter((k) => corpus.includes(k));

  const gaps: MatchGap[] = [];

  for (const s of missingSkills.slice(0, 8)) {
    gaps.push({
      id: uid(),
      kind: "skill",
      label: s,
      hint: "أضِفها فقط إن كنت تملكها فعلاً، ووضّح أين استخدمتها.",
    });
  }

  // Wording gaps: the requirement keyword exists nowhere, but a closely related skill does.
  if (matchedKeywords.length < Math.min(6, req.keywords.length)) {
    gaps.push({
      id: uid(),
      kind: "wording",
      label: "مصطلحات الوظيفة غير مستخدمة في ملفك",
      hint: "استخدم نفس مصطلحات الوصف الوظيفي حيث تنطبق على عملك الحقيقي.",
    });
  }

  const unverifiedNumbers = twin.achievements.filter((a) => a.metric && !a.verified).length;
  const bulletsWithNumbers = twin.workHistory
    .flatMap((w) => w.bullets ?? [])
    .filter((b) => /\d/.test(b)).length;

  if (bulletsWithNumbers < 2) {
    gaps.push({
      id: uid(),
      kind: "evidence",
      label: "الإنجازات بحاجة إلى أدلة قابلة للقياس",
      hint: "أضف رقماً أو نتيجة تعرفها بدقة لكل إنجاز رئيسي.",
    });
  }
  if (unverifiedNumbers > 0) {
    gaps.push({
      id: uid(),
      kind: "evidence",
      label: `${unverifiedNumbers} رقم لم تؤكده بعد`,
      hint: "أكّد الأرقام قبل استخدامها في سيرة مرسلة.",
    });
  }
  for (const m of req.missing.slice(0, 3)) {
    gaps.push({ id: uid(), kind: "info", label: m, hint: "أضف المعلومة يدوياً إن عرفتها من مصدر آخر." });
  }

  // Weighted, and honest about what it measures.
  const skillPart = req.hardSkills.length
    ? (matchedSkills.length / req.hardSkills.length) * 55
    : 30;
  const softPart = req.softSkills.length ? (matchedSoft.length / req.softSkills.length) * 15 : 10;
  const keywordPart = req.keywords.length ? (matchedKeywords.length / req.keywords.length) * 20 : 10;
  const evidencePart = Math.min(10, bulletsWithNumbers * 3);

  const score = Math.max(0, Math.min(100, Math.round(skillPart + softPart + keywordPart + evidencePart)));

  return { score, matchedSkills, missingSkills, gaps, limitations };
}

export const GAP_LABEL: Record<MatchGap["kind"], { ar: string; en: string }> = {
  skill: { ar: "فجوة مهارة", en: "Skill gap" },
  wording: { ar: "فجوة صياغة", en: "Wording gap" },
  evidence: { ar: "فجوة دليل", en: "Evidence gap" },
  info: { ar: "معلومة ناقصة", en: "Missing info" },
};
