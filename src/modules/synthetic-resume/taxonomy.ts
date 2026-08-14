import type { SyntheticSpecialty, SyntheticSpecialtyId } from "./types";

/**
 * Reviewed local specialty catalog. This module is loaded only after the visitor
 * chooses Noura's sample-resume flow, so it remains outside the assistant landing bundle.
 */
const specialty = (
  id: SyntheticSpecialtyId,
  group: SyntheticSpecialty["group"],
  name: SyntheticSpecialty["name"],
  searchTerms: string[],
  supportsCreativeTemplate = false,
): SyntheticSpecialty => ({ id, group, name, searchTerms, supportsCreativeTemplate });

export const SYNTHETIC_SPECIALTY_TAXONOMY: SyntheticSpecialty[] = [
  specialty(
    "software-development",
    { ar: "التقنية", en: "Technology" },
    { ar: "تطوير البرمجيات", en: "Software development" },
    ["software", "developer", "engineering", "برمجيات", "مطور", "تطوير"],
    true,
  ),
  specialty("accounting", { ar: "المالية", en: "Finance" }, { ar: "المحاسبة", en: "Accounting" }, [
    "accounting",
    "accountant",
    "finance",
    "محاسبة",
    "محاسب",
    "مالية",
  ]),
  specialty(
    "civil-engineering",
    { ar: "الهندسة", en: "Engineering" },
    { ar: "الهندسة المدنية", en: "Civil engineering" },
    ["civil", "engineering", "construction", "هندسة", "مدنية", "إنشاءات"],
  ),
  specialty(
    "human-resources",
    { ar: "الموارد البشرية", en: "Human resources" },
    { ar: "الموارد البشرية", en: "Human resources" },
    ["human resources", "hr", "recruitment", "موارد", "بشرية", "توظيف"],
  ),
  specialty("nursing", { ar: "الصحة", en: "Health" }, { ar: "التمريض", en: "Nursing" }, [
    "nursing",
    "nurse",
    "healthcare",
    "تمريض",
    "ممرض",
    "صحة",
  ]),
  specialty(
    "sales",
    { ar: "المبيعات والتسويق", en: "Sales & marketing" },
    { ar: "المبيعات", en: "Sales" },
    ["sales", "account management", "business development", "مبيعات", "تطوير أعمال"],
    true,
  ),
  specialty(
    "software-engineering",
    { ar: "التقنية", en: "Technology" },
    { ar: "هندسة البرمجيات", en: "Software engineering" },
    ["software engineer", "systems", "هندسة برمجيات", "مهندس برمجيات"],
    true,
  ),
  specialty(
    "data-analysis",
    { ar: "التقنية", en: "Technology" },
    { ar: "تحليل البيانات", en: "Data analysis" },
    ["data", "analytics", "bi", "بيانات", "تحليل", "ذكاء أعمال"],
  ),
  specialty(
    "cybersecurity",
    { ar: "التقنية", en: "Technology" },
    { ar: "الأمن السيبراني", en: "Cybersecurity" },
    ["cyber", "security", "infosec", "أمن سيبراني", "حماية معلومات"],
  ),
  specialty(
    "it-support",
    { ar: "التقنية", en: "Technology" },
    { ar: "دعم تقنية المعلومات", en: "IT support" },
    ["it support", "helpdesk", "technical support", "دعم تقني", "دعم تقنية المعلومات"],
  ),
  specialty(
    "network-engineering",
    { ar: "التقنية", en: "Technology" },
    { ar: "هندسة الشبكات", en: "Network engineering" },
    ["network", "network engineer", "شبكات", "مهندس شبكات"],
  ),
  specialty(
    "cloud-devops",
    { ar: "التقنية", en: "Technology" },
    { ar: "السحابة وDevOps", en: "Cloud and DevOps" },
    ["cloud", "devops", "platform", "سحابة", "ديف أوبس"],
  ),
  specialty(
    "mobile-development",
    { ar: "التقنية", en: "Technology" },
    { ar: "تطوير تطبيقات الجوال", en: "Mobile development" },
    ["mobile", "ios", "android", "تطبيقات جوال", "جوال"],
    true,
  ),
  specialty(
    "ui-ux-design",
    { ar: "التقنية", en: "Technology" },
    { ar: "تصميم تجربة وواجهة المستخدم", en: "UI/UX design" },
    ["ui", "ux", "product design", "واجهة", "تجربة المستخدم", "تصميم"],
    true,
  ),
  specialty(
    "quality-assurance",
    { ar: "التقنية", en: "Technology" },
    { ar: "ضمان الجودة", en: "Quality assurance" },
    ["quality assurance", "qa", "testing", "ضمان الجودة", "اختبار"],
  ),
  specialty(
    "project-management",
    { ar: "الإدارة والعمليات", en: "Management & operations" },
    { ar: "إدارة المشاريع", en: "Project management" },
    ["project management", "pmo", "إدارة مشاريع", "مشاريع"],
  ),
  specialty(
    "mechanical-engineering",
    { ar: "الهندسة", en: "Engineering" },
    { ar: "الهندسة الميكانيكية", en: "Mechanical engineering" },
    ["mechanical", "مهندس ميكانيكي", "هندسة ميكانيكية"],
  ),
  specialty(
    "electrical-engineering",
    { ar: "الهندسة", en: "Engineering" },
    { ar: "الهندسة الكهربائية", en: "Electrical engineering" },
    ["electrical", "مهندس كهربائي", "هندسة كهربائية"],
  ),
  specialty(
    "architecture",
    { ar: "الهندسة", en: "Engineering" },
    { ar: "العمارة والتصميم المعماري", en: "Architecture" },
    ["architecture", "architect", "عمارة", "معماري"],
    true,
  ),
  specialty(
    "supply-chain",
    { ar: "الإدارة والعمليات", en: "Management & operations" },
    { ar: "سلاسل الإمداد", en: "Supply chain" },
    ["supply chain", "logistics", "سلاسل إمداد", "لوجستيات"],
  ),
  specialty(
    "operations-management",
    { ar: "الإدارة والعمليات", en: "Management & operations" },
    { ar: "إدارة العمليات", en: "Operations management" },
    ["operations", "process", "إدارة عمليات", "تشغيل"],
  ),
  specialty(
    "procurement",
    { ar: "الإدارة والعمليات", en: "Management & operations" },
    { ar: "المشتريات", en: "Procurement" },
    ["procurement", "purchasing", "مشتريات", "شراء"],
  ),
  specialty(
    "financial-analysis",
    { ar: "المالية", en: "Finance" },
    { ar: "التحليل المالي", en: "Financial analysis" },
    ["financial analysis", "fp&a", "تحليل مالي", "محلل مالي"],
  ),
  specialty(
    "banking",
    { ar: "المالية", en: "Finance" },
    { ar: "الخدمات المصرفية", en: "Banking" },
    ["banking", "bank", "مصرف", "بنك", "خدمات مصرفية"],
  ),
  specialty(
    "internal-audit",
    { ar: "المالية", en: "Finance" },
    { ar: "المراجعة الداخلية", en: "Internal audit" },
    ["internal audit", "audit", "مراجعة داخلية", "تدقيق"],
  ),
  specialty(
    "investment-analysis",
    { ar: "المالية", en: "Finance" },
    { ar: "تحليل الاستثمار", en: "Investment analysis" },
    ["investment", "equity research", "استثمار", "تحليل استثماري"],
  ),
  specialty(
    "recruitment",
    { ar: "الموارد البشرية", en: "Human resources" },
    { ar: "التوظيف", en: "Recruitment" },
    ["recruitment", "talent acquisition", "توظيف", "استقطاب"],
  ),
  specialty(
    "payroll",
    { ar: "الموارد البشرية", en: "Human resources" },
    { ar: "الرواتب", en: "Payroll" },
    ["payroll", "compensation", "رواتب", "تعويضات"],
  ),
  specialty(
    "organizational-development",
    { ar: "الموارد البشرية", en: "Human resources" },
    { ar: "التطوير التنظيمي", en: "Organisational development" },
    ["organizational development", "learning development", "تطوير تنظيمي", "تدريب وتطوير"],
  ),
  specialty(
    "digital-marketing",
    { ar: "المبيعات والتسويق", en: "Sales & marketing" },
    { ar: "التسويق الرقمي", en: "Digital marketing" },
    ["digital marketing", "seo", "content", "تسويق رقمي", "محتوى"],
    true,
  ),
  specialty(
    "account-management",
    { ar: "المبيعات والتسويق", en: "Sales & marketing" },
    { ar: "إدارة الحسابات", en: "Account management" },
    ["account management", "key accounts", "إدارة حسابات", "حسابات رئيسية"],
  ),
  specialty(
    "business-development",
    { ar: "المبيعات والتسويق", en: "Sales & marketing" },
    { ar: "تطوير الأعمال", en: "Business development" },
    ["business development", "partnerships", "تطوير أعمال", "شراكات"],
  ),
  specialty(
    "customer-service",
    { ar: "المبيعات والتسويق", en: "Sales & marketing" },
    { ar: "خدمة العملاء", en: "Customer service" },
    ["customer service", "support", "خدمة عملاء", "عناية العملاء"],
  ),
  specialty(
    "ecommerce",
    { ar: "المبيعات والتسويق", en: "Sales & marketing" },
    { ar: "التجارة الإلكترونية", en: "E-commerce" },
    ["ecommerce", "e-commerce", "online retail", "تجارة إلكترونية", "متجر إلكتروني"],
    true,
  ),
  specialty("pharmacy", { ar: "الصحة", en: "Health" }, { ar: "الصيدلة", en: "Pharmacy" }, [
    "pharmacy",
    "pharmacist",
    "صيدلة",
    "صيدلي",
  ]),
  specialty(
    "laboratory-science",
    { ar: "الصحة", en: "Health" },
    { ar: "علوم المختبرات", en: "Laboratory science" },
    ["laboratory", "lab", "مختبر", "تحاليل"],
  ),
];

export function specialtyById(id: SyntheticSpecialtyId) {
  return SYNTHETIC_SPECIALTY_TAXONOMY.find((specialty) => specialty.id === id);
}

export function searchSyntheticSpecialties(query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return SYNTHETIC_SPECIALTY_TAXONOMY;
  return SYNTHETIC_SPECIALTY_TAXONOMY.filter((specialty) =>
    [
      specialty.name.ar,
      specialty.name.en,
      specialty.group.ar,
      specialty.group.en,
      ...specialty.searchTerms,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalized),
  );
}
