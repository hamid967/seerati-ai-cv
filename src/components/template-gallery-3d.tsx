import { lazy, Suspense, useEffect, useMemo, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Eye, GitCompareArrows, Search, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { demoResume } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import type { TemplateCategory, TemplateDef } from "@/lib/types";
import "../template-gallery-3d.css";

const LazyResumeThumb = lazy(() =>
  import("@/components/resume-preview").then((module) => ({ default: module.ResumeThumb })),
);

type Filter = "all" | "ats" | TemplateCategory;

const FILTERS: Filter[] = ["all", "ats", "executive", "modern", "minimal", "creative"];
const MAX_COMPARE = 3;
const INITIAL_PREVIEW_COUNT = 4;

function LightweightTemplatePreview({
  template,
  lang,
}: {
  template: TemplateDef;
  lang: "ar" | "en";
}) {
  const accent = template.design.accent;
  return (
    <div
      className="flex h-full min-h-[280px] flex-col gap-3 bg-white p-5 text-start"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="h-8 rounded-md" style={{ backgroundColor: `${accent}22` }}>
        <div className="h-full w-2/3 rounded-md" style={{ backgroundColor: accent }} />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-3/5 rounded-full bg-slate-300" />
        <div className="h-2 w-4/5 rounded-full bg-slate-200" />
      </div>
      <div
        className="mt-2 grid flex-1 gap-3"
        style={{ gridTemplateColumns: template.design.layout === "single" ? "1fr" : "0.7fr 1.3fr" }}
      >
        <div className="space-y-2">
          {["w-full", "w-5/6", "w-4/5", "w-3/4", "w-5/6"].map((width, index) => (
            <div key={`${width}-${index}`} className={`h-2 rounded-full bg-slate-200 ${width}`} />
          ))}
        </div>
        {template.design.layout !== "single" && (
          <div className="space-y-2 rounded-md p-2" style={{ backgroundColor: `${accent}10` }}>
            <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: `${accent}66` }} />
            <div className="h-2 w-full rounded-full bg-slate-200" />
            <div className="h-2 w-5/6 rounded-full bg-slate-200" />
          </div>
        )}
      </div>
      <p className="text-center text-[10px] font-semibold text-slate-400">
        {lang === "ar"
          ? "معاينة خفيفة — افتح لرؤية القالب الكامل"
          : "Light preview — open to view the full template"}
      </p>
    </div>
  );
}

function FullTemplatePreview({
  resume,
  template,
}: {
  resume: ReturnType<typeof demoResume>;
  template: TemplateDef;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
          Loading preview…
        </div>
      }
    >
      <LazyResumeThumb resume={resume} template={template} />
    </Suspense>
  );
}

export function TemplateGallery3D() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [previewLanguage, setPreviewLanguage] = useState<"ar" | "en">(lang);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [previewLimit, setPreviewLimit] = useState(INITIAL_PREVIEW_COUNT);

  const sample = useMemo(() => demoResume("template-gallery-preview"), []);
  const list = useMemo(
    () =>
      defaultTemplates.filter((template) => {
        if (!template.active) return false;
        if (
          filter !== "all" &&
          (filter === "ats" ? !template.atsFriendly : template.category !== filter)
        )
          return false;
        const normalizedQuery = query.trim().toLocaleLowerCase();
        if (!normalizedQuery) return true;
        return [template.name[lang], template.description[lang], template.category]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      }),
    [filter, lang, query],
  );

  useEffect(() => {
    setPreviewLimit(INITIAL_PREVIEW_COUNT);
  }, [filter]);

  const selected = defaultTemplates.find((template) => template.id === selectedId) ?? null;
  const visibleList = list.slice(0, previewLimit);
  const compared = compareIds
    .map((id) => defaultTemplates.find((template) => template.id === id))
    .filter((template): template is TemplateDef => Boolean(template));

  const filterCount = (id: Filter) =>
    defaultTemplates.filter((template) => {
      if (!template.active) return false;
      if (id === "all") return true;
      if (id === "ats") return template.atsFriendly;
      return template.category === id;
    }).length;

  const filterLabel = (id: Filter) => {
    if (id === "all") return ar ? "الكل" : "All";
    if (id === "ats") return "ATS";
    const labels: Record<TemplateCategory, { ar: string; en: string }> = {
      executive: { ar: "تنفيذي", en: "Executive" },
      modern: { ar: "عصري", en: "Modern" },
      minimal: { ar: "مبسّط", en: "Minimal" },
      creative: { ar: "إبداعي", en: "Creative" },
      ats: { ar: "ATS", en: "ATS" },
    };
    return labels[id][lang];
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, id];
    });
  };

  const tilt = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    target.style.setProperty("--gallery-ry", `${(px - 0.5) * 8}deg`);
    target.style.setProperty("--gallery-rx", `${(0.5 - py) * 7}deg`);
    target.style.setProperty("--gallery-shine-x", `${px * 100}%`);
    target.style.setProperty("--gallery-shine-y", `${py * 100}%`);
  };

  const resetTilt = (event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget;
    target.style.setProperty("--gallery-ry", "0deg");
    target.style.setProperty("--gallery-rx", "0deg");
    target.style.setProperty("--gallery-shine-x", "50%");
    target.style.setProperty("--gallery-shine-y", "20%");
  };

  const resumeFor = (template: TemplateDef) => ({
    ...sample,
    templateId: template.id,
    language: previewLanguage,
    data: {
      ...sample.data,
      personal: {
        ...sample.data.personal,
        fullName: previewLanguage === "ar" ? "ريم عبدالله" : "Reem Abdullah",
        jobTitle: previewLanguage === "ar" ? "مديرة منتجات رقمية" : "Digital Product Manager",
      },
    },
  });

  return (
    <>
      <section
        className="seerati-gallery-stage"
        aria-label={ar ? "معرض القوالب" : "Template gallery"}
      >
        <div className="seerati-gallery-toolbar">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {FILTERS.map((id) => (
              <Button
                key={id}
                size="sm"
                variant={filter === id ? "default" : "outline"}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                {filterLabel(id)}{" "}
                <span className="ms-1 text-[10px] opacity-70">{filterCount(id)}</span>
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ar ? "ابحث عن قالب أو أسلوب" : "Search a template or style"}
              aria-label={ar ? "البحث في القوالب" : "Search templates"}
              className="ps-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {ar ? "لغة المعاينة" : "Preview language"}
            </span>
            <div className="rounded-xl border border-border bg-card/80 p-1 shadow-sm">
              <Button
                size="sm"
                variant={previewLanguage === "ar" ? "secondary" : "ghost"}
                onClick={() => setPreviewLanguage("ar")}
              >
                عربي
              </Button>
              <Button
                size="sm"
                variant={previewLanguage === "en" ? "secondary" : "ghost"}
                onClick={() => setPreviewLanguage("en")}
              >
                EN
              </Button>
            </div>
          </div>
        </div>

        <div className="seerati-gallery-grid">
          {visibleList.map((template, index) => {
            const isCompared = compareIds.includes(template.id);
            return (
              <article
                key={template.id}
                className="seerati-template-card"
                style={{ "--gallery-index": index } as React.CSSProperties}
                onPointerMove={tilt}
                onPointerLeave={resetTilt}
              >
                <div className="seerati-template-card-glow" aria-hidden="true" />
                <div className="seerati-template-paper-wrap">
                  <div className="seerati-template-paper">
                    <LightweightTemplatePreview template={template} lang={lang} />
                  </div>
                </div>

                <div className="seerati-template-meta">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-extrabold">{template.name[lang]}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {template.description[lang]}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                      {template.category}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.atsFriendly ? (
                      <Badge variant="secondary" className="text-[10px]">
                        ATS
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        {ar ? "إبداعي بصري" : "Visual-first"}
                      </Badge>
                    )}
                    {template.supportsRTL && (
                      <Badge variant="outline" className="text-[10px]">
                        RTL
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      A4
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                    <Button size="sm" asChild>
                      <Link to="/resumes/new" search={{ template: template.id }}>
                        {ar ? "استخدم القالب" : "Use template"}
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={ar ? "معاينة القالب" : "Preview template"}
                      onClick={() => setSelectedId(template.id)}
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={isCompared ? "secondary" : "outline"}
                      aria-label={ar ? "إضافة للمقارنة" : "Add to compare"}
                      aria-pressed={isCompared}
                      disabled={!isCompared && compareIds.length >= MAX_COMPARE}
                      onClick={() => toggleCompare(template.id)}
                    >
                      {isCompared ? (
                        <Check className="size-4" />
                      ) : (
                        <GitCompareArrows className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {ar
              ? "لم نجد قالباً يطابق بحثك. جرّب كلمة أخرى أو امسح البحث."
              : "No templates match that search. Try another term or clear the search."}
          </div>
        )}
        {list.length > visibleList.length && (
          <div className="mt-6 flex justify-center">
            <Button type="button" variant="outline" onClick={() => setPreviewLimit(list.length)}>
              {ar
                ? `تحميل بقية المعاينات (${list.length - visibleList.length})`
                : `Load ${list.length - visibleList.length} more previews`}
            </Button>
          </div>
        )}
      </section>

      {compareIds.length > 0 && (
        <div
          className="seerati-compare-dock"
          role="region"
          aria-label={ar ? "مقارنة القوالب" : "Template comparison"}
        >
          <div className="min-w-0">
            <p className="text-sm font-bold">
              {ar
                ? `مقارنة ${compareIds.length} من ${MAX_COMPARE}`
                : `Compare ${compareIds.length} of ${MAX_COMPARE}`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {compared.map((template) => template.name[lang]).join(" · ")}
            </p>
          </div>
          <div className="ms-auto flex shrink-0 gap-2">
            <Button size="sm" onClick={() => setCompareOpen(true)} disabled={compareIds.length < 2}>
              <GitCompareArrows className="size-4" />
              {ar ? "قارن" : "Compare"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={ar ? "مسح المقارنة" : "Clear comparison"}
              onClick={() => setCompareIds([])}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="seerati-cinematic-dialog max-h-[92dvh] w-[min(96vw,72rem)] max-w-[96vw] overflow-y-auto overflow-x-hidden p-0 [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-background/90 [&>button]:p-2 [&>button]:opacity-100 [&>button]:shadow-lift">
          {selected && (
            <div className="grid min-h-[70vh] lg:grid-cols-[1.2fr_0.8fr]">
              <div className="seerati-cinematic-preview">
                <div className="seerati-cinematic-paper">
                  <FullTemplatePreview resume={resumeFor(selected)} template={selected} />
                </div>
              </div>
              <div className="flex flex-col p-6 md:p-8">
                <DialogHeader>
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-accent">
                    <Sparkles className="size-4" />
                    {ar ? "معاينة سينمائية" : "Cinematic preview"}
                  </div>
                  <DialogTitle className="text-2xl">{selected.name[lang]}</DialogTitle>
                </DialogHeader>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {selected.description[lang]}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge variant="secondary">{selected.category}</Badge>
                  {selected.atsFriendly && <Badge variant="outline">ATS</Badge>}
                  {selected.supportsRTL && <Badge variant="outline">RTL</Badge>}
                  <Badge variant="outline">A4</Badge>
                </div>
                <div className="mt-auto pt-8">
                  <Button size="lg" className="w-full" asChild>
                    <Link to="/resumes/new" search={{ template: selected.id }}>
                      {ar ? "ابدأ بهذا القالب" : "Start with this template"}
                    </Link>
                  </Button>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    {ar
                      ? "المعاينة تستخدم بيانات نموذجية واضحة ولا تمثل بيانات مستخدم حقيقي."
                      : "This preview uses clearly labelled sample data and does not represent a real user."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>{ar ? "مقارنة القوالب" : "Compare templates"}</DialogTitle>
          </DialogHeader>
          <div
            className={`grid gap-4 ${compared.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}
          >
            {compared.map((template) => (
              <div key={template.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="h-[420px] overflow-hidden rounded-xl bg-muted/40 p-2">
                  <FullTemplatePreview resume={resumeFor(template)} template={template} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{template.name[lang]}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.atsFriendly ? "ATS" : template.category}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link to="/resumes/new" search={{ template: template.id }}>
                      {ar ? "اختيار" : "Choose"}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
