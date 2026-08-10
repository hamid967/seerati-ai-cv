/**
 * Job application timeline.
 *
 * Events are append-mostly history rows for one job workspace. They are written
 * only *after* an operation succeeds, so the timeline never claims something
 * that did not happen. RLS scopes every row to its owner; these helpers just
 * shape the data.
 */
import { supabase } from "@/integrations/supabase/client";

export const TIMELINE_EVENT_TYPES = [
  "imported",
  "analyzed",
  "resume_variant",
  "cover_letter",
  "applied",
  "followup",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "note",
  "status_change",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const isTimelineEventType = (v: string): v is TimelineEventType =>
  (TIMELINE_EVENT_TYPES as readonly string[]).includes(v);

export const EVENT_LABEL: Record<TimelineEventType, { ar: string; en: string }> = {
  imported: { ar: "استيراد الوظيفة", en: "Job imported" },
  analyzed: { ar: "تحليل الوصف الوظيفي", en: "Description analyzed" },
  resume_variant: { ar: "نسخة سيرة", en: "Resume variant" },
  cover_letter: { ar: "خطاب تقديم", en: "Cover letter" },
  applied: { ar: "تم التقديم", en: "Applied" },
  followup: { ar: "متابعة", en: "Follow-up" },
  interview: { ar: "مقابلة", en: "Interview" },
  offer: { ar: "عرض وظيفي", en: "Offer" },
  rejected: { ar: "رفض", en: "Rejected" },
  withdrawn: { ar: "انسحاب", en: "Withdrawn" },
  note: { ar: "ملاحظة", en: "Note" },
  status_change: { ar: "تغيير الحالة", en: "Status change" },
};

export type TimelineEvent = {
  id: string;
  userId: string;
  jobId: string;
  eventType: TimelineEventType;
  title: string;
  notes: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
};

type EventRow = {
  id: string;
  user_id: string;
  job_id: string;
  event_type: string;
  title: string;
  notes: string | null;
  metadata: unknown;
  occurred_at: string;
  created_at: string;
};

const toEvent = (r: EventRow): TimelineEvent => ({
  id: r.id,
  userId: r.user_id,
  jobId: r.job_id,
  eventType: isTimelineEventType(r.event_type) ? r.event_type : "note",
  title: r.title,
  notes: r.notes ?? "",
  metadata:
    r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata)
      ? (r.metadata as Record<string, unknown>)
      : {},
  occurredAt: r.occurred_at,
  createdAt: r.created_at,
});

export async function listJobEvents(jobId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("job_application_events")
    .select("*")
    .eq("job_id", jobId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as EventRow[] | null) ?? []).map(toEvent);
}

/** Recent events across all of the user's jobs (dashboard / next actions). */
export async function listRecentEvents(userId: string, limit = 40): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("job_application_events")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data as EventRow[] | null) ?? []).map(toEvent);
}

export type TimelineEventInput = {
  jobId: string;
  eventType: TimelineEventType;
  title: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
};

/** Record one event. Call it only after the underlying operation succeeded. */
export async function addJobEvent(
  userId: string,
  input: TimelineEventInput,
): Promise<TimelineEvent | null> {
  if (!isTimelineEventType(input.eventType)) return null;
  const title = input.title.trim();
  if (!title) return null;
  const { data, error } = await supabase
    .from("job_application_events")
    .insert({
      user_id: userId,
      job_id: input.jobId,
      event_type: input.eventType,
      title,
      notes: input.notes?.trim() || null,
      metadata: (input.metadata ?? {}) as never,
      ...(input.occurredAt ? { occurred_at: input.occurredAt } : {}),
    })
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toEvent(data as EventRow) : null;
}

export async function deleteJobEvent(id: string): Promise<void> {
  const { error } = await supabase.from("job_application_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Deep-link targets a timeline entry can carry in its metadata. */
export type EventLink =
  | { kind: "resume"; resumeId: string; versionId?: string }
  | { kind: "cover_letter"; coverLetterId: string }
  | { kind: "interview"; sessionId: string };

export function eventLink(e: TimelineEvent): EventLink | null {
  const m = e.metadata;
  const str = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : undefined);
  const resumeId = str("resumeId");
  if (resumeId) {
    const versionId = str("versionId");
    return { kind: "resume", resumeId, ...(versionId ? { versionId } : {}) };
  }
  const coverLetterId = str("coverLetterId");
  if (coverLetterId) return { kind: "cover_letter", coverLetterId };
  const sessionId = str("interviewSessionId");
  if (sessionId) return { kind: "interview", sessionId };
  return null;
}

/** Interview events with a future-or-recent date, used by the action engine. */
export function upcomingInterviews(
  events: TimelineEvent[],
  jobTitleOf: (jobId: string) => string,
): Array<{ jobId: string; jobTitle: string; occurredAt: string }> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return events
    .filter((e) => e.eventType === "interview" && new Date(e.occurredAt).getTime() >= cutoff)
    .map((e) => ({
      jobId: e.jobId,
      jobTitle: jobTitleOf(e.jobId) || e.title,
      occurredAt: e.occurredAt,
    }));
}
