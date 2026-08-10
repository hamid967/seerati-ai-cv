/**
 * Connector registry for the Universal Import Center.
 *
 * TRUST RULE: a connector may only claim `direct` when a real, testable
 * official API/OAuth integration exists in this environment. None currently
 * does, so every platform here is honestly labelled `export_file` / `paste`.
 * We never scrape protected pages and never ask for platform passwords.
 */

export type ConnectorMode = "direct" | "export_file" | "paste";

export type SourceType =
  | "manual"
  | "device_pdf"
  | "device_docx"
  | "device_txt"
  | "linkedin_export"
  | "indeed_export"
  | "bayt_export"
  | "naukrigulf_export"
  | "enhancv_export"
  | "resumeio_export"
  | "zety_export"
  | "canva_export"
  | "paste"
  | "other";

export type Connector = {
  id: string;
  name: { ar: string; en: string };
  /** Supported ways to bring the data in — ordered by preference. */
  modes: ConnectorMode[];
  sourceType: SourceType;
  /** 2–3 honest steps describing how to obtain the platform's own export. */
  steps: { ar: string[]; en: string[] };
  accept: string[];
  note?: { ar: string; en: string };
};

export const MODE_BADGE: Record<ConnectorMode, { ar: string; en: string }> = {
  direct: { ar: "اتصال مباشر", en: "Direct connector" },
  export_file: { ar: "ملف تصدير", en: "Export file" },
  paste: { ar: "لصق نص", en: "Paste text" },
};

const FILE_ACCEPT = [".pdf", ".docx", ".txt", ".md"];

export const CONNECTORS: Connector[] = [
  {
    id: "linkedin",
    name: { ar: "LinkedIn", en: "LinkedIn" },
    modes: ["export_file", "paste"],
    sourceType: "linkedin_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: [
        "من ملفك الشخصي في LinkedIn اختر «More / المزيد».",
        "اختر Save to PDF لتنزيل ملف ملفك الشخصي.",
        "ارفع الملف هنا، أو انسخ نص الملف والصقه.",
      ],
      en: [
        "Open your LinkedIn profile and choose “More”.",
        "Choose “Save to PDF” to download your profile file.",
        "Upload that file here, or copy the profile text and paste it.",
      ],
    },
    note: {
      ar: "لا نطلب كلمة مرور LinkedIn ولا نسحب البيانات من الرابط — الاستيراد يعتمد على ملفك أو نصك فقط.",
      en: "We never ask for your LinkedIn password and never pull data from a URL — import uses your own file or text only.",
    },
  },
  {
    id: "indeed",
    name: { ar: "Indeed", en: "Indeed" },
    modes: ["export_file", "paste"],
    sourceType: "indeed_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: [
        "افتح سيرتك الذاتية في Indeed.",
        "اختر تنزيل السيرة (PDF).",
        "ارفع الملف هنا أو الصق نصه.",
      ],
      en: [
        "Open your resume on Indeed.",
        "Download the resume as PDF.",
        "Upload it here or paste its text.",
      ],
    },
  },
  {
    id: "bayt",
    name: { ar: "بيت.كوم", en: "Bayt.com" },
    modes: ["export_file", "paste"],
    sourceType: "bayt_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: [
        "افتح ملفك في بيت.كوم.",
        "نزّل نسخة السيرة الذاتية (PDF/Word).",
        "ارفع الملف هنا أو الصق نصه.",
      ],
      en: [
        "Open your Bayt.com profile.",
        "Download your CV copy (PDF/Word).",
        "Upload it here or paste its text.",
      ],
    },
  },
  {
    id: "naukrigulf",
    name: { ar: "Naukrigulf", en: "Naukrigulf" },
    modes: ["export_file", "paste"],
    sourceType: "naukrigulf_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: [
        "افتح حسابك في Naukrigulf.",
        "نزّل السيرة المرفوعة في ملفك.",
        "ارفع الملف هنا أو الصق نصه.",
      ],
      en: [
        "Open your Naukrigulf account.",
        "Download the resume attached to your profile.",
        "Upload it here or paste its text.",
      ],
    },
  },
  {
    id: "enhancv",
    name: { ar: "Enhancv", en: "Enhancv" },
    modes: ["export_file", "paste"],
    sourceType: "enhancv_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: ["افتح السيرة في Enhancv.", "اختر Download → PDF.", "ارفع الملف هنا أو الصق نصه."],
      en: [
        "Open your resume in Enhancv.",
        "Choose Download → PDF.",
        "Upload it here or paste its text.",
      ],
    },
  },
  {
    id: "resumeio",
    name: { ar: "Resume.io", en: "Resume.io" },
    modes: ["export_file", "paste"],
    sourceType: "resumeio_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: [
        "افتح السيرة في Resume.io.",
        "اختر Download وحدد PDF/DOCX.",
        "ارفع الملف هنا أو الصق نصه.",
      ],
      en: [
        "Open your resume in Resume.io.",
        "Choose Download and pick PDF/DOCX.",
        "Upload it here or paste its text.",
      ],
    },
  },
  {
    id: "zety",
    name: { ar: "Zety", en: "Zety" },
    modes: ["export_file", "paste"],
    sourceType: "zety_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: ["افتح السيرة في Zety.", "اختر Download كـ PDF.", "ارفع الملف هنا أو الصق نصه."],
      en: ["Open your resume in Zety.", "Download it as PDF.", "Upload it here or paste its text."],
    },
  },
  {
    id: "canva",
    name: { ar: "Canva Resume", en: "Canva Resume" },
    modes: ["export_file", "paste"],
    sourceType: "canva_export",
    accept: FILE_ACCEPT,
    steps: {
      ar: [
        "افتح تصميم السيرة في Canva.",
        "اختر Share → Download → PDF Standard (نص قابل للتحديد).",
        "ارفع الملف هنا أو الصق نصه.",
      ],
      en: [
        "Open your resume design in Canva.",
        "Choose Share → Download → PDF Standard (selectable text).",
        "Upload it here or paste its text.",
      ],
    },
    note: {
      ar: "تصاميم Canva المصدّرة كصورة لا يمكن استخراج نصها — اختر تصدير PDF نصي أو الصق النص.",
      en: "Canva exports rendered as images have no extractable text — export a text PDF or paste the text.",
    },
  },
  {
    id: "other",
    name: { ar: "منصة أخرى", en: "Other platform" },
    modes: ["export_file", "paste"],
    sourceType: "other",
    accept: FILE_ACCEPT,
    steps: {
      ar: [
        "صدّر سيرتك من المنصة بصيغة PDF أو DOCX أو نص.",
        "ارفع الملف هنا.",
        "أو الصق النص مباشرة.",
      ],
      en: [
        "Export your resume from the platform as PDF, DOCX or text.",
        "Upload the file here.",
        "Or paste the text directly.",
      ],
    },
  },
];

export const connectorById = (id: string) => CONNECTORS.find((c) => c.id === id);

export const SOURCE_LABEL: Record<SourceType, { ar: string; en: string }> = {
  manual: { ar: "إدخال يدوي", en: "Manual entry" },
  device_pdf: { ar: "ملف PDF من الجهاز", en: "Device PDF" },
  device_docx: { ar: "ملف DOCX من الجهاز", en: "Device DOCX" },
  device_txt: { ar: "ملف نصي من الجهاز", en: "Device text file" },
  linkedin_export: { ar: "تصدير LinkedIn", en: "LinkedIn export" },
  indeed_export: { ar: "تصدير Indeed", en: "Indeed export" },
  bayt_export: { ar: "تصدير بيت.كوم", en: "Bayt export" },
  naukrigulf_export: { ar: "تصدير Naukrigulf", en: "Naukrigulf export" },
  enhancv_export: { ar: "تصدير Enhancv", en: "Enhancv export" },
  resumeio_export: { ar: "تصدير Resume.io", en: "Resume.io export" },
  zety_export: { ar: "تصدير Zety", en: "Zety export" },
  canva_export: { ar: "تصدير Canva", en: "Canva export" },
  paste: { ar: "نص ملصق", en: "Pasted text" },
  other: { ar: "مصدر آخر", en: "Other source" },
};

/** Provenance recorded on the Career Twin — labels only, never the raw file. */
export type ImportProvenance = {
  id: string;
  sourceType: SourceType;
  sourceLabel: string;
  importedAt: string;
  userVerified: boolean;
  sections: string[];
};
