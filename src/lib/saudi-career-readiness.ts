import { SAUDI_CITIES } from "@/lib/saudi-career-taxonomy";
import type { Resume, TemplateDef } from "@/lib/types";

export type ReadinessSeverity = "good" | "improve" | "warning";
export type ReadinessDimensionId =
  | "identity"
  | "contact"
  | "localization"
  | "content"
  | "evidence"
  | "ats";

export type BiText = { ar: string; en: string };

export type SaudiReadinessCheck = {
  id: string;
  dimension: ReadinessDimensionId;
  severity: ReadinessSeverity;
  points: number;
  maxPoints: number;
  title: BiText;
  detail: BiText;
  action?: BiText;
};

export type SaudiCareerReadiness = {
  score: number;
  band: "strong" | "ready-with-improvements" | "needs-work";
  checks: SaudiReadinessCheck[];
  sensitiveSignals: string[];
  strengths: SaudiReadinessCheck[];
  priorities: SaudiReadinessCheck[];
  disclaimer: BiText;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAUDI_PHONE_RE = /^(?:\+?9665\d{8}|05\d{8})$/;
const ARABIC_RE = /[\u0600-\u06ff]/;
const LATIN_RE = /[A-Za-z]/;
const QUANTIFIED_RE = /(?:\d+[\d,.]*\s*%?|\b\d+[xX]\b|\bSAR\s*\d|\bر\.س\s*\d)/;
const NATIONAL_ID_RE = /\b[12]\d{9}\b/;
const SENSITIVE_LABEL_RE =
  /(رقم\s*(?:الهوية|الإقامة|السجل المدني)|national\s+id|iqama|identity\s+number|تاريخ\s+الميلاد|date\s+of\s+birth|الحالة\s+الاجتماعية|marital\s+status)/i;

const cleanPhone = (value: string) => value.replace(/[\s()-]/g, "");

function resumeText(resume: Resume) {
  const data = resume.data;
  return [
    data.summary,
    data.targetJob ?? "",
    data.jobDescription ?? "",
    ...data.experience.flatMap((item) => [item.role, item.company, item.location ?? "", ...item.bullets]),
    ...data.education.flatMap((item) => [item.degree, item.school, item.note ?? ""]),
    ...data.skills.map((item) => item.name),
    ...data.languages.flatMap((item) => [item.name, item.level]),
    ...data.certificates.flatMap((item) => [item.title, item.detail ?? ""]),
    ...data.projects.flatMap((item) => [item.title, item.detail ?? ""]),
    ...data.achievements.flatMap((item) => [item.title, item.detail ?? ""]),
    ...data.volunteering.flatMap((item) => [item.title, item.detail ?? ""]),
    ...data.references.flatMap((item) => [item.title, item.detail ?? ""]),
    ...data.custom.flatMap((section) => [
      section.title,
      ...section.items.flatMap((item) => [item.title, item.detail ?? ""]),
    ]),
  ]
    .filter(Boolean)
    .join(" \n ");
}

function detectSensitiveSignals(resume: Resume) {
  const text = resumeText(resume);
  const signals: string[] = [];
  if (NATIONAL_ID_RE.test(text)) signals.push("national-id-like-number");
  if (SENSITIVE_LABEL_RE.test(text)) signals.push("sensitive-personal-label");
  return signals;
}

function isSaudiCity(value: string) {
  const normalized = value.trim().toLocaleLowerCase();
  if (!normalized) return false;
  return SAUDI_CITIES.some((city) =>
    [city.label.ar, city.label.en].some((name) => name.toLocaleLowerCase() === normalized),
  );
}

function check(args: SaudiReadinessCheck): SaudiReadinessCheck {
  return args;
}

export function buildSaudiCareerReadiness(
  resume: Resume,
  options: { template: TemplateDef; measuredPages?: number },
): SaudiCareerReadiness {
  const data = resume.data;
  const text = resumeText(resume);
  const sensitiveSignals = detectSensitiveSignals(resume);
  const quantifiedBullets = data.experience.flatMap((item) => item.bullets).filter((bullet) =>
    QUANTIFIED_RE.test(bullet),
  ).length;
  const totalBullets = data.experience.reduce((sum, item) => sum + item.bullets.length, 0);
  const pages = options.measuredPages;
  const hasArabic = ARABIC_RE.test(text);
  const hasEnglish = LATIN_RE.test(text);
  const cityKnown = isSaudiCity(data.personal.city);
  const hasTarget = Boolean((data.targetJob || data.personal.jobTitle).trim());
  const hasLinkedIn = data.links.some(
    (link) => /linkedin/i.test(link.label) || /linkedin\.com/i.test(link.url),
  );

  const checks: SaudiReadinessCheck[] = [
    check({
      id: "professional-identity",
      dimension: "identity",
      severity: data.personal.fullName.trim() && hasTarget ? "good" : "warning",
      points: data.personal.fullName.trim() && hasTarget ? 12 : 4,
      maxPoints: 12,
      title: { ar: "الهوية المهنية", en: "Professional identity" },
      detail: data.personal.fullName.trim() && hasTarget
        ? {
            ar: "الاسم والمسمى/الهدف المهني واضحان في السيرة.",
            en: "Name and professional title/target are clear.",
          }
        : {
            ar: "يحتاج رأس السيرة إلى اسم واضح ومسمى أو هدف مهني محدد.",
            en: "The resume header needs a clear name and a specific title or target role.",
          },
      action: {
        ar: "استخدم مسمى مهنيًا محددًا بدل وصف عام مثل «باحث عن عمل».",
        en: "Use a specific professional title instead of a generic job-seeker label.",
      },
    }),
    check({
      id: "summary",
      dimension: "identity",
      severity: data.summary.trim().length >= 90 ? "good" : "improve",
      points: data.summary.trim().length >= 90 ? 8 : data.summary.trim() ? 5 : 0,
      maxPoints: 8,
      title: { ar: "الملخص المهني", en: "Professional summary" },
      detail: data.summary.trim().length >= 90
        ? { ar: "الملخص يعطي سياقًا مهنيًا كافيًا للمراجعة السريعة.", en: "The summary provides useful context for a quick review." }
        : { ar: "الملخص قصير أو غير موجود؛ اجعله مركزًا على القيمة والخبرة المستهدفة.", en: "The summary is short or missing; focus it on value and target experience." },
    }),
    check({
      id: "email",
      dimension: "contact",
      severity: EMAIL_RE.test(data.personal.email.trim()) ? "good" : "warning",
      points: EMAIL_RE.test(data.personal.email.trim()) ? 5 : 0,
      maxPoints: 5,
      title: { ar: "البريد الإلكتروني", en: "Email" },
      detail: EMAIL_RE.test(data.personal.email.trim())
        ? { ar: "صيغة البريد الإلكتروني سليمة.", en: "Email format looks valid." }
        : { ar: "أضف بريدًا إلكترونيًا مهنيًا صالحًا.", en: "Add a valid professional email address." },
    }),
    check({
      id: "phone",
      dimension: "contact",
      severity: SAUDI_PHONE_RE.test(cleanPhone(data.personal.phone)) ? "good" : "improve",
      points: SAUDI_PHONE_RE.test(cleanPhone(data.personal.phone)) ? 6 : data.personal.phone.trim() ? 3 : 0,
      maxPoints: 6,
      title: { ar: "رقم التواصل", en: "Contact number" },
      detail: SAUDI_PHONE_RE.test(cleanPhone(data.personal.phone))
        ? { ar: "رقم الجوال مكتوب بصيغة سعودية واضحة.", en: "The mobile number uses a clear Saudi format." }
        : { ar: "راجع صيغة الجوال؛ يفضّل 05XXXXXXXX أو +9665XXXXXXXX عند الاستهداف داخل المملكة.", en: "Review the mobile format; 05XXXXXXXX or +9665XXXXXXXX is clearer for Saudi applications." },
    }),
    check({
      id: "location",
      dimension: "contact",
      severity: data.personal.city.trim() && data.personal.country.trim() ? "good" : "improve",
      points: data.personal.city.trim() && data.personal.country.trim() ? 4 : 1,
      maxPoints: 4,
      title: { ar: "الموقع", en: "Location" },
      detail: cityKnown
        ? { ar: "المدينة معروفة ضمن قاموس المدن السعودي في سيرتي.", en: "The city matches Seerati's Saudi city taxonomy." }
        : data.personal.city.trim()
          ? { ar: "الموقع موجود. تأكد من كتابة المدينة والدولة بوضوح.", en: "Location is present. Keep city and country explicit." }
          : { ar: "أضف المدينة والدولة لتوضيح موقعك المهني.", en: "Add city and country to clarify your professional location." },
    }),
    check({
      id: "professional-link",
      dimension: "contact",
      severity: hasLinkedIn ? "good" : "improve",
      points: hasLinkedIn ? 3 : 1,
      maxPoints: 3,
      title: { ar: "الرابط المهني", en: "Professional link" },
      detail: hasLinkedIn
        ? { ar: "يوجد رابط LinkedIn ضمن بيانات التواصل.", en: "A LinkedIn link is included." }
        : { ar: "يمكن إضافة LinkedIn إذا كان محدثًا ويخدم طلب التوظيف.", en: "Consider adding LinkedIn when the profile is current and relevant." },
    }),
    check({
      id: "language-fit",
      dimension: "localization",
      severity: resume.language === "ar" ? (hasArabic ? "good" : "warning") : hasEnglish ? "good" : "warning",
      points: resume.language === "ar" ? (hasArabic ? 8 : 2) : hasEnglish ? 8 : 2,
      maxPoints: 8,
      title: { ar: "اتساق لغة السيرة", en: "Resume language consistency" },
      detail: resume.language === "ar"
        ? { ar: "يتم فحص وجود محتوى عربي متسق مع نسخة السيرة العربية.", en: "Checks that the Arabic resume actually contains Arabic content." }
        : { ar: "يتم فحص وجود محتوى إنجليزي متسق مع النسخة الإنجليزية.", en: "Checks that the English resume actually contains English content." },
    }),
    check({
      id: "bilingual-capability",
      dimension: "localization",
      severity: hasArabic && hasEnglish ? "good" : "improve",
      points: hasArabic && hasEnglish ? 7 : 4,
      maxPoints: 7,
      title: { ar: "الجاهزية ثنائية اللغة", en: "Bilingual readiness" },
      detail: hasArabic && hasEnglish
        ? { ar: "تظهر إشارات عربية وإنجليزية في الملف، ما يدعم الرحلات المهنية ثنائية اللغة.", en: "The profile contains both Arabic and English signals for bilingual workflows." }
        : { ar: "يمكن بناء نسخة مقابلة باللغة الأخرى عند الحاجة، مع مراجعة بشرية للمصطلحات المهمة.", en: "A counterpart version in the other language can be useful when required, with human review of key terms." },
    }),
    check({
      id: "experience-depth",
      dimension: "content",
      severity: data.experience.length >= 2 || data.projects.length >= 2 ? "good" : "improve",
      points: data.experience.length >= 2 || data.projects.length >= 2 ? 8 : data.experience.length || data.projects.length ? 5 : 1,
      maxPoints: 8,
      title: { ar: "عمق الخبرة", en: "Experience depth" },
      detail: { ar: `السيرة تحتوي على ${data.experience.length} خبرة و${data.projects.length} مشروع.`, en: `The resume contains ${data.experience.length} experience entries and ${data.projects.length} projects.` },
    }),
    check({
      id: "skills",
      dimension: "content",
      severity: data.skills.length >= 6 ? "good" : "improve",
      points: data.skills.length >= 6 ? 6 : Math.min(5, data.skills.length),
      maxPoints: 6,
      title: { ar: "المهارات", en: "Skills" },
      detail: { ar: `عدد المهارات المسجلة: ${data.skills.length}.`, en: `${data.skills.length} skills are currently listed.` },
    }),
    check({
      id: "education",
      dimension: "content",
      severity: data.education.length ? "good" : "improve",
      points: data.education.length ? 6 : 1,
      maxPoints: 6,
      title: { ar: "التعليم", en: "Education" },
      detail: data.education.length
        ? { ar: "يوجد سجل تعليمي واضح.", en: "Education history is present." }
        : { ar: "لا توجد بيانات تعليمية في السيرة الحالية.", en: "No education entry is present in this resume." },
    }),
    check({
      id: "quantified-impact",
      dimension: "evidence",
      severity: quantifiedBullets >= 2 ? "good" : "improve",
      points: quantifiedBullets >= 2 ? 9 : quantifiedBullets ? 6 : totalBullets ? 3 : 0,
      maxPoints: 9,
      title: { ar: "الأثر القابل للقياس", en: "Quantified impact" },
      detail: { ar: `تم رصد ${quantifiedBullets} نقطة خبرة تحتوي على رقم/مؤشر.`, en: `${quantifiedBullets} experience bullets contain a numeric signal.` },
      action: {
        ar: "لا تضف أرقامًا غير مؤكدة. استخدم فقط مؤشرات تستطيع إثباتها أو مراجعتها.",
        en: "Do not invent metrics. Use only figures you can support or verify.",
      },
    }),
    check({
      id: "achievement-evidence",
      dimension: "evidence",
      severity: data.achievements.length || data.certificates.length ? "good" : "improve",
      points: data.achievements.length || data.certificates.length ? 6 : 2,
      maxPoints: 6,
      title: { ar: "إشارات الإنجاز والتوثيق", en: "Achievement and proof signals" },
      detail: { ar: `الإنجازات: ${data.achievements.length}، الشهادات: ${data.certificates.length}.`, en: `Achievements: ${data.achievements.length}; certificates: ${data.certificates.length}.` },
    }),
    check({
      id: "ats-template",
      dimension: "ats",
      severity: options.template.atsFriendly ? "good" : "improve",
      points: options.template.atsFriendly ? 8 : 4,
      maxPoints: 8,
      title: { ar: "القالب وATS", en: "Template & ATS" },
      detail: options.template.atsFriendly
        ? { ar: "القالب مصنف داخليًا كخيار محافظ ومتوافق مع قواعد ATS في سيرتي.", en: "This template is conservatively marked ATS-friendly inside Seerati." }
        : { ar: "القالب بصري أكثر؛ استخدم قالب ATS عند التقديم لمسار يعتمد الفرز الآلي.", en: "This is a more visual template; consider an ATS-oriented template for automated screening workflows." },
    }),
    check({
      id: "page-length",
      dimension: "ats",
      severity: pages === undefined || pages <= 2 ? "good" : "improve",
      points: pages === undefined || pages <= 2 ? 4 : pages === 3 ? 2 : 0,
      maxPoints: 4,
      title: { ar: "طول المستند", en: "Document length" },
      detail: pages === undefined
        ? { ar: "يتم قياس عدد الصفحات فعليًا داخل Studio.", en: "Page count is measured directly inside Studio." }
        : { ar: `القياس الحالي: ${pages} صفحة.`, en: `Current measured length: ${pages} page${pages === 1 ? "" : "s"}.` },
    }),
    check({
      id: "privacy-minimization",
      dimension: "ats",
      severity: sensitiveSignals.length ? "warning" : "good",
      points: sensitiveSignals.length ? 0 : 3,
      maxPoints: 3,
      title: { ar: "تقليل البيانات الحساسة", en: "Sensitive-data minimization" },
      detail: sensitiveSignals.length
        ? { ar: "رُصدت إشارة قد تكون رقم هوية/إقامة أو وصفًا لبيانات شخصية حساسة داخل محتوى السيرة. راجعها قبل المشاركة.", en: "A possible national-ID/Iqama-like number or sensitive personal-data label was detected in resume content. Review it before sharing." }
        : { ar: "لم يرصد الفحص السريع أرقام هوية/إقامة أو تسميات حساسة شائعة داخل محتوى السيرة.", en: "The quick scan found no common national-ID/Iqama-like numbers or sensitive-data labels in resume content." },
      action: sensitiveSignals.length
        ? { ar: "احذف البيانات التي لا يحتاجها صاحب العمل من نسخة السيرة المرسلة.", en: "Remove personal data that is not necessary for the application." }
        : undefined,
    }),
  ];

  const max = checks.reduce((sum, item) => sum + item.maxPoints, 0);
  const earned = checks.reduce((sum, item) => sum + item.points, 0);
  const score = Math.round((earned / max) * 100);
  const band = score >= 85 ? "strong" : score >= 68 ? "ready-with-improvements" : "needs-work";

  return {
    score,
    band,
    checks,
    sensitiveSignals,
    strengths: checks.filter((item) => item.severity === "good").slice(0, 5),
    priorities: checks
      .filter((item) => item.severity !== "good")
      .sort((a, b) => b.maxPoints - b.points - (a.maxPoints - a.points))
      .slice(0, 6),
    disclaimer: {
      ar: "هذا تقييم لجودة وجاهزية المستند داخل سيرتي، وليس اعتمادًا حكوميًا أو ضمانًا للتوظيف أو توافقًا مؤكدًا مع أي جهة خارجية.",
      en: "This is a Seerati document-readiness assessment, not government certification, a hiring guarantee, or confirmed compatibility with any external organization.",
    },
  };
}
