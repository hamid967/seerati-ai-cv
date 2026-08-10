/**
 * Interview answers grounded in the user's own evidence.
 *
 * An answer is only drafted from verified `career_facts` and their evidence. If
 * no story fits the question, the component does NOT invent an experience or a
 * number — it asks the user for Situation / Task / Action / Result and, once
 * they approve, stores the result as a `star_story` fact they own.
 */
import { useMemo, useState } from "react";
import { BadgeCheck, Info, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { aiService } from "@/lib/ai-service";
import {
  buildAiFactContext,
  createEvidence,
  createFact,
  evidenceForFact,
  unsupportedFigures,
  verifiedFacts,
  type CareerFact,
  type FactGraph,
} from "@/lib/career-facts";

type Props = {
  userId: string;
  question: string;
  graph: FactGraph;
  jobDescription?: string;
  onSaved?: () => void;
};

const STAR_FIELDS = [
  {
    key: "situation",
    ar: "الموقف",
    en: "Situation",
    ph: { ar: "ما كان السياق؟", en: "What was the context?" },
  },
  {
    key: "task",
    ar: "المهمة",
    en: "Task",
    ph: { ar: "ما كانت مسؤوليتك؟", en: "What was your responsibility?" },
  },
  {
    key: "action",
    ar: "الإجراء",
    en: "Action",
    ph: { ar: "ماذا فعلت تحديداً؟", en: "What exactly did you do?" },
  },
  {
    key: "result",
    ar: "النتيجة",
    en: "Result",
    ph: { ar: "ما النتيجة؟ رقم إن توفّر", en: "What was the result? A number if you have one" },
  },
] as const;

type StarKey = (typeof STAR_FIELDS)[number]["key"];

/** Rank the user's verified facts against the question wording. */
function relevantFacts(graph: FactGraph, question: string, jobDescription?: string): CareerFact[] {
  const tokens = new Set(
    `${question} ${jobDescription ?? ""}`
      .toLowerCase()
      .split(/[^\p{L}\p{N}+#.]+/u)
      .filter((t) => t.length > 3),
  );
  return verifiedFacts(graph)
    .map((f) => {
      const hay = `${f.title} ${f.value}`.toLowerCase();
      let score = 0;
      tokens.forEach((t) => {
        if (hay.includes(t)) score += 1;
      });
      if (f.type === "star_story") score += 1;
      return { f, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.f);
}

export function InterviewEvidenceAnswer({
  userId,
  question,
  graph,
  jobDescription,
  onSaved,
}: Props) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [answer, setAnswer] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [star, setStar] = useState<Record<StarKey, string>>({
    situation: "",
    task: "",
    action: "",
    result: "",
  });
  const [metric, setMetric] = useState({ value: "", unit: "" });
  const [saving, setSaving] = useState(false);

  const facts = useMemo(
    () => relevantFacts(graph, question, jobDescription),
    [graph, question, jobDescription],
  );
  const hasStory = facts.length > 0;
  const flagged = answer ? unsupportedFigures(answer, graph) : [];

  const draft = async () => {
    setDrafting(true);
    try {
      const context = buildAiFactContext(graph, {
        ...(jobDescription ? { jobDescription } : {}),
      });
      if (context === "NO_VERIFIED_FACTS") {
        toast.error(
          ar
            ? "لا توجد حقائق موثّقة بعد — أكمل حقول STAR أدناه أولاً."
            : "No verified facts yet — fill the STAR fields below first.",
        );
        return;
      }
      const res = await aiService.run({
        task: "chat",
        lang,
        input: [
          ar
            ? "صِغ إجابة مقابلة بأسلوب STAR للسؤال التالي، مستخدماً الحقائق الموثّقة فقط. لا تضف أي شركة أو رقم أو مسمّى غير مذكور."
            : "Write a STAR interview answer for the question below using ONLY the verified facts. Do not add any company, number or title that is not listed.",
          `Q: ${question}`,
          "Verified facts:",
          context,
        ].join("\n"),
        context: { ...(jobDescription ? { jobDescription } : {}) },
      });
      setAnswer(res.text);
    } catch {
      toast.error(ar ? "تعذّر توليد الإجابة." : "Could not draft the answer.");
    } finally {
      setDrafting(false);
    }
  };

  const starComplete = STAR_FIELDS.every((f) => star[f.key].trim().length > 2);

  const saveStory = async () => {
    if (!starComplete) return;
    setSaving(true);
    try {
      const title = question.slice(0, 120);
      const value = STAR_FIELDS.map((f) => `${ar ? f.ar : f.en}: ${star[f.key].trim()}`).join("\n");
      const fact = await createFact(userId, {
        type: "star_story",
        title,
        value,
        sourceType: "interview",
        sourceLabel: ar ? "مقابلة تدريبية" : "Mock interview",
        // The user typed this themselves, so it is theirs and confirmed.
        verificationStatus: "verified",
        metadata: { question, star },
      });
      if (fact && metric.value.trim()) {
        await createEvidence(userId, {
          factId: fact.id,
          evidenceType: "metric",
          title: ar ? `نتيجة: ${title}` : `Result: ${title}`,
          description: star.result,
          metricValue: metric.value.trim(),
          metricUnit: metric.unit.trim(),
          verified: true,
        });
      }
      setStar({ situation: "", task: "", action: "", result: "" });
      setMetric({ value: "", unit: "" });
      onSaved?.();
      toast.success(ar ? "حُفظت القصة في خزانة الأدلة." : "Story saved to your evidence vault.");
    } catch {
      toast.error(ar ? "تعذّر الحفظ." : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card dir={dir}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base leading-[1.7]">{question}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {ar
            ? "الإجابة تُبنى من حقائقك الموثّقة فقط — لا نخترع تجربة ولا رقماً."
            : "Answers are built only from your verified facts — no invented experience or numbers."}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasStory ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={draft}
              disabled={drafting}
            >
              {drafting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {ar ? "اصنع إجابة من أدلتي" : "Draft from my evidence"}
            </Button>

            {answer ? (
              <div className="space-y-2">
                <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={7} />
                {flagged.length ? (
                  <p className="rounded-xl bg-destructive/5 p-2.5 text-[11px] text-muted-foreground">
                    {ar
                      ? `أرقام بلا دليل موثّق: ${flagged.join("، ")} — عدّلها أو أضف دليلها قبل الاعتماد عليها.`
                      : `Figures without verified evidence: ${flagged.join(", ")} — edit them or add evidence before relying on them.`}
                  </p>
                ) : null}
              </div>
            ) : null}

            <section className="rounded-2xl bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold">
                <Info className="size-3.5" />
                {ar ? "مبني على" : "Based on"}
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {facts.map((f) => {
                  const ev = evidenceForFact(graph, f.id).filter((e) => e.verified);
                  return (
                    <li key={f.id} className="text-xs">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <BadgeCheck className="size-3.5 text-primary" />
                        {f.title}
                      </span>
                      {ev.length ? (
                        <span className="text-muted-foreground">
                          {" — "}
                          {ev
                            .map(
                              (e) =>
                                [e.metricValue, e.metricUnit].filter(Boolean).join(" ") || e.title,
                            )
                            .join(" · ")}
                        </span>
                      ) : (
                        <Badge variant="outline" className="ms-1.5 text-[10px]">
                          {ar ? "بلا دليل مرفق" : "No evidence attached"}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        ) : (
          <p className="rounded-xl bg-muted/50 p-3 text-xs leading-[1.9] text-muted-foreground">
            {ar
              ? "لا توجد قصة موثّقة تناسب هذا السؤال. اكتب تجربتك الحقيقية في الحقول التالية، وسنحفظها كقصة جاهزة للمرات القادمة."
              : "No verified story fits this question. Write your real experience below and we will store it as a ready story for next time."}
          </p>
        )}

        <section className="space-y-2">
          <h4 className="text-sm font-bold">
            {ar ? "قصتك بأسلوب STAR" : "Your story in STAR form"}
          </h4>
          {STAR_FIELDS.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label className="text-xs">{ar ? f.ar : f.en}</Label>
              <Textarea
                rows={2}
                value={star[f.key]}
                placeholder={ar ? f.ph.ar : f.ph.en}
                onChange={(e) => setStar((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">{ar ? "الرقم (اختياري)" : "Metric (optional)"}</Label>
              <Input
                value={metric.value}
                onChange={(e) => setMetric({ ...metric, value: e.target.value })}
                placeholder="18"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{ar ? "الوحدة" : "Unit"}</Label>
              <Input
                value={metric.unit}
                onChange={(e) => setMetric({ ...metric, unit: e.target.value })}
                placeholder={ar ? "% انخفاض" : "% reduction"}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={saveStory}
            disabled={saving || !starComplete}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {ar ? "احفظ القصة كحقيقة موثّقة" : "Save story as a verified fact"}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
