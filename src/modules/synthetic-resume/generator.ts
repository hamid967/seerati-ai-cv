import { emptyResumeData, type ResumeData, type SectionKey } from "@/lib/types";
import { defaultTemplates } from "@/lib/templates";
import { specialtyById } from "./taxonomy";
import type {
  SampleField,
  SyntheticCareerProfile,
  SyntheticGeneratorInput,
  SyntheticReadiness,
  SyntheticResumeMetadata,
  SyntheticSpecialtyId,
  SyntheticTemplateOption,
} from "./types";

type Localized = { ar: string; en: string };

type RoleDefinition = {
  title: Localized;
  degree: Localized;
  summary: Localized;
  responsibilities: Localized[];
  skills: Localized[];
  project: Localized;
  certificate: Localized;
};

/**
 * Reviewed, fictional role copy. This library intentionally contains no real
 * employers, universities, clients, credentials, people, or performance data.
 */
export const SyntheticCareerTemplateLibrary: Record<SyntheticSpecialtyId, RoleDefinition> = {
  "software-development": {
    title: { ar: "مطور برمجيات", en: "Software Developer" },
    degree: { ar: "بكالوريوس في علوم الحاسب", en: "Bachelor's degree in Computer Science" },
    summary: {
      ar: "نموذج تجريبي لمطور برمجيات يركز على بناء حلول قابلة للصيانة والتعاون مع فرق المنتج والجودة.",
      en: "Sample profile for a software developer focused on maintainable solutions and collaboration with product and quality teams.",
    },
    responsibilities: [
      {
        ar: "طوّرت مكونات تطبيق قابلة لإعادة الاستخدام ضمن فريق تجريبي.",
        en: "Built reusable application components within a fictional team.",
      },
      {
        ar: "راجعت المتطلبات وكتبت ملاحظات واضحة للاختبار والتحسين.",
        en: "Reviewed requirements and wrote clear notes for testing and iteration.",
      },
      {
        ar: "تعاونت مع التصميم والجودة لتحسين رحلة المستخدم.",
        en: "Collaborated with design and quality to improve the user journey.",
      },
    ],
    skills: [
      { ar: "برمجة", en: "Programming" },
      { ar: "تصميم واجهات برمجية", en: "API design" },
      { ar: "اختبار البرمجيات", en: "Software testing" },
      { ar: "Git", en: "Git" },
    ],
    project: {
      ar: "مشروع تجريبي: لوحة متابعة طلبات داخلية",
      en: "Sample project: internal request-tracking dashboard",
    },
    certificate: {
      ar: "شهادة تدريب تجريبية في تطوير البرمجيات",
      en: "Sample software-development training certificate",
    },
  },
  accounting: {
    title: { ar: "محاسب", en: "Accountant" },
    degree: { ar: "بكالوريوس في المحاسبة", en: "Bachelor's degree in Accounting" },
    summary: {
      ar: "نموذج تجريبي لمحاسب يركز على تنظيم السجلات ومراجعة المستندات ودعم التقارير الدورية.",
      en: "Sample profile for an accountant focused on organised records, document review, and periodic reporting support.",
    },
    responsibilities: [
      {
        ar: "راجعت قيوداً تجريبية ونظمت المستندات المساندة.",
        en: "Reviewed sample entries and organised supporting documents.",
      },
      {
        ar: "أعددت مسودات تقارير دورية للمراجعة الداخلية.",
        en: "Prepared draft periodic reports for internal review.",
      },
      {
        ar: "نسقت مع أصحاب العلاقة لتوضيح بيانات الفواتير التجريبية.",
        en: "Coordinated with stakeholders to clarify sample invoice data.",
      },
    ],
    skills: [
      { ar: "إعداد التقارير", en: "Reporting" },
      { ar: "Excel", en: "Excel" },
      { ar: "المطابقات", en: "Reconciliations" },
      { ar: "الانتباه للتفاصيل", en: "Attention to detail" },
    ],
    project: {
      ar: "مشروع تجريبي: ملف متابعة للمصروفات",
      en: "Sample project: expense-tracking workbook",
    },
    certificate: {
      ar: "شهادة تدريب تجريبية في أساسيات المحاسبة",
      en: "Sample accounting fundamentals training certificate",
    },
  },
  "civil-engineering": {
    title: { ar: "مهندس مدني", en: "Civil Engineer" },
    degree: { ar: "بكالوريوس في الهندسة المدنية", en: "Bachelor's degree in Civil Engineering" },
    summary: {
      ar: "نموذج تجريبي لمهندس مدني يركز على التنسيق الموقعي ومراجعة المخططات ودعم جودة التنفيذ.",
      en: "Sample profile for a civil engineer focused on site coordination, drawing review, and execution-quality support.",
    },
    responsibilities: [
      {
        ar: "راجعت مخططات تجريبية وسجلت ملاحظات التنسيق.",
        en: "Reviewed sample drawings and recorded coordination notes.",
      },
      {
        ar: "دعمت متابعة أنشطة موقع افتراضي وفق إجراءات السلامة.",
        en: "Supported fictional site activity follow-up using safety procedures.",
      },
      {
        ar: "نسقت تحديثات العمل بين الفرق الفنية والموردين التجريبيين.",
        en: "Coordinated work updates across technical teams and fictional suppliers.",
      },
    ],
    skills: [
      { ar: "قراءة المخططات", en: "Drawing review" },
      { ar: "تنسيق الموقع", en: "Site coordination" },
      { ar: "إدارة الجودة", en: "Quality management" },
      { ar: "السلامة", en: "Safety" },
    ],
    project: {
      ar: "مشروع تجريبي: متابعة حزمة أعمال مدنية",
      en: "Sample project: civil works package follow-up",
    },
    certificate: {
      ar: "شهادة تدريب تجريبية في سلامة مواقع العمل",
      en: "Sample site-safety training certificate",
    },
  },
  "human-resources": {
    title: { ar: "أخصائي موارد بشرية", en: "Human Resources Specialist" },
    degree: {
      ar: "بكالوريوس في إدارة الأعمال",
      en: "Bachelor's degree in Business Administration",
    },
    summary: {
      ar: "نموذج تجريبي لأخصائي موارد بشرية يركز على تنظيم عمليات الموظفين ودعم التوظيف والتواصل الداخلي.",
      en: "Sample profile for an HR specialist focused on employee-process organisation, recruitment support, and internal communication.",
    },
    responsibilities: [
      {
        ar: "نظمت ملفات موظفين تجريبية وفق قائمة تحقق واضحة.",
        en: "Organised fictional employee files using a clear checklist.",
      },
      {
        ar: "دعمت تنسيق مقابلات تدريبية ورسائل تواصل داخلية.",
        en: "Supported practice interview coordination and internal communications.",
      },
      {
        ar: "أعددت مسودة مواد تعريفية لعملية انضمام تجريبية.",
        en: "Prepared draft onboarding materials for a fictional process.",
      },
    ],
    skills: [
      { ar: "التوظيف", en: "Recruitment" },
      { ar: "علاقات الموظفين", en: "Employee relations" },
      { ar: "تنسيق العمليات", en: "Operations coordination" },
      { ar: "التواصل", en: "Communication" },
    ],
    project: {
      ar: "مشروع تجريبي: قائمة متابعة للانضمام الوظيفي",
      en: "Sample project: employee onboarding checklist",
    },
    certificate: {
      ar: "شهادة تدريب تجريبية في أساسيات الموارد البشرية",
      en: "Sample HR fundamentals training certificate",
    },
  },
  nursing: {
    title: { ar: "ممرض/ممرضة", en: "Registered Nurse" },
    degree: { ar: "بكالوريوس في التمريض", en: "Bachelor's degree in Nursing" },
    summary: {
      ar: "نموذج تجريبي للتمريض يركز على الرعاية الآمنة والتواصل المهني والالتزام بإجراءات القسم.",
      en: "Sample profile for nursing focused on safe care, professional communication, and adherence to unit procedures.",
    },
    responsibilities: [
      {
        ar: "دعمت سيناريوهات رعاية تجريبية تحت إشراف تدريبي.",
        en: "Supported fictional care scenarios under training supervision.",
      },
      {
        ar: "وثقت ملاحظات تدريبية وفق نموذج محاكاة واضح.",
        en: "Documented training notes using a clear simulation template.",
      },
      {
        ar: "تعاونت مع فريق محاكاة لتنسيق انتقالات الرعاية.",
        en: "Collaborated with a simulation team to coordinate care handovers.",
      },
    ],
    skills: [
      { ar: "رعاية المرضى", en: "Patient care" },
      { ar: "التوثيق", en: "Documentation" },
      { ar: "مكافحة العدوى", en: "Infection control" },
      { ar: "التواصل السريري", en: "Clinical communication" },
    ],
    project: {
      ar: "مشروع تجريبي: دليل تسليم المناوبة",
      en: "Sample project: shift handover guide",
    },
    certificate: {
      ar: "شهادة تدريب تجريبية في السلامة السريرية",
      en: "Sample clinical-safety training certificate",
    },
  },
  sales: {
    title: { ar: "أخصائي مبيعات", en: "Sales Specialist" },
    degree: {
      ar: "بكالوريوس في إدارة الأعمال",
      en: "Bachelor's degree in Business Administration",
    },
    summary: {
      ar: "نموذج تجريبي لأخصائي مبيعات يركز على فهم احتياجات العملاء وتنظيم الفرص والتواصل التجاري الواضح.",
      en: "Sample profile for a sales specialist focused on understanding customer needs, organising opportunities, and clear commercial communication.",
    },
    responsibilities: [
      {
        ar: "نظمت فرصاً تجريبية في قائمة متابعة للمبيعات.",
        en: "Organised fictional opportunities in a sales follow-up list.",
      },
      {
        ar: "أعددت رسائل تواصل تجريبية وفق احتياجات عميل افتراضي.",
        en: "Prepared practice outreach messages for fictional customer needs.",
      },
      {
        ar: "راجعت مراحل البيع مع فريق تدريبي وحددت الخطوة التالية.",
        en: "Reviewed sales stages with a training team and identified next steps.",
      },
    ],
    skills: [
      { ar: "إدارة الحسابات", en: "Account management" },
      { ar: "التواصل التجاري", en: "Commercial communication" },
      { ar: "إدارة الفرص", en: "Opportunity management" },
      { ar: "العروض", en: "Presentations" },
    ],
    project: {
      ar: "مشروع تجريبي: مسار فرص لمنتج افتراضي",
      en: "Sample project: opportunity pipeline for a fictional product",
    },
    certificate: {
      ar: "شهادة تدريب تجريبية في أساسيات المبيعات",
      en: "Sample sales fundamentals training certificate",
    },
  },
};

const sampleField = (value: string): SampleField => ({
  value,
  status: "sample",
  source: "synthetic-template",
  requiresUserReview: true,
  exportApproved: false,
});

function sectionOrder(level: SyntheticGeneratorInput["experienceLevel"]): SectionKey[] {
  if (level === "student" || level === "graduate") {
    return [
      "summary",
      "education",
      "projects",
      "skills",
      "experience",
      "languages",
      "certificates",
      "achievements",
      "volunteering",
      "links",
      "references",
      "custom",
    ];
  }
  return [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certificates",
    "languages",
    "achievements",
    "volunteering",
    "links",
    "references",
    "custom",
  ];
}

function experienceCount(level: SyntheticGeneratorInput["experienceLevel"]) {
  if (level === "student") return 0;
  if (level === "graduate" || level === "junior" || level === "career-change") return 1;
  return 2;
}

function templateOptions(input: SyntheticGeneratorInput): SyntheticTemplateOption[] {
  const specialty = specialtyById(input.specialtyId)!;
  const ids = ["classic-ats", "modern", "saudi-professional", "minimal"];
  if (["manager", "executive", "advanced"].includes(input.experienceLevel)) ids[1] = "executive";
  if (specialty.supportsCreativeTemplate) ids[3] = "creative";
  return ids
    .map((id) => defaultTemplates.find((template) => template.id === id))
    .filter((template): template is NonNullable<typeof template> => Boolean(template))
    .map((template) => ({
      template,
      expectedPages: ["manager", "executive", "advanced"].includes(input.experienceLevel) ? 2 : 1,
      atsFit: template.atsFriendly ? "high" : "review",
      reason: template.atsFriendly
        ? {
            ar: "يناسب البداية المنظمة ووضوح الأقسام.",
            en: "Supports a structured start with clear sections.",
          }
        : {
            ar: "يقدم هوية بصرية بعد مراجعة المعاينة وPDF.",
            en: "Adds visual identity after reviewing preview and PDF.",
          },
      strengths: {
        ar: template.atsFriendly
          ? ["تنظيم محافظ", "سهل المراجعة"]
          : ["هوية بصرية", "عرض مرن للمهارات"],
        en: template.atsFriendly
          ? ["Conservative structure", "Easy to review"]
          : ["Visual identity", "Flexible skills display"],
      },
      limitations: {
        ar: template.atsFriendly
          ? ["يحتاج محتوى حقيقياً قبل الإرسال"]
          : ["راجع التوافق وPDF قبل الإرسال"],
        en: template.atsFriendly
          ? ["Needs verified content before sending"]
          : ["Review compatibility and PDF before sending"],
      },
    }));
}

function baseFieldMap(data: ResumeData) {
  const map: Record<string, SampleField> = {};
  const add = (path: string, value?: string) => {
    if (value) map[path] = sampleField(value);
  };
  add("personal.fullName", data.personal.fullName);
  add("personal.jobTitle", data.personal.jobTitle);
  add("personal.email", data.personal.email);
  add("personal.phone", data.personal.phone);
  add("personal.city", data.personal.city);
  add("personal.country", data.personal.country);
  add("summary", data.summary);
  data.experience.forEach((item, index) => {
    add(`experience.${index}.role`, item.role);
    add(`experience.${index}.company`, item.company);
    item.bullets.forEach((bullet, bulletIndex) =>
      add(`experience.${index}.bullets.${bulletIndex}`, bullet),
    );
  });
  data.education.forEach((item, index) => {
    add(`education.${index}.degree`, item.degree);
    add(`education.${index}.school`, item.school);
  });
  data.skills.forEach((item, index) => add(`skills.${index}.name`, item.name));
  data.projects.forEach((item, index) => add(`projects.${index}.title`, item.title));
  data.certificates.forEach((item, index) => add(`certificates.${index}.title`, item.title));
  data.links.forEach((item, index) => add(`links.${index}.url`, item.url));
  return map;
}

export function createSyntheticCareerProfile(
  input: SyntheticGeneratorInput,
): SyntheticCareerProfile {
  const role = SyntheticCareerTemplateLibrary[input.specialtyId];
  const specialty = specialtyById(input.specialtyId);
  if (!role || !specialty) throw new Error("Unsupported synthetic specialty");

  const lang = input.language;
  const text = (value: Localized) => value[lang];
  const data = emptyResumeData();
  const count = experienceCount(input.experienceLevel);
  const roleTitle = text(role.title);
  const company = lang === "ar" ? "اسم الشركة السابقة" : "Previous Company Name";
  const school = lang === "ar" ? "اسم الجامعة" : "University Name";
  const fullName = lang === "ar" ? "اسمك الكامل" : "Your Full Name";
  const city = lang === "ar" ? "مدينتك" : "Your City";
  const country = lang === "ar" ? "بلدك" : "Your Country";
  const experience = Array.from({ length: count }, (_, index) => ({
    id: `sample-exp-${index + 1}`,
    role:
      index === 0 ? roleTitle : `${roleTitle} ${lang === "ar" ? "— دور سابق" : "— Previous Role"}`,
    company,
    start: lang === "ar" ? "سنة البداية" : "Start year",
    end: lang === "ar" ? "سنة النهاية" : "End year",
    bullets: role.responsibilities.slice(0, index === 0 ? 3 : 2).map(text),
  }));

  const resumeData: ResumeData = {
    ...data,
    personal: {
      fullName,
      jobTitle: roleTitle,
      email: "example@email.com",
      phone: "05XXXXXXXX",
      city,
      country,
    },
    summary: text(role.summary),
    targetJob: roleTitle,
    experience,
    education: [
      {
        id: "sample-education-1",
        degree: text(role.degree),
        school,
        start: lang === "ar" ? "سنة البداية" : "Start year",
        end: lang === "ar" ? "سنة التخرج" : "Graduation year",
        note: lang === "ar" ? "معلومة تجريبية تحتاج مراجعة" : "Sample information requiring review",
      },
    ],
    skills: role.skills.map((skill, index) => ({
      id: `sample-skill-${index + 1}`,
      name: text(skill),
    })),
    languages: [
      {
        id: "sample-language-1",
        name: lang === "ar" ? "العربية" : "Arabic",
        level: lang === "ar" ? "مستوى تحدده" : "Level to confirm",
      },
      {
        id: "sample-language-2",
        name: lang === "ar" ? "الإنجليزية" : "English",
        level: lang === "ar" ? "مستوى تحدده" : "Level to confirm",
      },
    ],
    certificates: [{ id: "sample-certificate-1", title: text(role.certificate) }],
    projects: [{ id: "sample-project-1", title: text(role.project) }],
    links: [{ id: "sample-linkedin", label: "LinkedIn", url: "linkedin.com/in/your-name" }],
    sectionOrder: sectionOrder(input.experienceLevel),
  };

  const fieldMap = baseFieldMap(resumeData);
  const coreFieldPaths = [
    "personal.fullName",
    "personal.jobTitle",
    "personal.email",
    "personal.phone",
    "summary",
    ...(count > 0
      ? ["experience.0.role", "experience.0.company"]
      : ["education.0.degree", "education.0.school"]),
  ];
  const metadata: SyntheticResumeMetadata = {
    version: "synthetic-v1",
    specialtyId: input.specialtyId,
    experienceLevel: input.experienceLevel,
    goal: input.goal,
    language: lang,
    selectedTemplateId: templateOptions(input)[0]?.template.id ?? "classic-ats",
    fieldMap,
    coreFieldPaths,
    generatedAt: new Date().toISOString(),
  };

  return { resumeData, metadata, templates: templateOptions(input) };
}

export function updateSyntheticFieldMetadata(
  metadata: SyntheticResumeMetadata,
  fieldPath: string,
  value: string,
): SyntheticResumeMetadata {
  const previous = metadata.fieldMap[fieldPath];
  if (!previous) return metadata;
  return {
    ...metadata,
    fieldMap: {
      ...metadata.fieldMap,
      [fieldPath]: {
        value,
        status: "user-confirmed",
        source: "user",
        requiresUserReview: false,
        exportApproved: true,
      },
    },
  };
}

export function hasUnapprovedSampleData(metadata: SyntheticResumeMetadata) {
  return Object.values(metadata.fieldMap).some((field) => !field.exportApproved);
}

export function syntheticReadiness(metadata: SyntheticResumeMetadata): SyntheticReadiness {
  const fields = Object.values(metadata.fieldMap);
  const sampleFieldsRemaining = fields.filter((field) => field.status === "sample").length;
  const confirmedFields = fields.length - sampleFieldsRemaining;
  const incompleteCoreSections: SectionKey[] = metadata.coreFieldPaths.some(
    (path) => metadata.fieldMap[path]?.status !== "user-confirmed",
  )
    ? ["summary", "experience", "education"]
    : [];
  const state =
    sampleFieldsRemaining === fields.length
      ? "fully-sample"
      : sampleFieldsRemaining === 0 && incompleteCoreSections.length === 0
        ? "ready-for-export"
        : incompleteCoreSections.length === 0
          ? "ready-for-check"
          : "needs-review";
  return {
    state,
    sampleFieldsRemaining,
    confirmedFields,
    incompleteCoreSections,
    nextSteps: {
      ar:
        state === "ready-for-export"
          ? ["راجع PDF النهائي قبل الإرسال."]
          : [
              "استبدل الاسم وبيانات التواصل.",
              "راجع الملخص والخبرة أو التعليم.",
              "أكد المهارات التي تملك دليلاً عليها.",
            ],
      en:
        state === "ready-for-export"
          ? ["Review the final PDF before sending."]
          : [
              "Replace your name and contact details.",
              "Review the summary and experience or education.",
              "Confirm only skills you can evidence.",
            ],
    },
  };
}
