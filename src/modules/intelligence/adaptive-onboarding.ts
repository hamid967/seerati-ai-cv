import { OnboardingQuestionSchema, type OnboardingQuestion } from "./contracts";

export type OnboardingPersona = "graduate" | "professional" | "leader" | "unknown";

export type OnboardingState = {
  persona: OnboardingPersona;
  answered: string[];
  availableSections: string[];
  targetRole?: string;
};

const QUESTIONS: Record<OnboardingPersona, OnboardingQuestion[]> = {
  graduate: [
    {
      id: "target_role",
      prompt: { ar: "ما المسمى الذي تستهدفه؟", en: "What role are you targeting?" },
      reason: {
        ar: "يساعدنا على ترتيب المهارات والمشاريع ذات الصلة.",
        en: "It helps prioritize relevant skills and projects.",
      },
      section: "target_role",
      skippable: false,
      sendsToAi: false,
      savesData: false,
    },
    {
      id: "education",
      prompt: { ar: "ما مؤهلك أو تخصصك؟", en: "What is your degree or field?" },
      reason: {
        ar: "نحتاجه لبناء قسم التعليم دون افتراض معدل أو مرتبة.",
        en: "We use it to build education without assuming grades or honors.",
      },
      section: "education",
      skippable: true,
      sendsToAi: false,
      savesData: false,
    },
    {
      id: "project",
      prompt: { ar: "هل لديك مشروع يمكن شرحه؟", en: "Do you have a project you can explain?" },
      reason: {
        ar: "المشاريع تعوض نقص الخبرة عند الخريجين.",
        en: "Projects help represent graduates with limited work history.",
      },
      section: "projects",
      skippable: true,
      sendsToAi: false,
      savesData: false,
    },
    {
      id: "skills",
      prompt: { ar: "ما أهم ثلاث مهارات لديك؟", en: "What are your three strongest skills?" },
      reason: {
        ar: "نستخدم إجابتك كما هي ولا نضيف مهارات من وصف وظيفة.",
        en: "We use your answer as provided and never add skills from a job description.",
      },
      section: "skills",
      skippable: true,
      sendsToAi: false,
      savesData: false,
    },
  ],
  professional: [
    {
      id: "target_role",
      prompt: { ar: "ما المسمى الذي تستهدفه الآن؟", en: "What role are you targeting now?" },
      reason: {
        ar: "يربط السيرة بالخطوة المهنية الحالية.",
        en: "It connects the resume to your current career goal.",
      },
      section: "target_role",
      skippable: false,
      sendsToAi: false,
      savesData: false,
    },
    {
      id: "achievement",
      prompt: {
        ar: "ما إنجاز واحد يمكن قياس أثره؟",
        en: "What is one achievement with a measurable impact?",
      },
      reason: {
        ar: "نبحث عن دليل، ولن نخترع رقماً إذا لم تذكره.",
        en: "We look for evidence and will never invent a number.",
      },
      section: "achievements",
      skippable: true,
      sendsToAi: false,
      savesData: false,
    },
    {
      id: "tools",
      prompt: {
        ar: "ما الأدوات التي استخدمتها فعلياً؟",
        en: "Which tools have you actually used?",
      },
      reason: {
        ar: "نميز بين خبرة حقيقية وفجوة في وصف الوظيفة.",
        en: "We distinguish real experience from job-description gaps.",
      },
      section: "skills",
      skippable: true,
      sendsToAi: false,
      savesData: false,
    },
  ],
  leader: [
    {
      id: "target_role",
      prompt: {
        ar: "ما نطاق الدور القيادي المستهدف؟",
        en: "What leadership scope are you targeting?",
      },
      reason: {
        ar: "يساعد على إبراز النطاق بدلاً من الصفات العامة.",
        en: "It highlights scope rather than generic adjectives.",
      },
      section: "target_role",
      skippable: false,
      sendsToAi: false,
      savesData: false,
    },
    {
      id: "team_scope",
      prompt: {
        ar: "كم كان نطاق الفريق أو المسؤولية؟",
        en: "What was the team or responsibility scope?",
      },
      reason: {
        ar: "نحتاج حجماً قابلاً للتوثيق، لا وصفاً مبالغاً فيه.",
        en: "We need a verifiable scope, not inflated wording.",
      },
      section: "experience",
      skippable: true,
      sendsToAi: false,
      savesData: false,
    },
    {
      id: "transformation",
      prompt: {
        ar: "ما التحول أو النتيجة التي قدتها؟",
        en: "What transformation or outcome did you lead?",
      },
      reason: {
        ar: "يربط القيادة بنتيجة يمكن مراجعتها.",
        en: "It links leadership to a reviewable outcome.",
      },
      section: "achievements",
      skippable: true,
      sendsToAi: false,
      savesData: false,
    },
  ],
  unknown: [
    {
      id: "persona",
      prompt: {
        ar: "هل أنت خريج، موظف، أم قائد؟",
        en: "Are you a graduate, professional, or leader?",
      },
      reason: {
        ar: "سنستخدم إجابتك لتقليل الأسئلة غير الضرورية.",
        en: "We use this to avoid unnecessary questions.",
      },
      section: "profile",
      skippable: false,
      sendsToAi: false,
      savesData: false,
    },
  ],
};

export function inferOnboardingPersona(input: {
  years?: number;
  leadershipSignals?: number;
  educationOnly?: boolean;
}): OnboardingPersona {
  if (input.educationOnly || input.years === 0) return "graduate";
  if ((input.leadershipSignals ?? 0) >= 2 || (input.years ?? 0) >= 10) return "leader";
  if ((input.years ?? 0) > 0) return "professional";
  return "unknown";
}

export function nextOnboardingQuestion(state: OnboardingState): OnboardingQuestion | null {
  const answered = new Set(state.answered);
  const available = new Set(state.availableSections);
  const next = QUESTIONS[state.persona].find(
    (question) => !answered.has(question.id) && !available.has(question.section),
  );
  return next ? OnboardingQuestionSchema.parse(next) : null;
}

export function onboardingProgress(state: OnboardingState): {
  completed: number;
  remaining: number;
  stoppingPoint: "continue" | "ready";
} {
  const remaining = QUESTIONS[state.persona].filter(
    (question) => !state.answered.includes(question.id),
  ).length;
  return {
    completed: state.answered.length,
    remaining,
    stoppingPoint: remaining === 0 ? "ready" : "continue",
  };
}
