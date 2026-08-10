/**
 * Copilot action executor.
 *
 * The one place where an approved AI proposal turns into a real write. Two
 * gates are checked before anything happens:
 *   1. the proposal state must be "approved" — a pending or dismissed action is
 *      refused, so an AI response can never apply itself;
 *   2. the acting user must own the target row, verified through the normal
 *      authenticated data layer (RLS still applies underneath).
 *
 * Every applied action returns an inverse when it can be reversed, which is
 * what the session undo/redo stack replays.
 */
import type { CopilotProtocolAction } from "./actions";
import { requiresConfirmation } from "./actions";
import { createEvidence, createFact, deleteEvidence, deleteFact } from "@/lib/career-facts";
import type { ResumeData } from "@/lib/types";

export type ExecutionState = "pending" | "approved" | "dismissed";

export type ExecutorContext = {
  userId: string;
  /** Owner of the resume being edited, when a resume is in play. */
  resumeOwnerId?: string;
  /** Current draft, mutated functionally by resume-scoped actions. */
  draft?: ResumeData;
  /** Persist a new draft (autosave path of the builder). */
  applyDraft?: (next: ResumeData) => void;
};

export type ExecutionResult =
  | { ok: true; reversible: boolean; undo?: () => Promise<void> | void; note?: string }
  | { ok: false; error: ExecutionError };

export type ExecutionError =
  "not_approved" | "not_owner" | "missing_context" | "unsupported_action" | "write_failed";

export const EXECUTION_ERROR_LABEL: Record<ExecutionError, { ar: string; en: string }> = {
  not_approved: { ar: "لم تتم الموافقة على الاقتراح.", en: "The suggestion was not approved." },
  not_owner: {
    ar: "لا تملك صلاحية تعديل هذا العنصر.",
    en: "You are not allowed to edit this item.",
  },
  missing_context: {
    ar: "بيانات غير مكتملة لتطبيق الاقتراح.",
    en: "Not enough context to apply this.",
  },
  unsupported_action: {
    ar: "هذا الإجراء يُطبَّق من شاشته الخاصة.",
    en: "This action is applied from its own screen.",
  },
  write_failed: { ar: "تعذّر الحفظ، حاول مرة أخرى.", en: "Saving failed, please try again." },
};

const ownsResume = (ctx: ExecutorContext) => !ctx.resumeOwnerId || ctx.resumeOwnerId === ctx.userId;

/** Apply one approved action. Returns an undo closure whenever reversible. */
export async function executeCopilotAction(
  action: CopilotProtocolAction,
  state: ExecutionState,
  ctx: ExecutorContext,
): Promise<ExecutionResult> {
  // Gate 1 — approval. requiresConfirmation() is always true by contract.
  if (requiresConfirmation(action) && state !== "approved") {
    return { ok: false, error: "not_approved" };
  }
  if (!ctx.userId) return { ok: false, error: "not_owner" };
  // Gate 2 — ownership of the resume this action touches.
  if (!ownsResume(ctx)) return { ok: false, error: "not_owner" };

  const draftAction =
    action.type === "update_summary" ||
    action.type === "add_skill" ||
    action.type === "replace_bullet" ||
    action.type === "translate_section" ||
    action.type === "update_job_target";

  if (draftAction) {
    if (!ctx.draft || !ctx.applyDraft) return { ok: false, error: "missing_context" };
    const before = ctx.draft;
    const next = applyToDraft(action, before);
    if (!next) return { ok: false, error: "missing_context" };
    ctx.applyDraft(next);
    const revert = ctx.applyDraft;
    return { ok: true, reversible: true, undo: () => revert(before) };
  }

  if (action.type === "add_achievement") {
    try {
      const fact = await createFact(ctx.userId, {
        type: "achievement",
        title: action.payload.text,
        value: action.payload.metric,
        sourceType: "copilot",
        sourceLabel: "Seerati copilot",
        // AI-drafted achievements are never auto-trusted.
        verificationStatus: "needs_review",
      });
      if (!fact) return { ok: false, error: "write_failed" };
      return { ok: true, reversible: true, undo: () => deleteFact(fact.id) };
    } catch {
      return { ok: false, error: "write_failed" };
    }
  }

  if (action.type === "add_evidence") {
    try {
      const row = await createEvidence(ctx.userId, {
        factId: action.payload.factId,
        evidenceType: action.payload.evidenceType,
        title: action.payload.title,
        metricValue: action.payload.metricValue,
        metricUnit: action.payload.metricUnit,
        verified: false,
      });
      if (!row) return { ok: false, error: "write_failed" };
      return { ok: true, reversible: true, undo: () => deleteEvidence(row.id) };
    } catch {
      return { ok: false, error: "write_failed" };
    }
  }

  // create_resume_variant is a navigation-level action owned by the resumes
  // screen (the 3-resume limit lives there), so it is not executed here.
  return { ok: false, error: "unsupported_action" };
}

/** Pure draft transforms — no I/O, so undo is just restoring the old draft. */
export function applyToDraft(action: CopilotProtocolAction, draft: ResumeData): ResumeData | null {
  switch (action.type) {
    case "update_summary":
      return { ...draft, summary: action.payload.suggested };
    case "add_skill": {
      const name = action.payload.name.trim();
      if (draft.skills.some((s) => s.name.trim().toLowerCase() === name.toLowerCase()))
        return draft;
      return {
        ...draft,
        skills: [...draft.skills, { id: `sk_${Date.now().toString(36)}`, name }],
      };
    }
    case "replace_bullet": {
      const { experienceId, bulletIndex, suggested } = action.payload;
      const exp = draft.experience.find((e) => e.id === experienceId);
      if (!exp || bulletIndex >= exp.bullets.length) return null;
      return {
        ...draft,
        experience: draft.experience.map((e) =>
          e.id === experienceId
            ? { ...e, bullets: e.bullets.map((b, i) => (i === bulletIndex ? suggested : b)) }
            : e,
        ),
      };
    }
    case "translate_section": {
      if (action.payload.section === "summary") {
        return { ...draft, summary: action.payload.suggested };
      }
      return null;
    }
    case "update_job_target": {
      const jd = action.payload.jobDescription || draft.jobDescription;
      return {
        ...draft,
        targetJob: action.payload.targetJob,
        ...(jd ? { jobDescription: jd } : {}),
      };
    }
    default:
      return null;
  }
}
