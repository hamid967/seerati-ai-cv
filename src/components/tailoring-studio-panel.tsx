import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { FactGraph } from "@/lib/career-facts";
import { createVersionSnapshot } from "@/lib/resume-versions";
import {
  applyTailoringChanges,
  buildTailoringProposal,
  type TailoringApplyResult,
} from "@/lib/tailoring-studio";
import type { Resume } from "@/lib/types";

type Props = {
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumes: Resume[];
  graph: FactGraph;
  lang: "ar" | "en";
  onUpdateResume: (id: string, patch: Partial<Resume>) => Promise<void>;
  onChanged?: () => void;
};

type UndoState = {
  resumeId: string;
  beforeData: Resume["data"];
  beforeTemplateId: string;
  afterData: Resume["data"];
  afterTemplateId: string;
};

export function TailoringStudioPanel({
  userId,
  jobId,
  jobTitle,
  company,
  jobDescription,
  resumes,
  graph,
  lang,
  onUpdateResume,
  onChanged,
}: Props) {
  const ar = lang === "ar";
  const proposal = useMemo(
    () => buildTailoringProposal({ resumes, graph, jobTitle, jobDescription }),
    [resumes, graph, jobTitle, jobDescription],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);

  useEffect(() => {
    setSelectedIds(proposal?.changes.map((change) => change.id) ?? []);
    setUndo(null);
  }, [proposal?.resumeId, jobId]);

  if (!jobDescription.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "استوديو التخصيص" : "Tailoring Studio"}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {ar
            ? "ألصق الوصف الوظيفي أولًا لبناء خطة تخصيص آمنة."
            : "Paste the job description first to build a safe tailoring plan."}
        </CardContent>
      </Card>
    );
  }

  if (!proposal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "استوديو التخصيص" : "Tailoring Studio"}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {ar ? "أنشئ سيرة ذاتية أولًا لبدء التخصيص." : "Create a resume first to start tailoring."}
        </CardContent>
      </Card>
    );
  }

  const resume = resumes.find((item) => item.id === proposal.resumeId);
  if (!resume) return null;

  const toggle = (id: string, enabled: boolean) => {
    setSelectedIds((current) =>
      enabled ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  };

  const apply = async () => {
    if (!selectedIds.length) {
      toast.error(ar ? "اختر تعديلًا واحدًا على الأقل." : "Select at least one change.");
      return;
    }
    setSaving(true);
    try {
      const result: TailoringApplyResult = applyTailoringChanges({
        resume,
        proposal,
        selectedIds,
        jobTitle,
        jobDescription,
      });
      await createVersionSnapshot({
        userId,
        resumeId: resume.id,
        label: ar ? `قبل تخصيص ${jobTitle}` : `Before tailoring ${jobTitle}`,
        summary: `tailoring:${jobId}:before`,
        snapshot: resume.data,
        metadataJobId: jobId,
      });
      await onUpdateResume(resume.id, {
        data: result.data,
        templateId: result.templateId,
      });
      setUndo({
        resumeId: resume.id,
        beforeData: resume.data,
        beforeTemplateId: resume.templateId,
        afterData: result.data,
        afterTemplateId: result.templateId,
      });
      onChanged?.();
      toast.success(
        ar
          ? `تم تطبيق ${result.appliedIds.length} تعديلات مع حفظ نسخة قبل التغيير.`
          : `${result.appliedIds.length} changes applied with a pre-change snapshot.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message === "tailoring_numeric_integrity_failed"
          ? ar
            ? "أوقفنا التخصيص لأن فحص الأرقام لم يجتز بنجاح."
            : "Tailoring was stopped because numeric-integrity validation failed."
          : ar
            ? "تعذر تطبيق التخصيص."
            : "Could not apply tailoring.",
      );
    } finally {
      setSaving(false);
    }
  };

  const undoLast = async () => {
    if (!undo) return;
    setUndoing(true);
    try {
      await createVersionSnapshot({
        userId,
        resumeId: undo.resumeId,
        label: ar ? `نسخة مخصصة — ${jobTitle}` : `Tailored version — ${jobTitle}`,
        summary: `tailoring:${jobId}:after`,
        snapshot: undo.afterData,
        metadataJobId: jobId,
      });
      await onUpdateResume(undo.resumeId, {
        data: undo.beforeData,
        templateId: undo.beforeTemplateId,
      });
      setUndo(null);
      onChanged?.();
      toast.success(ar ? "تم التراجع عن آخر تخصيص." : "Last tailoring change was undone.");
    } catch {
      toast.error(ar ? "تعذر التراجع." : "Could not undo the change.");
    } finally {
      setUndoing(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              {ar ? "استوديو التخصيص" : "Tailoring Studio"}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {ar
                ? `الخطة موجهة إلى ${jobTitle}${company ? ` — ${company}` : ""} باستخدام «${proposal.resumeTitle}».`
                : `Plan for ${jobTitle}${company ? ` — ${company}` : ""} using “${proposal.resumeTitle}”.`}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {ar ? `${proposal.matchedRequirements} متطابق` : `${proposal.matchedRequirements} matched`}
            </Badge>
            {proposal.missingRequirements ? (
              <Badge variant="outline">
                {ar ? `${proposal.missingRequirements} مفقود` : `${proposal.missingRequirements} missing`}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />
          <p>{proposal.disclaimer[lang]}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {proposal.changes.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            {ar
              ? "لا توجد إعادة ترتيبات آمنة مطلوبة حاليًا لهذه النسخة. راجع المتطلبات المفقودة يدويًا ولا تضف إلا ما هو صحيح."
              : "No safe reordering changes are needed for this version. Review missing requirements manually and add only what is true."}
          </div>
        ) : (
          proposal.changes.map((change) => {
            const checked = selectedIds.includes(change.id);
            return (
              <div key={change.id} className="rounded-xl border p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggle(change.id, value === true)}
                    aria-label={change.title[lang]}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold">{change.title[lang]}</p>
                      <Badge variant={checked ? "default" : "outline"}>
                        {checked ? (ar ? "مقبول" : "Approved") : ar ? "مرفوض" : "Rejected"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{change.reason[lang]}</p>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="mb-1 font-semibold text-muted-foreground">
                          {ar ? "قبل" : "Before"}
                        </p>
                        <p className="break-words">{change.before}</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="mb-1 font-semibold text-muted-foreground">
                          {ar ? "بعد" : "After"}
                        </p>
                        <p className="break-words">{change.after}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={() => void apply()} disabled={saving || !proposal.changes.length}>
            <Check className="size-4" />
            {saving
              ? ar
                ? "جارِ التطبيق…"
                : "Applying…"
              : ar
                ? `طبّق المحدد (${selectedIds.length})`
                : `Apply selected (${selectedIds.length})`}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedIds([])}
            disabled={!selectedIds.length || saving}
          >
            <X className="size-4" />
            {ar ? "رفض الكل" : "Reject all"}
          </Button>
          {undo ? (
            <Button variant="secondary" onClick={() => void undoLast()} disabled={undoing}>
              <RotateCcw className="size-4" />
              {undoing ? (ar ? "جارِ التراجع…" : "Undoing…") : ar ? "تراجع" : "Undo"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
