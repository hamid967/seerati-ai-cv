import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import type { Resume } from "@/lib/types";
import { syntheticReadiness, updateSyntheticFieldMetadata } from "@/modules/synthetic-resume";

type Props = {
  resume: Resume;
  onUpdate: (patch: Partial<Resume>) => Promise<void> | void;
  compact?: boolean;
};

function readResumeValue(path: string, resume: Resume) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[key];
    return undefined;
  }, resume.data);
}

const labelForPath = (path: string, lang: "ar" | "en") => {
  const labels: Record<string, { ar: string; en: string }> = {
    "personal.fullName": { ar: "الاسم الكامل", en: "Full name" },
    "personal.jobTitle": { ar: "المسمى المستهدف", en: "Target title" },
    "personal.email": { ar: "البريد الإلكتروني", en: "Email" },
    "personal.phone": { ar: "رقم الجوال", en: "Phone number" },
    summary: { ar: "الملخص المهني", en: "Professional summary" },
    "experience.0.role": { ar: "المسمى في الخبرة", en: "Experience title" },
    "experience.0.company": { ar: "جهة العمل", en: "Employer" },
    "education.0.degree": { ar: "المؤهل", en: "Degree" },
    "education.0.school": { ar: "الجامعة أو المعهد", en: "University or school" },
  };
  return labels[path]?.[lang] ?? path;
};

export function SyntheticSampleNotice({ resume, onUpdate, compact = false }: Props) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const metadata = resume.syntheticSample;
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");
  const readiness = useMemo(() => (metadata ? syntheticReadiness(metadata) : null), [metadata]);

  if (!metadata || !readiness) return null;
  const nextCorePath = metadata.coreFieldPaths.find(
    (path) => metadata.fieldMap[path]?.status !== "user-confirmed",
  );
  const total = Object.keys(metadata.fieldMap).length || 1;
  const progress = Math.round((readiness.confirmedFields / total) * 100);

  const confirmNextField = async () => {
    if (!nextCorePath || !acknowledged) return;
    const existing = metadata.fieldMap[nextCorePath];
    const currentValue = readResumeValue(nextCorePath, resume);
    if (
      !existing ||
      typeof currentValue !== "string" ||
      currentValue.trim() === existing.value.trim()
    ) {
      setConfirmationError(
        ar
          ? "عدّل هذا الحقل في المحرر أولاً؛ لا يمكن اعتماد قيمة النموذج التجريبي نفسها."
          : "Edit this field in the editor first; the original sample value cannot be confirmed.",
      );
      return;
    }
    await onUpdate({
      syntheticSample: updateSyntheticFieldMetadata(metadata, nextCorePath, currentValue.trim()),
    });
    setConfirmationError("");
    setAcknowledged(false);
  };

  return (
    <aside
      className={`border border-amber-300 bg-amber-50/80 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100 ${compact ? "rounded-xl p-3" : "rounded-2xl p-4"}`}
      data-testid="synthetic-sample-notice"
      aria-label={ar ? "حالة بيانات النموذج التجريبي" : "Sample resume data status"}
    >
      <div className="flex flex-wrap items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">
              {ar
                ? "هذا نموذج تجريبي يحتوي على بيانات وهمية"
                : "This sample contains fictional placeholder information"}
            </p>
            <Badge variant="outline" className="border-amber-500/60 bg-transparent text-inherit">
              <Sparkles className="size-3" aria-hidden="true" />
              {ar ? "بيانات تجريبية" : "Sample data"}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-relaxed">
            {ar
              ? "استبدل المعلومات ببياناتك الحقيقية واعتمدها قبل التصدير أو استخدام ATS النهائي. لا تتحول هذه البيانات إلى حقائق تلقائياً."
              : "Replace this information with your verified details before export or a final ATS check. Sample data never becomes verified automatically."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span>{ar ? "جاهزية بياناتك" : "Your data readiness"}</span>
            <span aria-live="polite">
              {ar
                ? `${readiness.confirmedFields} مؤكدة · ${readiness.sampleFieldsRemaining} تجريبية متبقية`
                : `${readiness.confirmedFields} confirmed · ${readiness.sampleFieldsRemaining} samples remaining`}
            </span>
          </div>
          <Progress
            value={progress}
            className="mt-2 h-2"
            aria-label={ar ? "تقدم استبدال البيانات" : "Data replacement progress"}
          />
        </div>
        <Badge variant={readiness.state === "ready-for-export" ? "default" : "secondary"}>
          {readiness.state === "ready-for-export"
            ? ar
              ? "جاهز للتصدير"
              : "Ready for export"
            : ar
              ? "يحتاج مراجعة"
              : "Needs review"}
        </Badge>
      </div>

      {!compact && nextCorePath ? (
        <div className="mt-4 border-t border-amber-300/70 pt-3 dark:border-amber-700/70">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardCheck className="size-4" aria-hidden="true" />
            {ar
              ? `الخطوة التالية: استبدل ${labelForPath(nextCorePath, lang)}`
              : `Next: replace ${labelForPath(nextCorePath, lang)}`}
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
            />
            <span>
              {ar
                ? "أؤكد أنني استبدلت هذا الحقل ببياناتي الحقيقية وراجعت صحتها."
                : "I confirm that I replaced this field with my verified information and reviewed it."}
            </span>
          </label>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            disabled={!acknowledged}
            onClick={() => void confirmNextField()}
          >
            <CheckCircle2 className="size-4" />
            {ar ? "اعتماد الحقل بعد المراجعة" : "Confirm reviewed field"}
          </Button>
          {confirmationError ? (
            <p className="mt-2 text-xs font-medium" role="alert">
              {confirmationError}
            </p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
