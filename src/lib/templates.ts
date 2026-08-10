import type { TemplateDef, TemplateDesign } from "./types";

export const baseDesign: TemplateDesign = {
  accent: "#1e3a5f",
  headingFont: "sans",
  spacing: "normal",
  sectionStyle: "line",
  layout: "single",
  header: "stack",
  bullet: "disc",
  supportsPhoto: false,
};

export const defaultTemplates: TemplateDef[] = [
  {
    id: "classic-ats",
    name: { ar: "كلاسيكي ATS", en: "Classic ATS" },
    description: {
      ar: "عمود واحد هادئ بعناوين واضحة وفواصل دقيقة؛ مناسب للرفع المباشر إلى أنظمة التوظيف.",
      en: "A calm single-column layout with crisp headings and separators for ATS-first applications.",
    },
    category: "ats",
    atsFriendly: true,
    supportsRTL: true,
    active: true,
    order: 1,
    design: { ...baseDesign, accent: "#203a5f", sectionStyle: "line", layout: "single", header: "stack", bullet: "disc" },
  },
  {
    id: "modern",
    name: { ar: "عصري", en: "Modern" },
    description: {
      ar: "ترويسة ممتدة ولمسات زمردية مع تسلسل بصري واضح بدون التضحية بالقراءة.",
      en: "Wide header, restrained emerald accents and strong hierarchy without sacrificing readability.",
    },
    category: "modern", atsFriendly: true, supportsRTL: true, active: true, order: 2,
    design: { ...baseDesign, accent: "#0f766e", sectionStyle: "bar", layout: "single", header: "banner", bullet: "dash" },
  },
  {
    id: "executive",
    name: { ar: "تنفيذي", en: "Executive" },
    description: {
      ar: "طابع قيادي رصين، ترويسة موزعة ومساحات مريحة لملفات المديرين والخبرات العليا.",
      en: "A restrained leadership layout with split header and generous spacing for senior profiles.",
    },
    category: "executive", atsFriendly: true, supportsRTL: true, active: true, order: 3,
    design: { ...baseDesign, accent: "#172033", headingFont: "serif", spacing: "airy", sectionStyle: "caps", layout: "single", header: "split", bullet: "square" },
  },
  {
    id: "minimal",
    name: { ar: "مبسّط", en: "Minimal" },
    description: {
      ar: "مساحات بيضاء مدروسة، ترويسة موسطة، ونبرة بصرية محايدة تناسب أغلب التخصصات.",
      en: "Measured whitespace, centered header and neutral visual tone for broad professional use.",
    },
    category: "minimal", atsFriendly: true, supportsRTL: true, active: true, order: 4,
    design: { ...baseDesign, accent: "#334155", spacing: "airy", sectionStyle: "plain", layout: "single", header: "centered", bullet: "dash" },
  },
  {
    id: "saudi-professional",
    name: { ar: "سعودي مهني", en: "Saudi Professional" },
    description: {
      ar: "قالب عربي أولاً بترويسة خضراء وعمود جانبي منظم للمهارات واللغات والروابط؛ بصري أكثر من قوالب ATS أحادية العمود.",
      en: "Arabic-first profile with green banner and organized sidebar; more visual than Seerati's single-column ATS templates.",
    },
    category: "modern", atsFriendly: false, supportsRTL: true, active: true, order: 5,
    design: { ...baseDesign, accent: "#166534", sectionStyle: "bar", layout: "sidebar", header: "banner", bullet: "disc", supportsPhoto: true },
  },
  {
    id: "creative",
    name: { ar: "إبداعي", en: "Creative" },
    description: {
      ar: "شخصية بصرية أقوى مع عمود جانبي وصورة اختيارية؛ مناسب للأعمال الإبداعية أكثر من أنظمة ATS الصارمة.",
      en: "A stronger visual identity with sidebar and optional photo, aimed at creative roles rather than strict ATS flows.",
    },
    category: "creative", atsFriendly: false, supportsRTL: true, active: true, order: 6,
    design: { ...baseDesign, accent: "#5b2a86", spacing: "compact", sectionStyle: "plain", layout: "sidebar-left", header: "stack", bullet: "square", supportsPhoto: true },
  },
  {
    id: "riyadh-modern",
    name: { ar: "رياض مودرن", en: "Riyadh Modern" },
    description: {
      ar: "هوية حضرية هادئة بالأزرق النيلي، مناسبة للتقنية والاستشارات والمنتجات الرقمية.",
      en: "A quiet urban indigo identity for technology, consulting and digital product roles.",
    },
    category: "modern", atsFriendly: true, supportsRTL: true, active: true, order: 7,
    design: { ...baseDesign, accent: "#24456f", sectionStyle: "bar", layout: "single", header: "split", bullet: "dash" },
  },
  {
    id: "saudi-executive",
    name: { ar: "سعودي تنفيذي", en: "Saudi Executive" },
    description: {
      ar: "قالب قيادي بلمسة خضراء داكنة وتوزيع متزن للمعلومات يناسب المدراء والتنفيذيين.",
      en: "A leadership-focused Saudi profile with deep green accents and balanced information density.",
    },
    category: "executive", atsFriendly: true, supportsRTL: true, active: true, order: 8,
    design: { ...baseDesign, accent: "#14532d", headingFont: "serif", spacing: "airy", sectionStyle: "line", layout: "single", header: "split", bullet: "square" },
  },
  {
    id: "gulf-professional",
    name: { ar: "خليجي مهني", en: "Gulf Professional" },
    description: {
      ar: "تنسيق مهني نظيف مناسب للسوق الخليجي، مع عمود جانبي خفيف وقراءة بشرية ممتازة.",
      en: "A polished GCC-oriented profile with a light sidebar optimized for human scanning rather than strict ATS parsing.",
    },
    category: "modern", atsFriendly: false, supportsRTL: true, active: true, order: 9,
    design: { ...baseDesign, accent: "#0f5f5a", sectionStyle: "line", layout: "sidebar", header: "stack", bullet: "disc", supportsPhoto: true },
  },
  {
    id: "finance",
    name: { ar: "مالية واستثمار", en: "Finance & Investment" },
    description: {
      ar: "قالب رسمي عالي الانضباط للمالية والمحاسبة والاستثمار، يبرز الخبرة والأرقام بدون زخرفة زائدة.",
      en: "A disciplined formal layout for finance, accounting and investment, emphasizing evidence and measurable impact.",
    },
    category: "ats", atsFriendly: true, supportsRTL: true, active: true, order: 10,
    design: { ...baseDesign, accent: "#25344f", headingFont: "serif", spacing: "normal", sectionStyle: "caps", layout: "single", header: "split", bullet: "square" },
  },
  {
    id: "technology",
    name: { ar: "تقنية ومنتجات", en: "Technology & Product" },
    description: {
      ar: "قالب مدمج وسريع المسح البصري للبرمجة والبيانات والمنتجات مع إبراز المهارات والمشاريع.",
      en: "A compact, scan-friendly layout for engineering, data and product profiles with clear skills and projects.",
    },
    category: "ats", atsFriendly: true, supportsRTL: true, active: true, order: 11,
    design: { ...baseDesign, accent: "#075985", spacing: "compact", sectionStyle: "bar", layout: "single", header: "stack", bullet: "dash" },
  },
  {
    id: "graduate",
    name: { ar: "خريج وبداية مهنية", en: "Graduate & Early Career" },
    description: {
      ar: "تنسيق واضح للخريجين وبدايات المسار، يعطي مساحة أكبر للتعليم والمشاريع والتطوع والمهارات.",
      en: "A clear early-career layout that gives more visual room to education, projects, volunteering and skills.",
    },
    category: "minimal", atsFriendly: true, supportsRTL: true, active: true, order: 12,
    design: { ...baseDesign, accent: "#365314", spacing: "normal", sectionStyle: "plain", layout: "single", header: "centered", bullet: "disc" },
  },
];
