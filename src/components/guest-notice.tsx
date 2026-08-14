import { Link } from "@tanstack/react-router";
import { Cloud, Download, FileText, Info, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { ANONYMOUS_SESSION_TIMEOUT_MINUTES } from "@/lib/guest-store";
import { buildGuestExport, buildGuestPlainText, downloadLocalFile } from "@/lib/guest-transfer";

/**
 * Privacy status for the anonymous builder. The default session is memory-only;
 * this disclosure makes the data location, AI boundary, and expiry explicit.
 */
export function GuestNotice({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { isGuest, resumes, clearGuestSession, sessionRecoveryEnabled, setGuestSessionRecovery } =
    useStore();

  // A null user is the anonymous default while auth is resolving. Rendering the
  // disclosure immediately prevents auth bootstrap latency from becoming the
  // largest contentful paint; it disappears if an authenticated session wins.
  if (!isGuest) return null;

  const clear = () => {
    clearGuestSession();
    window.dispatchEvent(new CustomEvent("seerati:guest-data-deleted"));
  };

  const exportJson = () => {
    const document = buildGuestExport(resumes);
    downloadLocalFile(
      JSON.stringify(document, null, 2),
      "seerati-guest-session-export.json",
      "application/json",
    );
  };

  const exportPlainText = () => {
    downloadLocalFile(
      buildGuestPlainText(resumes),
      "seerati-guest-ats.txt",
      "text/plain;charset=utf-8",
    );
  };

  return (
    <details
      className={`${compact ? "rounded-lg" : "rounded-xl"} border border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100 ${className}`}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 text-xs leading-relaxed [&::-webkit-details-marker]:hidden">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className="block font-semibold">
            {ar ? "جلسة خاصة — لا حفظ افتراضي" : "Private session — no default saving"}
          </strong>
          {ar
            ? "بياناتك في ذاكرة الجلسة فقط. لا قاعدة بيانات ولا localStorage للسيرة."
            : "Your data stays in session memory. No database or resume localStorage by default."}
        </span>
        <span className="text-[11px] font-medium underline underline-offset-2">
          {ar ? "عرض التفاصيل" : "View details"}
        </span>
      </summary>

      <div className="border-t border-emerald-200/80 px-4 pb-4 pt-3 text-xs dark:border-emerald-900/80">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-white/60 p-3 dark:bg-black/10">
            <Info className="mb-1 size-4" aria-hidden="true" />
            <strong className="block">{ar ? "أين توجد البيانات؟" : "Where is it?"}</strong>
            <span>
              {ar
                ? "في ذاكرة الجلسة فقط افتراضياً. الاستعادة في sessionStorage اختيارية وبموافقة منفصلة."
                : "In session memory by default. Optional sessionStorage recovery requires separate consent."}
            </span>
          </div>
          <div className="rounded-lg bg-white/60 p-3 dark:bg-black/10">
            <ShieldCheck className="mb-1 size-4" aria-hidden="true" />
            <strong className="block">{ar ? "ماذا يُرسل إلى AI؟" : "What goes to AI?"}</strong>
            <span>
              {ar
                ? "لا شيء إلا عند طلب المساعدة صراحة، وبالحد الأدنى اللازم."
                : "Nothing unless you explicitly request help, and only the minimum needed."}
            </span>
          </div>
          <div className="rounded-lg bg-white/60 p-3 dark:bg-black/10">
            <Info className="mb-1 size-4" aria-hidden="true" />
            <strong className="block">{ar ? "متى تُحذف؟" : "When is it deleted?"}</strong>
            <span>
              {ar
                ? `بعد ${ANONYMOUS_SESSION_TIMEOUT_MINUTES} دقيقة من عدم النشاط أو عند الحذف.`
                : `After ${ANONYMOUS_SESSION_TIMEOUT_MINUTES} minutes of inactivity or when deleted.`}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={sessionRecoveryEnabled ? "secondary" : "outline"}
            type="button"
            aria-pressed={sessionRecoveryEnabled}
            onClick={() => setGuestSessionRecovery(!sessionRecoveryEnabled)}
          >
            {sessionRecoveryEnabled
              ? ar
                ? "إيقاف استعادة هذه الجلسة"
                : "Stop remembering this tab"
              : ar
                ? "حفظ هذه الجلسة في علامة التبويب"
                : "Remember this tab"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportJson}
            type="button"
            disabled={!resumes.length}
          >
            <Download className="size-4" aria-hidden="true" />
            {ar ? "تصدير JSON محلياً" : "Export JSON locally"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportPlainText}
            type="button"
            disabled={!resumes.length}
          >
            <FileText className="size-4" aria-hidden="true" />
            {ar ? "تصدير نص ATS" : "Export ATS text"}
          </Button>
          <Button size="sm" variant="outline" onClick={clear} type="button">
            <Trash2 className="size-4" aria-hidden="true" />
            {ar ? "حذف بياناتي الآن" : "Delete my data now"}
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/auth" search={{ mode: "signup", next: "/account" }}>
              <Cloud className="size-4" aria-hidden="true" />
              {ar
                ? "حساب اختياري لنسخ يدوي بعد المراجعة"
                : "Optional account for reviewed manual copy"}
            </Link>
          </Button>
        </div>
      </div>
    </details>
  );
}
