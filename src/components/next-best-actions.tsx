/**
 * "Your next step" cards for the dashboard and job workspace.
 *
 * The ranking comes from the deterministic engine in next-best-action.ts. No
 * model decides what appears here or what state anything is in.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { PRIORITY_LABEL, type ActionPriority, type NextAction } from "@/lib/next-best-action";
import { agentById } from "@/lib/team";

const TONE: Record<ActionPriority, string> = {
  critical: "border-destructive/40 bg-destructive/5",
  high: "border-primary/40 bg-primary/5",
  medium: "border-border bg-muted/40",
  low: "border-border bg-muted/20",
};

export function NextBestActions({
  actions,
  title,
  compact,
}: {
  actions: NextAction[];
  title?: string;
  compact?: boolean;
}) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";

  if (!actions.length) {
    return (
      <Card dir={dir}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title ?? (ar ? "خطوتك التالية" : "Your next step")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
            {ar
              ? "لا خطوات عاجلة الآن — ملفك وسيرتك في حالة جيدة."
              : "Nothing urgent right now — your profile and resume are in good shape."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir={dir}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-4" />
          {title ?? (ar ? "خطوتك التالية" : "Your next step")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {ar
            ? "مرتّبة حسب الأثر، ومبنية على حالة بياناتك الفعلية."
            : "Ordered by impact, based on the actual state of your data."}
        </p>
      </CardHeader>
      <CardContent className={compact ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
        {actions.map((a) => {
          const owner = agentById(a.personaOwner);
          return (
            <Link
              key={a.id}
              to={a.to}
              {...(a.params ? { params: a.params } : {})}
              className={`group block rounded-2xl border p-3 transition-colors hover:border-primary ${TONE[a.priority]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {ar ? PRIORITY_LABEL[a.priority].ar : PRIORITY_LABEL[a.priority].en}
                </Badge>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </div>
              <p className="mt-1.5 text-sm font-bold leading-[1.7]">{ar ? a.title.ar : a.title.en}</p>
              <p className="mt-1 text-xs leading-[1.9] text-muted-foreground">
                {ar ? a.why.ar : a.why.en}
              </p>
              {owner ? (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {ar ? `المسؤول: ${owner.name.ar}` : `Owner: ${owner.name.en}`}
                </p>
              ) : null}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
