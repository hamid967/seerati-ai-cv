import { useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fromResumeData, type CareerProfileGraph } from "@/modules/career";
import { buildStarPrompt, prepareInterview } from "@/modules/interview";
import { coachSection, type CoachSection } from "@/modules/intelligence";
import type { ResumeData } from "@/lib/types";

type IntelligenceCoachPanelProps = {
  data: ResumeData;
  language: "ar" | "en";
  section: string;
  jobDescription?: string;
};

function toCoachSection(section: string): CoachSection {
  if (section === "experience" || section === "education" || section === "skills") return section;
  if (section === "extras") return "projects";
  return "summary";
}

export function IntelligenceCoachPanel({
  data,
  language,
  section,
  jobDescription = "",
}: IntelligenceCoachPanelProps) {
  const ar = language === "ar";
  const graph = useMemo<CareerProfileGraph>(
    () => fromResumeData(data, { graphId: "editor-session", language }).graph,
    [data, language],
  );
  const prompts = useMemo(
    () => coachSection(toCoachSection(section), section === "summary" ? data.summary : ""),
    [data.summary, section],
  );
  const interview = useMemo(() => prepareInterview(graph, jobDescription), [graph, jobDescription]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [star, setStar] = useState<Record<string, string>>({});
  const question = interview.questions[questionIndex];
  const starPrompt = question ? buildStarPrompt(graph, question) : null;

  const setAnswer = (id: string, value: string) =>
    setAnswers((current) => ({ ...current, [id]: value }));
  const setStarValue = (key: string, value: string) =>
    setStar((current) => ({ ...current, [key]: value }));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            {ar ? "ذكاء محلي قابل للمراجعة" : "Reviewable local intelligence"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ar
              ? "أسئلة مبنية على محتوى سيرتك فقط. لا يوجد إرسال أو تعديل تلقائي."
              : "Prompts use only this resume. Nothing is sent or applied automatically."}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <LockKeyhole className="size-3" />
          {ar ? "محلي" : "Local"}
        </Badge>
      </div>

      <Tabs defaultValue="coach" className="min-h-0 flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coach" className="gap-1.5">
            <MessageCircleQuestion className="size-4" />
            {ar ? "مدرب القسم" : "Section Coach"}
          </TabsTrigger>
          <TabsTrigger value="interview" className="gap-1.5">
            <ShieldCheck className="size-4" />
            {ar ? "تدريب مقابلة" : "Interview prep"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coach" className="mt-3 space-y-3">
          {prompts.length ? (
            prompts.map((prompt) => (
              <div key={prompt.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-start gap-2">
                  <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{prompt.prompt[language]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{prompt.why[language]}</p>
                  </div>
                </div>
                <Textarea
                  rows={3}
                  value={answers[prompt.id] ?? ""}
                  onChange={(event) => setAnswer(prompt.id, event.target.value)}
                  placeholder={
                    ar ? "اكتب إجابتك هنا للمراجعة…" : "Write your answer here for review…"
                  }
                  aria-label={prompt.prompt[language]}
                />
                <p className="text-[11px] text-muted-foreground">
                  {ar
                    ? "إجابة مؤقتة في هذه الجلسة فقط — لن تُضاف للسيرة تلقائياً."
                    : "Session-only answer — it will not be added automatically."}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <CheckCircle2 className="mb-2 size-5 text-emerald-600" />
              {ar
                ? "لا توجد أسئلة محلية إضافية لهذا القسم حالياً."
                : "No additional local prompts for this section right now."}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interview" className="mt-3 space-y-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {ar
                ? `السؤال ${questionIndex + 1} من ${interview.questions.length}`
                : `Question ${questionIndex + 1} of ${interview.questions.length}`}
            </p>
            <p className="mt-2 text-sm font-semibold">{question?.question}</p>
            {question?.missingEvidence && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                {ar
                  ? "لا توجد أدلة خبرة كافية بعد؛ أجب من واقع خبرتك ولا تخترع رقماً."
                  : "Evidence is limited; answer from your real experience and do not invent a number."}
              </p>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["situation", "task", "action", "result"] as const).map((key) => (
              <Textarea
                key={key}
                rows={3}
                value={star[key] ?? starPrompt?.[key] ?? ""}
                onChange={(event) => setStarValue(key, event.target.value)}
                placeholder={
                  ar
                    ? { situation: "الموقف", task: "المهمة", action: "الإجراء", result: "النتيجة" }[
                        key
                      ]
                    : key.charAt(0).toUpperCase() + key.slice(1)
                }
                aria-label={key}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
            >
              {ar ? "السابق" : "Previous"}
            </Button>
            <p className="text-[11px] text-muted-foreground">{interview.disclaimer}</p>
            <Button
              type="button"
              size="sm"
              disabled={questionIndex >= interview.questions.length - 1}
              onClick={() =>
                setQuestionIndex((index) => Math.min(interview.questions.length - 1, index + 1))
              }
            >
              {ar ? "التالي" : "Next"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
