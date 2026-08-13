import { routeIntent } from "./intent-router";
import type { Intent } from "./contracts";

export type EvaluationCase = {
  id: string;
  language: "ar" | "en" | "mixed";
  text: string;
  expected: Intent;
};
export type EvaluationReport = {
  total: number;
  correct: number;
  intentAccuracy: number;
  clarificationCases: number;
  failures: Array<{ id: string; actual: Intent; expected: Intent }>;
};

const fixtures: Array<{
  language: EvaluationCase["language"];
  phrases: string[];
  expected: Intent;
}> = [
  { language: "ar", phrases: ["أنشئ سيرتي", "إنشاء سيرة", "سوي سيرة"], expected: "create_resume" },
  {
    language: "en",
    phrases: ["create resume", "build my CV", "make a resume"],
    expected: "create_resume",
  },
  {
    language: "ar",
    phrases: ["استورد سيرتي", "ارفع سيرتي", "استيراد سيرة"],
    expected: "import_resume",
  },
  {
    language: "en",
    phrases: ["import resume", "upload CV", "parse resume"],
    expected: "import_resume",
  },
  {
    language: "ar",
    phrases: ["حسن سيرتي", "تحسين السيرة", "طور السيرة"],
    expected: "improve_resume",
  },
  {
    language: "en",
    phrases: ["improve resume", "fix my CV", "optimize resume"],
    expected: "improve_resume",
  },
  {
    language: "ar",
    phrases: ["جهزني لوظيفة", "حلل الوصف", "طابق الوظيفة"],
    expected: "target_job",
  },
  {
    language: "en",
    phrases: ["prepare me for a job", "match this job", "analyze job description"],
    expected: "target_job",
  },
  { language: "ar", phrases: ["فحص السيرة", "افحص ATS", "فحص ATS"], expected: "check_ats" },
  {
    language: "en",
    phrases: ["check ATS", "scan my resume", "resume scan"],
    expected: "check_ats",
  },
  {
    language: "ar",
    phrases: ["ترجم السيرة", "ترجمة سيرتي", "حولها للانجليزية"],
    expected: "translate_resume",
  },
  {
    language: "en",
    phrases: ["translate resume", "translate my CV", "make it English"],
    expected: "translate_resume",
  },
  { language: "ar", phrases: ["خطاب تقديم", "اكتب خطاب", "رسالة تقديم"], expected: "cover_letter" },
  {
    language: "en",
    phrases: ["cover letter", "write an application letter", "application letter"],
    expected: "cover_letter",
  },
  {
    language: "ar",
    phrases: ["استعد للمقابلة", "تحضير مقابلة", "تدرب للمقابلة"],
    expected: "interview_prep",
  },
  {
    language: "en",
    phrases: ["prepare for interview", "interview prep", "practice interview"],
    expected: "interview_prep",
  },
  { language: "ar", phrases: ["غير القالب", "اختر قالب", "قالب ATS"], expected: "change_template" },
  {
    language: "en",
    phrases: ["change template", "choose a template", "pick an ATS template"],
    expected: "change_template",
  },
  {
    language: "ar",
    phrases: ["قصر السيرة", "اختصر السيرة", "صفحة واحدة"],
    expected: "shorten_resume",
  },
  {
    language: "en",
    phrases: ["shorten resume", "make it shorter", "one page resume"],
    expected: "shorten_resume",
  },
];

export function buildSyntheticIntentCases(total = 500): EvaluationCase[] {
  const cases: EvaluationCase[] = [];
  for (let index = 0; index < total; index += 1) {
    const fixture = fixtures[index % fixtures.length]!;
    const phrase = fixture.phrases[Math.floor(index / fixtures.length) % fixture.phrases.length]!;
    const text = fixture.language === "mixed" ? `please ${phrase}` : phrase;
    cases.push({
      id: `synthetic-${String(index + 1).padStart(3, "0")}`,
      language: fixture.language,
      text,
      expected: fixture.expected,
    });
  }
  return cases;
}

export function evaluateIntentRouter(cases = buildSyntheticIntentCases()): EvaluationReport {
  const failures: EvaluationReport["failures"] = [];
  let correct = 0;
  let clarificationCases = 0;
  for (const item of cases) {
    const actual = routeIntent(item.text, ["resume", "job_description", "job_target"]).intent;
    if (actual === "clarify") clarificationCases += 1;
    if (actual === item.expected) correct += 1;
    else failures.push({ id: item.id, actual, expected: item.expected });
  }
  return {
    total: cases.length,
    correct,
    intentAccuracy: cases.length ? correct / cases.length : 0,
    clarificationCases,
    failures,
  };
}
