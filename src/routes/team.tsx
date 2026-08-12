import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { TEAM, agentPrimaryHref, type AgentDef } from "@/lib/team";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "فريق سيرتي | Seerati Career Team" },
      {
        name: "description",
        content:
          "ثمانية مختصين افتراضيين في سيرتي: استشارة مسار، ATS، كتابة تنفيذية، تصميم، بحث وظائف، مقابلات، تدقيق لغوي، وإدارة الطلبات.",
      },
      { property: "og:title", content: "فريق سيرتي — ثمانية مختصين يعملون معك" },
      {
        property: "og:description",
        content: "تعرّف على فريق سيرتي المهني وكيف يساعد كل مختص في رحلة التقديم.",
      },
      { property: "og:url", content: "https://hrhbs.com/team" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://hrhbs.com/og-image.png" },
      { name: "twitter:image", content: "https://hrhbs.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://hrhbs.com/team" }],
  }),
  component: TeamPage,
});

const SURFACE_LABEL: Record<AgentDef["surfaces"][number], { ar: string; en: string }> = {
  "career-twin": { ar: "الملف المهني", en: "Career profile" },
  jobs: { ar: "مساحات الوظائف", en: "Job spaces" },
  builder: { ar: "محرر السيرة", en: "Resume builder" },
  ats: { ar: "فحص ATS", en: "ATS check" },
  "cover-letter": { ar: "المساعد", en: "Assistant" },
  interview: { ar: "المساعد", en: "Assistant" },
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
};

function TeamPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  return (
    <div className="seerati-marketing flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden surface-ink">
          <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
            <Badge
              variant="secondary"
              className="mb-5 gap-1.5 rounded-full border-none bg-white/10 px-3 py-1 text-[12px] text-ink-foreground"
            >
              <Sparkles className="size-3.5" />
              {ar ? "ثمانية أدوار متخصصة" : "Eight specialist roles"}
            </Badge>
            <p className="seerati-hero-brand text-ink-foreground">{ar ? "سيرتي" : "Seerati"}</p>
            <h1 className="mt-3 text-balance-ar text-2xl font-extrabold tracking-tight md:text-4xl">
              {ar ? "فريقك المهني جاهز للعمل معك" : "Your career team is ready to work with you"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-[1.9] text-ink-foreground/75 md:text-base">
              {ar
                ? "كل مختص دور واضح فوق مساعد كتابة واحد — بدون اختراع خبرات، وبدون وعود بتجاوز أنظمة التوظيف."
                : "Each specialist is a focused role on one writing assistant — no invented experience, and no promises to beat ATS systems."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
                asChild
              >
                <Link to="/resumes/new">
                  {ar ? "ابدأ مع الفريق" : "Start with the team"}
                  <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-none bg-white/10 text-ink-foreground hover:bg-white/20"
                asChild
              >
                <Link to="/career-twin">{ar ? "افتح الملف المهني" : "Open career profile"}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="section-y mx-auto max-w-6xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((agent) => (
              <Card key={agent.id} className="border-border/80 surface-editorial">
                <CardContent className="flex h-full flex-col pt-6">
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
                  <h2 className="mt-4 text-lg font-bold">{agent.name[lang]}</h2>
                  <p className="text-xs font-semibold text-emerald-accent">{agent.role[lang]}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {agent.blurb[lang]}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {agent.surfaces.map((surface) => (
                      <Badge key={surface} variant="outline" className="text-[10.5px] font-medium">
                        {SURFACE_LABEL[surface][lang]}
                      </Badge>
                    ))}
                  </div>
                  <Button className="mt-5 w-full" variant="outline" size="sm" asChild>
                    <a href={agentPrimaryHref(agent)}>
                      {ar ? `ابدأ مع ${agent.name.ar}` : `Work with ${agent.name.en}`}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-3xl surface-ink p-10 text-center shadow-editorial md:p-14">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              {ar ? "ابدأ رحلتك مع الفريق اليوم" : "Start your journey with the team today"}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-ink-foreground/75">
              {ar
                ? "ابنِ ملفك المهني مرة واحدة، ودع المختصين يساعدونك في كل خطوة حتى تصدير PDF."
                : "Build your career profile once, and let the specialists help through every step to PDF export."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
                asChild
              >
                <Link to="/resumes/new">{ar ? "أنشئ سيرتك" : "Build your resume"}</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  {ar ? "إنشاء حساب" : "Create account"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
