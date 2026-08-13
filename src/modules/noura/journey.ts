import { z } from "zod";
import {
  NouraGoalSchema,
  NouraStateSchema,
  type NouraGoal,
  type NouraState,
} from "./agent-profile";

export const JourneyQuestionFamilySchema = z.enum([
  "persona_and_role",
  "resume_source",
  "job_description",
  "file_review",
  "ats_context",
  "evidence_confirmation",
  "priority_actions",
]);
export type JourneyQuestionFamily = z.infer<typeof JourneyQuestionFamilySchema>;

export const JourneyEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("choose_goal"), goal: NouraGoalSchema }),
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("back") }),
  z.object({ type: z.literal("local_review") }),
  z.object({ type: z.literal("request_ai") }),
  z.object({ type: z.literal("consent_granted") }),
  z.object({ type: z.literal("suggestion_ready") }),
  z.object({ type: z.literal("approve_suggestion") }),
  z.object({ type: z.literal("reject_suggestion") }),
  z.object({ type: z.literal("offline") }),
  z.object({ type: z.literal("retry") }),
  z.object({ type: z.literal("session_expiring") }),
  z.object({ type: z.literal("delete_data") }),
  z.object({ type: z.literal("reset") }),
]);
export type JourneyEvent = z.infer<typeof JourneyEventSchema>;

export const JourneySnapshotSchema = z.object({
  state: NouraStateSchema,
  goal: NouraGoalSchema.optional(),
  step: z.number().int().min(0).max(4),
  questionFamily: JourneyQuestionFamilySchema.optional(),
  hasConsent: z.boolean(),
  lastEvent: z.string().optional(),
});
export type JourneySnapshot = z.infer<typeof JourneySnapshotSchema>;

const QUESTION_FAMILY_BY_GOAL: Record<NouraGoal, JourneyQuestionFamily> = {
  create_resume: "persona_and_role",
  improve_resume: "resume_source",
  target_job: "job_description",
  import_resume: "file_review",
  check_ats: "ats_context",
  cover_letter: "evidence_confirmation",
  review_resume: "priority_actions",
};

export const JOURNEY_COPY: Record<JourneyQuestionFamily, { ar: string; en: string }> = {
  persona_and_role: {
    ar: "سنبدأ بمستواك الحالي والوظيفة التي تستهدفها.",
    en: "We’ll start with your current level and target role.",
  },
  resume_source: {
    ar: "اختر مصدر السيرة التي تريد تحسينها.",
    en: "Choose the source of the resume you want to improve.",
  },
  job_description: {
    ar: "أرسل وصف الوظيفة لنحدد حدود التحليل أولاً.",
    en: "Provide the job description so we can define the analysis boundary first.",
  },
  file_review: {
    ar: "سنراجع الملف قبل إضافة أي معلومة إلى المسودة.",
    en: "We’ll review the file before adding anything to the draft.",
  },
  ats_context: {
    ar: "سنحدد السيرة والوظيفة قبل عرض فحص ATS الإرشادي.",
    en: "We’ll identify the resume and role before showing the advisory ATS check.",
  },
  evidence_confirmation: {
    ar: "سنؤكد الأدلة التي تريد استخدامها في خطاب التقديم.",
    en: "We’ll confirm the evidence you want to use in the cover letter.",
  },
  priority_actions: {
    ar: "سنبدأ بأهم ثلاث خطوات قابلة للتنفيذ.",
    en: "We’ll start with the three most useful next actions.",
  },
};

export function createInitialJourney(): JourneySnapshot {
  return JourneySnapshotSchema.parse({
    state: "idle",
    step: 0,
    hasConsent: false,
  });
}

function withEvent(
  snapshot: JourneySnapshot,
  event: JourneyEvent,
  patch: Partial<JourneySnapshot>,
) {
  return JourneySnapshotSchema.parse({
    ...snapshot,
    ...patch,
    lastEvent: event.type,
  });
}

export function transitionJourney(
  snapshot: JourneySnapshot,
  rawEvent: JourneyEvent,
): JourneySnapshot {
  const event = JourneyEventSchema.parse(rawEvent);

  if (event.type === "reset") return createInitialJourney();
  if (event.type === "delete_data") {
    return withEvent(snapshot, event, {
      state: "data_deleted",
      goal: undefined,
      step: 0,
      questionFamily: undefined,
      hasConsent: false,
    });
  }
  if (snapshot.state === "data_deleted") return snapshot;

  if (event.type === "choose_goal") {
    return withEvent(snapshot, event, {
      state: "asking",
      goal: event.goal,
      step: 1,
      questionFamily: QUESTION_FAMILY_BY_GOAL[event.goal],
    });
  }

  if (event.type === "back") {
    return withEvent(snapshot, event, {
      state: snapshot.step <= 1 ? "idle" : "asking",
      step: Math.max(0, snapshot.step - 1),
    });
  }

  if (event.type === "next") {
    return withEvent(snapshot, event, {
      state: snapshot.step >= 4 ? "completed" : "asking",
      step: Math.min(4, snapshot.step + 1),
    });
  }

  if (event.type === "local_review") {
    return withEvent(snapshot, event, { state: "local_analysis" });
  }
  if (event.type === "request_ai") {
    return withEvent(snapshot, event, {
      state: snapshot.hasConsent ? "ai_processing" : "consent_required",
    });
  }
  if (event.type === "consent_granted") {
    return withEvent(snapshot, event, { state: "ai_processing", hasConsent: true });
  }
  if (event.type === "suggestion_ready") {
    return withEvent(snapshot, event, { state: "awaiting_approval" });
  }
  if (event.type === "approve_suggestion") {
    return withEvent(snapshot, event, { state: "completed" });
  }
  if (event.type === "reject_suggestion") {
    return withEvent(snapshot, event, { state: "local_analysis" });
  }
  if (event.type === "offline") {
    return withEvent(snapshot, event, { state: "offline" });
  }
  if (event.type === "retry") {
    return withEvent(snapshot, event, {
      state: snapshot.goal ? "asking" : "idle",
    });
  }
  if (event.type === "session_expiring") {
    return withEvent(snapshot, event, { state: "session_expiring" });
  }

  return snapshot;
}

export function journeyPrompt(snapshot: JourneySnapshot, lang: "ar" | "en") {
  return snapshot.questionFamily ? JOURNEY_COPY[snapshot.questionFamily][lang] : "";
}
