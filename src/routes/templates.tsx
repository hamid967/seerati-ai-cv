import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Globe2, ScanText, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { TemplateGallery3D } from "@/components/template-gallery-3d";
import { TemplateIntelligenceGuide } from "@/components/template-intelligence-guide";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "القوالب | سيرتي — Seerati 3D Template Gallery" },
      {
        name: "description",
        content:
          "معرض ثلاثي الأبعاد لقوالب سيرتي: قوالب عربية وإنجليزية، ATS، تنفيذية وعصرية مع معاينة ومقارنة تفاعلية قبل إنشاء السيرة.",
      },
      { property: "og:title", content: "معرض قوالب سيرتي ثلاثي الأبعاد" },
      {
        property: "og:description",
        content:
          "استعرض وقارن قوالب السيرة الذاتية بالعربية والإنجليزية قبل اختيار القالب المناسب لمسارك.",
      },
      { property: "og:url", content: "https://hrhbs.com/templates" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://hrhbs.com/og-image.png" },
      { name: "twitter:image", content: "https://hrhbs.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://hrhbs.com/templates" }],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const activeTemplates = defaultTemplates.filter((template) => template.active);
  const atsTemplates = activeTemplates.filter((template) => template.atsFriendly).length;
  const [recommendedTemplateIds, setRecommendedTemplateIds] = useState<string[]>([]);

  return (
    <div className="seerati-intelligence-page flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/70 px-4 py-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--emerald-accent)_12%,transparent),transparent_42%)]" />
          <div className="mx-auto max-w-6xl">
            <Badge variant="secondary" className="gap-1.5 rounded-full">
              <Sparkles className="size-3.5" />
              {ar ? "تجربة قوالب سينمائية" : "Cinematic template experience"}
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
              {ar
                ? "اختر القالب كما لو كنت تمسكه بيدك"
                : "Choose a template as if it were in your hands"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground md:text-base">
              {ar
                ? "حرّك القالب بالماوس، افتحه بمعاينة سينمائية، وقارن حتى ثلاثة تصاميم جنباً إلى جنب. بيانات المعاينة نموذجية وواضحة ولا تختلط بحسابك الحقيقي."
                : "Tilt templates with your pointer, open a cinematic preview, and compare up to three designs side by side. Preview data is clearly sample-only and never mixed into your real account."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-card/80 px-3 py-1.5">
                {activeTemplates.length} {ar ? "قالباً فعالاً" : "active templates"}
              </span>
              <span className="rounded-full border border-border bg-card/80 px-3 py-1.5">
                {atsTemplates} {ar ? "إعدادات ATS محافظة" : "conservative ATS configurations"}
              </span>
              <span className="rounded-full border border-border bg-card/80 px-3 py-1.5">
                AR / EN · RTL / LTR
              </span>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3" data-testid="template-global-signals">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                <Globe2 className="mt-0.5 size-5 shrink-0 text-emerald-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold">{ar ? "جاهز للاتجاهين" : "Direction-ready"}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {ar
                      ? "إشارات القالب توضّح دعم العربية RTL والإنجليزية LTR."
                      : "Template signals clarify Arabic RTL and English LTR support."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                <ScanText
                  className="mt-0.5 size-5 shrink-0 text-emerald-accent"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold">{ar ? "خصائص مفهومة" : "Explainable fit"}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {ar
                      ? "الأيقونات تعرض بنية القالب وكثافته وملاءمة القراءة دون وعود بنتائج."
                      : "Icons show structure, density, and reading fit without outcome promises."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0 text-emerald-accent"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold">
                    {ar ? "اختيار محلي خاص" : "Private local choice"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {ar
                      ? "إرشاد القوالب يعمل محلياً ولا يطلب محتوى سيرتك أو يخزّن اختيارك."
                      : "Template guidance runs locally and never requests or stores resume content."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:space-y-10 md:py-14">
          <TemplateIntelligenceGuide onRecommendationsChange={setRecommendedTemplateIds} />
          <div id="template-gallery">
            <TemplateGallery3D recommendedTemplateIds={recommendedTemplateIds} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
