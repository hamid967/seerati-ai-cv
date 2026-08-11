import { normalizeResumeDesign } from "@/lib/resume-layout";
import type { Resume, ResumeUserDesign, SectionKey, TemplateDef } from "@/lib/types";

export type DesignRoleFamily =
  | "executive"
  | "technology"
  | "finance"
  | "creative"
  | "healthcare"
  | "sales"
  | "operations"
  | "general";

export type DesignCareerBand = "early" | "established" | "leadership" | "executive-style";
export type DesignContentLoad = "light" | "balanced" | "dense";
export type DesignConfidence = "medium" | "high";

export type BilingualText = { ar: string; en: string };

export type ResumeDesignProposal = {
  roleFamily: DesignRoleFamily;
  careerBand: DesignCareerBand;
  contentLoad: DesignContentLoad;
  confidence: DesignConfidence;
  atsPriority: boolean;
  templateId: string;
  alternativeTemplateIds: string[];
  targetPages: 1 | 2;
  design: ResumeUserDesign;
  sectionOrder: SectionKey[];
  reasons: BilingualText[];
  changes: Array<{
    key: string;
    label: BilingualText;
    before: string;
    after: string;
  }>;
};

const ROLE_PATTERNS: Array<{ family: DesignRoleFamily; pattern: RegExp }> = [
  {
    family: "executive",
    pattern:
      /\b(chief|ceo|cfo|cto|coo|president|vice president|vp|general manager|executive director)\b|رئيس تنفيذي|الرئيس التنفيذي|نائب رئيس|مدير عام|تنفيذي أول/i,
  },
  {
    family: "technology",
    pattern:
      /\b(engineer|engineering|developer|software|data|analytics|product|cyber|cloud|devops|ai|machine learning|ux|ui)\b|مهندس|هندسة|مطور|برمج|بيانات|تحليلات|منتج|أمن سيبراني|سحابة|ذكاء اصطناعي|تعلم آلي/i,
  },
  {
    family: "finance",
    pattern:
      /\b(finance|financial|account|accounting|audit|investment|treasury|bank|risk|tax)\b|مالي|مالية|محاسب|محاسبة|تدقيق|استثمار|خزينة|بنك|مخاطر|ضريبة/i,
  },
  {
    family: "creative",
    pattern:
      /\b(design|designer|creative|brand|branding|art director|content creator|photograph|video|motion)\b|مصمم|تصميم|إبداع|إبداعي|علامة تجارية|محتوى|تصوير|مونتاج|موشن/i,
  },
  {
    family: "healthcare",
    pattern:
      /\b(doctor|physician|nurse|nursing|medical|healthcare|pharmac|clinical|dentist|hospital)\b|طبيب|دكتور|تمريض|ممرض|طبي|صحي|صيدل|سريري|أسنان|مستشفى/i,
  },
  {
    family: "sales",
    pattern:
      /\b(sales|business development|account manager|commercial|marketing|growth|customer success)\b|مبيعات|تطوير أعمال|مدير حساب|تجاري|تسويق|نمو|نجاح العملاء/i,
  },
  {
    family: "operations",
    pattern:
      /\b(operations|operation|supply chain|logistics|procurement|project manager|program manager|quality|hr|human resources)\b|عمليات|تشغيل|سلاسل إمداد|لوجست|مشتريات|مدير مشروع|إدارة مشاريع|جودة|موارد بشرية/i,
  },
];

const LEADERSHIP_PATTERN =
  /\b(head|director|manager|lead|principal|senior manager)\b|رئيس|مدير|قائد|قيادي|إدارة/i;
const EXECUTIVE_PATTERN = ROLE_PATTERNS[0]!.pattern;

function contentUnits(resume: Resume) {
  const data = resume.data;
  const experienceText = data.experience.reduce(
    (sum, item) =>
      sum +
      item.role.length +
      item.company.length +
      item.bullets.reduce((bulletSum, bullet) => bulletSum + bullet.length, 0),
    0,
  );
  const educationText = data.education.reduce(
    (sum, item) => sum + item.degree.length + item.school.length + (item.note?.length ?? 0),
    0,
  );
  const simpleText = [
    ...data.certificates,
    ...data.projects,
    ...data.achievements,
    ...data.volunteering,
    ...data.references,
  ].reduce((sum, item) => sum + item.title.length + (item.detail?.length ?? 0), 0);
  const customText = data.custom.reduce(
    (sum, section) =>
      sum +
      section.title.length +
      section.items.reduce(
        (sectionSum, item) => sectionSum + item.title.length + (item.detail?.length ?? 0),
        0,
      ),
    0,
  );

  return (
    data.summary.length +
    experienceText +
    educationText +
    simpleText +
    customText +
    data.skills.length * 26 +
    data.languages.length * 28 +
    data.experience.length * 120 +
    data.education.length * 80
  );
}

function classifyRole(resume: Resume): { family: DesignRoleFamily; confident: boolean } {
  const text = [
    resume.data.targetJob,
    resume.data.personal.jobTitle,
    resume.data.jobDescription,
    ...resume.data.skills.map((skill) => skill.name),
  ]
    .filter(Boolean)
    .join(" ");

  for (const candidate of ROLE_PATTERNS) {
    if (candidate.pattern.test(text)) return { family: candidate.family, confident: true };
  }
  return { family: "general", confident: false };
}

function classifyCareerBand(resume: Resume): DesignCareerBand {
  const title = `${resume.data.targetJob ?? ""} ${resume.data.personal.jobTitle ?? ""}`;
  if (EXECUTIVE_PATTERN.test(title)) return "executive-style";
  if (LEADERSHIP_PATTERN.test(title) || resume.data.experience.length >= 5) return "leadership";
  if (resume.data.experience.length <= 1) return "early";
  return "established";
}

function classifyLoad(resume: Resume): DesignContentLoad {
  const units = contentUnits(resume);
  if (units >= 4300 || resume.data.experience.length >= 6) return "dense";
  if (units <= 1750 && resume.data.experience.length <= 2) return "light";
  return "balanced";
}

function activeTemplates(templates: TemplateDef[]) {
  return templates.filter((template) => template.active && template.supportsRTL);
}

function templatePreferences(
  family: DesignRoleFamily,
  band: DesignCareerBand,
  atsPriority: boolean,
): string[] {
  if (band === "executive-style" || family === "executive") {
    return ["saudi-executive", "executive", "classic-ats", "finance"];
  }
  if (family === "technology") {
    return ["technology", "riyadh-modern", "classic-ats", "modern"];
  }
  if (family === "finance") {
    return ["finance", "classic-ats", "minimal", "saudi-executive"];
  }
  if (family === "creative") {
    return atsPriority
      ? ["modern", "riyadh-modern", "classic-ats", "creative"]
      : ["modern", "creative", "riyadh-modern", "minimal"];
  }
  if (family === "healthcare") {
    return ["classic-ats", "modern", "minimal", "saudi-professional"];
  }
  if (family === "sales") {
    return ["modern", "classic-ats", "riyadh-modern", "saudi-professional"];
  }
  if (family === "operations") {
    return ["classic-ats", "modern", "riyadh-modern", "minimal"];
  }
  return band === "early"
    ? ["graduate", "classic-ats", "modern", "minimal"]
    : ["classic-ats", "modern", "minimal", "riyadh-modern"];
}

function pickTemplates(
  templates: TemplateDef[],
  preferences: string[],
  atsPriority: boolean,
): TemplateDef[] {
  const active = activeTemplates(templates);
  const byId = new Map(active.map((template) => [template.id, template]));
  const ranked = preferences
    .map((id) => byId.get(id))
    .filter((item): item is TemplateDef => !!item);
  const remaining = active.filter((template) => !ranked.some((item) => item.id === template.id));
  const pool = [...ranked, ...remaining];
  if (!atsPriority) return pool;
  return [
    ...pool.filter((template) => template.atsFriendly),
    ...pool.filter((template) => !template.atsFriendly),
  ];
}

function preferredSectionOrder(family: DesignRoleFamily, band: DesignCareerBand): SectionKey[] {
  if (band === "early") {
    return [
      "summary",
      "education",
      "skills",
      "projects",
      "experience",
      "certificates",
      "achievements",
      "languages",
      "volunteering",
      "links",
      "references",
      "custom",
    ];
  }
  if (band === "executive-style" || family === "executive") {
    return [
      "summary",
      "experience",
      "achievements",
      "skills",
      "education",
      "certificates",
      "projects",
      "languages",
      "volunteering",
      "links",
      "references",
      "custom",
    ];
  }
  if (family === "technology") {
    return [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certificates",
      "achievements",
      "languages",
      "links",
      "volunteering",
      "references",
      "custom",
    ];
  }
  if (family === "finance") {
    return [
      "summary",
      "experience",
      "achievements",
      "skills",
      "education",
      "certificates",
      "languages",
      "projects",
      "volunteering",
      "links",
      "references",
      "custom",
    ];
  }
  if (family === "creative") {
    return [
      "summary",
      "experience",
      "projects",
      "skills",
      "achievements",
      "education",
      "links",
      "certificates",
      "languages",
      "volunteering",
      "references",
      "custom",
    ];
  }
  return [
    "summary",
    "experience",
    "skills",
    "education",
    "achievements",
    "certificates",
    "projects",
    "languages",
    "volunteering",
    "links",
    "references",
    "custom",
  ];
}

function reorderWithoutLoss(current: SectionKey[], preferred: SectionKey[]) {
  const all = [...new Set([...current, ...preferred])];
  const rank = new Map(preferred.map((key, index) => [key, index]));
  return all.sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
}

function targetPageCount(
  resume: Resume,
  load: DesignContentLoad,
  band: DesignCareerBand,
  measuredPages?: number,
): 1 | 2 {
  if (band === "executive-style" || band === "leadership") return 2;
  if (load === "dense" || resume.data.experience.length >= 4) return 2;
  if (measuredPages && measuredPages >= 3) return 2;
  return 1;
}

function marketPageSize(resume: Resume): "a4" | "letter" {
  const market = `${resume.data.personal.country} ${resume.data.personal.city}`.toLowerCase();
  return /\b(united states|usa|u\.s\.|canada)\b/.test(market) ? "letter" : "a4";
}

function proposedLayout(
  resume: Resume,
  template: TemplateDef,
  load: DesignContentLoad,
  targetPages: 1 | 2,
  band: DesignCareerBand,
): ResumeUserDesign {
  const current = normalizeResumeDesign(resume.data.design);
  const compact = targetPages === 1 || load === "dense";
  const executive = band === "executive-style" || band === "leadership";

  return {
    ...resume.data.design,
    pageSize: marketPageSize(resume),
    accent: template.design.accent,
    density: compact ? "compact" : executive ? "normal" : template.design.spacing,
    fontScale: compact ? (load === "dense" ? 0.9 : 0.94) : executive ? 1.02 : 1,
    marginMm: compact ? (load === "dense" ? 8 : 9) : executive ? 12 : 11,
    lineHeight: compact ? (load === "dense" ? 1.42 : 1.5) : executive ? 1.62 : 1.58,
    columnWidth:
      template.design.layout === "single" ? current.columnWidth : load === "dense" ? 30 : 28,
    showPhoto: template.design.supportsPhoto ? resume.data.design?.showPhoto : false,
    pageBreakBefore: resume.data.design?.pageBreakBefore,
    keepTogetherSections: resume.data.design?.keepTogetherSections,
  };
}

function formatSectionOrder(order: SectionKey[]) {
  return order.slice(0, 4).join(" → ") + (order.length > 4 ? " …" : "");
}

function buildChanges(
  resume: Resume,
  template: TemplateDef,
  design: ResumeUserDesign,
  sectionOrder: SectionKey[],
): ResumeDesignProposal["changes"] {
  const before = normalizeResumeDesign(resume.data.design);
  const after = normalizeResumeDesign(design);
  const changes: ResumeDesignProposal["changes"] = [];
  const push = (key: string, label: BilingualText, from: string, to: string) => {
    if (from !== to) changes.push({ key, label, before: from, after: to });
  };

  push("template", { ar: "القالب", en: "Template" }, resume.templateId, template.id);
  push("page-size", { ar: "حجم الصفحة", en: "Page size" }, before.pageSize, after.pageSize);
  push(
    "density",
    { ar: "كثافة المحتوى", en: "Density" },
    resume.data.design?.density ?? "template default",
    design.density ?? "template default",
  );
  push(
    "font-scale",
    { ar: "حجم الخط", en: "Font scale" },
    `${Math.round(before.fontScale * 100)}%`,
    `${Math.round(after.fontScale * 100)}%`,
  );
  push(
    "margins",
    { ar: "الهوامش", en: "Margins" },
    `${before.marginMm} mm`,
    `${after.marginMm} mm`,
  );
  push(
    "line-height",
    { ar: "ارتفاع السطر", en: "Line height" },
    before.lineHeight.toFixed(2),
    after.lineHeight.toFixed(2),
  );
  push(
    "section-order",
    { ar: "ترتيب الأقسام", en: "Section order" },
    formatSectionOrder(resume.data.sectionOrder),
    formatSectionOrder(sectionOrder),
  );
  return changes;
}

export function buildResumeDesignProposal(
  resume: Resume,
  templates: TemplateDef[],
  options?: { measuredPages?: number },
): ResumeDesignProposal {
  const role = classifyRole(resume);
  const careerBand = classifyCareerBand(resume);
  const contentLoad = classifyLoad(resume);
  const atsPriority = Boolean(resume.data.jobDescription?.trim());
  const ranked = pickTemplates(
    templates,
    templatePreferences(role.family, careerBand, atsPriority),
    atsPriority,
  );
  const template = ranked[0] ?? templates[0];
  if (!template) throw new Error("No active resume template is available");

  const targetPages = targetPageCount(resume, contentLoad, careerBand, options?.measuredPages);
  const design = proposedLayout(resume, template, contentLoad, targetPages, careerBand);
  const sectionOrder = reorderWithoutLoss(
    resume.data.sectionOrder,
    preferredSectionOrder(role.family, careerBand),
  );
  const reasons: BilingualText[] = [];

  reasons.push({
    ar:
      contentLoad === "dense"
        ? "المحتوى كثيف، لذلك الاقتراح يضغط المسافات ضمن حدود القراءة الآمنة بدل حذف أي معلومة."
        : contentLoad === "light"
          ? "المحتوى خفيف نسبيًا، لذلك الاقتراح يحافظ على مساحة بيضاء مريحة بدون تمديد مصطنع."
          : "حجم المحتوى متوازن، لذلك الاقتراح يوازن بين سرعة المسح البصري والقراءة.",
    en:
      contentLoad === "dense"
        ? "Content is dense, so the proposal tightens spacing within safe readability limits instead of deleting information."
        : contentLoad === "light"
          ? "Content is relatively light, so the proposal preserves comfortable whitespace without artificial expansion."
          : "Content volume is balanced, so the proposal balances scan speed and readability.",
  });

  reasons.push({
    ar: atsPriority
      ? "يوجد وصف وظيفي مرتبط بالسيرة، لذلك أعطينا أولوية لقالب متوافق مع ATS."
      : "لا يوجد وصف وظيفي ملزم، لذلك اعتمد الاختيار على نوع الدور ووضوح القراءة البشرية.",
    en: atsPriority
      ? "A job description is attached, so an ATS-friendly template is prioritized."
      : "No job description is forcing an ATS-first choice, so role fit and human readability guide the recommendation.",
  });

  if (role.family !== "general") {
    reasons.push({
      ar: `تم اكتشاف نمط مهني «${role.family}» من المسمى والمهارات/الوصف، واستخدم فقط لاختيار العرض البصري.`,
      en: `A “${role.family}” presentation pattern was detected from the title and skills/job text and is used only for visual selection.`,
    });
  }

  reasons.push({
    ar: `الهدف المقترح ${targetPages === 1 ? "صفحة واحدة" : "صفحتان"}. هذا هدف تخطيط، والقياس الحقيقي في Studio يبقى المرجع النهائي.`,
    en: `The suggested target is ${targetPages} page${targetPages === 1 ? "" : "s"}. This is a layout target; the Studio's measured rendering remains the final authority.`,
  });

  return {
    roleFamily: role.family,
    careerBand,
    contentLoad,
    confidence: role.confident || atsPriority ? "high" : "medium",
    atsPriority,
    templateId: template.id,
    alternativeTemplateIds: ranked.slice(1, 4).map((item) => item.id),
    targetPages,
    design,
    sectionOrder,
    reasons,
    changes: buildChanges(resume, template, design, sectionOrder),
  };
}
