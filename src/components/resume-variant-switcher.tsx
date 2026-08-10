/**
 * Variant switcher — base resume, job variants and history in one control.
 *
 * Variants live in `resume_versions`, so branching never creates a new resume
 * row and never consumes the 3-resume limit. Restore always writes a backup
 * snapshot first and asks for confirmation, because it overwrites live data.
 */
import { useState } from "react";
import { Check, GitBranch, History, Loader2, PenLine, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResumeDiffView } from "@/components/resume-diff-view";
import { useI18n } from "@/lib/i18n";
import { diffResumeData } from "@/lib/resume-diff";
import {
  asResumeData,
  renameResumeVersion,
  restoreResumeVersion,
  versionJobId,
  type ResumeVersion,
} from "@/lib/resume-versions";
import type { ResumeData } from "@/lib/types";

type Props = {
  userId: string;
  resumeId: string;
  current: ResumeData;
  versions: ResumeVersion[];
  loading?: boolean;
  onRestored: (data: ResumeData) => void;
  onChanged: () => void;
};

export function ResumeVariantSwitcher({
  userId,
  resumeId,
  current,
  versions,
  loading,
  onRestored,
  onChanged,
}: Props) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [compare, setCompare] = useState<ResumeVersion | null>(null);
  const [confirm, setConfirm] = useState<ResumeVersion | null>(null);
  const [renaming, setRenaming] = useState<ResumeVersion | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const jobVariants = versions.filter((v) => versionJobId(v));
  const history = versions.filter((v) => !versionJobId(v));

  const doRestore = async (version: ResumeVersion) => {
    setBusy(true);
    try {
      const res = await restoreResumeVersion({
        userId,
        resumeId,
        versionId: version.id,
        current,
        lang,
      });
      if (!res.ok) {
        toast.error(ar ? "تعذّرت الاستعادة." : "Restore failed.");
        return;
      }
      onRestored(res.data);
      onChanged();
      setConfirm(null);
      setOpen(false);
      toast.success(
        ar ? "تمت الاستعادة، وحُفظت نسخة احتياطية." : "Restored, and a backup snapshot was saved.",
      );
    } catch {
      toast.error(ar ? "تعذّرت الاستعادة." : "Restore failed.");
    } finally {
      setBusy(false);
    }
  };

  const doRename = async () => {
    if (!renaming) return;
    setBusy(true);
    try {
      await renameResumeVersion(renaming.id, label);
      onChanged();
      setRenaming(null);
    } finally {
      setBusy(false);
    }
  };

  const row = (v: ResumeVersion, isVariant: boolean) => (
    <li key={v.id} className="rounded-xl border border-border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-xs font-bold">
            {isVariant ? (
              <GitBranch className="size-3.5 shrink-0" />
            ) : (
              <History className="size-3.5 shrink-0" />
            )}
            {v.label}
          </p>
          {v.changeSummary && !v.changeSummary.startsWith("variant:") ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{v.changeSummary}</p>
          ) : null}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {new Date(v.createdAt).toLocaleString(ar ? "ar" : "en")}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            title={ar ? "مقارنة" : "Compare"}
            onClick={() => setCompare(v)}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            title={ar ? "إعادة التسمية" : "Rename"}
            onClick={() => {
              setRenaming(v);
              setLabel(v.label);
            }}
          >
            <PenLine className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            title={ar ? "استعادة" : "Restore"}
            onClick={() => setConfirm(v)}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );

  const compareData = compare ? asResumeData(compare.snapshot) : null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <GitBranch className="size-4" />
            {ar ? "النسخ" : "Variants"}
            {versions.length ? <Badge variant="secondary">{versions.length}</Badge> : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent dir={dir} align="end" className="w-80 p-3">
          <p className="text-xs text-muted-foreground">
            {ar
              ? "النسخ محفوظة داخل نفس السيرة ولا تستهلك حدّ الثلاث سير."
              : "Variants live inside this resume and do not consume your 3-resume limit."}
          </p>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {ar ? "جاري التحميل…" : "Loading…"}
            </div>
          ) : versions.length === 0 ? (
            <p className="py-6 text-xs text-muted-foreground">
              {ar
                ? "لا نسخ بعد. أنشئ نسخة من صفحة الوظيفة لتخصيص السيرة لها."
                : "No versions yet. Create one from a job page to tailor this resume."}
            </p>
          ) : (
            <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
              {jobVariants.length ? (
                <div>
                  <h5 className="mb-1.5 text-[11px] font-bold text-muted-foreground">
                    {ar ? "نسخ الوظائف" : "Job variants"}
                  </h5>
                  <ul className="space-y-1.5">{jobVariants.map((v) => row(v, true))}</ul>
                </div>
              ) : null}
              {history.length ? (
                <div>
                  <h5 className="mb-1.5 text-[11px] font-bold text-muted-foreground">
                    {ar ? "السجل" : "History"}
                  </h5>
                  <ul className="space-y-1.5">{history.map((v) => row(v, false))}</ul>
                </div>
              ) : null}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={!!compare} onOpenChange={(o) => !o && setCompare(null)}>
        <DialogContent dir={dir} className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {ar ? `مقارنة الحالي مع «${compare?.label}»` : `Current vs “${compare?.label}”`}
            </DialogTitle>
          </DialogHeader>
          {compareData ? (
            <ResumeDiffView diff={diffResumeData(current, compareData)} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {ar ? "تعذّر قراءة هذه النسخة." : "This version could not be read."}
            </p>
          )}
          {compare ? (
            <Button variant="outline" onClick={() => setConfirm(compare)} className="gap-1.5">
              <RotateCcw className="size-4" />
              {ar ? "استعادة هذه النسخة" : "Restore this version"}
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent dir={dir} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{ar ? "إعادة تسمية النسخة" : "Rename version"}</DialogTitle>
          </DialogHeader>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={90} />
          <Button onClick={doRename} disabled={busy || !label.trim()}>
            {ar ? "حفظ" : "Save"}
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ar ? "استعادة هذه النسخة؟" : "Restore this version?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ar
                ? "سيُستبدل محتوى السيرة الحالي بمحتوى هذه النسخة، وستُحفظ نسخة احتياطية من الحالة الحالية أولاً."
                : "The current resume content will be replaced by this version. A backup of the current state is saved first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (confirm) void doRestore(confirm);
              }}
            >
              {ar ? "استعادة" : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
