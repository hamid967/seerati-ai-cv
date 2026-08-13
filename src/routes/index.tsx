import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole, Palette } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import { DESIGN_TEAM, agentPrimaryHref } from "@/lib/team";
import heroResume from "@/assets/hero-resume.webp";
import type { CSSProperties } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سيرتي | Seerati — ابنِ سيرة تفوز بالوظيفة" },
      {
        name: "description",
        content:
          "أنشئ سيرتك بالعربية أو الإنجليزية، حسّنها بالذكاء الاصطناعي، وافحص توافقها مع ATS — مجانًا، دون تسجيل، ودون حفظ بياناتك.",
      },
      { property: "og:title", content: "سيرتي | Seerati" },
      {
        property: "og:description",
        content: "ابنِ سيرة تفوز بالوظيفة — قوالب عربية، مساعد كتابة، وتصدير PDF.",
      },
      { property: "og:url", content: "https://hrhbs.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://hrhbs.com/og-image.png" },
      { name: "twitter:image", content: "https://hrhbs.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://hrhbs.com/" },
      { rel: "preload", as: "image", href: heroResume, type: "image/webp", fetchPriority: "high" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const templateCount = defaultTemplates.length;
  const featuredTemplates = defaultTemplates.filter((t) => t.active !== false).slice(0, 6);

  const steps = ar
    ? [
        { t: "اختر قالباً", d: "ابدأ بتصميم يناسب وظيفتك ولغتك." },
        { t: "أضف خبرتك", d: "اكتب ما لديك فعلاً — بدون اختراع أرقام." },
        { t: "صدّر وقدّم", d: "معاينة ثم PDF عربي جاهز للإرسال." },
      ]
    : [
        { t: "Pick a template", d: "Start with a layout that fits your role and language." },
        { t: "Add your experience", d: "Write what you actually have — no invented figures." },
        { t: "Export & apply", d: "Preview, then a submission-ready Arabic PDF." },
      ];

  return (
    <div className="seerati-marketing flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="seerati-ad-hero relative overflow-hidden surface-ink">
          <div className="seerati-ad-hero__glow" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:grid-cols-2 md:py-20">
            <div className="text-start">
              <p className="seerati-hero-brand text-ink-foreground">
                {ar ? "سيرتي | Saudi Future Professional" : "Seerati | Saudi Future Professional"}
              </p>
              <h1 className="mt-3 text-balance-ar text-3xl font-extrabold leading-[1.3] tracking-tight md:text-5xl">
                {ar
                  ? "سيرة سعودية احترافية تفتح لك أبواب الفرص"
                  : "A Saudi professional resume that opens new opportunities"}
              </h1>
              <p className="mt-4 max-w-lg text-[15px] leading-[1.9] text-ink-foreground/75 md:text-base">
                {ar
                  ? "أنشئ سيرتك بالعربية أو الإنجليزية، حسّنها بالذكاء الاصطناعي، وافحص توافقها مع ATS — مجانًا، دون تسجيل، ودون حفظ بياناتك."
                  : "Create your resume in Arabic or English, improve it with AI, and check ATS guidance — free, without registration, and without saving your data."}
              </p>
              <p
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-ink-foreground/80"
                role="note"
              >
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                {ar
                  ? "سيرتك لك وحدك — حذف الجلسة متاح فورًا"
                  : "Your CV stays yours — delete the session anytime"}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
                  asChild
                >
                  <Link to="/resumes/new">
                    {ar ? "ابدأ سيرة" : "Start a resume"}
                    <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="border-none bg-white/10 text-ink-foreground hover:bg-white/20"
                  asChild
                >
                  <Link to="/import">{ar ? "استورد سيرتك" : "Import your CV"}</Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
                  asChild
                >
                  <Link to="/templates">{ar ? "استعرض القوالب" : "Browse templates"}</Link>
                </Button>
              </div>
            </div>

            <div className="seerati-hero-visual seerati-ad-frame">
              <img
                src={heroResume}
                alt={ar ? "سيرة عربية من سيرتي" : "Arabic resume from Seerati"}
                width={1440}
                height={1024}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="mx-auto w-full rounded-2xl border border-white/10 shadow-2xl"
              />
            </div>
          </div>
        </section>

        <section className="section-y mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {ar ? "ثلاث خطوات" : "Three steps"}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.t} className="seerati-clean-step">
                <span className="seerati-clean-step__n">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-secondary/40 section-y">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Palette className="size-3.5" />
                  {ar ? "فريق التصميم" : "Design team"}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                  {ar ? "صور وتصاميم بتأثير موحّد" : "Images and layouts, one system"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {ar
                    ? "مصممون يوحّدون الهوية البصرية والقوالب والمحتوى الإعلاني — لا واجهات تجريبية ولا بيانات وهمية."
                    : "Designers align brand visuals, templates and campaign content — no mock dashboards or filler data."}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/team">{ar ? "كل الفريق" : "Full team"}</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DESIGN_TEAM.map((agent) => (
                <a
                  key={agent.id}
                  href={agentPrimaryHref(agent)}
                  className="seerati-design-card group rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-emerald-accent/40"
                >
                  <span
                    className="seerati-agent-avatar"
                    style={
                      {
                        backgroundColor: `var(--agent-${agent.accent})`,
                        "--agent-accent": `var(--agent-${agent.accent})`,
                      } as CSSProperties
                    }
                  >
                    {agent.initials}
                  </span>
                  <h3 className="mt-4 font-bold group-hover:text-primary">{agent.name[lang]}</h3>
                  <p className="text-xs font-semibold text-emerald-700">{agent.role[lang]}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {agent.blurb[lang]}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section-y mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                {ar ? "القوالب" : "Templates"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {ar
                  ? `${templateCount} قالباً — عربية وإنجليزية، قابلة للتبديل في أي وقت.`
                  : `${templateCount} templates — Arabic and English, switch anytime.`}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/templates">{ar ? "عرض الكل" : "View all"}</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTemplates.map((tpl) => (
              <Link
                key={tpl.id}
                to="/resumes/new"
                search={{ template: tpl.id }}
                className="seerati-ad-frame group rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5"
              >
                <div
                  className="mb-3 h-28 rounded-xl border border-border/60"
                  style={{
                    background: `linear-gradient(160deg, ${tpl.design.accent}22, color-mix(in oklab, var(--emerald-accent) 8%, transparent) 55%, transparent 85%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{tpl.name[lang]}</p>
                  {tpl.atsFriendly && (
                    <Badge variant="outline" className="text-[10px]">
                      ATS
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="seerati-ad-cta rounded-3xl surface-ink p-10 text-center md:p-14">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              {ar ? "ابدأ الآن" : "Start now"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink-foreground/75">
              {ar
                ? "أنشئ سيرتك، ثم سجّل لحفظها ومزامنتها."
                : "Create your resume, then sign up to save and sync."}
            </p>
            <Button
              size="lg"
              className="mt-6 bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
              asChild
            >
              <Link to="/resumes/new">{ar ? "سيرة جديدة" : "New resume"}</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
