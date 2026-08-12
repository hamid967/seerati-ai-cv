import { keywordCoverage } from "@/lib/ats";
import type { ResumeData } from "@/lib/types";

export type KeywordScanAction = {
  id: "add-skills" | "open-tailoring" | "improve-summary" | "open-ats";
  title: { ar: string; en: string };
  detail: { ar: string; en: string };
};

export type KeywordScanReport = {
  total: number;
  matched: string[];
  missing: string[];
  coverage: number;
  band: "strong" | "fair" | "weak";
  actions: KeywordScanAction[];
};

/**
 * Rezi-style keyword targeting: compare a job description against resume data
 * and return transparent coverage plus next actions. Advisory only — never
 * auto-inserts keywords into the resume.
 */
export function scanKeywords(jobDescription: string, data: ResumeData): KeywordScanReport | null {
  const coverage = keywordCoverage(jobDescription, data);
  if (!coverage) return null;

  const band: KeywordScanReport["band"] =
    coverage.coverage >= 75 ? "strong" : coverage.coverage >= 45 ? "fair" : "weak";

  const actions: KeywordScanAction[] = [];
  if (coverage.missing.length) {
    actions.push({
      id: "add-skills",
      title: {
        ar: "راجع المهارات الناقصة بصدق",
        en: "Review missing skills honestly",
      },
      detail: {
        ar: "أضف فقط المهارات التي تملكها فعلاً — لا تُدرَج الكلمات تلقائياً.",
        en: "Add only skills you actually have — keywords are never auto-inserted.",
      },
    });
  }
  if (band !== "strong") {
    actions.push({
      id: "open-tailoring",
      title: {
        ar: "خصّص السيرة لهذه الوظيفة",
        en: "Tailor the resume to this job",
      },
      detail: {
        ar: "استوديو التخصيص يعيد ترتيب المحتوى الموجود فقط دون اختلاق إنجازات.",
        en: "Tailoring Studio only reorders existing content — it never invents achievements.",
      },
    });
    actions.push({
      id: "improve-summary",
      title: {
        ar: "حسّن الملخص ليعكس الهدف",
        en: "Tighten the summary to the target",
      },
      detail: {
        ar: "صِغ ملخصاً يذكر المسمى المستهدف والمهارات المؤكدة من سيرتك.",
        en: "Rewrite the summary to name the target role and verified skills from your resume.",
      },
    });
  }
  actions.push({
    id: "open-ats",
    title: { ar: "افتح فحص الجاهزية الكامل", en: "Open the full readiness check" },
    detail: {
      ar: "درجة ATS الإرشادية تجمع الاتصال والملخص والخبرة والكلمات المفتاحية.",
      en: "The advisory ATS score combines contact, summary, experience and keywords.",
    },
  });

  return { ...coverage, band, actions };
}
