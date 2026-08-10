import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n, useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const searchSchema = z.object({ mode: z.enum(["signin", "signup", "reset"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | سيرتي — Seerati" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً في سيرتي لبناء سيرتك الذاتية بالذكاء الاصطناعي." },
      { property: "og:title", content: "الدخول إلى سيرتي" },
      { property: "og:description", content: "حساب واحد يتيح لك حتى ٣ سير ذاتية." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useStore();

  const [tab, setTab] = useState<"signin" | "signup" | "reset">(mode ?? "signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e['email'] = ar ? "بريد إلكتروني غير صحيح" : "Invalid email";
    if (tab !== "reset" && password.length < 6) e['password'] = ar ? "٦ أحرف على الأقل" : "At least 6 characters";
    if (tab === "signup" && name.trim().length < 3) e['name'] = ar ? "اكتب اسمك الكامل" : "Enter your full name";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || busy) return;
    setBusy(true);
    try {
      if (tab === "reset") {
        const res = await resetPassword(email);
        if (res.error) toast.error(res.error);
        else {
          toast.success(ar ? "أرسلنا رابط إعادة التعيين إلى بريدك." : "Reset link sent to your email.");
          setTab("signin");
        }
        return;
      }
      if (tab === "signup") {
        const res = await signUp(email, password, name.trim());
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        if (res.needsConfirmation) {
          toast.success(
            ar
              ? "تم إنشاء الحساب. افتح بريدك وأكّد الرابط ثم سجّل الدخول."
              : "Account created. Confirm the link in your email, then sign in.",
          );
          setTab("signin");
          return;
        }
        toast.success(ar ? "تم إنشاء الحساب" : "Account created");
        navigate({ to: "/onboarding" });
        return;
      }
      const res = await signIn(email, password);
      if ("error" in res) {
        toast.error(ar ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
        return;
      }
      toast.success(ar ? "مرحباً بك" : "Welcome back");
      navigate({ to: res.role === "admin" ? "/admin" : res.onboarded ? "/dashboard" : "/onboarding" });
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="hero-grid flex-1">
        <div className="mx-auto w-full max-w-md px-4 py-14">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <div className="mb-6 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <FileText className="size-5" />
              </span>
              <p className="text-lg font-extrabold">{t("brand")}</p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">{t("auth_signin")}</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">{t("auth_signup")}</TabsTrigger>
                <TabsTrigger value="reset" className="flex-1">{ar ? "استعادة" : "Reset"}</TabsTrigger>
              </TabsList>
            </Tabs>

            <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
              {tab === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("full_name")}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  {errors['name'] && <p className="text-xs text-destructive">{errors['name']}</p>}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" dir="ltr" />
                {errors['email'] && <p className="text-xs text-destructive">{errors['email']}</p>}
              </div>
              {tab !== "reset" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                  {errors['password'] && <p className="text-xs text-destructive">{errors['password']}</p>}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {tab === "signin" ? t("auth_signin") : tab === "signup" ? t("auth_signup") : t("auth_reset")}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
              {ar
                ? "حسابك محفوظ بأمان في السحابة. الحد الأقصى ٣ سير ذاتية لكل حساب."
                : "Your account is stored securely in the cloud. Up to 3 resumes per account."}
            </p>
            <p className="mt-3 text-center text-xs">
              <Link to="/" className="text-primary hover:underline">
                {ar ? "العودة إلى الصفحة الرئيسية" : "Back to home"}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
