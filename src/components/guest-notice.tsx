import { Link } from "@tanstack/react-router";
import { Cloud, Info, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { ANONYMOUS_SESSION_TIMEOUT_MINUTES } from "@/lib/guest-store";

/**
 * Privacy status for the anonymous builder. The default session is memory-only;
 * this disclosure makes the data location, AI boundary, and expiry explicit.
 */
export function GuestNotice({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, isGuest, clearGuestSession } = useStore();

  if (!ready || !isGuest) return null;

  const clear = () => {
    clearGuestSession();
    window.dispatchEvent(new CustomEvent("seerati:guest-data-deleted"));
  };

  return (
    <details
      className={`rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100 ${className}`}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 text-xs leading-relaxed [&::-webkit-details-marker]:hidden">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className="block font-semibold">
            {ar
              ? "خصوصيتك محفوظة — بيانات هذه السيرة غير محفوظة"
              : "Your privacy is protected — this CV is not retained"}
          </strong>
          {ar ? "تُستخدم مؤقتًا داخل جلستك فقط." : "Used temporarily in this session only."}
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
                ? "في ذاكرة المتصفح فقط، ولا تُكتب في التخزين الدائم."
                : "In browser memory only; not in persistent storage."}
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
          <Button size="sm" variant="outline" onClick={clear} type="button">
            <Trash2 className="size-4" aria-hidden="true" />
            {ar ? "حذف بياناتي الآن" : "Delete my data now"}
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Cloud className="size-4" aria-hidden="true" />
              {ar ? "حساب اختياري للحفظ" : "Optional account to save"}
            </Link>
          </Button>
        </div>
      </div>
    </details>
  );
}
