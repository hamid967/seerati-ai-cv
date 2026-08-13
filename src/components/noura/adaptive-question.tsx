import { FileUp, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AssistantAnswers } from "@/lib/assistant-create";
import { adaptiveQuestionForGoal, type NouraGoal, USER_TYPE_OPTIONS } from "@/modules/noura";

type AdaptiveQuestionProps = {
  goal: NouraGoal | undefined;
  lang: "ar" | "en";
  answers: AssistantAnswers;
  onChange: (patch: Partial<AssistantAnswers>) => void;
  onOpenTool: (tool: "import" | "ats" | "cover-letter") => void;
};

const toolByGoal = {
  import_resume: "import",
  check_ats: "ats",
  cover_letter: "cover-letter",
} as const;

export function AdaptiveQuestion({
  goal,
  lang,
  answers,
  onChange,
  onOpenTool,
}: AdaptiveQuestionProps) {
  const ar = lang === "ar";
  const question = adaptiveQuestionForGoal(goal);

  if (!question) return null;

  const needsEvidence = question.requiredFields.includes("story");
  const tool = goal ? toolByGoal[goal as keyof typeof toolByGoal] : undefined;

  return (
    <div className="noura-adaptive-question mt-4" data-testid="adaptive-question-card">
      <div className="noura-adaptive-question__lead">
        <span className="noura-adaptive-question__eyebrow">
          {ar ? "سؤال واحد الآن" : "One question now"}
        </span>
        <h3>{question.prompt[lang]}</h3>
        <p>{question.hint[lang]}</p>
      </div>

      {goal === "create_resume" && (
        <fieldset className="noura-adaptive-question__choices">
          <legend>{ar ? "المرحلة المهنية" : "Career stage"}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {USER_TYPE_OPTIONS.map((option) => {
              const selected = answers.userType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ userType: option.value })}
                  className="noura-stage-choice"
                >
                  <span className="font-semibold">{option[lang]}</span>
                  {selected && (
                    <span className="text-xs text-primary">{ar ? "محدد" : "Selected"}</span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="adaptive-job-title">{ar ? "المسمى المستهدف" : "Target job title"}</Label>
        <Input
          id="adaptive-job-title"
          value={answers.jobTitle}
          placeholder={ar ? "مثال: محلل بيانات" : "e.g. Data Analyst"}
          onChange={(event) => onChange({ jobTitle: event.target.value })}
        />
      </div>

      {needsEvidence && (
        <div className="space-y-1.5">
          <Label htmlFor="adaptive-evidence">
            {ar ? "الدليل أو المقتطف الذي تريد مراجعته" : "Evidence or excerpt to review"}
          </Label>
          <Textarea
            id="adaptive-evidence"
            rows={4}
            value={answers.story}
            placeholder={
              ar
                ? "اكتب إنجازاً حقيقياً أو مقتطفاً مختصراً من وصف الوظيفة."
                : "Enter a real achievement or a short job-description excerpt."
            }
            onChange={(event) => onChange({ story: event.target.value })}
          />
        </div>
      )}

      {tool && (
        <div className="noura-adaptive-question__tool">
          <div>
            <p className="font-semibold text-foreground">
              {goal === "import_resume"
                ? ar
                  ? "لدي ملف جاهز"
                  : "I have a file ready"
                : goal === "check_ats"
                  ? ar
                    ? "افتح فحص ATS الإرشادي"
                    : "Open the advisory ATS check"
                  : ar
                    ? "افتح محرر خطاب التقديم"
                    : "Open the cover-letter editor"}
            </p>
            <p>
              {ar
                ? "تفتح الأداة فقط باختيارك، ولا تنقل هذه الإجابة إلى أي حساب أو خدمة."
                : "The tool opens only when you choose it; this answer is not moved to an account or service."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenTool(tool)}
            className="shrink-0 gap-2"
          >
            {tool === "ats" ? <ScanSearch className="size-4" /> : <FileUp className="size-4" />}
            {ar ? "فتح الأداة" : "Open tool"}
          </Button>
        </div>
      )}

      <p className="noura-adaptive-question__boundary" role="note">
        {ar
          ? "تُحفظ إجابتك في هذه الجلسة فقط. لا يبدأ إرسال للذكاء الاصطناعي من هذا السؤال."
          : "Your answer remains in this session only. This question does not start an AI transmission."}
      </p>
    </div>
  );
}
