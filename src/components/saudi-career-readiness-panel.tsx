import { AlertTriangle, CheckCircle2, MapPinned, ShieldCheck, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTemplate } from "@/components/resume-preview";
import { buildSaudiCareerReadiness } from "@/lib/saudi-career-readiness";
import type { Resume } from "@/lib/types";

export function SaudiCareerReadinessPanel({
  resume,
  measuredPages,
  lang,
}: {
  resume: Resume;
  measuredPages: number;
  lang: "ar" | "en";
}) {
  const ar = lang === "ar";
  const readiness = buildSaudiCareerReadiness(resume, {
    template: getTemplate(resume.templateId),
    measuredPages,
  });

  const bandLabel =
    readiness.band === "strong"
      ? ar
        ? "جاهزية قوية"
        : "Strong readiness"
      : readiness.band === "ready-with-improvements"
        ? ar
          ? "جاهز مع تحسينات"
          : "Ready with improvements"
        : ar
          ? "يحتاج تطوير"
          : "Needs work";

  return (
    <section className="seerati-panel overflow-hidden border-primary/20">
      <div className="border-b border-border/70 bg-primary/[0.04] p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <MapPinned className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold">
                {ar ? "جاهزية السيرة للسوق السعودي" : "Saudi Career Readiness"}
              </h2>
              <Badge variant={readiness.score >= 85 ? "default" : "secondary"}>
                {readiness.score}/100
              </Badge>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {ar
                ? "فحص حتمي للسيرة نفسها: الهوية المهنية، التواصل، اللغة، المحتوى، الأدلة، ATS وتقليل البيانات الحساسة."
                : "A deterministic document check covering identity, contact data, language, content, proof, ATS and sensitive-data minimization."}
            </p>
          </div>
        </div>
        <Progress className="mt-3 h-2" value={readiness.score} />
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          <strong>{bandLabel}</strong>
          <span className="text-muted-foreground">
            {ar ? `${readiness.priorities.length} أولوية حالية` : `${readiness.priorities.length} current priorities`}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {readiness.strengths.length ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="size-4 text-emerald-accent" />
              {ar ? "نقاط قوية" : "Strong signals"}
            </div>
            <div className="mt-2 space-y-1.5">
              {readiness.strengths.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg border border-border/60 bg-background/55 p-2.5">
                  <p className="text-xs font-semibold">{item.title[lang]}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    {item.detail[lang]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <Wrench className="size-4 text-amber-600" />
            {ar ? "الأولوية قبل الإرسال" : "Priority before sending"}
          </div>
          {readiness.priorities.length ? (
            <div className="mt-2 space-y-2">
              {readiness.priorities.slice(0, 4).map((item, index) => (
                <div key={item.id} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-black">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-bold">{item.title[lang]}</p>
                        {item.severity === "warning" ? (
                          <AlertTriangle className="size-3.5 text-destructive" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        {item.detail[lang]}
                      </p>
                      {item.action ? (
                        <p className="mt-1.5 text-[10px] font-medium leading-relaxed">
                          {item.action[lang]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              {ar ? "لا توجد أولوية كبيرة في هذا الفحص." : "No major priority was found in this check."}
            </p>
          )}
        </div>

        {readiness.sensitiveSignals.length ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-destructive">
              <ShieldCheck className="size-4" />
              {ar ? "مراجعة الخصوصية مطلوبة" : "Privacy review required"}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              {ar
                ? "راجع محتوى السيرة بحثًا عن رقم هوية/إقامة أو بيانات شخصية لا يحتاجها طلب التوظيف قبل التنزيل والمشاركة."
                : "Review the resume for national-ID/Iqama-like numbers or personal data that the application does not need before exporting or sharing."}
            </p>
          </div>
        ) : null}

        <p className="border-t border-border/60 pt-3 text-[9px] leading-relaxed text-muted-foreground">
          {readiness.disclaimer[lang]}
        </p>
      </div>
    </section>
  );
}
