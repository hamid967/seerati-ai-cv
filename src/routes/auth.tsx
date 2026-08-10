import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n, useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ mode: z.enum(["signin", "signup", "reset"]).optional() });

type AuthMode = "signin" | "signup" | "reset";
type AuthErrors = Partial<Record<"email" | "password" | "confirm" | "name" | "terms", string>>;

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "بوابة الحساب | سيرتي — Seerati" },
      {
        name: "description",
        content: "سجّل الدخول أو أنشئ حساباً في سيرتي لبناء سيرتك الذاتية بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "بوابة الحساب | سيرتي" },
      { property: "og:description", content: "حساب واحد يتيح لك حتى ٣ سير ذاتية." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function passwordScore(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

function AuthPage() {
  const t = useT();
  const { lang, toggle } = useI18n();
  const ar = lang === "ar";
  const { mode: modeFromSearch } = Route.useSearch();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useStore();

  const [tab, setTab] = useState<AuthMode>(modeFromSearch ?? "signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});

  useEffect(() => {
    if (modeFromSearch) setTab(modeFromSearch);
  }, [modeFromSearch]);

  const setMode = (next: AuthMode) => {
    setTab(next);
    setErrors({});
    void navigate({ to: "/auth", search: { mode: next }, replace: true });
  };

  const strength = useMemo(() => passwordScore(password), [password]);
  const strengthLabel =
    strength <= 1
      ? t("auth_strength_weak")
      : strength === 2
        ? t("auth_strength_fair")
        : strength === 3
          ? t("auth_strength_good")
          : t("auth_strength_strong");

  const validate = () => {
    const e: AuthErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = t("auth_err_email");
    if (tab !== "reset") {
      if (tab === "signup") {
        if (password.length < 8 || strength < 2) e.password = t("auth_err_password");
        if (confirm !== password) e.confirm = t("auth_err_confirm");
        if (name.trim().length < 3) e.name = t("auth_err_name");
        if (!acceptedTerms) e.terms = t("auth_err_terms");
      } else if (password.length < 6) {
        e.password = t("auth_err_password_short");
      }
    }
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
          toast.success(t("auth_ok_reset"));
          setMode("signin");
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
          toast.success(t("auth_ok_confirm_email"));
          setMode("signin");
          return;
        }
        toast.success(t("auth_ok_created"));
        navigate({ to: "/onboarding" });
        return;
      }
      const res = await signIn(email, password);
      if ("error" in res) {
        toast.error(t("auth_err_credentials"));
        return;
      }
      toast.success(t("auth_ok_welcome"));
      navigate({
        to: res.role === "admin" ? "/admin" : res.onboarded ? "/dashboard" : "/onboarding",
      });
    } finally {
      setBusy(false);
    }
  };

  const title =
    tab === "signup"
      ? t("auth_signup_title")
      : tab === "reset"
        ? t("auth_reset_title")
        : t("auth_signin_title");
  const subtitle =
    tab === "signup"
      ? t("auth_signup_sub")
      : tab === "reset"
        ? t("auth_reset_sub")
        : t("auth_signin_sub");

  const benefits = [t("auth_benefit_1"), t("auth_benefit_2"), t("auth_benefit_3")];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden surface-ink text-ink-foreground lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(55% 50% at 80% 15%, oklch(0.72 0.13 165 / 0.4), transparent 70%), radial-gradient(40% 45% at 10% 90%, oklch(0.55 0.08 250 / 0.35), transparent 70%)",
          }}
        />
        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <Link to="/" className="inline-flex items-center gap-2 self-start">
            <span className="grid size-10 place-items-center rounded-xl bg-white/12 text-ink-foreground ring-1 ring-white/15">
              <FileText className="size-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              {t("brand")}
              <span className="ms-1.5 text-xs font-medium text-ink-foreground/65">Seerati</span>
            </span>
          </Link>

          <div className="max-w-md space-y-6">
            <Badge className="gap-1.5 rounded-full border-none bg-white/10 px-3 py-1 text-[12px] text-ink-foreground hover:bg-white/10">
              <Sparkles className="size-3.5 text-emerald-accent" />
              {t("auth_portal_badge")}
            </Badge>
            <div>
              <h1 className="text-balance-ar text-4xl font-extrabold leading-[1.25] tracking-tight xl:text-5xl">
                {t("auth_panel_title")}
              </h1>
              <p className="mt-4 text-[15px] leading-[1.9] text-ink-foreground/75">
                {t("auth_panel_sub")}
              </p>
            </div>
            <ul className="space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-foreground/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-accent/15 text-emerald-accent">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-2 text-xs text-ink-foreground/55">
            <ShieldCheck className="size-3.5" />
            {t("auth_secure_note")}
          </p>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col bg-background">
        <div className="hero-grid absolute inset-0 opacity-60" aria-hidden />
        <header className="relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <FileText className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              {t("brand")}
              <span className="ms-1 text-xs font-medium text-muted-foreground">Seerati</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 lg:ms-auto">
            <Button variant="ghost" size="sm" onClick={toggle} aria-label={t("language")}>
              <Globe className="size-4" />
              {lang === "ar" ? "EN" : "ع"}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">{t("auth_back_home")}</Link>
            </Button>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-7 space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>

            {tab !== "reset" && (
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    tab === "signin"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("auth_signin")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    tab === "signup"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("auth_signup")}
                </button>
              </div>
            )}

            <form
              className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7"
              onSubmit={submit}
              noValidate
            >
              <div className="space-y-4">
                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("full_name")}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder={ar ? "أحمد محمد" : "Ahmed Mohammed"}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    dir="ltr"
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {tab !== "reset" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password">{t("password")}</Label>
                      {tab === "signin" && (
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline"
                          onClick={() => setMode("reset")}
                        >
                          {t("forgot")}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={tab === "signup" ? "new-password" : "current-password"}
                        dir="ltr"
                        className="pe-11"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 end-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? t("auth_hide_password") : t("auth_show_password")
                        }
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                    {tab === "signup" && password.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{t("auth_strength")}</span>
                          <span
                            className={cn(
                              strength <= 1 && "text-destructive",
                              strength === 2 && "text-amber-600",
                              strength >= 3 && "text-emerald-accent",
                            )}
                          >
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={cn(
                                "h-1.5 rounded-full bg-muted",
                                strength >= step && strength <= 1 && "bg-destructive",
                                strength >= step && strength === 2 && "bg-amber-500",
                                strength >= step && strength >= 3 && "bg-emerald-accent",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">{t("auth_password_confirm")}</Label>
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      dir="ltr"
                    />
                    {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
                  </div>
                )}

                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                      <Checkbox
                        checked={acceptedTerms}
                        onCheckedChange={(v) => setAcceptedTerms(v === true)}
                        className="mt-0.5"
                        aria-label={t("auth_terms")}
                      />
                      <span>
                        {t("auth_terms_prefix")}{" "}
                        <Link to="/terms" className="font-medium text-primary hover:underline">
                          {t("auth_terms")}
                        </Link>{" "}
                        {t("auth_and")}{" "}
                        <Link to="/privacy" className="font-medium text-primary hover:underline">
                          {t("auth_privacy")}
                        </Link>
                      </span>
                    </label>
                    {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("auth_submit_busy")}
                    </>
                  ) : tab === "signin" ? (
                    t("auth_signin")
                  ) : tab === "signup" ? (
                    t("auth_signup")
                  ) : (
                    t("auth_reset")
                  )}
                </Button>

                {tab === "reset" && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode("signin")}
                  >
                    {t("auth_back_signin")}
                  </Button>
                )}
              </div>
            </form>

            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground lg:hidden">
              {t("auth_secure_note")}
            </p>
          </div>
        </main>
      </section>
    </div>
  );
}
