import { z } from "zod";

export const TaxonomyTermSchema = z.object({
  id: z.string().min(1),
  ar: z.string().min(1),
  en: z.string().min(1),
  synonymsAr: z.array(z.string()),
  synonymsEn: z.array(z.string()),
  source: z.literal("seerati-curated-general"),
  reviewedAt: z.string().datetime(),
});
export type TaxonomyTerm = z.infer<typeof TaxonomyTermSchema>;

export const TaxonomySectorSchema = z.object({
  id: z.string().min(1),
  ar: z.string().min(1),
  en: z.string().min(1),
  occupations: z.array(TaxonomyTermSchema),
});
export type TaxonomySector = z.infer<typeof TaxonomySectorSchema>;

export const SaudiCareerTaxonomySchema = z.object({
  id: z.literal("seerati-career-taxonomy"),
  version: z.literal("0.1.0"),
  officialClassification: z.literal(false),
  disclaimer: z.string().min(1),
  sectors: z.array(TaxonomySectorSchema),
});
export type SaudiCareerTaxonomy = z.infer<typeof SaudiCareerTaxonomySchema>;

const reviewedAt = "2026-08-13T00:00:00.000Z";
const term = (
  id: string,
  ar: string,
  en: string,
  synonymsAr: string[] = [],
  synonymsEn: string[] = [],
): TaxonomyTerm => ({
  id,
  ar,
  en,
  synonymsAr,
  synonymsEn,
  source: "seerati-curated-general",
  reviewedAt,
});
const sector = (
  id: string,
  ar: string,
  en: string,
  occupations: TaxonomyTerm[],
): TaxonomySector => ({ id, ar, en, occupations });

export const saudiCareerTaxonomy: SaudiCareerTaxonomy = SaudiCareerTaxonomySchema.parse({
  id: "seerati-career-taxonomy",
  version: "0.1.0",
  officialClassification: false,
  disclaimer: "تصنيف عام منسق داخل سيرتي وليس تصنيفاً حكومياً أو تنظيمياً رسمياً.",
  sectors: [
    sector("government", "حكومي", "Government", [
      term("public-administration", "إدارة عامة", "Public administration"),
    ]),
    sector("technology", "تقنية", "Technology", [
      term(
        "software-engineer",
        "مهندس برمجيات",
        "Software engineer",
        ["مطور برمجيات"],
        ["software developer"],
      ),
      term("product-manager", "مدير منتجات", "Product manager"),
    ]),
    sector("cybersecurity", "أمن سيبراني", "Cybersecurity", [
      term("security-analyst", "محلل أمن", "Security analyst"),
    ]),
    sector("engineering", "هندسة", "Engineering", [
      term("civil-engineer", "مهندس مدني", "Civil engineer"),
    ]),
    sector("energy", "طاقة", "Energy", [term("energy-analyst", "محلل طاقة", "Energy analyst")]),
    sector("health", "صحة", "Health", [
      term("health-administrator", "إداري صحي", "Healthcare administrator"),
    ]),
    sector("finance", "مالية ومصرفية", "Finance and banking", [
      term("financial-analyst", "محلل مالي", "Financial analyst"),
    ]),
    sector("accounting", "محاسبة", "Accounting", [term("accountant", "محاسب", "Accountant")]),
    sector("human-resources", "موارد بشرية", "Human resources", [
      term("hr-specialist", "أخصائي موارد بشرية", "HR specialist"),
    ]),
    sector("sales", "مبيعات", "Sales", [term("sales-manager", "مدير مبيعات", "Sales manager")]),
    sector("marketing", "تسويق", "Marketing", [
      term("marketing-specialist", "أخصائي تسويق", "Marketing specialist"),
    ]),
    sector("operations", "تشغيل", "Operations", [
      term("operations-manager", "مدير عمليات", "Operations manager"),
    ]),
    sector("logistics", "لوجستيات", "Logistics", [
      term("supply-chain-specialist", "أخصائي سلاسل إمداد", "Supply chain specialist"),
    ]),
    sector("tourism", "سياحة", "Tourism", [
      term("tourism-specialist", "أخصائي سياحة", "Tourism specialist"),
    ]),
    sector("hospitality", "ضيافة", "Hospitality", [
      term("hospitality-manager", "مدير ضيافة", "Hospitality manager"),
    ]),
    sector("education", "تعليم", "Education", [term("teacher", "معلم", "Teacher")]),
    sector("legal", "قانون", "Legal", [
      term("legal-specialist", "أخصائي قانوني", "Legal specialist"),
    ]),
    sector("real-estate", "عقارات", "Real estate", [
      term("real-estate-agent", "وسيط عقاري", "Real estate agent"),
    ]),
    sector("construction", "بناء", "Construction", [
      term("construction-manager", "مدير إنشاءات", "Construction manager"),
    ]),
    sector("nonprofit", "قطاع غير ربحي", "Nonprofit", [
      term("program-manager", "مدير برامج", "Program manager"),
    ]),
    sector("media", "إعلام", "Media", [term("content-editor", "محرر محتوى", "Content editor")]),
    sector("culture", "ثقافة", "Culture", [
      term("cultural-programmer", "منسق برامج ثقافية", "Cultural programmer"),
    ]),
    sector("sport", "رياضة", "Sport", [
      term("sports-coordinator", "منسق رياضي", "Sports coordinator"),
    ]),
  ],
});

export function loadTaxonomySector(id: string): TaxonomySector | undefined {
  return saudiCareerTaxonomy.sectors.find((sectorItem) => sectorItem.id === id);
}

export function findTaxonomyTerms(query: string, sectorId?: string): TaxonomyTerm[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];
  const sectors = sectorId
    ? saudiCareerTaxonomy.sectors.filter((item) => item.id === sectorId)
    : saudiCareerTaxonomy.sectors;
  return sectors
    .flatMap((item) => item.occupations)
    .filter((item) =>
      [item.ar, item.en, ...item.synonymsAr, ...item.synonymsEn].some((value) =>
        value.toLocaleLowerCase().includes(normalized),
      ),
    );
}
