import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { TemplateGallery3D } from "@/components/template-gallery-3d";
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
        content: "استعرض وقارن قوالب السيرة الذاتية بالعربية والإنجليزية قبل اختيار القالب المناسب لمسارك.",
      },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const activeTemplates = defaultTemplates.filter((template) => template.active);
  const atsTemplates = activeTemplates.filter((template) => template.atsFriendly).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
              {ar ? "اختر القالب كما لو كنت تمسكه بيدك" : "Choose a template as if it were in your hands"}
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <TemplateGallery3D />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
