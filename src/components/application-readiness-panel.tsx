import { CheckCircle2, CircleAlert, FileCheck2, FileQuestion, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  buildApplicationReadiness,
  type RequirementStatus,
} from "@/lib/application-readiness";
import type { FactGraph } from "@/lib/career-facts";
import type { Resume } from "@/lib/types";

const STATUS_META: Record<
  RequirementStatus,
  { ar: string; en: string; icon: typeof CheckCircle2; className: string }
> = {
  matched: {
    ar: "متطابق",
    en: "Matched",
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  partial: {
    ar: "جزئي",
    en: "Partial",
    icon: FileQuestion,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  missing: {
    ar: "غير موجود",
    en: "Missing",
    icon: CircleAlert,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  unverified: {
    ar: "غير موثّق",
    en: "Unverified",
    icon: ShieldCheck,
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
};

export function ApplicationReadinessPanel({
  jobTitle,
  jobDescription,
  resumes,
  graph,
  lang,
}: {
  jobTitle: string;
  jobDescription: string;
  resumes: Resume[];
  graph: FactGraph;
  lang: "ar" | "en";
}) {
  const ar = lang === "ar";
  if (!jobDescription.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-primary" />
            {ar ? "جاهزية التقديم" : "Application readiness"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {ar
            ? "أضف الوصف الوظيفي ثم شغّل التحليل لرؤية خريطة المطابقة والنسخة الأنسب من سيرتك."
            : "Add the job description and run the analysis to see the requirement map and best resume variant."}
        </CardContent>
      </Card>
    );
  }

  const report = buildApplicationReadiness({ jobTitle, jobDescription, resumes, graph });
  const band =
    report.band === "ready"
      ? ar
        ? "جاهز للتقديم"
        : "Ready to apply"
      : report.band === "improve-first"
        ? ar
          ? "حسّن قبل التقديم"
          : "Improve before applying"
        : ar
          ? "يحتاج تجهيز"
          : "Needs preparation";
  const best = report.variants[0] ?? null;

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="border-b border-border/60 bg-primary/[0.035]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4 text-primary" />
              {ar ? "ذكاء مطابقة الوظيفة وجاهزية التقديم" : "Job Match & Application Readiness"}
            </CardTitle>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {ar
                ? "يقارن نص الوظيفة مع كل سيرة محفوظة وسجل الأدلة، ثم يفصل بين المتطابق والجزئي والمفقود وغير الموثق."
                : "Compares the pasted job text with every saved resume and the evidence graph, separating matched, partial, missing and unverified requirements."}
            </p>
          </div>
          <div className="text-end">
            <p className="text-2xl font-black tabular-nums">{report.score}/100</p>
            <Badge variant={report.band === "ready" ? "default" : "secondary"}>{band}</Badge>
          </div>
        </div>
        <Progress value={report.score} className="mt-3 h-2" />
      </CardHeader>

      <CardContent className="space-y-5 p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(STATUS_META) as RequirementStatus[]).map((status) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            return (
              <div key={status} className={`rounded-xl border p-3 ${meta.className}`}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <Icon className="size-3.5" />
                  {meta[lang]}
                </div>
                <p className="mt-1 text-xl font-black tabular-nums">{report.requirementCounts[status]}</p>
              </div>
            );
          })}
        </div>

        {best ? (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.025] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {ar ? "السيرة الأنسب لهذه الوظيفة" : "Best resume for this job"}
                </p>
                <p className="mt-0.5 font-extrabold">{best.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {best.templateName[lang]} · {best.atsFriendly ? "ATS" : ar ? "قالب بصري" : "Visual template"}
                </p>
              </div>
              <div className="text-end">
                <p className="text-lg font-black">{best.score}%</p>
                <p className="text-[10px] text-muted-foreground">
                  {ar ? "مطابقة المستند" : "document alignment"}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-5">
              <Metric label={ar ? "المتطلبات" : "Requirements"} value={best.requirementScore} />
              <Metric label={ar ? "الدور" : "Role"} value={best.roleAlignmentScore} />
              <Metric label="ATS" value={best.atsScore} />
              <Metric label={ar ? "الأدلة" : "Evidence"} value={best.evidenceScore} />
              <Metric label={ar ? "اكتمال السيرة" : "Completeness"} value={best.completenessScore} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {ar ? "أنشئ سيرة واحدة على الأقل لبدء مقارنة النسخ." : "Create at least one resume to compare variants."}
          </p>
        )}

        {report.variants.length > 1 ? (
          <div>
            <p className="mb-2 text-xs font-bold">{ar ? "مقارنة نسخ السيرة" : "Resume comparison"}</p>
            <div className="space-y-2">
              {report.variants.map((variant, index) => (
                <div
                  key={variant.resumeId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {index === 0 ? <FileCheck2 className="size-3.5 text-primary" /> : null}
                      <p className="truncate text-xs font-bold">{variant.title}</p>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {variant.statusCounts.matched} {ar ? "متطابق" : "matched"} · {variant.statusCounts.unverified}{" "}
                      {ar ? "غير موثّق" : "unverified"} · {variant.statusCounts.missing} {ar ? "مفقود" : "missing"}
                    </p>
                  </div>
                  <strong className="tabular-nums">{variant.score}%</strong>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {report.requirements.length ? (
          <div>
            <p className="mb-2 text-xs font-bold">{ar ? "خريطة المتطلبات" : "Requirement map"}</p>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pe-1">
              {report.requirements.map((requirement) => {
                const meta = STATUS_META[requirement.status];
                const Icon = meta.icon;
                return (
                  <div key={requirement.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold">{requirement.label}</p>
                      <Badge variant="outline" className={`gap-1 text-[9px] ${meta.className}`}>
                        <Icon className="size-3" />
                        {meta[lang]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      {requirement.explanation[lang]}
                    </p>
                    {requirement.resumeEvidence.length || requirement.graphEvidence.length ? (
                      <div className="mt-2 space-y-1 text-[9px] text-muted-foreground">
                        {requirement.resumeEvidence[0] ? (
                          <p>
                            <strong className="text-foreground">{ar ? "في السيرة:" : "Resume:"}</strong>{" "}
                            {requirement.resumeEvidence[0]}
                          </p>
                        ) : null}
                        {requirement.graphEvidence[0] ? (
                          <p>
                            <strong className="text-foreground">{ar ? "في الأدلة:" : "Evidence:"}</strong>{" "}
                            {requirement.graphEvidence[0]}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {report.priorities.length ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-3">
            <p className="text-xs font-bold">{ar ? "قبل التقديم" : "Before applying"}</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {report.priorities.map((item, index) => (
                <li key={index}>• {item[lang]}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="border-t border-border/60 pt-3 text-[9px] leading-relaxed text-muted-foreground">
          {report.disclaimer[lang]}
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/70 p-2 text-center">
      <p className="font-black tabular-nums">{value}</p>
      <p className="mt-0.5 text-muted-foreground">{label}</p>
    </div>
  );
}
