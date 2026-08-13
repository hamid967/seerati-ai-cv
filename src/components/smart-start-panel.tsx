import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileCheck2,
  FolderOpen,
  ScanSearch,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPrivacyPreview } from "@/modules/intelligence";

const preview = buildPrivacyPreview({
  availableFields: ["resume", "job_description", "contact_fields"],
  requestedFields: [],
  reason: "Local-first smart start",
  consentAiProcessing: false,
});

export function SmartStartPanel({ arabic }: { arabic: boolean }) {
  const choices = arabic
    ? [
        { label: "أنشئ سيرتي", hint: "ابدأ من الصفر", icon: Sparkles, to: "/resumes/new" as const },
        { label: "حسّن سيرتي", hint: "افحص أهم المشكلات", icon: FileCheck2, to: "/ats" as const },
        { label: "جهزني لوظيفة", hint: "حلل الوصف محلياً", icon: Target, to: "/jobs" as const },
        { label: "افحص ATS", hint: "قواعد قابلة للتفسير", icon: ScanSearch, to: "/ats" as const },
        {
          label: "اكتب خطاب تقديم",
          hint: "مرتبط بالوظيفة",
          icon: FolderOpen,
          to: "/cover-letters" as const,
        },
        {
          label: "أنشئ ملفاً مهنياً",
          hint: "تقدم تدريجي واضح",
          icon: UserRound,
          to: "/career-twin" as const,
        },
      ]
    : [
        {
          label: "Create my resume",
          hint: "Start from scratch",
          icon: Sparkles,
          to: "/resumes/new" as const,
        },
        {
          label: "Improve my resume",
          hint: "Find the top issues",
          icon: FileCheck2,
          to: "/ats" as const,
        },
        {
          label: "Prepare me for a job",
          hint: "Analyze it locally",
          icon: Target,
          to: "/jobs" as const,
        },
        {
          label: "Check ATS",
          hint: "Reviewable local rules",
          icon: ScanSearch,
          to: "/ats" as const,
        },
        {
          label: "Write a cover letter",
          hint: "Linked to a job target",
          icon: FolderOpen,
          to: "/cover-letters" as const,
        },
        {
          label: "Create a professional profile",
          hint: "Build it step by step",
          icon: UserRound,
          to: "/career-twin" as const,
        },
      ];

  return (
    <section className="section-y mx-auto max-w-6xl px-4" aria-labelledby="smart-start-title">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              {arabic ? "بداية ذكية" : "Smart start"}
            </p>
            <h2
              id="smart-start-title"
              className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl"
            >
              {arabic ? "ما الذي تريد إنجازه اليوم؟" : "What do you want to accomplish today?"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-[1.9] text-muted-foreground">
              {arabic
                ? "اختر هدفاً واحداً. نبدأ بالقواعد المحلية، ونسألك أقل عدد ممكن من الأسئلة."
                : "Choose one goal. We start with local rules and ask only what is necessary."}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/assistant">
              {arabic ? "اكتب طلباً طبيعياً" : "Use a natural request"}
              <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {choices.map(({ label, hint, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="group rounded-2xl border border-border/80 bg-secondary/30 p-4 transition hover:border-emerald-accent/50 hover:bg-secondary/60"
            >
              <Icon className="size-5 text-emerald-700" aria-hidden="true" />
              <p className="mt-3 font-bold group-hover:text-primary">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </Link>
          ))}
        </div>
        <div
          className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground"
          role="note"
        >
          <span>{arabic ? "البيانات في الذاكرة فقط" : "Data stays in memory"}</span>
          <span>
            {arabic ? "لا إرسال إلى AI دون موافقة" : "No AI transmission without consent"}
          </span>
          <span>
            {arabic
              ? `الإرسال الحالي: ${preview.sendsContent ? "نعم" : "لا"}`
              : `Current transmission: ${preview.sendsContent ? "yes" : "no"}`}
          </span>
        </div>
      </div>
    </section>
  );
}
