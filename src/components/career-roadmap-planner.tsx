import { useMemo, useState } from "react";
import { CheckCircle2, Compass, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useI18n } from "@/lib/i18n";
import {
  careerRoadmapPrivacyCopy,
  createCareerRoadmap,
  type CareerRoadmapFocus,
  type CareerRoadmapHorizon,
} from "@/lib/career-roadmap";

const FOCUSES: { id: CareerRoadmapFocus; ar: string; en: string }[] = [
  { id: "skills", ar: "تطوير المهارات", en: "Build skills" },
  { id: "portfolio", ar: "بناء المحفظة", en: "Build a portfolio" },
  { id: "network", ar: "العلاقات المهنية", en: "Grow a professional network" },
  { id: "applications", ar: "تحسين التقديم", en: "Improve applications" },
];

const HORIZONS: { id: CareerRoadmapHorizon; ar: string; en: string }[] = [
  { id: "3", ar: "4 أسابيع", en: "4 weeks" },
  { id: "6", ar: "6 أشهر", en: "6 months" },
  { id: "12", ar: "12 شهراً", en: "12 months" },
];

export function CareerRoadmapPlanner() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [targetRole, setTargetRole] = useState("");
  const [focus, setFocus] = useState<CareerRoadmapFocus>("skills");
  const [horizon, setHorizon] = useState<CareerRoadmapHorizon>("3");
  const [planned, setPlanned] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  const milestones = useMemo(
    () => createCareerRoadmap({ locale: lang, focus, horizon, targetRole }),
    [focus, horizon, lang, targetRole],
  );

  const copy = {
    eyebrow: ar ? "خطة المسار" : "Career roadmap",
    title: ar ? "اختر خطوة مهنية يمكن إثباتها" : "Choose a career step you can evidence",
    subtitle: ar
      ? "حوّل هدفاً مهنياً إلى ثلاث مراحل مراجعة محلية. الخطة تساعدك على التنظيم ولا تتنبأ بنتيجة توظيف."
      : "Turn a career goal into three local review stages. The plan helps you organise; it does not predict a hiring outcome.",
    target: ar ? "الدور أو الاتجاه المستهدف" : "Target role or direction",
    targetPlaceholder: ar ? "مثال: مدير مشروع" : "Example: Project manager",
    focus: ar ? "التركيز الحالي" : "Current focus",
    horizon: ar ? "المدة التي تريد التخطيط لها" : "Planning horizon",
    create: ar ? "إنشاء الخطة المحلية" : "Create local plan",
    update: ar ? "تحديث الخطة" : "Update plan",
    milestones: ar ? "مراحل الخطة" : "Plan stages",
    privacy: ar ? "خصوصية الخطة" : "Plan privacy",
    review: ar ? "راجعت هذه المرحلة" : "I reviewed this stage",
  };

  const toggle = (id: string) => {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = () => {
    setPlanned(true);
    setCompleted(new Set());
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 px-4 py-8 md:py-10" dir={ar ? "rtl" : "ltr"}>
      <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-emerald-accent/[0.06] p-6 md:p-8">
        <Badge variant="secondary" className="gap-1.5">
          <Compass className="size-3.5" aria-hidden="true" />
          {copy.eyebrow}
        </Badge>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
          {copy.subtitle}
        </p>
      </section>

      <section
        className="grid gap-5 lg:grid-cols-[1fr_0.75fr]"
        aria-labelledby="roadmap-setup-title"
      >
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle id="roadmap-setup-title">{ar ? "إعداد الخطة" : "Plan setup"}</CardTitle>
            <CardDescription>
              {ar
                ? "اختر ما تريد مراجعته الآن. يمكنك تغيير الخطة أو مسحها في أي وقت قبل إغلاق الصفحة."
                : "Choose what you want to review now. You can change or clear the plan at any time before closing the page."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="roadmap-target">{copy.target}</Label>
              <Input
                id="roadmap-target"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder={copy.targetPlaceholder}
              />
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">{copy.focus}</legend>
              <RadioGroup
                value={focus}
                onValueChange={(value) => setFocus(value as CareerRoadmapFocus)}
                className="grid gap-2 sm:grid-cols-2"
              >
                {FOCUSES.map((item) => (
                  <Label
                    key={item.id}
                    htmlFor={`focus-${item.id}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-secondary/60"
                  >
                    <RadioGroupItem value={item.id} id={`focus-${item.id}`} />
                    {ar ? item.ar : item.en}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">{copy.horizon}</legend>
              <RadioGroup
                value={horizon}
                onValueChange={(value) => setHorizon(value as CareerRoadmapHorizon)}
                className="flex flex-wrap gap-2"
              >
                {HORIZONS.map((item) => (
                  <Label
                    key={item.id}
                    htmlFor={`horizon-${item.id}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/60"
                  >
                    <RadioGroupItem value={item.id} id={`horizon-${item.id}`} />
                    {ar ? item.ar : item.en}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <Button onClick={create}>
              <Sparkles className="size-4" aria-hidden="true" />
              {planned ? copy.update : copy.create}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-accent/25 bg-emerald-accent/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-emerald-accent" aria-hidden="true" />
              {copy.privacy}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>{careerRoadmapPrivacyCopy(lang)}</p>
            <div className="rounded-xl border border-border/80 bg-background/80 p-3 text-xs leading-6">
              {ar
                ? "هذه خارطة تنظيمية قابلة للتعديل وليست توصية توظيف أو وعداً بفرصة أو راتب."
                : "This is an editable organising roadmap, not a hiring recommendation or a promise of an opportunity or salary."}
            </div>
          </CardContent>
        </Card>
      </section>

      {planned ? (
        <section className="space-y-4" aria-labelledby="roadmap-stages-title">
          <div>
            <h2 id="roadmap-stages-title" className="text-xl font-bold">
              {copy.milestones}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "علّم المرحلة بعد مراجعة ما يمكنك إثباته؛ لا تُعامل العلامة كإنجاز تلقائي."
                : "Mark a stage only after reviewing what you can evidence; a check is not an automatic achievement."}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {milestones.map((milestone, index) => {
              const checked = completed.has(milestone.id);
              return (
                <Card
                  key={milestone.id}
                  className={checked ? "border-emerald-accent/50" : "border-border/80"}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary">{milestone.period}</Badge>
                      <span className="text-xs text-muted-foreground">{index + 1}/3</span>
                    </div>
                    <CardTitle className="text-base">{milestone.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">{milestone.detail}</p>
                    <Button
                      variant={checked ? "secondary" : "outline"}
                      className="w-full"
                      onClick={() => toggle(milestone.id)}
                      aria-pressed={checked}
                    >
                      {checked ? (
                        <CheckCircle2 className="size-4 text-emerald-accent" />
                      ) : (
                        <MapPinned className="size-4" />
                      )}
                      {copy.review}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
