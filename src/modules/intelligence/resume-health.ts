import { ResumeHealthSchema, type ResumeHealth } from "./contracts";
import type { ResumeData } from "@/lib/types";

const labels = {
  completeness: { ar: "الاكتمال", en: "Completeness" },
  clarity: { ar: "الوضوح", en: "Clarity" },
  achievements: { ar: "قوة الإنجازات", en: "Achievement strength" },
  duplication: { ar: "التكرار", en: "Duplication" },
  chronology: { ar: "التسلسل الزمني", en: "Chronology" },
  language: { ar: "اللغة", en: "Language" },
  ats: { ar: "جاهزية ATS", en: "ATS readiness" },
  privacy: { ar: "الخصوصية", en: "Privacy" },
  pdf: { ar: "جودة PDF", en: "PDF readiness" },
} as const;

function dimension(id: keyof typeof labels, score: number, findings: string[]) {
  return {
    id,
    label: labels[id],
    score: Math.max(0, Math.min(100, Math.round(score))),
    state:
      score >= 80 ? ("good" as const) : score >= 55 ? ("warning" as const) : ("critical" as const),
    findings,
    localOnly: true,
  };
}

export function assessResumeHealth(data: ResumeData): ResumeHealth {
  const completenessChecks = [
    Boolean(data.personal.fullName.trim()),
    Boolean(data.personal.email.trim()),
    Boolean(data.summary.trim()),
    data.experience.length > 0 || data.education.length > 0,
    data.skills.length > 0,
  ];
  const completeness =
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100;
  const clarity =
    data.summary.trim().length >= 80 && data.summary.trim().length <= 700
      ? 100
      : data.summary.trim().length
        ? 65
        : 25;
  const achievementCount =
    data.achievements.length +
    data.experience.reduce(
      (sum, item) =>
        sum +
        item.bullets.filter((bullet) => /\d|%|زيادة|خفض|increased|reduced|improved/i.test(bullet))
          .length,
      0,
    );
  const achievementScore =
    data.experience.length || data.achievements.length
      ? Math.min(100, 45 + achievementCount * 15)
      : 20;
  const allText = [
    ...data.experience.flatMap((item) => item.bullets),
    ...data.achievements.map((item) => `${item.title} ${item.detail ?? ""}`),
  ]
    .map((text) => text.trim().toLocaleLowerCase())
    .filter(Boolean);
  const duplicateCount = allText.length - new Set(allText).size;
  const chronologyScore = data.experience.every((item) => item.start && (item.current || item.end))
    ? 100
    : 60;
  const languageScore =
    data.personal.fullName.trim() && (data.summary.includes(" ") || data.summary.includes("\n"))
      ? 90
      : 45;
  const atsScore =
    data.personal.email.trim() && data.experience.length > 0 && data.skills.length > 0 ? 90 : 55;
  const privacyScore = data.personal.phone.trim() || data.personal.email.trim() ? 80 : 100;
  const estimatedPages = Math.ceil(
    (data.summary.length +
      data.experience.reduce((sum, item) => sum + item.bullets.join(" ").length, 0) +
      data.skills.length * 20) /
      2600,
  );
  const pdfScore =
    estimatedPages <= 2 && data.links.every((link) => /^https?:\/\//i.test(link.url)) ? 95 : 65;
  const dimensions = [
    dimension(
      "completeness",
      completeness,
      completeness < 80 ? ["Add the missing core resume sections."] : [],
    ),
    dimension(
      "clarity",
      clarity,
      clarity < 80 ? ["Rewrite the summary with a clear role, specialty, and goal."] : [],
    ),
    dimension(
      "achievements",
      achievementScore,
      achievementScore < 80
        ? ["Add evidence-backed outcomes instead of responsibilities only."]
        : [],
    ),
    dimension(
      "duplication",
      duplicateCount ? 45 : 100,
      duplicateCount ? [`Review ${duplicateCount} repeated statement(s).`] : [],
    ),
    dimension(
      "chronology",
      chronologyScore,
      chronologyScore < 80 ? ["Complete missing start/end dates before export."] : [],
    ),
    dimension(
      "language",
      languageScore,
      languageScore < 80 ? ["Add enough content for a meaningful language review."] : [],
    ),
    dimension(
      "ats",
      atsScore,
      atsScore < 80 ? ["Complete contact, experience, and skills fields for ATS basics."] : [],
    ),
    dimension(
      "privacy",
      privacyScore,
      privacyScore < 90 ? ["Review whether contact fields are needed for this version."] : [],
    ),
    dimension(
      "pdf",
      pdfScore,
      pdfScore < 80 ? ["Review length or long links before PDF export."] : [],
    ),
  ];
  const score = Math.round(
    dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length,
  );
  const topIssues = dimensions
    .filter((item) => item.state !== "good")
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .flatMap((item) => item.findings);
  return ResumeHealthSchema.parse({
    score,
    status: score >= 80 ? "ready" : completeness < 50 ? "incomplete" : "needs_attention",
    dimensions,
    topIssues,
    nextAction: topIssues[0] ?? "run ATS and PDF checks before applying",
    estimatedMinutes: Math.max(2, topIssues.length * 5),
  });
}
