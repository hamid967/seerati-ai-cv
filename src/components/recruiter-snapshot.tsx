/**
 * Recruiter Snapshot card.
 *
 * Shows the first-ten-seconds read of a resume. Every line states its source,
 * and verified items carry an evidence badge, so it is always clear what is
 * documented versus merely written.
 */
import { AlertTriangle, BadgeCheck, Clock, Contact, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { InsightSource, RecruiterSnapshot } from "@/lib/recruiter-view";

const SOURCE_LABEL: Record<InsightSource, { ar: string; en: string }> = {
  resume: { ar: "من السيرة", en: "From resume" },
  evidence: { ar: "من خزانة الأدلة", en: "From evidence vault" },
  job_description: { ar: "من الوصف الوظيفي", en: "From job description" },
  lint: { ar: "من فحص الجودة", en: "From quality check" },
  derived: { ar: "محسوب من التواريخ", en: "Derived from dates" },
};

function SourceTag({ source }: { source: InsightSource }) {
  const { lang } = useI18n();
  return (
    <span className="text-[11px] text-muted-foreground">
      {lang === "ar" ? SOURCE_LABEL[source].ar : SOURCE_LABEL[source].en}
    </span>
  );
}

export function RecruiterSnapshotCard({ snapshot }: { snapshot: RecruiterSnapshot }) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";

  return (
    <Card dir={dir}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {ar ? "نظرة مسؤول التوظيف — ملخص سريع" : "Recruiter Snapshot"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {ar
            ? "ملخص محسوب من بياناتك فقط، وليس محاكاة لمسؤول توظيف حقيقي ولا توقعاً للقبول."
            : "Computed from your own data only — not a simulated recruiter and not a hiring prediction."}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Target className="size-3.5" /> {ar ? "الوظيفة المستهدفة" : "Target role"}
            </p>
            <p className="mt-1 truncate text-sm font-bold">
              {snapshot.targetTitle || (ar ? "غير محددة" : "Not set")}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3.5" /> {ar ? "سنوات الخبرة" : "Years of experience"}
            </p>
            <p className="mt-1 text-sm font-bold">
              {snapshot.yearsExperience === null
                ? ar
                  ? "غير محسوبة"
                  : "Not derived"
                : `${snapshot.yearsExperience}`}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {ar ? snapshot.yearsNote.ar : snapshot.yearsNote.en}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Contact className="size-3.5" /> {ar ? "اكتمال التواصل" : "Contact completeness"}
            </p>
            <p className="mt-1 text-sm font-bold">{snapshot.contact.score}%</p>
            {!snapshot.contact.complete ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {ar ? "ناقص: " : "Missing: "}
                {snapshot.contact.missing.join(", ")}
              </p>
            ) : null}
          </div>
        </div>

        <section>
          <h4 className="text-sm font-bold">
            {ar ? "أقوى ٣ إنجازات موثّقة" : "Top 3 verified achievements"}
          </h4>
          {snapshot.topEvidence.length ? (
            <ul className="mt-2 space-y-1.5">
              {snapshot.topEvidence.map((i) => (
                <li key={i.id} className="rounded-xl border border-border p-2.5">
                  <div className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-[1.8]">{i.value}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {ar ? "موثّق بدليل" : "Evidence-backed"}
                        </Badge>
                        <SourceTag source={i.source} />
                      </div>
                      {i.detail ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {ar ? i.detail.ar : i.detail.en}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              {ar
                ? "لا توجد إنجازات موثّقة بعد — أضف إنجازاً ودليله في خزانة الأدلة."
                : "No verified achievements yet — add one with its evidence in the vault."}
            </p>
          )}
        </section>

        {snapshot.matchingSkills.length || snapshot.missingSkills.length ? (
          <section className="grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-bold">{ar ? "مهارات مطابقة" : "Matching skills"}</h4>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {snapshot.matchingSkills.length ? (
                  snapshot.matchingSkills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[11px]">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {ar ? "لا تطابق مباشر" : "No direct match"}
                  </span>
                )}
              </div>
              <SourceTag source="job_description" />
            </div>
            <div>
              <h4 className="text-sm font-bold">{ar ? "كلمات غير موجودة" : "Terms not present"}</h4>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {snapshot.missingSkills.map((s) => (
                  <Badge key={s} variant="outline" className="text-[11px]">
                    {s}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {ar
                  ? "أضِفها فقط إن كانت تصف خبرتك فعلاً."
                  : "Add them only if they truly describe your experience."}
              </p>
            </div>
          </section>
        ) : null}

        {snapshot.gaps.length ? (
          <section>
            <h4 className="text-sm font-bold">{ar ? "أهم الفجوات" : "Strongest gaps"}</h4>
            <ul className="mt-2 space-y-1.5">
              {snapshot.gaps.map((g) => (
                <li key={g.id} className="flex items-start gap-2 rounded-xl bg-muted/40 p-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">
                      {ar ? g.label.ar : g.label.en}: {g.value}
                    </p>
                    {g.detail ? (
                      <p className="text-[11px] text-muted-foreground">
                        {ar ? g.detail.ar : g.detail.en}
                      </p>
                    ) : null}
                    <SourceTag source={g.source} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {snapshot.vaguest ? (
          <section className="rounded-xl border border-dashed border-border p-3">
            <h4 className="text-sm font-bold">{ar ? "أكثر عبارة تحتاج تحديداً" : "Vaguest item"}</h4>
            <p className="mt-1 text-xs leading-[1.9] text-muted-foreground">
              “{snapshot.vaguest.text}”
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {ar ? "الموضع: " : "Where: "}
              {snapshot.vaguest.where}
            </p>
          </section>
        ) : null}

        {snapshot.scanFlags.length ? (
          <section>
            <h4 className="text-sm font-bold">
              {ar ? "ملاحظات القراءة والمسح" : "Scan & readability flags"}
            </h4>
            <ul className="mt-1.5 space-y-1">
              {snapshot.scanFlags.slice(0, 5).map((f) => (
                <li key={f.id} className="text-xs text-muted-foreground">
                  · {ar ? f.message.ar : f.message.en}
                </li>
              ))}
            </ul>
            <SourceTag source="lint" />
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
