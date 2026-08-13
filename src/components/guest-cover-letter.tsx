import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function GuestCoverLetter() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { resumes } = useStore();
  const resume = resumes[0] ?? null;
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState({ opening: "", body: "", closing: "" });
  const data = resume?.data;
  const evidence = useMemo(() => {
    const summary = data?.summary?.trim() ?? "";
    const firstExperience = data?.experience?.[0];
    const bullet = firstExperience?.bullets?.[0]?.trim() ?? "";
    const skills = (data?.skills ?? [])
      .slice(0, 5)
      .map((skill) => skill.name)
      .filter(Boolean)
      .join(ar ? "، " : ", ");
    return { summary, role: firstExperience?.role ?? "", bullet, skills };
  }, [ar, data]);
  const generate = () => {
    const target = jobTitle.trim() || (ar ? "هذه الفرصة" : "this opportunity");
    const org = company.trim() || (ar ? "فريقكم" : "your team");
    setDraft({
      opening: ar
        ? `السادة في ${org}،\n\nأتقدم باهتمام إلى فرصة ${target}.`
        : `Dear ${org} team,\n\nI am writing to express my interest in the ${target} opportunity.`,
      body: ar
        ? [
            evidence.summary,
            evidence.role &&
              `في خبرتي كـ${evidence.role}${evidence.bullet ? `، ${evidence.bullet}` : ""}.`,
            evidence.skills && `وتشمل مهاراتي ذات الصلة: ${evidence.skills}.`,
          ]
            .filter(Boolean)
            .join(" ") ||
          "أرغب في مناقشة القيمة التي يمكنني تقديمها بناءً على خبرتي الموثقة في سيرتي."
        : [
            evidence.summary,
            evidence.role &&
              `In my experience as ${evidence.role}${evidence.bullet ? `, ${evidence.bullet}` : ""}.`,
            evidence.skills && `Relevant skills include ${evidence.skills}.`,
          ]
            .filter(Boolean)
            .join(" ") ||
          "I would welcome the opportunity to discuss the value I can bring based on the experience documented in my resume.",
      closing: ar
        ? "أشكركم على وقتكم،\n\nمع التحية"
        : "Thank you for your consideration,\n\nBest regards,",
    });
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {ar ? "اكتب خطاب تقديم" : "Write a cover letter"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar
              ? "مسودة محلية مبنية على سيرتك الحالية. لا تُحفظ ولا تُرسل قبل تسجيلك ومراجعتك."
              : "A local draft grounded in your current resume. It is not saved or sent before sign-up and review."}
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{ar ? "معلومات الوظيفة" : "Job details"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              aria-label={ar ? "المسمى الوظيفي" : "Job title"}
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder={ar ? "المسمى الوظيفي" : "Job title"}
            />
            <Input
              aria-label={ar ? "الشركة" : "Company"}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder={ar ? "الشركة" : "Company"}
            />
          </div>
          <Textarea
            aria-label={ar ? "الوصف الوظيفي" : "Job description"}
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={
              ar ? "الصق الوصف الوظيفي (اختياري)…" : "Paste the job description (optional)…"
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={generate}>{ar ? "أنشئ مسودة محلية" : "Create local draft"}</Button>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {ar ? "ذاكرة مؤقتة فقط" : "Memory-only guest mode"}
            </span>
          </div>
        </CardContent>
      </Card>
      {(draft.opening || draft.body) && (
        <Card>
          <CardHeader>
            <CardTitle>{ar ? "راجع المسودة" : "Review your draft"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={4}
              value={draft.opening}
              onChange={(event) => setDraft({ ...draft, opening: event.target.value })}
              aria-label={ar ? "الافتتاحية" : "Opening"}
            />
            <Textarea
              rows={8}
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              aria-label={ar ? "المتن" : "Body"}
            />
            <Textarea
              rows={4}
              value={draft.closing}
              onChange={(event) => setDraft({ ...draft, closing: event.target.value })}
              aria-label={ar ? "الخاتمة" : "Closing"}
            />
            <p className="text-xs text-muted-foreground">
              {description.trim()
                ? ar
                  ? "الوصف محفوظ داخل هذه الجلسة فقط ولا يُحلَّل عن بُعد."
                  : "The job description remains in this session and is not analyzed remotely."
                : ar
                  ? "أضف وصف الوظيفة لاحقاً لمراجعته يدوياً قبل الإرسال."
                  : "Add a job description later and review it manually before sending."}
            </p>
          </CardContent>
        </Card>
      )}
      {!resume && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-sm text-muted-foreground">
            {ar
              ? "لصياغة خطاب مرتبط بخبرتك، أنشئ مسودة مجانية أولاً."
              : "Create a free draft first to ground the letter in your experience."}
            <Button className="ms-2" variant="link" asChild>
              <Link to="/assistant">{ar ? "فتح المساعد" : "Open assistant"}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
