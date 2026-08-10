import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Briefcase,
  CheckCircle2,
  FileDown,
  FolderKanban,
  Languages,
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
import { TEAM } from "@/lib/team";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سيرتي | Seerati — استوديو مهني رقمي" },
      {
        name: "description",
        content:
          "سيرتي استوديو مهني رقمي: فريق من ثمانية مختصين افتراضيين يساعدونك على بناء ملف مهني موحّد، متابعة وظائفك، ومطابقة سيرتك مع كل وصف وظيفي.",
      },
      { property: "og:title", content: "سيرتي | Seerati — استوديو مهني رقمي" },
      {
        property: "og:description",
        content: "فريق متخصص يعمل معك: من الملف المهني الموحّد إلى حزمة التقديم وفحص ATS وتصدير PDF عربي.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const steps = ar
    ? [
        { t: "ابنِ ملفك المهني الموحّد", d: "أدخل خبراتك وإنجازاتك ومهاراتك مرة واحدة — تُستخدم في كل سيرة ومهمة لاحقاً." },
        { t: "افتح مساحة لكل وظيفة", d: "احفظ وصف الوظيفة، وتابع حالتها من محفوظة إلى مقابلة أو عرض." },
        { t: "طابق وجهّز", d: "قارن ملفك مع متطلبات الوظيفة، واعرف الفجوات الحقيقية قبل التقديم." },
        { t: "صدّر حزمة التقديم", d: "سيرة مخصصة، فحص ATS، ونسخة PDF عربية جاهزة للإرسال." },
      ]
    : [
        { t: "Build your unified career profile", d: "Add your experience, achievements and skills once — reused across every resume and task." },
        { t: "Open a workspace per job", d: "Save the job description and track its status from saved to interview or offer." },
        { t: "Match & prepare", d: "Compare your profile against the role's requirements and see the real gaps first." },
        { t: "Export your application pack", d: "A tailored resume, an ATS check, and a submission-ready Arabic PDF." },
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
        { q: "من هو فريق سيرتي؟", a: "ثمانية مختصين افتراضيين — من استشارية المسار المهني إلى مدير الطلبات — يعملون كأدوار متخصصة فوق مساعد كتابة واحد، كل منهم مسؤول عن جزء واضح من رحلتك." },
        { q: "هل القوالب متوافقة مع أنظمة التوظيف؟", a: "خمسة من القوالب الستة مبنية بعمود واحد وعناوين نصية واضحة، وهي الأنسب للتقديم الإلكتروني. القالب الإبداعي مخصص للتقديم المباشر أو ملف الأعمال." },
        { q: "كيف يعمل فحص ATS؟", a: "الفحص أولي ويعتمد على قواعد واضحة: اكتمال معلومات الاتصال، طول الملخص، وجود الأقسام الأساسية، عدد نقاط الإنجاز، ووجود أرقام قابلة للقياس. النتيجة إرشادية وليست وعداً بالقبول." },
        { q: "هل مطابقة الوصف الوظيفي تضمن القبول؟", a: "لا. المطابقة تقارن النص فقط وتوضح لك الفجوات الظاهرة؛ القرار النهائي دائماً لجهة التوظيف." },
        { q: "ما حد السير الذاتية؟", a: "٣ سير ذاتية لكل حساب في هذه المرحلة، مع إمكانية الاستنساخ والتعديل داخل الحد." },
      ]
    : [
        { q: "Who is the Seerati team?", a: "Eight virtual specialists — from a career strategist to an application manager — running as focused roles on one writing assistant, each owning a clear part of your journey." },
        { q: "Are the templates ATS friendly?", a: "Five of the six templates use a single column with plain text headings, which suits online applications. The creative template is meant for direct sharing or a portfolio." },
        { q: "How does the ATS check work?", a: "It is a rule-based check: contact completeness, summary length, core sections, bullet count and measurable figures. The score is guidance, not a guarantee." },
        { q: "Does job matching guarantee an offer?", a: "No. Matching compares text only and highlights visible gaps; the hiring decision always sits with the employer." },
        { q: "What is the resume limit?", a: "3 resumes per account at this stage, including duplicates." },
      ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden surface-ink">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(50% 60% at 20% 10%, oklch(0.72 0.13 165 / 0.35), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
            <Badge variant="secondary" className="mb-6 gap-1.5 rounded-full border-none bg-white/10 px-3 py-1 text-[12px] text-ink-foreground">
              <Sparkles className="size-3.5" />
              {ar ? "استوديو مهني رقمي" : "A digital career studio"}
            </Badge>
            <h1 className="text-balance-ar text-4xl font-extrabold leading-[1.25] tracking-tight md:text-6xl">
              {ar ? "فريق متخصص" : "A specialist team"}{" "}
              <span className="text-emerald-accent">{ar ? "يعمل معك" : "working with you"}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.9] text-ink-foreground/75 md:text-lg">
              {ar
                ? "من الملف المهني الموحّد إلى مساحة كل وظيفة، ومطابقة وصفها، وحزمة تقديم كاملة تنتهي بسيرة PDF عربية جاهزة."
                : "From your unified career profile to a workspace per job, a match against its description, and a full application pack ending in an Arabic PDF."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  {ar ? "ابدأ مجاناً" : "Start for free"}
                  <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="border-none bg-white/10 text-ink-foreground hover:bg-white/20" asChild>
                <Link to="/templates">{ar ? "استعرض القوالب" : "Browse templates"}</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-ink-foreground/60">
              {ar ? "تدعم العربية والإنجليزية · حتى ٣ سير ذاتية لكل حساب" : "Arabic & English · up to 3 resumes per account"}
            </p>
          </div>
        </section>

        {/* The team */}
        <section className="section-y mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">{ar ? "فريق سيرتي" : "The Seerati team"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {ar
                ? "ثمانية أدوار متخصصة فوق مساعد كتابة واحد، كل دور مسؤول عن جزء واضح من رحلتك المهنية."
                : "Eight focused roles on one writing assistant, each owning a clear part of your career journey."}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((agent) => (
              <Card key={agent.id} className="border-border/80 surface-editorial">
                <CardContent className="pt-6">
                  <span
                    className="grid size-11 place-items-center rounded-full text-sm font-bold text-ink-foreground"
                    style={{ backgroundColor: `var(--agent-${agent.accent})` }}
                  >
                    {agent.initials}
                  </span>
                  <h3 className="mt-4 font-bold">{agent.name[lang]}</h3>
                  <p className="text-xs font-semibold text-emerald-accent">{agent.role[lang]}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{agent.blurb[lang]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-secondary/40 section-y">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-extrabold tracking-tight">{ar ? "كيف يعمل" : "How it works"}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-4">
              {steps.map((s, i) => (
                <Card key={s.t} className="border-border/80 shadow-soft">
                  <CardContent className="pt-6">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 text-base font-bold">{s.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="section-y mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-extrabold tracking-tight">{ar ? "قدرات المنصة" : "Platform capabilities"}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ar
              ? "كل قدرة مبنية لتخدم خطوة حقيقية في رحلة التقديم على وظيفة."
              : "Every capability serves a real step in the job-application journey."}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((f) => (
              <Card key={f.title} className="border-border/80">
                <CardContent className="pt-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section className="bg-secondary/40 section-y">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">{ar ? "قوالب مصممة بعناية" : "Carefully crafted templates"}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {ar
                  ? "كل قالب يدعم العربية والإنجليزية ويمكن تبديله في أي وقت."
                  : "Every template supports Arabic and English and can be switched anytime."}
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {defaultTemplates.map((tpl) => (
                <Link
                  key={tpl.id}
                  to="/templates"
                  className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-1"
                >
                  <div
                    className="mb-4 h-28 rounded-xl border border-border/70"
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
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tpl.description[lang]}</p>
                </Link>
              ))}
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
              <h2 className="text-3xl font-extrabold tracking-tight">{ar ? "مساعد كتابة في كل خطوة" : "A writing assistant at every step"}</h2>
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
          <h2 className="text-center text-3xl font-extrabold tracking-tight">{ar ? "الأسئلة الشائعة" : "FAQ"}</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faq.map((f, i) => (
              <AccordionItem key={i} value={`i${i}`}>
                <AccordionTrigger className="text-start text-[15px] font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-[1.9] text-muted-foreground">{f.a}</AccordionContent>
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
              {ar ? "أنشئ حساباً وابنِ ملفك المهني الموحّد خلال دقائق." : "Create an account and build your unified career profile in minutes."}
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                {ar ? "ابدأ مجاناً" : "Start for free"}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
