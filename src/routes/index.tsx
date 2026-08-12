import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Briefcase,
  CheckCircle2,
  FileDown,
  FolderKanban,
  Gift,
  Languages,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
  Target,
  UserSquare2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import { TEAM, TEAM_COUNT } from "@/lib/team";
import { LandingCareerVisual } from "@/components/landing-experience";
import heroResume from "@/assets/hero-resume.jpg";
import type { CSSProperties } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سيرتي | Seerati — استوديو مهني رقمي" },
      {
        name: "description",
        content: `سيرتي استوديو مهني رقمي: فريق من ${TEAM_COUNT} مختصاً افتراضياً في المسار والهندسة يساعدونك على بناء ملف مهني موحّد، متابعة وظائفك، ومطابقة سيرتك مع كل وصف وظيفي.`,
      },
      { property: "og:title", content: "سيرتي | Seerati — استوديو مهني رقمي" },
      {
        property: "og:description",
        content:
          "فريق متخصص يعمل معك: من الملف المهني الموحّد إلى حزمة التقديم وفحص ATS وتصدير PDF عربي.",
      },
      { property: "og:url", content: "https://hrhbs.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://hrhbs.com/og-image.png" },
      { name: "twitter:image", content: "https://hrhbs.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://hrhbs.com/" }],
  }),
  component: Landing,
});

function Landing() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const templateCount = defaultTemplates.length;
  const atsTemplateCount = defaultTemplates.filter((template) => template.atsFriendly).length;
  const featuredTemplates = defaultTemplates.slice(0, 6);

  const trustItems = ar
    ? [
        { icon: Gift, t: "أول سيرة مجاناً للأبد" },
        { icon: Languages, t: "عربية وإنجليزية أصيلة" },
        { icon: ShieldCheck, t: "فحص ATS إرشادي واضح" },
        { icon: LayoutTemplate, t: `${templateCount} قالباً قابلاً للتبديل` },
      ]
    : [
        { icon: Gift, t: "First resume free forever" },
        { icon: Languages, t: "Native Arabic & English" },
        { icon: ShieldCheck, t: "Clear rule-based ATS check" },
        { icon: LayoutTemplate, t: `${templateCount} switchable templates` },
      ];

  const steps = ar
    ? [
        {
          t: "ابنِ ملفك المهني الموحّد",
          d: "أدخل خبراتك وإنجازاتك ومهاراتك مرة واحدة — تُستخدم في كل سيرة ومهمة لاحقاً.",
          visual: ["الهوية المهنية", "الخبرات", "المهارات", "الإنجازات"],
        },
        {
          t: "افتح مساحة لكل وظيفة",
          d: "احفظ وصف الوظيفة، وتابع حالتها من محفوظة إلى مقابلة أو عرض.",
          visual: ["محفوظة", "قيد التقديم", "مقابلة", "عرض"],
        },
        {
          t: "طابق وجهّز",
          d: "قارن ملفك مع متطلبات الوظيفة، واعرف الفجوات الحقيقية قبل التقديم.",
          visual: ["متطلبات", "مطابقة", "فجوات", "تحضير"],
        },
        {
          t: "صدّر حزمة التقديم",
          d: "سيرة مخصصة، فحص ATS، ونسخة PDF عربية جاهزة للإرسال.",
          visual: ["قالب", "ATS", "معاينة", "PDF"],
        },
      ]
    : [
        {
          t: "Build your unified career profile",
          d: "Add your experience, achievements and skills once — reused across every resume and task.",
          visual: ["Identity", "Experience", "Skills", "Impact"],
        },
        {
          t: "Open a workspace per job",
          d: "Save the job description and track its status from saved to interview or offer.",
          visual: ["Saved", "Applied", "Interview", "Offer"],
        },
        {
          t: "Match & prepare",
          d: "Compare your profile against the role's requirements and see the real gaps first.",
          visual: ["Requirements", "Match", "Gaps", "Prep"],
        },
        {
          t: "Export your application pack",
          d: "A tailored resume, an ATS check, and a submission-ready Arabic PDF.",
          visual: ["Template", "ATS", "Preview", "PDF"],
        },
      ];

  const capabilities = [
    {
      icon: UserSquare2,
      title: ar ? "الملف المهني الموحّد" : "Unified career profile",
      body: ar
        ? "مصدر واحد لخبراتك وإنجازاتك ومهاراتك، تستخدمه كل سيرة ذاتية ومهمة تكتبها لاحقاً."
        : "One source of truth for your experience and skills, reused across every resume you build.",
    },
    {
      icon: FolderKanban,
      title: ar ? "مساحات الوظائف" : "Job spaces",
      body: ar
        ? "مساحة عمل مستقلة لكل وظيفة تتقدّم لها: الوصف، الحالة، والمهام التالية في مكان واحد."
        : "A dedicated workspace per role you're pursuing: description, status and next tasks in one place.",
    },
    {
      icon: Target,
      title: ar ? "مطابقة الوصف الوظيفي" : "Job description matching",
      body: ar
        ? "تحليل يقارن ملفك بمتطلبات الوظيفة ويوضح ما هو متوفر وما هو ناقص فعلاً."
        : "An analysis that compares your profile to a role's requirements and shows real gaps.",
    },
    {
      icon: Briefcase,
      title: ar ? "حزمة التقديم" : "Application pack",
      body: ar
        ? "سيرة ذاتية مخصصة للوظيفة مع ملاحظات التحضير، مبنية من ملفك المهني."
        : "A resume tailored to the role, built from your career profile, with prep notes.",
    },
    {
      icon: CheckCircle2,
      title: ar ? "تحليل ATS" : "ATS analysis",
      body: ar
        ? "فحص قواعدي واضح لجاهزية سيرتك لأنظمة تتبع المتقدمين — إرشادي وليس ضماناً."
        : "A clear, rule-based readiness check for applicant tracking systems — guidance, not a guarantee.",
    },
    {
      icon: FileDown,
      title: ar ? "تصدير PDF عربي" : "Arabic PDF export",
      body: ar
        ? "معاينة طباعة دقيقة وتنزيل PDF يحافظ على الاتجاه والخط العربي بشكل سليم."
        : "An accurate print preview and a PDF export that keeps Arabic direction and typography correct.",
    },
  ];

  const faq = ar
    ? [
        {
          q: "من هو فريق سيرتي؟",
          a: `${TEAM_COUNT} مختصاً افتراضياً — من استشارية المسار المهني إلى مهندسي السيرة التقنية — يعملون كأدوار متخصصة فوق مساعد كتابة واحد، كل منهم مسؤول عن جزء واضح من رحلتك.`,
        },
        {
          q: "هل القوالب متوافقة مع أنظمة التوظيف؟",
          a: `${atsTemplateCount} من أصل ${templateCount} قالباً مميزة داخل النظام كقوالب ATS محافظة وفق قواعد سيرتي. اختر القالب المناسب للوظيفة، والنتيجة تبقى إرشادية وليست ضماناً لقبول نظام جهة التوظيف.`,
        },
        {
          q: "كيف يعمل فحص ATS؟",
          a: "الفحص أولي ويعتمد على قواعد واضحة: اكتمال معلومات الاتصال، طول الملخص، وجود الأقسام الأساسية، عدد نقاط الإنجاز، ووجود أرقام قابلة للقياس. النتيجة إرشادية وليست وعداً بالقبول.",
        },
        {
          q: "هل مطابقة الوصف الوظيفي تضمن القبول؟",
          a: "لا. المطابقة تقارن النص فقط وتوضح لك الفجوات الظاهرة؛ القرار النهائي دائماً لجهة التوظيف.",
        },
        {
          q: "ما حد السير الذاتية؟",
          a: "٣ سير ذاتية لكل حساب في هذه المرحلة، مع إمكانية الاستنساخ والتعديل داخل الحد.",
        },
      ]
    : [
        {
          q: "Who is the Seerati team?",
          a: `${TEAM_COUNT} virtual specialists — from a career strategist to tech resume engineers — running as focused roles on one writing assistant, each owning a clear part of your journey.`,
        },
        {
          q: "Are the templates ATS friendly?",
          a: `${atsTemplateCount} of ${templateCount} templates are marked as conservative ATS-oriented templates under Seerati rules. Choose the layout for the role; this remains guidance, not a guarantee of an employer system result.`,
        },
        {
          q: "How does the ATS check work?",
          a: "It is a rule-based check: contact completeness, summary length, core sections, bullet count and measurable figures. The score is guidance, not a guarantee.",
        },
        {
          q: "Does job matching guarantee an offer?",
          a: "No. Matching compares text only and highlights visible gaps; the hiring decision always sits with the employer.",
        },
        {
          q: "What is the resume limit?",
          a: "3 resumes per account at this stage, including duplicates.",
        },
      ];

  return (
    <div className="seerati-marketing flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — brand first, one CTA group, dominant resume visual */}
        <section className="relative overflow-hidden surface-ink">
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:gap-10 sm:py-16 sm:grid-cols-2 md:gap-12 md:py-24">
            <div className="text-start">
              <Badge
                variant="secondary"
                className="mb-5 gap-1.5 rounded-full border-none bg-white/10 px-3 py-1 text-[12px] text-ink-foreground"
              >
                <Sparkles className="size-3.5" />
                {ar ? "استوديو مهني رقمي" : "A digital career studio"}
              </Badge>
              <p className="seerati-hero-brand text-ink-foreground">
                {ar ? "سيرتي" : "Seerati"}
                <span className="ms-2 align-middle text-base font-medium text-emerald-accent md:text-lg">
                  {ar ? "Seerati" : "سيرتي"}
                </span>
              </p>
              <h1 className="mt-3 text-balance-ar text-2xl font-extrabold leading-[1.35] tracking-tight md:text-4xl">
                {ar ? "ابنِ سيرة تفوز بالوظيفة" : "Build a job-winning resume"}
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-[1.9] text-ink-foreground/75 md:text-base">
                {ar
                  ? `فريق من ${TEAM_COUNT} مختصاً يعمل معك من الملف المهني الموحّد حتى PDF عربي جاهز للتقديم.`
                  : `${TEAM_COUNT} specialists work with you — from a unified career profile to a submission-ready Arabic PDF.`}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
                  asChild
                >
                  <Link to="/resumes/new">
                    {ar ? "ابدأ مجاناً" : "Get started free"}
                    <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="border-none bg-white/10 text-ink-foreground hover:bg-white/20"
                  asChild
                >
                  <Link to="/team">{ar ? "تعرّف على الفريق" : "Meet the team"}</Link>
                </Button>
              </div>
              <p className="mt-5 text-xs text-ink-foreground/60">
                {ar
                  ? "اختر قالباً وابنِ سيرتك — ثم أنشئ حساباً لحفظها ومزامنتها"
                  : "Pick a template and build your resume — then create an account to save and sync"}
              </p>
            </div>

            <div className="seerati-hero-visual">
              <img
                src={heroResume}
                alt={
                  ar
                    ? "نموذج سيرة ذاتية عربية من سيرتي بتصميم عمودين"
                    : "Arabic resume mockup built with Seerati"
                }
                width={1440}
                height={1024}
                className="mx-auto w-full rounded-2xl border border-white/10 shadow-2xl"
              />
            </div>
          </div>
          <LandingCareerVisual ar={ar} />
        </section>

        {/* Trust strip */}
        <section className="seerati-trust-strip">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.t} className="seerati-trust-item">
                <span className="seerati-trust-icon">
                  <item.icon className="size-4" />
                </span>
                <p className="text-sm font-semibold leading-snug">{item.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — zigzag */}
        <section className="section-y mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              {ar ? "كيف يعمل" : "How it works"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {ar
                ? "أربع خطوات واضحة من ملفك المهني إلى حزمة التقديم."
                : "Four clear steps from your career profile to an application pack."}
            </p>
          </div>
          <div className="mt-12 space-y-12 md:space-y-16">
            {steps.map((s, i) => (
              <div
                key={s.t}
                className="seerati-how-step"
                data-flip={i % 2 === 1 ? "true" : "false"}
              >
                <div className="seerati-how-copy">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-bold md:text-2xl">{s.t}</h3>
                  <p className="mt-3 max-w-md text-sm leading-[1.9] text-muted-foreground">{s.d}</p>
                </div>
                <div className="seerati-how-visual">
                  <div className="grid grid-cols-2 gap-2">
                    {s.visual.map((label) => (
                      <div
                        key={label}
                        className="rounded-xl border border-border/70 bg-background/80 px-3 py-4 text-center text-xs font-semibold text-foreground"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The team */}
        <section className="bg-secondary/50 section-y">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">
                {ar ? "فريق سيرتي" : "The Seerati team"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {ar
                  ? `${TEAM_COUNT} دوراً متخصصاً فوق مساعد كتابة واحد — مسار مهني وهندسة — كل دور مسؤول عن جزء واضح من رحلتك.`
                  : `${TEAM_COUNT} focused roles on one writing assistant — career and engineering — each owning a clear part of your journey.`}
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((agent) => (
                <Card key={agent.id} className="border-border/80 bg-card shadow-soft">
                  <CardContent className="pt-6">
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
                    <h3 className="mt-4 font-bold">{agent.name[lang]}</h3>
                    <p className="text-xs font-semibold text-emerald-accent">{agent.role[lang]}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {agent.blurb[lang]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link to="/team">
                  {ar ? "صفحة الفريق الكاملة" : "Full team page"}
                  <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="section-y mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {ar ? "ما يشمله الاستوديو" : "What's included"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ar
              ? "كل قدرة مبنية لتخدم خطوة حقيقية في رحلة التقديم على وظيفة."
              : "Every capability serves a real step in the job-application journey."}
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((f) => (
              <div key={f.title} className="border-0 bg-transparent p-0 shadow-none">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section className="bg-secondary/50 section-y">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">
                {ar ? "قوالب مصممة بعناية" : "Carefully crafted templates"}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {ar
                  ? "كل قالب يدعم العربية والإنجليزية ويمكن تبديله في أي وقت."
                  : "Every template supports Arabic and English and can be switched anytime."}
              </p>
            </div>
            <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {featuredTemplates.map((tpl) => (
                <Link
                  key={tpl.id}
                  to="/templates"
                  className="group w-[240px] shrink-0 rounded-2xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-1"
                >
                  <div
                    className="mb-4 h-32 rounded-xl border border-border/70"
                    style={{
                      background: `linear-gradient(160deg, ${tpl.design.accent}1f, transparent 70%)`,
                      borderColor: `${tpl.design.accent}33`,
                    }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{tpl.name[lang]}</p>
                    {tpl.atsFriendly && (
                      <Badge variant="outline" className="text-[10.5px]">
                        ATS
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {tpl.description[lang]}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button size="lg" asChild>
                <Link to="/templates">{ar ? "كل قوالب السيرة" : "All resume templates"}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Assistant strip */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
            <div>
              <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10">
                <Bot className="size-5" />
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {ar ? "مساعد كتابة في كل خطوة" : "A writing assistant at every step"}
              </h2>
              <p className="mt-4 text-sm leading-[1.9] opacity-85">
                {ar
                  ? "يقترح صياغة الملخص والإنجازات، ويربط عملك بأثر قابل للقياس، دون اختراع أرقام لم تذكرها."
                  : "Drafts your summary and achievements, links your work to measurable impact, and never invents figures you didn't give it."}
              </p>
              <Button variant="secondary" size="lg" className="mt-6" asChild>
                <Link to="/ats">{ar ? "تعرّف على فحص ATS" : "See the ATS check"}</Link>
              </Button>
            </div>
            <ul className="space-y-3 rounded-2xl bg-primary-foreground/10 p-6">
              {(ar
                ? [
                    "الملف المهني الموحّد مصدر واحد للحقيقة",
                    "مساحة عمل مستقلة لكل وظيفة",
                    "مطابقة صريحة تُظهر الفجوات الحقيقية",
                    "فحص ATS قائم على قواعد واضحة",
                    "تصدير PDF عربي دقيق الاتجاه والخط",
                  ]
                : [
                    "One unified career profile as the source of truth",
                    "A dedicated workspace per job",
                    "Honest matching that surfaces real gaps",
                    "A rule-based ATS check",
                    "Precise Arabic PDF export",
                  ]
              ).map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-y mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            {ar ? "الأسئلة الشائعة" : "FAQ"}
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {faq.map((f, i) => (
              <AccordionItem key={i} value={`i${i}`}>
                <AccordionTrigger className="text-start text-[15px] font-semibold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-[1.9] text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-3xl surface-ink p-10 text-center shadow-editorial md:p-14">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              {ar ? "ابدأ استوديوك المهني اليوم" : "Start your career studio today"}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-ink-foreground/75">
              {ar
                ? "اختر قالباً وابدأ بناء سيرتك، ثم سجّل لحفظها والمتابعة."
                : "Pick a template, start building your resume, then sign up to save and continue."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-accent text-ink-foreground hover:bg-emerald-accent/90"
                asChild
              >
                <Link to="/templates">
                  {ar ? "ابدأ باختيار قالب" : "Start by choosing a template"}
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/resumes/new">{ar ? "سيرة جديدة" : "New resume"}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
