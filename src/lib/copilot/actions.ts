/**
 * Copilot Action Protocol (P0).
 *
 * Central Zod schemas + a reducer for pending AI actions. Nothing here writes
 * to the database: the reducer only tracks proposals, applied entries and the
 * undo/redo stacks for the current session. The screen that owns the data does
 * the actual mutation when the user presses Apply, and reverses it on Undo.
 *
 * This sits next to the existing `src/lib/ai-actions.ts` contract (language
 * routing + quick actions) and does not replace it.
 */
import { z } from "zod";

/* -------------------------------- schemas --------------------------------- */

const nonEmpty = z.string().trim().min(1).max(4000);

export const copilotActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("update_summary"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({ original: z.string().default(""), suggested: nonEmpty }),
  }),
  z.object({
    type: z.literal("add_skill"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({ name: nonEmpty, level: z.number().int().min(1).max(5).optional() }),
  }),
  z.object({
    type: z.literal("replace_bullet"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({
      experienceId: nonEmpty,
      bulletIndex: z.number().int().min(0),
      original: z.string().default(""),
      suggested: nonEmpty,
    }),
  }),
  z.object({
    type: z.literal("add_achievement"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({ text: nonEmpty, metric: z.string().default("") }),
  }),
  z.object({
    type: z.literal("translate_section"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({
      section: nonEmpty,
      targetLang: z.enum(["ar", "en"]),
      original: z.string().default(""),
      suggested: nonEmpty,
    }),
  }),
  z.object({
    type: z.literal("create_resume_variant"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({
      title: nonEmpty,
      language: z.enum(["ar", "en"]),
      templateId: z.string().default(""),
    }),
  }),
  z.object({
    type: z.literal("add_evidence"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({
      title: nonEmpty,
      evidenceType: z.enum(["metric", "document", "link", "reference", "note"]),
      metricValue: z.string().default(""),
      metricUnit: z.string().default(""),
      factId: z.string().nullable().default(null),
    }),
  }),
  z.object({
    type: z.literal("update_job_target"),
    reason: nonEmpty,
    evidenceUsed: z.array(z.string()).default([]),
    payload: z.object({ targetJob: nonEmpty, jobDescription: z.string().default("") }),
  }),
]);

export type CopilotProtocolAction = z.infer<typeof copilotActionSchema>;
export type CopilotProtocolActionType = CopilotProtocolAction["type"];

export const COPILOT_ACTION_TYPES: CopilotProtocolActionType[] = [
  "update_summary",
  "add_skill",
  "replace_bullet",
  "add_achievement",
  "translate_section",
  "create_resume_variant",
  "add_evidence",
  "update_job_target",
];

export const ACTION_LABEL: Record<CopilotProtocolActionType, { ar: string; en: string }> = {
  update_summary: { ar: "تحديث الملخص", en: "Update summary" },
  add_skill: { ar: "إضافة مهارة", en: "Add skill" },
  replace_bullet: { ar: "استبدال نقطة خبرة", en: "Replace bullet" },
  add_achievement: { ar: "إضافة إنجاز", en: "Add achievement" },
  translate_section: { ar: "ترجمة قسم", en: "Translate section" },
  create_resume_variant: { ar: "إنشاء نسخة سيرة", en: "Create resume variant" },
  add_evidence: { ar: "إضافة دليل", en: "Add evidence" },
  update_job_target: { ar: "تحديث الوظيفة المستهدفة", en: "Update job target" },
};

/** Every protocol action mutates user data, so all of them need confirmation. */
export const requiresConfirmation = (_action: CopilotProtocolAction): boolean => true;

export type ParseResult =
  | { ok: true; action: CopilotProtocolAction }
  | { ok: false; error: string };

/** Validate untrusted model output. Unknown types and partial JSON are rejected. */
export function parseCopilotAction(input: unknown): ParseResult {
  let candidate = input;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return { ok: false, error: "invalid_json" };
    }
  }
  if (!candidate || typeof candidate !== "object") return { ok: false, error: "not_an_object" };
  // The model is never allowed to opt out of human confirmation.
  const declared = (candidate as { requiresConfirmation?: unknown }).requiresConfirmation;
  if (declared === false) return { ok: false, error: "confirmation_required" };
  const type = (candidate as { type?: unknown }).type;
  if (typeof type !== "string" || !COPILOT_ACTION_TYPES.includes(type as CopilotProtocolActionType)) {
    return { ok: false, error: "unknown_action" };
  }
  const parsed = copilotActionSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "schema_error" };
  }
  return { ok: true, action: parsed.data };
}

/* ------------------------------ pending state ----------------------------- */

export type PendingAction = {
  id: string;
  action: CopilotProtocolAction;
  status: "pending" | "applied" | "dismissed";
  createdAt: number;
};

export type AppliedEntry = {
  id: string;
  action: CopilotProtocolAction;
  /** How to revert this entry — owned by the screen that applied it. */
  undoToken: string;
};

export type CopilotState = {
  pending: PendingAction[];
  undoStack: AppliedEntry[];
  redoStack: AppliedEntry[];
};

export const initialCopilotState: CopilotState = { pending: [], undoStack: [], redoStack: [] };

export type CopilotEvent =
  | { kind: "propose"; action: CopilotProtocolAction; id?: string }
  | { kind: "edit"; id: string; action: CopilotProtocolAction }
  | { kind: "apply"; id: string; undoToken?: string }
  | { kind: "dismiss"; id: string }
  | { kind: "undo" }
  | { kind: "redo" }
  | { kind: "clear" };

const newId = () => `act_${Math.random().toString(36).slice(2, 10)}`;

export function copilotReducer(state: CopilotState, event: CopilotEvent): CopilotState {
  switch (event.kind) {
    case "propose":
      return {
        ...state,
        pending: [
          ...state.pending,
          {
            id: event.id ?? newId(),
            action: event.action,
            status: "pending",
            createdAt: Date.now(),
          },
        ],
      };
    case "edit":
      return {
        ...state,
        pending: state.pending.map((p) =>
          p.id === event.id && p.status === "pending" ? { ...p, action: event.action } : p,
        ),
      };
    case "apply": {
      const target = state.pending.find((p) => p.id === event.id && p.status === "pending");
      if (!target) return state;
      return {
        pending: state.pending.map((p) => (p.id === event.id ? { ...p, status: "applied" } : p)),
        undoStack: [
          ...state.undoStack,
          { id: target.id, action: target.action, undoToken: event.undoToken ?? "" },
        ],
        redoStack: [],
      };
    }
    case "dismiss":
      return {
        ...state,
        pending: state.pending.map((p) => (p.id === event.id ? { ...p, status: "dismissed" } : p)),
      };
    case "undo": {
      const last = state.undoStack[state.undoStack.length - 1];
      if (!last) return state;
      return {
        pending: state.pending,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, last],
      };
    }
    case "redo": {
      const last = state.redoStack[state.redoStack.length - 1];
      if (!last) return state;
      return {
        pending: state.pending,
        undoStack: [...state.undoStack, last],
        redoStack: state.redoStack.slice(0, -1),
      };
    }
    case "clear":
      return initialCopilotState;
    default:
      return state;
  }
}

/** Convenience selectors for the UI. */
export const visiblePending = (s: CopilotState) => s.pending.filter((p) => p.status === "pending");
export const canUndo = (s: CopilotState) => s.undoStack.length > 0;
export const canRedo = (s: CopilotState) => s.redoStack.length > 0;

/** Original / Suggested text pair for a diff card, whatever the action type. */
export function diffOf(action: CopilotProtocolAction): { original: string; suggested: string } {
  switch (action.type) {
    case "update_summary":
      return { original: action.payload.original, suggested: action.payload.suggested };
    case "replace_bullet":
      return { original: action.payload.original, suggested: action.payload.suggested };
    case "translate_section":
      return { original: action.payload.original, suggested: action.payload.suggested };
    case "add_skill":
      return { original: "", suggested: action.payload.name };
    case "add_achievement":
      return {
        original: "",
        suggested: [action.payload.text, action.payload.metric].filter(Boolean).join(" — "),
      };
    case "create_resume_variant":
      return { original: "", suggested: `${action.payload.title} (${action.payload.language})` };
    case "add_evidence":
      return {
        original: "",
        suggested: [action.payload.title, action.payload.metricValue, action.payload.metricUnit]
          .filter(Boolean)
          .join(" · "),
      };
    case "update_job_target":
      return { original: "", suggested: action.payload.targetJob };
    default:
      return { original: "", suggested: "" };
  }
}
