import { Link } from "@tanstack/react-router";
import { Cloud, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/**
 * Privacy status for the anonymous builder. The copy intentionally explains
 * that the default is memory-only and offers an immediate deletion control.
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
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Info className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs leading-relaxed">
        <strong className="block font-semibold">
          {ar ? "بيانات سيرتك لا تُحفظ" : "Your CV data is not retained"}
        </strong>
        {ar
          ? "تُستخدم مؤقتاً داخل جلستك وتُحذف بعد الانتهاء. لا تسجيل ولا بطاقة ائتمان."
          : "It is used temporarily in this session and deleted when you finish. No account or card required."}
      </p>
      <Button size="sm" variant="outline" onClick={clear} type="button">
        <Trash2 className="size-4" aria-hidden="true" />
        {ar ? "حذف بياناتي" : "Delete my data"}
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/auth" search={{ mode: "signup" }}>
          <Cloud className="size-4" aria-hidden="true" />
          {ar ? "حساب اختياري" : "Optional account"}
        </Link>
      </Button>
    </div>
  );
}
