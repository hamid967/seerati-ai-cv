import { useMemo, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  MicOff,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import {
  createInterviewPractice,
  interviewPracticePrivacyCopy,
  type InterviewPracticeSession,
} from "@/lib/interview-practice";

export function InterviewPractice() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [session, setSession] = useState<InterviewPracticeSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answered = useMemo(
    () => Object.values(answers).filter((answer) => answer.trim().length > 0).length,
    [answers],
  );
  const percent = session ? Math.round((answered / session.questions.length) * 100) : 0;

  const copy = {
    eyebrow: ar ? "تدريب المقابلة" : "Interview practice",
    title: ar ? "تمرّن على إجابات قابلة للمراجعة" : "Practice answers you can review",
    subtitle: ar
      ? "اكتب الدور ووصف الوظيفة للحصول على أسئلة STAR محلية. لا يسجّل هذا القسم صوتاً ولا يرسل إجاباتك تلقائياً."
      : "Enter a role and job description to generate local STAR questions. This section records no audio and does not automatically send your answers.",
    role: ar ? "الدور المستهدف" : "Target role",
    rolePlaceholder: ar ? "مثال: محلل بيانات" : "Example: Data analyst",
    description: ar ? "وصف الوظيفة (اختياري)" : "Job description (optional)",
    descriptionPlaceholder: ar
      ? "الصق متطلبات الدور لتخصيص كلمات الأسئلة محلياً."
      : "Paste role requirements to tailor question terms locally.",
    generate: ar ? "إنشاء تمرين" : "Create practice",
    reset: ar ? "مسح التمرين" : "Clear practice",
    progress: ar ? "إجابات تمت مراجعتها" : "Answers reviewed",
    answer: ar ? "مسودّة إجابتك" : "Your answer draft",
    answerPlaceholder: ar
      ? "اكتب إجابة مختصرة: الموقف، المهمة، الفعل، ثم النتيجة التي تستطيع تأكيدها."
      : "Draft a concise answer: situation, task, action, then a result you can verify.",
    coaching: ar ? "تذكير STAR" : "STAR reminder",
    privacy: ar ? "خصوصية التمرين" : "Practice privacy",
  };

  const create = () => {
    setSession(createInterviewPractice({ role, jobDescription, locale: lang }));
    setAnswers({});
  };

  const clear = () => {
    setRole("");
    setJobDescription("");
    setSession(null);
    setAnswers({});
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 px-4 py-8 md:py-10" dir={ar ? "rtl" : "ltr"}>
      <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.06] p-6 md:p-8">
        <Badge variant="secondary" className="gap-1.5">
          <BrainCircuit className="size-3.5" aria-hidden="true" />
          {copy.eyebrow}
        </Badge>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
          {copy.subtitle}
        </p>
      </section>

      <section
        className="grid gap-5 lg:grid-cols-[1fr_0.75fr]"
        aria-labelledby="interview-setup-title"
      >
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle id="interview-setup-title">
              {ar ? "إعداد التمرين" : "Set up practice"}
            </CardTitle>
            <CardDescription>
              {ar
                ? "يكفي الدور للبدء؛ يضيف الوصف كلمات مرتبطة بالفرصة من دون مغادرة جهازك."
                : "The role is enough to start. The description adds opportunity terms without leaving your device."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="practice-role">{copy.role}</Label>
              <Input
                id="practice-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder={copy.rolePlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="practice-description">{copy.description}</Label>
              <Textarea
                id="practice-description"
                rows={6}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder={copy.descriptionPlaceholder}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={create} disabled={!role.trim()}>
                <BrainCircuit className="size-4" aria-hidden="true" />
                {copy.generate}
              </Button>
              {(session || role || jobDescription) && (
                <Button variant="outline" onClick={clear}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {copy.reset}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/[0.035]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              {copy.privacy}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>{interviewPracticePrivacyCopy(lang)}</p>
            <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-background/80 p-3 text-xs leading-6">
              <MicOff className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                {ar
                  ? "لا يوجد تسجيل صوتي أو تحليل صوت أو ادعاء بأن التدريب يضمن مقابلة أو عرض عمل."
                  : "There is no voice recording or voice analysis, and this practice does not claim to guarantee an interview or offer."}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {session ? (
        <section className="space-y-4" aria-labelledby="interview-questions-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="interview-questions-title" className="text-xl font-bold">
                {ar ? "أسئلة التمرين" : "Practice questions"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{session.disclaimer}</p>
            </div>
            <Badge variant="outline">
              {answered}/{session.questions.length} {copy.progress}
            </Badge>
          </div>
          <Progress value={percent} aria-label={`${answered} of ${session.questions.length}`} />

          <div className="grid gap-4">
            {session.questions.map((question, index) => {
              const complete = Boolean(answers[question.id]?.trim());
              return (
                <Card key={question.id} className="border-border/80">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="secondary">
                        {ar ? `السؤال ${index + 1}` : `Question ${index + 1}`}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {complete ? <CheckCircle2 className="size-4 text-emerald-accent" /> : null}
                        {question.competency}
                      </span>
                    </div>
                    <CardTitle className="text-base leading-7">{question.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl bg-secondary/55 p-3 text-xs leading-6 text-muted-foreground">
                      <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                        <Lightbulb className="size-3.5 text-primary" aria-hidden="true" />
                        {copy.coaching}
                      </p>
                      {question.coaching}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`answer-${question.id}`}>{copy.answer}</Label>
                      <Textarea
                        id={`answer-${question.id}`}
                        rows={4}
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                        placeholder={copy.answerPlaceholder}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
