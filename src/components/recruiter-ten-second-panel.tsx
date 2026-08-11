import { AlertTriangle, Eye, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import type { RecruiterTenSecondScan } from "@/lib/recruiter-ten-second-scan";

export function RecruiterTenSecondPanel({ scan }: { scan: RecruiterTenSecondScan }) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const band =
    scan.band === "strong"
      ? ar
        ? "قوي"
        : "Strong"
      : scan.band === "workable"
        ? ar
          ? "قابل للتحسين"
          : "Workable"
        : ar
          ? "ضعيف"
          : "Weak";

  return (
    <div dir={dir} className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TimerReset className="size-5" />
                {ar ? "محاكاة أول 10 ثوانٍ" : "First 10-second recruiter scan"}
              </CardTitle>
              <p className="mt-1 max-w-3xl text-xs leading-6 text-muted-foreground">
                {ar ? scan.disclaimer.ar : scan.disclaimer.en}
              </p>
            </div>
            <div className="text-end">
              <div className="text-3xl font-black">{scan.score}/100</div>
              <Badge variant="outline">{band}</Badge>
            </div>
          </div>
          <Progress value={scan.score} className="mt-4" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          {scan.categories.map((category) => (
            <div key={category.id} className="rounded-xl border border-border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-bold">{ar ? category.label.ar : category.label.en}</p>
                <span className="text-xs font-black">
                  {category.score}/{category.max}
                </span>
              </div>
              <Progress value={(category.score / category.max) * 100} className="mt-2 h-1.5" />
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                {ar ? category.explanation.ar : category.explanation.en}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-4" /> {ar ? "مسار القراءة المتوقع" : "Likely scan timeline"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {scan.timeline.map((moment) => (
            <div key={moment.window} className="rounded-2xl border border-border p-4">
              <Badge variant="secondary">{moment.window}</Badge>
              <h3 className="mt-3 font-bold">{ar ? moment.title.ar : moment.title.en}</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {moment.notices.map((notice, index) => (
                  <li key={index}>• {ar ? notice.ar : notice.en}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "Attention Map تقديري" : "Estimated attention map"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scan.attentionMap.slice(0, 8).map((item) => (
            <div key={item.section} className="grid gap-2 md:grid-cols-[180px_1fr_70px] md:items-center">
              <div className="text-sm font-semibold">{ar ? item.label.ar : item.label.en}</div>
              <div>
                <Progress value={item.score} className="h-2" />
                <p className="mt-1 text-[11px] text-muted-foreground">{ar ? item.reason.ar : item.reason.en}</p>
              </div>
              <Badge variant={item.level === "high" ? "default" : "outline"} className="justify-center">
                {item.score}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" /> {ar ? "أقوى الإشارات" : "Strongest signals"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scan.strongestSignals.length ? (
              <ul className="space-y-2 text-sm">
                {scan.strongestSignals.map((signal, index) => (
                  <li key={index} className="rounded-xl bg-muted/50 p-3">{ar ? signal.ar : signal.en}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{ar ? "لا توجد إشارات قوية كافية بعد." : "Not enough strong signals yet."}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" /> {ar ? "النقاط التي قد تُفقد الانتباه" : "Likely blind spots"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scan.blindSpots.length ? (
              <ul className="space-y-2 text-sm">
                {scan.blindSpots.map((spot, index) => (
                  <li key={index} className="rounded-xl border border-border p-3">{ar ? spot.ar : spot.en}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{ar ? "لا توجد فجوات بارزة وفق القواعد الحالية." : "No major blind spots under the current rules."}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" /> {ar ? "أفضل خطوات التحسين" : "Highest-value improvements"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scan.actions.map((action) => (
            <div key={action.id} className="flex gap-3 rounded-xl border border-border p-3">
              <Badge variant="secondary">P{action.priority}</Badge>
              <div>
                <p className="text-sm font-bold">{ar ? action.title.ar : action.title.en}</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">{ar ? action.detail.ar : action.detail.en}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
