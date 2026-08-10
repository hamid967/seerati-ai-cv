/**
 * Saudi / Gulf career taxonomy — product-owned reference data.
 *
 * SCOPE AND HONESTY RULES
 * - This file holds *stable naming* data only: sectors, normalised job titles
 *   and their Arabic/English aliases, seniority vocabulary, major Saudi cities
 *   and work patterns.
 * - It deliberately contains NO salary bands, NO hiring rates, NO market-demand
 *   or "hot job" claims and no other figure that changes over time. Such data
 *   would be an unverifiable claim, and Seerati never shows the user a number it
 *   cannot stand behind.
 * - Everything here is used for normalisation and autocomplete, never to
 *   assert a fact about the user.
 */

export type Bi = { ar: string; en: string };

/* --------------------------------- sectors -------------------------------- */

export type Sector = { id: string; label: Bi };

export const SECTORS: Sector[] = [
  { id: "government", label: { ar: "القطاع الحكومي", en: "Government" } },
  { id: "energy", label: { ar: "الطاقة والبتروكيماويات", en: "Energy & petrochemicals" } },
  { id: "banking", label: { ar: "البنوك والتمويل", en: "Banking & finance" } },
  { id: "technology", label: { ar: "التقنية والبرمجيات", en: "Technology & software" } },
  { id: "telecom", label: { ar: "الاتصالات", en: "Telecom" } },
  { id: "healthcare", label: { ar: "الرعاية الصحية", en: "Healthcare" } },
  { id: "education", label: { ar: "التعليم والتدريب", en: "Education & training" } },
  { id: "construction", label: { ar: "المقاولات والتشييد", en: "Construction & contracting" } },
  { id: "retail", label: { ar: "التجزئة والتجارة", en: "Retail & commerce" } },
  { id: "logistics", label: { ar: "النقل واللوجستيات", en: "Transport & logistics" } },
  { id: "hospitality", label: { ar: "الضيافة والسياحة", en: "Hospitality & tourism" } },
  { id: "manufacturing", label: { ar: "الصناعة والتصنيع", en: "Industry & manufacturing" } },
  { id: "realestate", label: { ar: "العقار والتطوير", en: "Real estate & development" } },
  { id: "consulting", label: { ar: "الاستشارات", en: "Consulting" } },
  { id: "media", label: { ar: "الإعلام والمحتوى", en: "Media & content" } },
  { id: "nonprofit", label: { ar: "القطاع غير الربحي", en: "Non-profit" } },
];

export const sectorLabel = (id: string): Bi | null =>
  SECTORS.find((s) => s.id === id)?.label ?? null;

/* ------------------------------ seniority -------------------------------- */

export const SENIORITY_LEVELS = [
  "intern",
  "entry",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "executive",
] as const;
export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

export const SENIORITY_LABEL: Record<SeniorityLevel, Bi> = {
  intern: { ar: "متدرّب", en: "Intern" },
  entry: { ar: "مبتدئ", en: "Entry level" },
  mid: { ar: "متوسط الخبرة", en: "Mid level" },
  senior: { ar: "خبير/أول", en: "Senior" },
  lead: { ar: "قائد فريق", en: "Lead" },
  manager: { ar: "مدير", en: "Manager" },
  director: { ar: "مدير عام/تنفيذي أول", en: "Director" },
  executive: { ar: "قيادة تنفيذية", en: "Executive" },
};

/** Title cues only — the level is never guessed from years or salary. */
const SENIORITY_CUES: Array<{ level: SeniorityLevel; cues: string[] }> = [
  { level: "intern", cues: ["intern", "internship", "trainee", "متدرب", "متدرّب", "تدريب"] },
  {
    level: "entry",
    cues: ["junior", "jr", "graduate", "assistant", "مبتدئ", "مساعد", "حديث التخرج"],
  },
  { level: "senior", cues: ["senior", "sr", "specialist ii", "أول", "خبير", "كبير"] },
  { level: "lead", cues: ["lead", "principal", "staff", "قائد", "رئيس فريق"] },
  { level: "manager", cues: ["manager", "head of", "supervisor", "مدير", "مشرف", "رئيس قسم"] },
  {
    level: "director",
    cues: ["director", "vp", "vice president", "general manager", "مدير عام", "نائب رئيس"],
  },
  {
    level: "executive",
    cues: [
      "chief",
      "ceo",
      "cto",
      "cfo",
      "coo",
      "cio",
      "president",
      "الرئيس التنفيذي",
      "المدير التنفيذي",
    ],
  },
];

/* ------------------------------- job titles ------------------------------- */

export type JobTitleEntry = {
  id: string;
  label: Bi;
  sector: string;
  aliases: { ar: string[]; en: string[] };
};

export const JOB_TITLES: JobTitleEntry[] = [
  {
    id: "software-engineer",
    label: { ar: "مهندس برمجيات", en: "Software Engineer" },
    sector: "technology",
    aliases: {
      ar: ["مطور برمجيات", "مبرمج", "مهندس تطوير", "مطوّر"],
      en: ["software developer", "developer", "programmer", "swe", "software dev"],
    },
  },
  {
    id: "frontend-engineer",
    label: { ar: "مهندس واجهات أمامية", en: "Frontend Engineer" },
    sector: "technology",
    aliases: {
      ar: ["مطور واجهات", "مطور فرونت اند", "مبرمج واجهات"],
      en: ["frontend developer", "front-end engineer", "ui engineer", "web developer"],
    },
  },
  {
    id: "backend-engineer",
    label: { ar: "مهندس أنظمة خلفية", en: "Backend Engineer" },
    sector: "technology",
    aliases: {
      ar: ["مطور باك اند", "مهندس خدمات خلفية"],
      en: ["backend developer", "back-end engineer", "api engineer"],
    },
  },
  {
    id: "data-analyst",
    label: { ar: "محلل بيانات", en: "Data Analyst" },
    sector: "technology",
    aliases: {
      ar: ["محلل معلومات", "محلل بيانات أعمال", "أخصائي تحليل بيانات"],
      en: ["business intelligence analyst", "bi analyst", "data analytics specialist"],
    },
  },
  {
    id: "data-scientist",
    label: { ar: "عالم بيانات", en: "Data Scientist" },
    sector: "technology",
    aliases: {
      ar: ["مهندس تعلم آلي", "أخصائي علم بيانات"],
      en: ["machine learning engineer", "ml engineer"],
    },
  },
  {
    id: "product-manager",
    label: { ar: "مدير منتج", en: "Product Manager" },
    sector: "technology",
    aliases: { ar: ["مالك منتج", "مسؤول منتج"], en: ["product owner", "pm", "product lead"] },
  },
  {
    id: "project-manager",
    label: { ar: "مدير مشروع", en: "Project Manager" },
    sector: "consulting",
    aliases: {
      ar: ["مدير مشاريع", "مسؤول إدارة مشاريع", "مدير برنامج"],
      en: ["program manager", "pmo lead", "projects manager"],
    },
  },
  {
    id: "business-analyst",
    label: { ar: "محلل أعمال", en: "Business Analyst" },
    sector: "consulting",
    aliases: {
      ar: ["محلل عمليات", "محلل نظم أعمال"],
      en: ["systems analyst", "process analyst", "ba"],
    },
  },
  {
    id: "accountant",
    label: { ar: "محاسب", en: "Accountant" },
    sector: "banking",
    aliases: {
      ar: ["محاسب عام", "محاسب مالي", "مدقق حسابات"],
      en: ["general accountant", "financial accountant"],
    },
  },
  {
    id: "financial-analyst",
    label: { ar: "محلل مالي", en: "Financial Analyst" },
    sector: "banking",
    aliases: {
      ar: ["أخصائي تحليل مالي", "محلل استثمار"],
      en: ["investment analyst", "fp&a analyst"],
    },
  },
  {
    id: "hr-specialist",
    label: { ar: "أخصائي موارد بشرية", en: "HR Specialist" },
    sector: "consulting",
    aliases: {
      ar: ["أخصائي شؤون موظفين", "أخصائي توظيف", "مسؤول موارد بشرية"],
      en: [
        "human resources specialist",
        "recruiter",
        "talent acquisition specialist",
        "hr officer",
      ],
    },
  },
  {
    id: "marketing-specialist",
    label: { ar: "أخصائي تسويق", en: "Marketing Specialist" },
    sector: "media",
    aliases: {
      ar: ["أخصائي تسويق رقمي", "مسؤول تسويق", "أخصائي تسويق إلكتروني"],
      en: ["digital marketing specialist", "marketing executive", "growth marketer"],
    },
  },
  {
    id: "sales-representative",
    label: { ar: "مندوب مبيعات", en: "Sales Representative" },
    sector: "retail",
    aliases: {
      ar: ["أخصائي مبيعات", "تنفيذي مبيعات"],
      en: ["sales executive", "account executive", "sales officer"],
    },
  },
  {
    id: "customer-service",
    label: { ar: "أخصائي خدمة عملاء", en: "Customer Service Specialist" },
    sector: "retail",
    aliases: {
      ar: ["موظف خدمة عملاء", "أخصائي تجربة عميل", "مسؤول دعم عملاء"],
      en: ["customer support specialist", "customer experience specialist", "call center agent"],
    },
  },
  {
    id: "civil-engineer",
    label: { ar: "مهندس مدني", en: "Civil Engineer" },
    sector: "construction",
    aliases: { ar: ["مهندس إنشائي", "مهندس موقع"], en: ["structural engineer", "site engineer"] },
  },
  {
    id: "mechanical-engineer",
    label: { ar: "مهندس ميكانيكي", en: "Mechanical Engineer" },
    sector: "manufacturing",
    aliases: {
      ar: ["مهندس صيانة ميكانيكية"],
      en: ["maintenance engineer", "mechanical maintenance engineer"],
    },
  },
  {
    id: "electrical-engineer",
    label: { ar: "مهندس كهربائي", en: "Electrical Engineer" },
    sector: "energy",
    aliases: {
      ar: ["مهندس كهرباء", "مهندس طاقة"],
      en: ["power engineer", "electrical maintenance engineer"],
    },
  },
  {
    id: "process-engineer",
    label: { ar: "مهندس عمليات", en: "Process Engineer" },
    sector: "energy",
    aliases: {
      ar: ["مهندس تشغيل", "مهندس إنتاج"],
      en: ["operations engineer", "production engineer"],
    },
  },
  {
    id: "hse-officer",
    label: { ar: "مسؤول سلامة وصحة مهنية", en: "HSE Officer" },
    sector: "energy",
    aliases: {
      ar: ["أخصائي سلامة", "مشرف سلامة", "أخصائي صحة وسلامة"],
      en: ["safety officer", "health and safety specialist", "hse specialist"],
    },
  },
  {
    id: "nurse",
    label: { ar: "ممرض/ممرضة", en: "Nurse" },
    sector: "healthcare",
    aliases: { ar: ["ممرض عام", "كادر تمريض"], en: ["registered nurse", "staff nurse", "rn"] },
  },
  {
    id: "pharmacist",
    label: { ar: "صيدلي", en: "Pharmacist" },
    sector: "healthcare",
    aliases: { ar: ["صيدلي إكلينيكي"], en: ["clinical pharmacist"] },
  },
  {
    id: "teacher",
    label: { ar: "معلم", en: "Teacher" },
    sector: "education",
    aliases: { ar: ["مدرّس", "معلمة", "مدرب"], en: ["instructor", "tutor", "trainer"] },
  },
  {
    id: "supply-chain-specialist",
    label: { ar: "أخصائي سلاسل إمداد", en: "Supply Chain Specialist" },
    sector: "logistics",
    aliases: {
      ar: ["أخصائي مشتريات", "أخصائي لوجستيات", "مسؤول مخازن"],
      en: ["procurement specialist", "logistics specialist", "warehouse supervisor"],
    },
  },
  {
    id: "administrative-officer",
    label: { ar: "موظف إداري", en: "Administrative Officer" },
    sector: "government",
    aliases: {
      ar: ["مسؤول إداري", "سكرتير تنفيذي", "منسق إداري"],
      en: ["admin officer", "executive secretary", "office coordinator", "administrator"],
    },
  },
  {
    id: "graphic-designer",
    label: { ar: "مصمم جرافيك", en: "Graphic Designer" },
    sector: "media",
    aliases: { ar: ["مصمم هوية", "مصمم بصري"], en: ["visual designer", "brand designer"] },
  },
  {
    id: "ux-designer",
    label: { ar: "مصمم تجربة المستخدم", en: "UX Designer" },
    sector: "technology",
    aliases: {
      ar: ["مصمم واجهات وتجربة", "مصمم منتج"],
      en: ["product designer", "ui/ux designer", "ux/ui designer"],
    },
  },
  {
    id: "cybersecurity-specialist",
    label: { ar: "أخصائي أمن سيبراني", en: "Cybersecurity Specialist" },
    sector: "technology",
    aliases: {
      ar: ["أخصائي أمن معلومات", "محلل أمن سيبراني"],
      en: ["information security specialist", "security analyst", "soc analyst"],
    },
  },
  {
    id: "it-support",
    label: { ar: "أخصائي دعم تقني", en: "IT Support Specialist" },
    sector: "technology",
    aliases: {
      ar: ["فني دعم فني", "مسؤول دعم تقني"],
      en: ["helpdesk specialist", "technical support engineer"],
    },
  },
];

/* --------------------------------- cities --------------------------------- */

export type CityEntry = { id: string; label: Bi; region: Bi };

export const SAUDI_CITIES: CityEntry[] = [
  {
    id: "riyadh",
    label: { ar: "الرياض", en: "Riyadh" },
    region: { ar: "منطقة الرياض", en: "Riyadh Region" },
  },
  {
    id: "jeddah",
    label: { ar: "جدة", en: "Jeddah" },
    region: { ar: "منطقة مكة المكرمة", en: "Makkah Region" },
  },
  {
    id: "makkah",
    label: { ar: "مكة المكرمة", en: "Makkah" },
    region: { ar: "منطقة مكة المكرمة", en: "Makkah Region" },
  },
  {
    id: "madinah",
    label: { ar: "المدينة المنورة", en: "Madinah" },
    region: { ar: "منطقة المدينة", en: "Madinah Region" },
  },
  {
    id: "dammam",
    label: { ar: "الدمام", en: "Dammam" },
    region: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  },
  {
    id: "khobar",
    label: { ar: "الخبر", en: "Al Khobar" },
    region: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  },
  {
    id: "dhahran",
    label: { ar: "الظهران", en: "Dhahran" },
    region: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  },
  {
    id: "jubail",
    label: { ar: "الجبيل", en: "Jubail" },
    region: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  },
  {
    id: "abha",
    label: { ar: "أبها", en: "Abha" },
    region: { ar: "منطقة عسير", en: "Asir Region" },
  },
  {
    id: "taif",
    label: { ar: "الطائف", en: "Taif" },
    region: { ar: "منطقة مكة المكرمة", en: "Makkah Region" },
  },
  {
    id: "tabuk",
    label: { ar: "تبوك", en: "Tabuk" },
    region: { ar: "منطقة تبوك", en: "Tabuk Region" },
  },
  {
    id: "hail",
    label: { ar: "حائل", en: "Hail" },
    region: { ar: "منطقة حائل", en: "Hail Region" },
  },
  {
    id: "qassim",
    label: { ar: "بريدة", en: "Buraidah" },
    region: { ar: "منطقة القصيم", en: "Qassim Region" },
  },
  {
    id: "najran",
    label: { ar: "نجران", en: "Najran" },
    region: { ar: "منطقة نجران", en: "Najran Region" },
  },
  {
    id: "jazan",
    label: { ar: "جازان", en: "Jazan" },
    region: { ar: "منطقة جازان", en: "Jazan Region" },
  },
  {
    id: "neom",
    label: { ar: "نيوم", en: "NEOM" },
    region: { ar: "منطقة تبوك", en: "Tabuk Region" },
  },
  {
    id: "kaec",
    label: { ar: "مدينة الملك عبدالله الاقتصادية", en: "King Abdullah Economic City" },
    region: { ar: "منطقة مكة المكرمة", en: "Makkah Region" },
  },
];

/* ------------------------------ work patterns ----------------------------- */

export const WORK_PATTERNS = ["onsite", "hybrid", "remote"] as const;
export type WorkPattern = (typeof WORK_PATTERNS)[number];

export const WORK_PATTERN_LABEL: Record<WorkPattern, Bi> = {
  onsite: { ar: "حضوري", en: "On-site" },
  hybrid: { ar: "هجين", en: "Hybrid" },
  remote: { ar: "عن بُعد", en: "Remote" },
};

/* ------------------------------ skill aliases ----------------------------- */

export type SkillEntry = { id: string; label: Bi; aliases: string[] };

export const SKILL_ALIASES: SkillEntry[] = [
  {
    id: "excel",
    label: { ar: "إكسل", en: "Microsoft Excel" },
    aliases: ["excel", "ms excel", "اكسل", "الإكسل", "جدول بيانات"],
  },
  {
    id: "powerpoint",
    label: { ar: "بوربوينت", en: "Microsoft PowerPoint" },
    aliases: ["powerpoint", "ppt", "بوربوينت", "باوربوينت"],
  },
  {
    id: "power-bi",
    label: { ar: "باور بي آي", en: "Power BI" },
    aliases: ["power bi", "powerbi", "باور بي اي", "بور بي آي"],
  },
  {
    id: "sql",
    label: { ar: "SQL", en: "SQL" },
    aliases: ["sql", "mysql", "ms sql", "t-sql", "قواعد بيانات sql"],
  },
  { id: "python", label: { ar: "بايثون", en: "Python" }, aliases: ["python", "بايثون", "بيثون"] },
  {
    id: "javascript",
    label: { ar: "جافاسكربت", en: "JavaScript" },
    aliases: ["javascript", "js", "جافا سكربت", "جافاسكريبت"],
  },
  {
    id: "react",
    label: { ar: "React", en: "React" },
    aliases: ["react", "reactjs", "react.js", "رياكت"],
  },
  {
    id: "project-management",
    label: { ar: "إدارة المشاريع", en: "Project management" },
    aliases: ["project management", "pmp", "ادارة مشاريع", "إدارة مشاريع"],
  },
  { id: "sap", label: { ar: "SAP", en: "SAP" }, aliases: ["sap", "sap erp", "ساب"] },
  {
    id: "oracle",
    label: { ar: "أوراكل", en: "Oracle" },
    aliases: ["oracle", "oracle erp", "اوراكل", "أوراكل"],
  },
  {
    id: "autocad",
    label: { ar: "أوتوكاد", en: "AutoCAD" },
    aliases: ["autocad", "auto cad", "اوتوكاد", "أوتوكاد"],
  },
  {
    id: "primavera",
    label: { ar: "بريمافيرا", en: "Primavera P6" },
    aliases: ["primavera", "p6", "بريمافيرا"],
  },
  {
    id: "communication",
    label: { ar: "مهارات التواصل", en: "Communication" },
    aliases: ["communication", "communication skills", "التواصل", "مهارات تواصل"],
  },
  {
    id: "leadership",
    label: { ar: "القيادة", en: "Leadership" },
    aliases: ["leadership", "team leadership", "قيادة", "قيادة فرق"],
  },
  {
    id: "customer-service",
    label: { ar: "خدمة العملاء", en: "Customer service" },
    aliases: ["customer service", "customer care", "خدمة العملاء", "خدمة عملاء"],
  },
  {
    id: "arabic-writing",
    label: { ar: "الكتابة بالعربية", en: "Arabic writing" },
    aliases: ["arabic writing", "كتابة عربية", "تحرير عربي"],
  },
  {
    id: "english",
    label: { ar: "اللغة الإنجليزية", en: "English" },
    aliases: ["english", "english language", "الإنجليزية", "انجليزي"],
  },
  {
    id: "data-analysis",
    label: { ar: "تحليل البيانات", en: "Data analysis" },
    aliases: ["data analysis", "analytics", "تحليل بيانات", "تحليل البيانات"],
  },
  {
    id: "digital-marketing",
    label: { ar: "التسويق الرقمي", en: "Digital marketing" },
    aliases: ["digital marketing", "seo", "sem", "تسويق رقمي", "التسويق الإلكتروني"],
  },
  {
    id: "hse",
    label: { ar: "السلامة والصحة المهنية", en: "Health & safety (HSE)" },
    aliases: ["hse", "nebosh", "iosh", "سلامة", "الصحة والسلامة"],
  },
];

/* --------------------------------- helpers -------------------------------- */

/** Arabic-aware, punctuation-tolerant normalisation for matching only. */
export function foldText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // harakat + tatweel
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[^\p{L}\p{N}+#.& ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type TitleMatch = {
  entry: JobTitleEntry;
  /** Canonical label in the requested locale. */
  canonical: string;
  /** 1 = exact label, 0.85 = alias, 0.6 = partial containment. */
  confidence: number;
  matchedOn: "label" | "alias" | "partial";
};

/**
 * Maps free text onto a canonical job title. Returns null when nothing matches
 * confidently — the caller keeps the user's own wording in that case.
 */
export function normalizeJobTitle(input: string, locale: "ar" | "en" = "ar"): TitleMatch | null {
  const q = foldText(input);
  if (q.length < 2) return null;

  for (const entry of JOB_TITLES) {
    if (foldText(entry.label.ar) === q || foldText(entry.label.en) === q) {
      return { entry, canonical: entry.label[locale], confidence: 1, matchedOn: "label" };
    }
  }
  for (const entry of JOB_TITLES) {
    const aliases = [...entry.aliases.ar, ...entry.aliases.en].map(foldText);
    if (aliases.includes(q)) {
      return { entry, canonical: entry.label[locale], confidence: 0.85, matchedOn: "alias" };
    }
  }
  // Partial containment: "senior software engineer" → software engineer.
  let best: TitleMatch | null = null;
  for (const entry of JOB_TITLES) {
    const candidates = [
      entry.label.ar,
      entry.label.en,
      ...entry.aliases.ar,
      ...entry.aliases.en,
    ].map(foldText);
    for (const c of candidates) {
      if (c.length >= 4 && (q.includes(c) || c.includes(q))) {
        const score = 0.6 * (Math.min(c.length, q.length) / Math.max(c.length, q.length));
        if (!best || score > best.confidence) {
          best = {
            entry,
            canonical: entry.label[locale],
            confidence: Number(score.toFixed(2)),
            matchedOn: "partial",
          };
        }
      }
    }
  }
  return best && best.confidence >= 0.3 ? best : null;
}

export type SkillMatch = { entry: SkillEntry; canonical: string; confidence: number };

/** Maps a written skill to its canonical bilingual name (or null if unknown). */
export function normalizeSkill(input: string, locale: "ar" | "en" = "ar"): SkillMatch | null {
  const q = foldText(input);
  if (!q) return null;
  for (const entry of SKILL_ALIASES) {
    const forms = [entry.label.ar, entry.label.en, ...entry.aliases].map(foldText);
    if (forms.includes(q)) return { entry, canonical: entry.label[locale], confidence: 1 };
  }
  for (const entry of SKILL_ALIASES) {
    const forms = [entry.label.ar, entry.label.en, ...entry.aliases].map(foldText);
    if (forms.some((f) => f.length >= 3 && (q.includes(f) || f.includes(q)))) {
      return { entry, canonical: entry.label[locale], confidence: 0.7 };
    }
  }
  return null;
}

export type SeniorityGuess = { level: SeniorityLevel; confidence: number; cue: string | null };

/**
 * Infers seniority from the *title text only*. Never from years of experience,
 * salary or any external assumption — and the confidence is reported so the UI
 * can present it as a suggestion, not a fact.
 */
export function inferSeniority(title: string): SeniorityGuess {
  const q = foldText(title);
  if (!q) return { level: "mid", confidence: 0, cue: null };
  // Most specific levels first so "senior manager" reads as manager.
  const ordered: SeniorityLevel[] = [
    "executive",
    "director",
    "manager",
    "lead",
    "senior",
    "intern",
    "entry",
  ];
  for (const level of ordered) {
    const found = SENIORITY_CUES.find((c) => c.level === level);
    if (!found) continue;
    const cue = found.cues.map(foldText).find((c) => q.includes(c));
    if (cue) return { level, confidence: 0.8, cue };
  }
  return { level: "mid", confidence: 0.25, cue: null };
}

export type TaxonomySuggestion = {
  kind: "title" | "skill" | "city" | "sector";
  id: string;
  label: Bi;
};

/** Autocomplete across every taxonomy list, ranked by match tightness. */
export function searchTaxonomy(query: string, limit = 8): TaxonomySuggestion[] {
  const q = foldText(query);
  if (!q) return [];
  const out: Array<TaxonomySuggestion & { score: number }> = [];

  const push = (kind: TaxonomySuggestion["kind"], id: string, label: Bi, forms: string[]) => {
    let score = 0;
    for (const f of forms.map(foldText)) {
      if (!f) continue;
      if (f === q) score = Math.max(score, 3);
      else if (f.startsWith(q)) score = Math.max(score, 2);
      else if (f.includes(q)) score = Math.max(score, 1);
    }
    if (score) out.push({ kind, id, label, score });
  };

  for (const t of JOB_TITLES)
    push("title", t.id, t.label, [t.label.ar, t.label.en, ...t.aliases.ar, ...t.aliases.en]);
  for (const s of SKILL_ALIASES)
    push("skill", s.id, s.label, [s.label.ar, s.label.en, ...s.aliases]);
  for (const c of SAUDI_CITIES) push("city", c.id, c.label, [c.label.ar, c.label.en]);
  for (const s of SECTORS) push("sector", s.id, s.label, [s.label.ar, s.label.en]);

  return out
    .sort((a, b) => b.score - a.score || a.label.en.length - b.label.en.length)
    .slice(0, limit)
    .map(({ kind, id, label }) => ({ kind, id, label }));
}

/** Flat autocomplete option lists for `<datalist>`-style inputs. */
export const titleOptions = (locale: "ar" | "en"): string[] =>
  JOB_TITLES.map((t) => t.label[locale]);

export const skillOptions = (locale: "ar" | "en"): string[] =>
  SKILL_ALIASES.map((s) => s.label[locale]);

export const cityOptions = (locale: "ar" | "en"): string[] =>
  SAUDI_CITIES.map((c) => c.label[locale]);

/**
 * Expands one keyword into its known aliases so ATS keyword matching does not
 * punish the user for writing "Power BI" when the ad says "PowerBI".
 */
export function keywordAliases(token: string): string[] {
  const q = foldText(token);
  const out = new Set<string>([q]);
  for (const s of SKILL_ALIASES) {
    const forms = [s.label.ar, s.label.en, ...s.aliases].map(foldText);
    if (forms.includes(q)) forms.forEach((f) => out.add(f));
  }
  for (const t of JOB_TITLES) {
    const forms = [t.label.ar, t.label.en, ...t.aliases.ar, ...t.aliases.en].map(foldText);
    if (forms.includes(q)) forms.forEach((f) => out.add(f));
  }
  return [...out].filter(Boolean);
}
