import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  FileDown,
  Languages,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import heroImage from "@/assets/hero-resume.jpg";
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
import { useI18n, useT } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سيرتي | Seerati — أنشئ سيرتك الذاتية بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "منصة سيرتي لإنشاء السير الذاتية بالعربية والإنجليزية: قوالب متوافقة مع أنظمة التوظيف ATS، مساعد كتابة بالذكاء الاصطناعي، ومعاينة مباشرة مع تنزيل PDF.",
      },
      { property: "og:title", content: "سيرتي | Seerati — سيرة ذاتية بالذكاء الاصطناعي" },
      {
        property: "og:description",
        content: "اختر قالباً، أدخل بياناتك، حسّن الصياغة بالذكاء الاصطناعي، ونزّل سيرتك PDF.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const t = useT();
  const { lang } = useI18n();
  const ar = lang === "ar";

  const features = [
    {
      icon: Bot,
      title: ar ? "مساعد كتابة داخل المحرر" : "In-editor writing assistant",
      body: ar
        ? "يقترح ملخصاً مهنياً، ويحسّن نقاط الخبرة، ويحوّل المهام إلى إنجازات قابلة للقياس."
        : "Drafts summaries, improves bullets and turns duties into measurable achievements.",
    },
    {
      icon: Target,
      title: ar ? "كلمات مفتاحية من وصف الوظيفة" : "Keywords from a job description",
      body: ar
        ? "الصق وصف الوظيفة وسنعرض الكلمات الموجودة والناقصة في سيرتك."
        : "Paste a job description to see which keywords your resume covers.",
    },
    {
      icon: Languages,
      title: ar ? "عربي وإنجليزي بالكامل" : "Full Arabic & English",
      body: ar
        ? "واجهة RTL أصلية وقوالب تدعم الاتجاهين مع خطوط عربية واضحة."
        : "Native RTL interface with bidirectional templates and clear Arabic typography.",
    },
    {
      icon: FileDown,
      title: ar ? "تصدير PDF ونسخة نصية" : "PDF export & plain text",
      body: ar
        ? "معاينة طباعة دقيقة، وتنزيل نسخة نصية مناسبة للنسخ في نماذج التقديم."
        : "Accurate print preview plus a plain-text version for application forms.",
    },
    {
      icon: ShieldCheck,
      title: ar ? "بياناتك تحت سيطرتك" : "Your data, your control",
      body: ar
        ? "لا توجد مفاتيح أو أسرار في الواجهة، وطلبات الذكاء الاصطناعي تمر بطبقة خدمة واحدة."
        : "No secrets in the client; AI requests pass through a single service layer.",
    },
    {
      icon: BadgeCheck,
      title: ar ? "٣ سير ذاتية لكل حساب" : "3 resumes per account",
      body: ar
        ? "أنشئ نسخاً مخصصة لكل وظيفة مع متابعة الاستخدام ٠/٣."
        : "Tailor a version per role, with clear 0/3 usage tracking.",
    },
  ];

  const faq = ar
    ? [
        { q: "هل القوالب متوافقة مع أنظمة التوظيف؟", a: "خمسة من القوالب الستة مبنية بعمود واحد وعناوين نصية واضحة، وهي الأنسب للتقديم الإلكتروني. القالب الإبداعي مخصص للتقديم المباشر أو ملف الأعمال." },
        { q: "كيف يعمل فحص ATS؟", a: "الفحص أولي ويعتمد على قواعد واضحة: اكتمال معلومات الاتصال، طول الملخص، وجود الأقسام الأساسية، عدد نقاط الإنجاز، ووجود أرقام قابلة للقياس. النتيجة إرشادية وليست وعداً بالقبول." },
        { q: "هل يمكنني الكتابة بالعربية والإنجليزية في نفس الحساب؟", a: "نعم، لكل سيرة ذاتية لغة مستقلة، ويمكنك تبديل لغة الواجهة في أي وقت." },
        { q: "ما حد السير الذاتية؟", a: "٣ سير ذاتية لكل حساب في هذه المرحلة، مع إمكانية الاستنساخ والتعديل داخل الحد." },
        { q: "هل مساعد الذكاء الاصطناعي متصل بمزود حقيقي؟", a: "في هذه النسخة يعمل المساعد عبر مزود تجريبي داخل طبقة خدمة موحّدة، ويمكن ربطه بمزود حقيقي دون تغيير الواجهة." },
      ]
    : [
        { q: "Are the templates ATS friendly?", a: "Five of the six templates use a single column with plain text headings, which suits online applications. The creative template is meant for direct sharing or a portfolio." },
        { q: "How does the ATS check work?", a: "It is a rule-based check: contact completeness, summary length, core sections, bullet count and measurable figures. The score is guidance, not a guarantee." },
        { q: "Can I write in both Arabic and English?", a: "Yes — each resume has its own language and the interface language can be switched anytime." },
        { q: "What is the resume limit?", a: "3 resumes per account at this stage, including duplicates." },
        { q: "Is the AI assistant connected to a real provider?", a: "In this version it runs on a demo provider behind a single service layer, ready to connect to a real provider without UI changes." },
      ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="hero-grid">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full px-3 py-1 text-[12px]">
                <Sparkles className="size-3.5" />
                {t("hero_badge")}
              </Badge>
              <h1 className="text-balance-ar text-4xl font-extrabold leading-[1.25] tracking-tight md:text-5xl">
                {t("hero_title_1")}{" "}
                <span className="text-emerald-accent">{t("hero_title_2")}</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-[1.9] text-muted-foreground">{t("hero_sub")}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    {t("hero_cta")}
                    <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/templates">{t("hero_cta2")}</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{t("hero_note")}</p>
            </div>

            <div className="relative">
              <img
                src={heroImage}
                alt={ar ? "نموذج سيرة ذاتية احترافية من منصة سيرتي" : "A professional resume built with Seerati"}
                className="w-full rounded-3xl shadow-lift"
                loading="eager"
              />
              <div className="absolute -bottom-5 start-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
                <p className="text-xs text-muted-foreground">{ar ? "جاهزية ATS" : "ATS readiness"}</p>
                <p className="text-xl font-extrabold text-emerald-accent">86/100</p>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="section-y mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">{t("steps_title")}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-border/80 shadow-soft">
                <CardContent className="pt-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                    {n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{t(`step${n}_t`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`step${n}_d`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section className="bg-secondary/40 section-y">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">{t("templates_title")}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t("templates_sub")}
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

        {/* AI features */}
        <section className="section-y mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-extrabold tracking-tight">{t("ai_title")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("ai_sub")}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
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

        {/* ATS */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">{t("ats_title")}</h2>
              <p className="mt-4 text-sm leading-[1.9] opacity-85">{t("ats_sub")}</p>
              <Button variant="secondary" size="lg" className="mt-6" asChild>
                <Link to="/ats">{ar ? "تعرّف على الفحص" : "See the checks"}</Link>
              </Button>
            </div>
            <ul className="space-y-3 rounded-2xl bg-primary-foreground/10 p-6">
              {(ar
                ? ["معلومات اتصال مكتملة", "ملخص بين ٣٠ و٩٠ كلمة", "٣ نقاط إنجاز أو أكثر", "أرقام قابلة للقياس", "٥ مهارات أو أكثر"]
                : ["Complete contact details", "Summary of 30–90 words", "Three or more bullets", "Measurable figures", "Five or more skills"]
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
          <h2 className="text-center text-3xl font-extrabold tracking-tight">{t("faq_title")}</h2>
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
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{t("cta_title")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("cta_sub")}</p>
            <Button size="lg" className="mt-6" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("hero_cta")}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
