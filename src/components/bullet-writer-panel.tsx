import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { suggestStrongerBullets, type BulletSuggestion } from "@/lib/bullet-writer";

type Props = {
  bullets: string[];
  lang: "ar" | "en";
  onApply: (original: string, suggested: string) => void;
};

export function BulletWriterPanel({ bullets, lang, onApply }: Props) {
  const ar = lang === "ar";
  const suggestions = useMemo(() => suggestStrongerBullets(bullets, lang), [bullets, lang]);
  const [applied, setApplied] = useState<Record<string, true>>({});

  if (!suggestions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-emerald-accent" />
            {ar ? "كاتب نقاط الإنجاز" : "Bullet point writer"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {ar
            ? "نقاطك الحالية تبدو قوية بما يكفي، أو أضف خبرات بنقاط إنجاز أولاً."
            : "Your current bullets look strong enough, or add experience bullets first."}
        </CardContent>
      </Card>
    );
  }

  const applyOne = (item: BulletSuggestion) => {
    onApply(item.original, item.suggested);
    setApplied((prev) => ({ ...prev, [item.original]: true }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-emerald-accent" />
          {ar ? "كاتب نقاط الإنجاز" : "Bullet point writer"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {ar
            ? "اقتراحات صياغة أقوى دون اختلاق أرقام. طبّق يدوياً بعد المراجعة."
            : "Stronger phrasing suggestions without inventing metrics. Apply manually after review."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 6).map((item) => {
          const done = Boolean(applied[item.original]);
          return (
            <div key={item.original} className="rounded-xl border border-border p-3 text-sm">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge variant="outline">{ar ? "قبل" : "Before"}</Badge>
                {done ? <Badge variant="secondary">{ar ? "مُطبَّق" : "Applied"}</Badge> : null}
              </div>
              <p className="text-muted-foreground line-through decoration-border">
                {item.original}
              </p>
              <p className="mt-2 font-medium">{item.suggested}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.reason[lang]}</p>
              <Button
                size="sm"
                className="mt-2"
                variant={done ? "secondary" : "default"}
                disabled={done}
                onClick={() => applyOne(item)}
              >
                <Check className="size-3.5" />
                {done ? (ar ? "تم" : "Done") : ar ? "تطبيق" : "Apply"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
