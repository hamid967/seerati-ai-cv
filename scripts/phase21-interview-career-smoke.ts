import {
  createInterviewPractice,
  interviewPracticePrivacyCopy,
} from "../src/lib/interview-practice";
import { careerRoadmapPrivacyCopy, createCareerRoadmap } from "../src/lib/career-roadmap";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const arabicPractice = createInterviewPractice({
  locale: "ar",
  role: "محلل بيانات",
  jobDescription: "يتطلب الدور تحليل البيانات وبناء لوحات متابعة والتعاون مع فرق المنتج.",
});
assert(arabicPractice.questions.length === 4, "Arabic practice must create four questions");
assert(
  arabicPractice.questions.every((question) => question.question.includes("STAR")),
  "Questions use STAR",
);
assert(
  arabicPractice.disclaimer.includes("لا يسجل صوتاً"),
  "Arabic practice discloses no recording",
);
assert(
  interviewPracticePrivacyCopy("ar").includes("ذاكرة هذه الصفحة"),
  "Arabic practice discloses page-memory boundary",
);

const englishPractice = createInterviewPractice({
  locale: "en",
  role: "Data analyst",
  jobDescription: "",
});
assert(
  englishPractice.questions.length === 4,
  "English fallback practice must create four questions",
);
assert(
  englishPractice.questions[0]?.question.includes("Data analyst"),
  "Role is reflected in an English practice question",
);
assert(
  interviewPracticePrivacyCopy("en").includes("not automatically sent"),
  "English practice discloses no automatic transfer",
);

const roadmap = createCareerRoadmap({
  locale: "ar",
  focus: "portfolio",
  horizon: "6",
  targetRole: "مدير مشروع",
});
assert(roadmap.length === 3, "Roadmap must have three review stages");
assert(roadmap[0]?.period === "الشهر 1", "Six-month roadmap starts in month one");
assert(roadmap[1]?.detail.includes("مشروع"), "Portfolio roadmap describes reviewable proof");
assert(
  careerRoadmapPrivacyCopy("ar").includes("ذاكرة الصفحة"),
  "Roadmap discloses page-memory boundary",
);
assert(
  !roadmap.some((milestone) => /مضمون|guarantee/i.test(milestone.detail)),
  "Roadmap must not make guaranteed outcome claims",
);

console.log(
  "Phase 21 interview and career smoke passed: bilingual local practice, roadmap, and privacy boundaries.",
);
