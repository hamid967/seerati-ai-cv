import { Link } from "@tanstack/react-router";
import { CheckCircle2, Compass, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import {
  recommendTemplates,
  type TemplateRecommendationInput,
} from "@/modules/intelligence/template-recommendation";

type Strategy = "ats" | "leadership" | "clarity" | "portfolio";

type StrategyDefinition = {
  id: Strategy;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  input: Pick<TemplateRecommendationInput, "atsRequired" | "pages" | "sector">;
};

const STRATEGIES: StrategyDefinition[] = [
  {
    id: "ats",
    title: { ar: "وضوح أنظمة ATS", en: "ATS clarity" },
    description: {
      ar: "أولوية للبساطة والقراءة الآلية.",
      en: "Prioritise simple, machine-readable structure.",
    },
    input: { atsRequired: true, pages: 1 },
  },
  {
    id: "leadership",
    title: { ar: "مسار قيادي", en: "Leadership path" },
    description: {
      ar: "مساحة منظمة للخبرة والأثر التنفيذي.",
      en: "Structured space for experience and executive impact.",
    },
    input: { pages: 2, sector: "executive" },
  },
  {
    id: "clarity",
    title: { ar: "قصة مركزة", en: "Focused story" },
    description: {
      ar: "سرد قصير ومنظم للانتقال السريع.",
      en: "A concise, organised narrative for quick review.",
    },
    input: { pages: 1, sector: "minimal" },
  },
  {
    id: "portfolio",
    title: { ar: "هوية بصرية", en: "Visual identity" },
    description: {
      ar: "عرض أكثر تميزاً مع مراجعة PDF قبل الإرسال.",
      en: "A more distinctive presentation with PDF review before sending.",
    },
    input: { pages: 2, sector: "creative" },
  },
];

/**
 * Explainable, browser-local template guidance. It accepts only broad design
 * preferences, does not collect CV content, and never persists a visitor's
 * choices. The ranking reuses the deterministic recommendation engine.
 */
export function TemplateIntelligenceGuide({
  onRecommendationsChange,
}: {
  onRecommendationsChange: (templateIds: string[]) => void;
}) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [strategy, setStrategy] = useState<Strategy>("ats");
  const [shown, setShown] = useState(false);

  const selected = STRATEGIES.find((item) => item.id === strategy) ?? STRATEGIES[0]!;
  const recommendations = useMemo(
    () =>
      recommendTemplates(
        {
          language: lang,
          direction: dir,
          ...selected.input,
        },
        3,
      ),
    [dir, lang, selected],
  );

  const applyRecommendations = () => {
    setShown(true);
    onRecommendationsChange(recommendations.map((item) => item.templateId));
  };

  return (
    <section
      className="seerati-intelligence-guide"
      dir={dir}
      aria-labelledby="template-intelligence-title"
      data-testid="template-intelligence-guide"
    >
      <div className="seerati-intelligence-guide__signal" aria-hidden="true" />
      <div className="seerati-intelligence-guide__intro">
        <Badge variant="secondary" className="w-fit gap-1.5 rounded-full">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {ar ? "مرشد القوالب الذكي" : "Intelligent template guide"}
        </Badge>
        <h2
          id="template-intelligence-title"
          className="mt-4 text-2xl font-extrabold tracking-tight md:text-3xl"
        >
          {ar
            ? "ابدأ بنية واضحة، ثم دع التصميم يخدم قصتك"
            : "Start with a clear intent, then let design serve your story"}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          {ar
            ? "اختر هدفاً بصرياً واحداً لتحصل على اقتراحات محلية قابلة للتفسير. لا نطلب اسمك أو سيرتك ولا نحفظ هذا الاختيار."
            : "Choose one visual goal to receive explainable local suggestions. We do not ask for your name or resume, and this choice is not saved."}
        </p>
      </div>

      <div
        className="seerati-intelligence-guide__controls"
        role="group"
        aria-label={ar ? "هدف اختيار القالب" : "Template selection goal"}
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {ar ? "ما الأهم الآن؟" : "What matters most now?"}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {STRATEGIES.map((item) => {
            const active = item.id === strategy;
            return (
              <button
                key={item.id}
                type="button"
                className={`seerati-intelligence-guide__choice ${active ? "is-active" : ""}`}
                aria-pressed={active}
                onClick={() => {
                  setStrategy(item.id);
                  setShown(false);
                  onRecommendationsChange([]);
                }}
              >
                <span className="flex items-start gap-2">
                  <Compass className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="text-start">
                    <span className="block text-sm font-bold">
                      {ar ? item.title.ar : item.title.en}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {ar ? item.description.ar : item.description.en}
                    </span>
                  </span>
                </span>
                {active && (
                  <CheckCircle2
                    className="size-4 shrink-0 text-emerald-accent"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
        <Button type="button" className="mt-4 w-full sm:w-auto" onClick={applyRecommendations}>
          <Wand2 className="size-4" aria-hidden="true" />
          {ar ? "اعرض توصيات محلية" : "Show local recommendations"}
        </Button>
      </div>

      <div className="seerati-intelligence-guide__results" aria-live="polite">
        {shown ? (
          <>
            <p className="text-sm font-bold">
              {ar ? "ثلاث نقاط بداية مناسبة" : "Three sensible starting points"}
            </p>
            <div className="mt-3 space-y-2">
              {recommendations.map((recommendation, index) => {
                const template = defaultTemplates.find(
                  (item) => item.id === recommendation.templateId,
                );
                if (!template) return null;
                return (
                  <div
                    key={recommendation.templateId}
                    className="seerati-intelligence-guide__result"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{template.name[lang]}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {recommendation.reason[lang]}
                      </span>
                    </span>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/resumes/new" search={{ template: template.id }}>
                        {ar ? "استخدم" : "Use"}
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {ar
                ? "هذه توصية محلية من خصائص القوالب، وليست وعداً بنتيجة ATS أو توظيف. راجع المعاينة وPDF قبل الإرسال."
                : "This is a local template-property recommendation, not an ATS or hiring guarantee. Review the preview and PDF before sending."}
            </p>
          </>
        ) : (
          <div className="seerati-intelligence-guide__empty">
            <Sparkles className="size-4 text-emerald-accent" aria-hidden="true" />
            <span>
              {ar
                ? "ستظهر التوصيات هنا بعد اختيار هدفك."
                : "Recommendations will appear here after you choose your goal."}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
