import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Scale,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import {
  createSyntheticCareerProfile,
  searchSyntheticSpecialties,
  type SyntheticCareerGoal,
  type SyntheticExperienceLevel,
  type SyntheticSpecialtyId,
} from "@/modules/synthetic-resume";

const levels: { id: SyntheticExperienceLevel; ar: string; en: string }[] = [
  { id: "student", ar: "طالب", en: "Student" },
  { id: "graduate", ar: "خريج جديد", en: "New graduate" },
  { id: "junior", ar: "خبرة من سنة إلى ثلاث سنوات", en: "One to three years" },
  { id: "mid", ar: "خبرة متوسطة", en: "Mid-level" },
  { id: "advanced", ar: "خبرة متقدمة", en: "Advanced" },
  { id: "manager", ar: "مدير", en: "Manager" },
  { id: "executive", ar: "قيادي تنفيذي", en: "Executive leader" },
  { id: "career-change", ar: "تغيير مسار مهني", en: "Career change" },
  { id: "general", ar: "نموذج عام للتخصص", en: "General specialty sample" },
];

const goals: { id: SyntheticCareerGoal; ar: string; en: string }[] = [
  { id: "job-application", ar: "التقديم على وظيفة", en: "Job application" },
  { id: "graduate-program", ar: "برنامج خريجين", en: "Graduate programme" },
  { id: "internship", ar: "تدريب أو تدريب تعاوني", en: "Internship or co-op" },
  { id: "internal-promotion", ar: "ترقية داخلية", en: "Internal promotion" },
  { id: "career-change", ar: "تغيير مجال", en: "Career change" },
  { id: "public-sector", ar: "وظيفة حكومية", en: "Public-sector role" },
  { id: "private-sector", ar: "وظيفة في القطاع الخاص", en: "Private-sector role" },
  { id: "leadership", ar: "وظيفة قيادية", en: "Leadership role" },
  { id: "general-use", ar: "استخدام عام", en: "General use" },
];

type Props = { onClose: () => void };

export function SyntheticSampleFlow({ onClose }: Props) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { createTransientSampleResume } = useStore();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [specialtyId, setSpecialtyId] = useState<SyntheticSpecialtyId | null>(null);
  const [level, setLevel] = useState<SyntheticExperienceLevel>("graduate");
  const [sampleLanguage, setSampleLanguage] = useState<"ar" | "en">(lang);
  const [goal, setGoal] = useState<SyntheticCareerGoal>("job-application");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [customSpecialty, setCustomSpecialty] = useState("");

  const specialties = useMemo(() => searchSyntheticSpecialties(query), [query]);
  const profile = useMemo(
    () =>
      specialtyId
        ? createSyntheticCareerProfile({
            specialtyId,
            experienceLevel: level,
            language: sampleLanguage,
            goal,
          })
        : null,
    [specialtyId, level, sampleLanguage, goal],
  );
  const activeTemplate = profile?.templates.find((option) => option.template.id === previewId);
  const canContinue = step === 0 ? Boolean(specialtyId) : true;

  const createSample = (templateId: string) => {
    if (!profile) return;
    const template = profile.templates.find((option) => option.template.id === templateId);
    if (!template) return;
    const title =
      profile.resumeData.personal.jobTitle || (ar ? "نموذج سيرة تجريبي" : "Sample resume");
    const resume = createTransientSampleResume({
      title,
      templateId,
      language: sampleLanguage,
      data: profile.resumeData,
      syntheticSample: { ...profile.metadata, selectedTemplateId: templateId },
    });
    void navigate({ to: "/resumes/$id/edit", params: { id: resume.id } });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current.slice(-1), id],
    );
  };

  const heading =
    step === 0
      ? ar
        ? "ما التخصص أو الوظيفة التي تريد إنشاء نموذج سيرة لها؟"
        : "What profession should this sample CV represent?"
      : step === 1
        ? ar
          ? "ما مستوى النموذج الذي يناسبك؟"
          : "Which sample level fits you?"
        : step === 2
          ? ar
            ? "بأي لغة تريد النموذج؟"
            : "Which language should the sample use?"
          : step === 3
            ? ar
              ? "ما الهدف من هذه السيرة؟"
              : "What is this resume for?"
            : ar
              ? "اختر الشكل الأقرب لك"
              : "Choose the closest look";

  return (
    <section
      className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
      data-testid="synthetic-sample-flow"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="secondary">
            <Sparkles className="size-3" aria-hidden="true" />
            {ar ? "نموذج محلي وآمن" : "Local, safe sample"}
          </Badge>
          <h2 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">{heading}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {ar
              ? "سننشئ بيانات وهمية واضحة للمراجعة فقط. لا نطلب تسجيلاً أو بريداً أو رقماً، ولا تحفظ اختياراتك أو النموذج في قاعدة البيانات."
              : "We will create clearly fictional data for review only. No sign-up, email, or phone is required, and neither your choices nor the sample are stored in a database."}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {ar ? "العودة لنورة" : "Back to Noura"}
        </Button>
      </div>
      <Progress
        value={((step + 1) / 5) * 100}
        className="mt-5 h-1.5"
        aria-label={ar ? "تقدم نموذج السيرة" : "Sample resume progress"}
      />

      {step === 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_.8fr]">
          <div>
            <Label htmlFor="synthetic-specialty-search">
              {ar ? "ابحث عن تخصص" : "Search professions"}
            </Label>
            <Input
              id="synthetic-specialty-search"
              className="mt-2"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ar ? "مثال: محاسب أو مطور" : "e.g. accountant or developer"}
              autoComplete="off"
            />
            <div
              className="mt-3 grid gap-2 sm:grid-cols-2"
              role="listbox"
              aria-label={ar ? "تخصصات متاحة" : "Available specialties"}
            >
              {specialties.map((specialty) => {
                const selected = specialty.id === specialtyId;
                return (
                  <button
                    key={specialty.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setSpecialtyId(specialty.id)}
                    className={`min-h-16 rounded-xl border p-3 text-start text-sm ${selected ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:bg-secondary/60"}`}
                  >
                    <span className="block font-semibold">{specialty.name[lang]}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {specialty.group[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4">
            <p className="font-semibold">{ar ? "لم أجد تخصصي" : "I cannot find my specialty"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "المكتبة الأولية تغطي ستة تخصصات فقط. يمكنك كتابة تخصصك هنا للرجوع إليه، ثم اختيار الأقرب لإنشاء نموذج عام قابل للتحرير. لا يُرسل النص أو يُحفظ."
                : "The initial library covers six professions. You may note your specialty here, then choose the closest option for an editable general sample. This text is neither sent nor stored."}
            </p>
            <Input
              className="mt-3"
              value={customSpecialty}
              onChange={(event) => setCustomSpecialty(event.target.value)}
              placeholder={ar ? "اكتب تخصصاً مخصصاً" : "Type a custom specialty"}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={level === item.id}
              onClick={() => setLevel(item.id)}
              className={`min-h-14 rounded-xl border px-3 py-2 text-start text-sm font-semibold ${level === item.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:bg-secondary/60"}`}
            >
              {item[lang]}
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {(["ar", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={sampleLanguage === value}
              onClick={() => setSampleLanguage(value)}
              className={`min-h-20 rounded-xl border p-4 text-start ${sampleLanguage === value ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:bg-secondary/60"}`}
            >
              <span className="block font-semibold">{value === "ar" ? "العربية" : "English"}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {value === "ar" ? "محتوى مهني عربي طبيعي" : "Natural professional English copy"}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={goal === item.id}
              onClick={() => setGoal(item.id)}
              className={`min-h-14 rounded-xl border px-3 py-2 text-start text-sm font-semibold ${goal === item.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:bg-secondary/60"}`}
            >
              {item[lang]}
            </button>
          ))}
          <p className="sm:col-span-2 lg:col-span-3 text-xs text-muted-foreground">
            {ar
              ? "هذا خيار لصياغة النموذج فقط، ولا يعني ارتباط المنصة ببرنامج أو جهة حكومية."
              : "This only guides the sample structure and does not indicate affiliation with a programme or public body."}
          </p>
        </div>
      ) : null}

      {step === 4 && profile ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {ar
                ? "اختر نموذجاً بنفس المصدر التجريبي المنظم. القرار النهائي لك."
                : "Choose a layout using the same structured sample source. The decision remains yours."}
            </p>
            <Badge variant="outline">{ar ? "4 قوالب" : "4 templates"}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {profile.templates.map((option) => {
              const selectedForCompare = compareIds.includes(option.template.id);
              return (
                <article
                  key={option.template.id}
                  className="flex min-h-72 flex-col rounded-xl border border-border bg-background p-3"
                >
                  <div
                    className="h-28 rounded-lg border bg-gradient-to-br from-primary/15 via-background to-secondary/70 p-3"
                    aria-hidden="true"
                  >
                    <div className="h-2 w-1/2 rounded bg-primary/50" />
                    <div className="mt-3 space-y-1.5">
                      <div className="h-1.5 w-full rounded bg-muted" />
                      <div className="h-1.5 w-4/5 rounded bg-muted" />
                      <div className="h-1.5 w-3/5 rounded bg-muted" />
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold">{option.template.name[lang]}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{option.reason[lang]}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">ATS</dt>
                      <dd className="font-semibold">
                        {option.atsFit === "high"
                          ? ar
                            ? "مرتفع"
                            : "High"
                          : ar
                            ? "راجع"
                            : "Review"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{ar ? "الصفحات" : "Pages"}</dt>
                      <dd className="font-semibold">{option.expectedPages}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto grid gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewId(option.template.id)}
                    >
                      <Eye className="size-4" />
                      {ar ? "معاينة" : "Preview"}
                    </Button>
                    <Button
                      type="button"
                      variant={selectedForCompare ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => toggleCompare(option.template.id)}
                      aria-pressed={selectedForCompare}
                    >
                      <Scale className="size-4" />
                      {selectedForCompare
                        ? ar
                          ? "ضمن المقارنة"
                          : "In comparison"
                        : ar
                          ? "قارن"
                          : "Compare"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => createSample(option.template.id)}
                    >
                      <Check className="size-4" />
                      {ar ? "اختر وابدأ التعديل" : "Choose and edit"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          {compareIds.length === 2 ? (
            <section
              className="rounded-xl border border-primary/20 bg-primary/5 p-4"
              aria-live="polite"
            >
              <h3 className="font-bold">{ar ? "مقارنة القالبين" : "Template comparison"}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {profile.templates
                  .filter((option) => compareIds.includes(option.template.id))
                  .map((option) => (
                    <div
                      key={option.template.id}
                      className="border-s border-primary/50 ps-3 text-sm"
                    >
                      <p className="font-semibold">{option.template.name[lang]}</p>
                      <p className="mt-1 text-muted-foreground">
                        {option.strengths[lang].join(" · ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ar ? "قيد:" : "Limit:"} {option.limitations[lang].join(" · ")}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}
          {activeTemplate ? (
            <section
              className="rounded-xl border border-border bg-secondary/20 p-4"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{activeTemplate.template.name[lang]}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTemplate.reason[lang]}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => createSample(activeTemplate.template.id)}
                >
                  {ar ? "استخدم هذا النموذج" : "Use this template"}
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          {ar ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {ar ? "السابق" : "Back"}
        </Button>
        {step < 4 ? (
          <Button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((current) => current + 1)}
          >
            {ar ? "التالي" : "Next"}
            {ar ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
