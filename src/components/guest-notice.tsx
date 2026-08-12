import { Link } from "@tanstack/react-router";
import { Cloud, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/**
 * Shown on builder surfaces while there is no account: explains that the draft
 * lives in this browser until the guest signs up (the post-template flow).
 */
export function GuestNotice({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, isGuest } = useStore();

  if (!ready || !isGuest) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 ${className}`}
    >
      <Info className="size-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
        {ar
          ? "أنت تعمل كزائر — سيرتك محفوظة في هذا المتصفح فقط. أنشئ حساباً لحفظها في السحابة والمتابعة."
          : "You are working as a guest — this resume is stored in this browser only. Create an account to save it in the cloud and continue."}
      </p>
      <Button size="sm" variant="outline" asChild>
        <Link to="/auth" search={{ mode: "signup" }}>
          <Cloud className="size-4" />
          {ar ? "إنشاء حساب" : "Create account"}
        </Link>
      </Button>
    </div>
  );
}
