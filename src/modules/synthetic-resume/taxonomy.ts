import type { SyntheticSpecialty, SyntheticSpecialtyId } from "./types";

/**
 * Initial, intentionally narrow specialty catalog. It is imported only by the
 * sample-resume flow, not the assistant landing bundle.
 */
export const SYNTHETIC_SPECIALTY_TAXONOMY: SyntheticSpecialty[] = [
  {
    id: "software-development",
    group: { ar: "التقنية", en: "Technology" },
    name: { ar: "تطوير البرمجيات", en: "Software development" },
    searchTerms: ["software", "developer", "engineering", "برمجيات", "مطور", "تطوير"],
    supportsCreativeTemplate: true,
  },
  {
    id: "accounting",
    group: { ar: "المالية", en: "Finance" },
    name: { ar: "المحاسبة", en: "Accounting" },
    searchTerms: ["accounting", "accountant", "finance", "محاسبة", "محاسب", "مالية"],
  },
  {
    id: "civil-engineering",
    group: { ar: "الهندسة", en: "Engineering" },
    name: { ar: "الهندسة المدنية", en: "Civil engineering" },
    searchTerms: ["civil", "engineering", "construction", "هندسة", "مدنية", "إنشاءات"],
  },
  {
    id: "human-resources",
    group: { ar: "الموارد البشرية", en: "Human resources" },
    name: { ar: "الموارد البشرية", en: "Human resources" },
    searchTerms: ["human resources", "hr", "recruitment", "موارد", "بشرية", "توظيف"],
  },
  {
    id: "nursing",
    group: { ar: "الصحة", en: "Health" },
    name: { ar: "التمريض", en: "Nursing" },
    searchTerms: ["nursing", "nurse", "healthcare", "تمريض", "ممرض", "صحة"],
  },
  {
    id: "sales",
    group: { ar: "المبيعات والتسويق", en: "Sales & marketing" },
    name: { ar: "المبيعات", en: "Sales" },
    searchTerms: ["sales", "account management", "business development", "مبيعات", "تطوير أعمال"],
    supportsCreativeTemplate: true,
  },
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
