export type CoachSection = "summary" | "experience" | "education" | "skills" | "projects";

export type SectionCoachPrompt = {
  id: string;
  section: CoachSection;
  prompt: { ar: string; en: string };
  why: { ar: string; en: string };
  localOnly: true;
  requiresEvidence: boolean;
};

const prompts: Record<CoachSection, SectionCoachPrompt[]> = {
  summary: [
    {
      id: "summary_value",
      section: "summary",
      prompt: {
        ar: "ما القيمة المهنية التي تقدمها؟",
        en: "What professional value do you provide?",
      },
      why: {
        ar: "لجعل الملخص أكثر تحديداً من الصفات العامة.",
        en: "To make the summary more specific than generic adjectives.",
      },
      localOnly: true,
      requiresEvidence: false,
    },
    {
      id: "summary_goal",
      section: "summary",
      prompt: {
        ar: "ما المسمى أو الاتجاه المستهدف؟",
        en: "What role or direction are you targeting?",
      },
      why: { ar: "يربط الملخص بهدفك الحالي.", en: "It connects the summary to your current goal." },
      localOnly: true,
      requiresEvidence: false,
    },
  ],
  experience: [
    {
      id: "experience_outcome",
      section: "experience",
      prompt: {
        ar: "هل هذه النقطة مسؤولية أم إنجاز؟ وما النتيجة؟",
        en: "Is this a responsibility or an achievement, and what was the result?",
      },
      why: {
        ar: "نريد عرض الأثر لا قائمة المهام فقط.",
        en: "We want impact, not only a task list.",
      },
      localOnly: true,
      requiresEvidence: true,
    },
    {
      id: "experience_evidence",
      section: "experience",
      prompt: {
        ar: "هل لديك دليل أو رقم يمكنك تأكيده؟",
        en: "Do you have evidence or a number you can confirm?",
      },
      why: {
        ar: "لن نضيف رقماً إذا لم تؤكده.",
        en: "We will not add a number you have not confirmed.",
      },
      localOnly: true,
      requiresEvidence: true,
    },
  ],
  education: [
    {
      id: "education_project",
      section: "education",
      prompt: {
        ar: "هل لديك مشروع أو تدريب تريد إبرازه؟",
        en: "Do you have a project or training to highlight?",
      },
      why: {
        ar: "المشاريع مفيدة خصوصاً عند قلة الخبرة.",
        en: "Projects are especially useful when work history is limited.",
      },
      localOnly: true,
      requiresEvidence: false,
    },
  ],
  skills: [
    {
      id: "skills_source",
      section: "skills",
      prompt: {
        ar: "أين استخدمت هذه المهارة فعلياً؟",
        en: "Where have you actually used this skill?",
      },
      why: {
        ar: "نميز المهارة المثبتة عن الفجوة في الوصف الوظيفي.",
        en: "We distinguish a proven skill from a job-description gap.",
      },
      localOnly: true,
      requiresEvidence: true,
    },
  ],
  projects: [
    {
      id: "project_result",
      section: "projects",
      prompt: { ar: "ما المشكلة التي حلها المشروع؟", en: "What problem did the project solve?" },
      why: {
        ar: "يربط المشروع بنتيجة قابلة للشرح.",
        en: "It connects the project to an explainable outcome.",
      },
      localOnly: true,
      requiresEvidence: true,
    },
  ],
};

export function coachSection(section: CoachSection, existingText = ""): SectionCoachPrompt[] {
  const hasEvidence = /\d|%|زيادة|خفض|increased|reduced|improved/i.test(existingText);
  return prompts[section].filter((prompt) => !prompt.requiresEvidence || !hasEvidence);
}
