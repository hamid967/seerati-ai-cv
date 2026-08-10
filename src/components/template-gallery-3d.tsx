import { useMemo, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Eye, GitCompareArrows, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumeThumb } from "@/components/resume-preview";
import { demoResume } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import type { TemplateCategory, TemplateDef } from "@/lib/types";
import "../template-gallery-3d.css";

type Filter = "all" | "ats" | TemplateCategory;

const FILTERS: Filter[] = ["all", "ats", "executive", "modern", "minimal", "creative"];
const MAX_COMPARE = 3;

export function TemplateGallery3D() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [filter, setFilter] = useState<Filter>("all");
  const [previewLanguage, setPreviewLanguage] = useState<"ar" | "en">(lang);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const sample = useMemo(() => demoResume("template-gallery-preview"), []);
  const list = useMemo(
    () =>
      defaultTemplates.filter((template) => {
        if (!template.active) return false;
        if (filter === "all") return true;
        if (filter === "ats") return template.atsFriendly;
        return template.category === filter;
      }),
    [filter],
  );

  const selected = defaultTemplates.find((template) => template.id === selectedId) ?? null;
  const compared = compareIds
    .map((id) => defaultTemplates.find((template) => template.id === id))
    .filter((template): template is TemplateDef => Boolean(template));

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
      <section className="seerati-gallery-stage" aria-label={ar ? "معرض القوالب" : "Template gallery"}>
        <div className="seerati-gallery-toolbar">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((id) => (
              <Button
                key={id}
                size="sm"
                variant={filter === id ? "default" : "outline"}
                onClick={() => setFilter(id)}
              >
                {filterLabel(id)}
              </Button>
            ))}
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
          {list.map((template, index) => {
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
                    <ResumeThumb resume={resumeFor(template)} template={template} />
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
                      {isCompared ? <Check className="size-4" /> : <GitCompareArrows className="size-4" />}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {compareIds.length > 0 && (
        <div className="seerati-compare-dock" role="region" aria-label={ar ? "مقارنة القوالب" : "Template comparison"}>
          <div className="min-w-0">
            <p className="text-sm font-bold">
              {ar ? `مقارنة ${compareIds.length} من ${MAX_COMPARE}` : `Compare ${compareIds.length} of ${MAX_COMPARE}`}
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
            <Button size="icon" variant="ghost" aria-label={ar ? "مسح المقارنة" : "Clear comparison"} onClick={() => setCompareIds([])}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="seerati-cinematic-dialog max-w-6xl overflow-hidden p-0">
          {selected && (
            <div className="grid min-h-[70vh] lg:grid-cols-[1.2fr_0.8fr]">
              <div className="seerati-cinematic-preview">
                <div className="seerati-cinematic-paper">
                  <ResumeThumb resume={resumeFor(selected)} template={selected} />
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
          <div className={`grid gap-4 ${compared.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
            {compared.map((template) => (
              <div key={template.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="h-[420px] overflow-hidden rounded-xl bg-muted/40 p-2">
                  <ResumeThumb resume={resumeFor(template)} template={template} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{template.name[lang]}</p>
                    <p className="text-xs text-muted-foreground">{template.atsFriendly ? "ATS" : template.category}</p>
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
