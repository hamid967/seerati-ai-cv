/**
 * Application timeline for one job workspace.
 *
 * Events are recorded by the system only after an action succeeds, plus manual
 * notes and status entries the user adds here. Entries carrying ids in their
 * metadata deep-link to the related resume variant, cover letter or interview.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CircleDot,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import {
  EVENT_LABEL,
  TIMELINE_EVENT_TYPES,
  addJobEvent,
  deleteJobEvent,
  eventLink,
  type TimelineEvent,
  type TimelineEventType,
} from "@/lib/job-timeline";

const ICON: Partial<Record<TimelineEventType, typeof CircleDot>> = {
  resume_variant: FileText,
  cover_letter: Mail,
  interview: CalendarClock,
  note: MessageSquare,
};

type Props = {
  userId: string;
  jobId: string;
  events: TimelineEvent[];
  loading?: boolean;
  onChanged: () => void;
};

export function ApplicationTimeline({ userId, jobId, events, loading, onChanged }: Props) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<TimelineEventType>("note");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addJobEvent(userId, {
        jobId,
        eventType: type,
        title,
        notes,
        ...(when ? { occurredAt: new Date(when).toISOString() } : {}),
      });
      setTitle("");
      setNotes("");
      setWhen("");
      setAdding(false);
      onChanged();
      toast.success(ar ? "تمت إضافة الحدث." : "Event added.");
    } catch {
      toast.error(ar ? "تعذّرت إضافة الحدث." : "Could not add the event.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteJobEvent(id);
      onChanged();
    } catch {
      toast.error(ar ? "تعذّر الحذف." : "Delete failed.");
    }
  };

  return (
    <Card dir={dir}>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">{ar ? "سجل الطلب" : "Application timeline"}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {ar
              ? "يُسجَّل الحدث بعد نجاح الإجراء فعلياً."
              : "Events are recorded only after an action actually succeeds."}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAdding((v) => !v)}>
          <Plus className="size-4" />
          {ar ? "إضافة" : "Add"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {adding ? (
          <div className="space-y-2 rounded-2xl border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={type} onValueChange={(v) => setType(v as TimelineEventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ar ? EVENT_LABEL[t].ar : EVENT_LABEL[t].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={ar ? "العنوان، مثل: مقابلة أولية" : "Title, e.g. First interview"}
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={ar ? "ملاحظات (اختياري)" : "Notes (optional)"}
            />
            <Button size="sm" onClick={submit} disabled={busy || !title.trim()}>
              {ar ? "حفظ الحدث" : "Save event"}
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {ar ? "جاري التحميل…" : "Loading…"}
          </div>
        ) : events.length === 0 ? (
          <p className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
            {ar
              ? "لا أحداث بعد. ستُسجَّل تلقائياً عند تحليل الوظيفة أو إنشاء نسخة أو خطاب، ويمكنك إضافة ملاحظة يدوياً."
              : "No events yet. They are logged automatically when you analyze the job or create a variant or letter, and you can add a note manually."}
          </p>
        ) : (
          <ol className="relative space-y-3 border-border ps-5 before:absolute before:inset-y-1 before:start-1.5 before:w-px before:bg-border">
            {events.map((e) => {
              const Icon = ICON[e.eventType] ?? CircleDot;
              const link = eventLink(e);
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -start-[1.05rem] top-1 grid size-3.5 place-items-center rounded-full bg-background">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </span>
                  <div className="rounded-xl border border-border p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold">{e.title}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {ar ? EVENT_LABEL[e.eventType].ar : EVENT_LABEL[e.eventType].en}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(e.occurredAt).toLocaleString(ar ? "ar" : "en")}
                        </p>
                        {e.notes ? (
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-[1.8] text-muted-foreground">
                            {e.notes}
                          </p>
                        ) : null}
                        {link?.kind === "resume" ? (
                          <Link
                            to="/resumes/$id/edit"
                            params={{ id: link.resumeId }}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            {ar ? "فتح السيرة" : "Open resume"}
                          </Link>
                        ) : null}
                        {link?.kind === "cover_letter" ? (
                          <Link
                            to="/cover-letters"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            {ar ? "فتح الخطاب" : "Open letter"}
                          </Link>
                        ) : null}
                        {link?.kind === "interview" ? (
                          <Link
                            to="/interview"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            {ar ? "فتح جلسة المقابلة" : "Open interview session"}
                          </Link>
                        ) : null}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0"
                        onClick={() => void remove(e.id)}
                        title={ar ? "حذف" : "Delete"}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
