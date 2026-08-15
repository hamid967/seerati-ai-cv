import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileCheck2,
  FileText,
  Mail,
  ScanSearch,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  applicationChecklist,
  applicationChecklistProgress,
  applicationLaunchpadPrivacyCopy,
  type ApplicationChecklistItem,
} from "@/lib/application-launchpad";
import { useI18n } from "@/lib/i18n";

type Tool = {
  id: string;
  label: { ar: string; en: string };
  detail: { ar: string; en: string };
  action: { ar: string; en: string };
  to: string;
  Icon: typeof Target;
  guestReady: boolean;
};

const APPLICATION_TOOLS: Tool[] = [
  {
    id: "job-match",
    label: { ar: "مطابقة الوظيفة", en: "Job match" },
    detail: {
      ar: "الصق وصفاً وظيفياً وافهم نقاط التطابق والفجوات بصياغة قابلة للمراجعة.",
      en: "Paste a job description and review matches and gaps with explainable wording.",
    },
    action: { ar: "ابدأ المطابقة", en: "Start matching" },
    to: "/jobs",
    Icon: ScanSearch,
    guestReady: true,
  },
  {
    id: "keyword-scan",
    label: { ar: "ماسح الكلمات", en: "Keyword scanner" },
    detail: {
      ar: "قارن كلمات الدور بمهاراتك من دون إضافة ادعاءات لا يدعمها ملفك.",
      en: "Compare role keywords with your skills without adding unsupported claims.",
    },
    action: { ar: "فحص الكلمات", en: "Scan keywords" },
    to: "/keyword-scanner",
    Icon: Target,
    guestReady: true,
  },
  {
    id: "cover-letter",
    label: { ar: "خطاب تقديم", en: "Cover letter" },
    detail: {
      ar: "أنشئ مسودة مرتبطة بالدور، ثم راجع الأدلة قبل حفظها أو استخدامها.",
      en: "Create a role-linked draft, then review its evidence before saving or using it.",
    },
    action: { ar: "فتح الخطابات", en: "Open letters" },
    to: "/cover-letters",
    Icon: Mail,
    guestReady: true,
  },
  {
    id: "ats",
    label: { ar: "فحص جاهزية ATS", en: "ATS readiness" },
    detail: {
      ar: "افحص قابلية القراءة والبنية قبل التقديم، من دون وعود بنتيجة توظيف.",
      en: "Review readability and structure before applying, without outcome guarantees.",
    },
    action: { ar: "فتح فحص ATS", en: "Open ATS check" },
    to: "/ats",
    Icon: FileCheck2,
    guestReady: true,
  },
];

function ToolCard({ tool, lang }: { tool: Tool; lang: "ar" | "en" }) {
  const { Icon } = tool;
  return (
    <Card className="group h-full border-border/80 bg-card/90 transition-colors hover:border-emerald-accent/45">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-accent/10 text-emerald-accent">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          {tool.guestReady ? (
            <Badge variant="secondary" className="text-[10px]">
              {lang === "ar" ? "متاح للضيف" : "Guest-ready"}
            </Badge>
          ) : null}
        </div>
        <div>
          <CardTitle className="text-base">{tool.label[lang]}</CardTitle>
          <CardDescription className="mt-2 leading-6">{tool.detail[lang]}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline" asChild>
          <Link to={tool.to}>
            {tool.action[lang]}
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function ApplicationLaunchpad() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const checklist = useMemo(() => applicationChecklist(lang), [lang]);
  const [checked, setChecked] = useState<Set<ApplicationChecklistItem["id"]>>(() => new Set());
  const progress = applicationChecklistProgress(checked, lang);
  const progressPercent = Math.round((progress.completed / progress.total) * 100);

  const toggle = (id: ApplicationChecklistItem["id"]) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copy = {
    eyebrow: ar ? "مركز التقديم" : "Application center",
    title: ar
      ? "حوّل فرصتك إلى حزمة تقديم واضحة"
      : "Turn an opportunity into a clear application pack",
    subtitle: ar
      ? "ابدأ من وصف الوظيفة، ثم طابق الأدلة وخطاب التقديم والسيرة قبل الإرسال. لا يتطلب ذلك حساباً للبدء."
      : "Start with the job description, then align evidence, letter, and resume before sending. No account is required to begin.",
    tools: ar ? "أدوات الحزمة" : "Pack tools",
    checklist: ar ? "قائمة الجاهزية" : "Readiness checklist",
    reset: ar ? "مسح العلامات" : "Clear checks",
    complete: ar ? "الحزمة جاهزة للمراجعة النهائية" : "Pack is ready for final review",
    inProgress: ar ? "أكمل العناصر قبل الإرسال" : "Complete the items before sending",
    privacy: ar ? "خصوصية الضيف" : "Guest privacy",
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:py-10" dir={ar ? "rtl" : "ltr"}>
      <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-emerald-accent/[0.06] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {copy.eyebrow}
            </Badge>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {copy.subtitle}
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to="/jobs">
              <ScanSearch className="size-4" aria-hidden="true" />
              {ar ? "ابدأ من وظيفة" : "Start with a job"}
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="application-tools-title">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <h2 id="application-tools-title" className="text-xl font-bold">
            {copy.tools}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPLICATION_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} lang={lang} />
          ))}
        </div>
      </section>

      <section
        className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"
        aria-labelledby="application-checklist-title"
      >
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle id="application-checklist-title">{copy.checklist}</CardTitle>
                <CardDescription className="mt-1.5">
                  {progress.completed}/{progress.total} {ar ? "عناصر مكتملة" : "items complete"}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChecked(new Set())}
                disabled={!checked.size}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {copy.reset}
              </Button>
            </div>
            <Progress
              value={progressPercent}
              aria-label={`${progress.completed} of ${progress.total}`}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {checklist.map((item) => {
              const isChecked = checked.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isChecked}
                  className="flex w-full items-start gap-3 rounded-xl border border-transparent p-3 text-start outline-none transition-colors hover:bg-secondary/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {isChecked ? (
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-emerald-accent"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-emerald-accent/25 bg-emerald-accent/[0.04]">
          <CardHeader>
            <CardTitle className="text-base">
              {progress.ready ? copy.complete : copy.inProgress}
            </CardTitle>
            <CardDescription className="leading-6">
              {progress.ready
                ? ar
                  ? "هذه إشارة لمراجعة الحزمة، وليست ضماناً لنتيجة التوظيف أو قرار جهة العمل."
                  : "This is a prompt to review the pack, not a guarantee of an employment outcome or employer decision."
                : ar
                  ? "استخدم الأدوات أعلاه عند الحاجة، ثم علّم الخطوة بعد أن تتحقق منها بنفسك."
                  : "Use the tools above when needed, then mark a step only after you have verified it yourself."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-emerald-accent/25 bg-background/80 p-4">
              <p className="text-sm font-bold">{copy.privacy}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {applicationLaunchpadPrivacyCopy(lang)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
