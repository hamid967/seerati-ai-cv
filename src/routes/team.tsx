import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ArrowLeft, Code2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { ENGINEERING_SQUADS } from "@/lib/org-squads";
import { ENGINEERING_TEAM, TEAM, TEAM_COUNT, agentPrimaryHref, type AgentDef } from "@/lib/team";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "فريق سيرتي | Seerati Career Team" },
      {
        name: "description",
        content: `فريق سيرتي: ${TEAM_COUNT} مختصاً افتراضياً في المسار المهني والهندسة — استشارة، ATS، كتابة، تصميم، بحث وظائف، مقابلات، تدقيق، وإدارة الطلبات، مع مهندسي سيرة تقنية وواجهات ومنصات.`,
      },
      {
        property: "og:title",
        content: `فريق سيرتي — ${TEAM_COUNT} مختصاً يعملون معك`,
      },
      {
        property: "og:description",
        content: "تعرّف على فريق سيرتي المهني والهندسي وكيف يساعد كل مختص في رحلة التقديم.",
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
  assistant: { ar: "مساعد سيرتي", en: "Seerati Assistant" },
};

const CAREER_TEAM = TEAM.filter((a) => a.track !== "engineering");

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
              {ar
                ? `${TEAM_COUNT} أدوار متخصصة · مسار وهندسة`
                : `${TEAM_COUNT} specialist roles · career & eng`}
            </Badge>
            <p className="seerati-hero-brand text-ink-foreground">{ar ? "سيرتي" : "Seerati"}</p>
            <h1 className="mt-3 text-balance-ar text-2xl font-extrabold tracking-tight md:text-4xl">
              {ar
                ? "فريقك المهني والهندسي جاهز للعمل معك"
                : "Your career & engineering team is ready"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-[1.9] text-ink-foreground/75 md:text-base">
              {ar
                ? "مختصو المسار المهني يقودون التقديم، ومهندسون ومطورون يساعدونك على صياغة الخبرات التقنية — فوق مساعد كتابة واحد، بدون اختراع خبرات."
                : "Career specialists guide applications; engineers and developers help frame technical experience — on one writing assistant, with no invented history."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
                asChild
              >
                <Link to="/assistant">
                  {ar ? "ابدأ مع مساعد سيرتي" : "Start with Seerati Assistant"}
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
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {ar ? "المسار المهني" : "Career track"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {ar
                ? "استشارة، ATS، كتابة، تصميم، بحث وظائف، مقابلات، تدقيق، وإدارة الطلبات."
                : "Strategy, ATS, writing, design, job research, interviews, editing, and applications."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAREER_TEAM.map((agent) => (
              <AgentCard key={agent.id} agent={agent} lang={lang} ar={ar} />
            ))}
          </div>
        </section>

        <section className="bg-secondary/40 section-y">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <Badge variant="outline" className="mb-3 gap-1.5">
                  <Code2 className="size-3.5" />
                  {ar ? "هندسة وتطوير" : "Engineering & development"}
                </Badge>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {ar ? "المهندسون والمطورون" : "Engineers & developers"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {ar
                    ? "متخصصون افتراضيون لصياغة السيرة التقنية — مرتبطون بمساعد سيرتي والمحرر."
                    : "Virtual specialists for tech resumes — wired into Seerati Assistant and the builder."}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ENGINEERING_TEAM.map((agent) => (
                <AgentCard key={agent.id} agent={agent} lang={lang} ar={ar} />
              ))}
            </div>

            <div className="mt-12">
              <h3 className="text-lg font-bold">
                {ar ? "فرق التسليم الهندسي" : "Engineering delivery squads"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {ar
                  ? "لمحة عن تخصصات البناء خلف المنتج — ليست قائمة موظفين كاملة."
                  : "A product-facing snapshot of build specialties — not a full headcount roster."}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {ENGINEERING_SQUADS.map((squad) => (
                  <Card key={squad.id} className="border-border/80 surface-editorial">
                    <CardContent className="pt-6">
                      <h4 className="font-bold">{squad.name[lang]}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{squad.focus[lang]}</p>
                      <ul className="mt-4 space-y-1.5">
                        {squad.roles.map((role) => (
                          <li
                            key={role.en}
                            className="flex items-start gap-2 text-sm text-foreground/90"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-accent" />
                            {role[lang]}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 pt-4">
          <div className="rounded-3xl surface-ink p-10 text-center shadow-editorial md:p-14">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              {ar ? "ابدأ رحلتك مع الفريق اليوم" : "Start your journey with the team today"}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-ink-foreground/75">
              {ar
                ? "اختر متخصصاً في مساعد سيرتي، وابنِ سيرتك حتى تصدير PDF."
                : "Pick a specialist in Seerati Assistant, and build through to PDF export."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
                asChild
              >
                <Link to="/assistant">{ar ? "افتح المساعد" : "Open the assistant"}</Link>
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

function AgentCard({ agent, lang, ar }: { agent: AgentDef; lang: "ar" | "en"; ar: boolean }) {
  return (
    <Card className="border-border/80 surface-editorial">
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
          {agent.track === "engineering" && (
            <Badge className="bg-emerald-accent/15 text-[10.5px] text-emerald-accent hover:bg-emerald-accent/15">
              {ar ? "هندسة" : "Engineering"}
            </Badge>
          )}
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
  );
}
