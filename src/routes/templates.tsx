import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import { ResumeThumb } from "@/components/resume-preview";
import { demoResume } from "@/lib/demo-data";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "القوالب | سيرتي — Seerati Templates" },
      {
        name: "description",
        content: "ستة قوالب سير ذاتية تدعم العربية والإنجليزية، منها قوالب متوافقة مع أنظمة التوظيف ATS وأخرى عصرية وإبداعية.",
      },
      { property: "og:title", content: "قوالب السير الذاتية | سيرتي" },
      { property: "og:description", content: "قوالب ATS وعصرية وتنفيذية ومبسطة وسعودية مهنية وإبداعية." },
    ],
  }),
  component: TemplatesPage,
});

type Filter = "all" | "ats" | "modern" | "arabic" | "english";

function TemplatesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [filter, setFilter] = useState<Filter>("all");
  const sample = demoResume("preview");

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: ar ? "الكل" : "All" },
    { id: "ats", label: "ATS" },
    { id: "modern", label: ar ? "عصري" : "Modern" },
    { id: "arabic", label: ar ? "عربي" : "Arabic" },
    { id: "english", label: ar ? "إنجليزي" : "English" },
  ];

  const list = defaultTemplates.filter((t) => {
    if (!t.active) return false;
    if (filter === "ats") return t.atsFriendly;
    if (filter === "modern") return t.category === "modern" || t.category === "creative";
    if (filter === "arabic") return t.supportsRTL;
    if (filter === "english") return true;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{ar ? "معرض القوالب" : "Template gallery"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {ar
            ? "كل قالب مبني كمكوّن مستقل، ويمكن تبديله في أي وقت دون فقدان بياناتك."
            : "Each template is a standalone component and can be switched anytime without losing your data."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? "default" : "outline"}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tpl) => (
            <div key={tpl.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-4">
                <ResumeThumb
                  resume={{ ...sample, templateId: tpl.id, language: filter === "english" ? "en" : sample.language }}
                  template={tpl}
                  scale={0.3}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{tpl.name[lang]}</p>
                <div className="flex gap-1">
                  {tpl.atsFriendly && <Badge variant="outline" className="text-[10px]">ATS</Badge>}
                  {tpl.supportsRTL && <Badge variant="secondary" className="text-[10px]">RTL</Badge>}
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tpl.description[lang]}</p>
              <Button className="mt-4 w-full" size="sm" asChild>
                <Link to="/resumes/new" search={{ template: tpl.id }}>
                  {ar ? "استخدم هذا القالب" : "Use this template"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
