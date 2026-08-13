import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { matchResumeToJob, parseJobDescription } from "@/lib/job-match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function GuestJobMatch() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { resumes } = useStore();
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const resume = resumes[0] ?? null;
  const requirements = useMemo(
    () => (submitted ? parseJobDescription(description) : null),
    [description, submitted],
  );
  const match = useMemo(
    () => (requirements ? matchResumeToJob(resume, requirements) : null),
    [resume, requirements],
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Search className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {ar ? "طابق سيرتك مع وظيفة" : "Match your resume to a job"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {ar
              ? "الصق وصف الوظيفة لتحليل محلي سريع. لا يُرسل النص إلى خادم أو مزود تحليلات."
              : "Paste a job description for a quick local analysis. The text is not sent to a server or analytics provider."}
          </p>
        </div>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{ar ? "وصف الوظيفة" : "Job description"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={10}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setSubmitted(false);
            }}
            placeholder={ar ? "الصق النص هنا…" : "Paste the full description here…"}
            aria-label={ar ? "وصف الوظيفة" : "Job description"}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setSubmitted(true)} disabled={description.trim().length < 20}>
              {ar ? "حلّل محلياً" : "Analyze locally"}
            </Button>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {ar ? "ذاكرة مؤقتة فقط" : "Memory-only guest mode"}
            </span>
          </div>
        </CardContent>
      </Card>
      {match && requirements && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{ar ? "ملخص المطابقة" : "Match summary"}</CardTitle>
            <Badge>{match.score}%</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {ar
                ? "هذه إشارة محلية مبنية على الكلمات الموجودة في الوصف وسيرتك الحالية، وليست قرار توظيف."
                : "This is a local signal based on words in the description and your current resume, not a hiring decision."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold">
                  {ar ? "المهارات المستخرجة" : "Detected skills"}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requirements.hardSkills.length ? (
                    requirements.hardSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={match.matchedSkills.includes(skill) ? "default" : "outline"}
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {ar ? "لم تُكتشف مهارات محددة" : "No specific skills detected"}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold">
                  {ar ? "الفجوات المقترحة للمراجعة" : "Gaps to review"}
                </h2>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-muted-foreground">
                  {match.gaps.slice(0, 5).map((gap) => (
                    <li key={gap.id}>{gap.label}</li>
                  ))}
                </ul>
              </div>
            </div>
            {!resume && (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm">
                {ar
                  ? "أنشئ مسودة مجانية أولاً لتحصل على مطابقة مرتبطة بخبرتك."
                  : "Create a free draft first to get a match grounded in your experience."}
                <Link className="ms-2 font-semibold text-primary underline" to="/assistant">
                  {ar ? "فتح المساعد" : "Open assistant"}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
