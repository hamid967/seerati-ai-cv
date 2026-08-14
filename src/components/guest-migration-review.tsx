import { useState } from "react";
import { CloudUpload, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/**
 * Post-auth review surface for the same-tab guest session. It never runs a
 * migration automatically: a signed-in user must acknowledge the exact copy
 * and press the transfer action. Local state is retained by default.
 */
export function GuestMigrationReview() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { guestMigrationPreview, migrateGuestResumes } = useStore();
  const [confirmed, setConfirmed] = useState(false);
  const [deleteLocal, setDeleteLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ migrated: number; skipped: number } | null>(null);

  if (!guestMigrationPreview.requested) return null;

  const canCopy = guestMigrationPreview.transferable.length > 0;
  const copy = async () => {
    if (!confirmed || !canCopy || busy) return;
    setBusy(true);
    try {
      const next = await migrateGuestResumes({
        confirmed,
        deleteLocalAfterMigration: deleteLocal,
      });
      if (next.error) {
        toast.error(
          next.error === "account_limit"
            ? ar
              ? "لا توجد مساحة كافية في الحساب لنسخ السيرة."
              : "Your account does not have space for this resume."
            : ar
              ? "تعذّر نسخ السيرة. بقيت بيانات الضيف المحلية كما هي."
              : "The resume could not be copied. Your local guest data remains unchanged.",
        );
        return;
      }
      setResult(next);
      toast.success(
        ar
          ? `تم نسخ ${next.migrated} سيرة إلى حسابك بعد موافقتك.`
          : `${next.migrated} resume was copied to your account after your confirmation.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-6 border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudUpload className="size-4" />
          {ar ? "مراجعة النسخ اليدوي من جلسة الضيف" : "Review manual copy from your guest session"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-relaxed text-muted-foreground">
          {ar
            ? "عُثر على بيانات سيرة في ذاكرة علامة التبويب الحالية فقط. لم تُنسخ هذه البيانات عند تسجيلك أو إنشاء حسابك. راجعها هنا ثم اختر النسخ صراحةً إن أردت."
            : "A resume exists only in this tab’s guest memory. It was not copied when you signed in or created an account. Review it here and choose an explicit copy only if you want one."}
        </p>

        <div className="rounded-lg border border-emerald-200 bg-background/80 p-3 dark:border-emerald-900">
          <p className="font-semibold">
            {ar ? "ما يمكن نسخه الآن" : "What can be copied now"}:{" "}
            {guestMigrationPreview.transferable.length}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {guestMigrationPreview.transferable.map((resume) => (
              <li key={resume.id}>
                {resume.title} —{" "}
                {resume.language === "ar" ? (ar ? "عربية" : "Arabic") : ar ? "إنجليزية" : "English"}
              </li>
            ))}
          </ul>
          {guestMigrationPreview.blocked.length > 0 ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              {ar
                ? `${guestMigrationPreview.blocked.length} سيرة لن تُنسخ بسبب حد الحساب، ولن تُحذف محلياً.`
                : `${guestMigrationPreview.blocked.length} resume cannot be copied because of the account limit and will remain local.`}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 text-xs leading-relaxed">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
            aria-label={ar ? "تأكيد النسخ اليدوي" : "Confirm manual copy"}
          />
          <span>
            {ar
              ? "أفهم أن الضغط على زر النسخ فقط هو ما ينشئ نسخة من هذه السيرة داخل حسابي. لا توجد أي وعود بنتيجة توظيف."
              : "I understand that only the copy button will create a copy of this resume in my account. This does not promise any employment outcome."}
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 text-xs leading-relaxed">
          <Checkbox
            checked={deleteLocal}
            onCheckedChange={(value) => setDeleteLocal(value === true)}
            aria-label={ar ? "حذف النسخة المحلية بعد النسخ" : "Delete local copy after copying"}
          />
          <span>
            {ar
              ? "بعد نسخ كل السيرة بنجاح، احذف النسخة المحلية وبيانات استعادة هذه الجلسة. اترك هذا الخيار غير محدد للاحتفاظ بالنسخة المحلية."
              : "After every resume copies successfully, delete the local copy and this-tab recovery data. Leave this unchecked to retain the local copy."}
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => void copy()}
            disabled={!confirmed || !canCopy || busy}
          >
            <ShieldCheck className="size-4" />
            {busy
              ? ar
                ? "جارِ النسخ…"
                : "Copying…"
              : ar
                ? "انسخ السيرة المحددة إلى حسابي"
                : "Copy this reviewed resume to my account"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {ar
              ? "النسخ اختياري ولا يبدأ تلقائياً."
              : "Copying is optional and never starts automatically."}
          </span>
        </div>

        {result ? (
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
            {ar
              ? `تم نسخ ${result.migrated} سيرة. المتبقي محلياً: ${result.skipped}.`
              : `${result.migrated} resume copied. Remaining locally: ${result.skipped}.`}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
