import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  FileText,
  Languages,
  ScanSearch,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Capability = {
  icon: typeof Sparkles;
  href: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  tone: string;
};

const capabilities: Capability[] = [
  {
    icon: Sparkles,
    href: "#assistant-builder",
    title: { ar: "اكتب سيرتك مع AI", en: "Draft with AI" },
    description: {
      ar: "أسئلة قصيرة ثم ملخص وإنجازات ومهارات قابلة للمراجعة.",
      en: "Answer a few questions, then review a drafted summary, bullets and skills.",
    },
    tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    icon: Upload,
    href: "/import",
    title: { ar: "استورد Word أو PDF", en: "Import Word or PDF" },
    description: {
      ar: "حوّل ملفك الحالي إلى بيانات منظمة قبل التعديل.",
      en: "Turn an existing file into structured data before editing.",
    },
    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    icon: ScanSearch,
    href: "/ats",
    title: { ar: "افحص ATS", en: "Run an ATS check" },
    description: {
      ar: "راجع الكلمات المفتاحية والوضوح دون وعود توظيف مطلقة.",
      en: "Review keywords and clarity without absolute hiring promises.",
    },
    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    icon: Target,
    href: "/jobs",
    title: { ar: "خصّص لوظيفة", en: "Tailor to a job" },
    description: {
      ar: "اربط خبرتك بوصف وظيفي وراجع التعديلات قبل تطبيقها.",
      en: "Map your experience to a job description and review changes before applying.",
    },
    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  {
    icon: FileText,
    href: "/cover-letters",
    title: { ar: "اكتب خطاب تقديم", en: "Write a cover letter" },
    description: {
      ar: "أنشئ مسودة مرتبطة بسيرتك وراجع الادعاءات قبل الحفظ.",
      en: "Create a resume-grounded draft and review claims before saving.",
    },
    tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  {
    icon: Languages,
    href: "/arabic-intelligence",
    title: { ar: "عربي / English / RTL", en: "Arabic / English / RTL" },
    description: {
      ar: "بدّل اللغة والاتجاه مع الحفاظ على معنى خبرتك.",
      en: "Switch language and direction while preserving your experience.",
    },
    tone: "bg-primary/10 text-primary",
  },
];

export function AssistantCapabilityHub() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby="assistant-capabilities-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {ar ? "مركز مساعد سيرتي" : "Seerati assistant hub"}
          </p>
          <h2
            id="assistant-capabilities-title"
            className="mt-1 text-xl font-extrabold tracking-tight"
          >
            {ar ? "اختر نقطة البداية المناسبة لك" : "Choose the right starting point"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ar
              ? "يمكنك البدء من الصفر، استيراد ملف، فحص ATS، تخصيص السيرة، أو كتابة خطاب تقديم. راجع كل اقتراح قبل تطبيقه."
              : "Start from scratch, import a file, run ATS, tailor your resume, or write a cover letter. Review every suggestion before applying it."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {ar ? "AI مع مراجعة بشرية" : "AI with human review"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item) => {
          const Icon = item.icon;
          const isBuilder = item.href.startsWith("#");
          const className = cn(
            "group flex min-h-32 flex-col justify-between rounded-xl border border-border bg-background p-3 text-start transition-colors hover:border-primary/40 hover:bg-secondary/60",
            isBuilder && "border-primary/30 bg-primary/[0.03]",
          );
          const content = (
            <>
              <span className={cn("grid size-9 place-items-center rounded-lg", item.tone)}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="mt-3 block">
                <span className="flex items-center gap-1 text-sm font-bold">
                  {item.title[lang]}
                  {!isBuilder && (
                    <ArrowUpRight className="size-3.5 opacity-60" aria-hidden="true" />
                  )}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {item.description[lang]}
                </span>
              </span>
            </>
          );
          return isBuilder ? (
            <a key={item.href} href={item.href} className={className}>
              {content}
            </a>
          ) : (
            <Link key={item.href} to={item.href as "/import"} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
