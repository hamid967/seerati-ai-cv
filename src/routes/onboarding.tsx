import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import { defaultTemplates } from "@/lib/templates";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "لنبدأ | سيرتي — Seerati Onboarding" },
      { name: "description", content: "ثلاث خطوات سريعة لتخصيص تجربتك داخل سيرتي قبل بناء سيرتك الذاتية." },
      { property: "og:title", content: "إعداد حسابك في سيرتي" },
      { property: "og:description", content: "حدّد هدفك الوظيفي والقالب المناسب في دقيقة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { user, ready, updateProfile, createResume } = useStore();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState("");
  const [years, setYears] = useState("1-3");
  const [industry, setIndustry] = useState("");
  const [templateId, setTemplateId] = useState("saudi-professional");

  useEffect(() => {
  }, [ready, user, navigate]);

  const finish = async () => {
    await updateProfile({ onboarded: true, targetRole, yearsExperience: years, industry });
    const created = await createResume({
      title: targetRole ? (ar ? `سيرة ${targetRole}` : `${targetRole} resume`) : ar ? "سيرتي الذاتية" : "My resume",
      templateId,
      language: lang,
      jobTitle: targetRole,
    });
    if (created) {
      toast.success(ar ? "أنشأنا لك سيرة ذاتية للبدء" : "We created a resume to get you started");
      navigate({ to: "/resumes/$id/edit", params: { id: created.id } });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-12">
        <p className="text-xs font-semibold text-muted-foreground">
          {ar ? `الخطوة ${step} من ٣` : `Step ${step} of 3`}
        </p>
        <Progress value={(step / 3) * 100} className="mt-3" />

        {step === 1 && (
          <section className="mt-8 space-y-5">
            <h1 className="text-2xl font-extrabold">{ar ? "ما الوظيفة التي تستهدفها؟" : "What role are you targeting?"}</h1>
            <div className="space-y-1.5">
              <Label htmlFor="role">{ar ? "المسمى الوظيفي المستهدف" : "Target job title"}</Label>
              <Input
                id="role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={ar ? "مثال: محلل بيانات" : "e.g. Data Analyst"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "سنوات الخبرة" : "Years of experience"}</Label>
              <Select value={years} onValueChange={setYears}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["0-1", "1-3", "4-7", "8+"].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-8 space-y-5">
            <h1 className="text-2xl font-extrabold">{ar ? "في أي قطاع تعمل؟" : "Which industry?"}</h1>
            <div className="grid gap-2 sm:grid-cols-2">
              {(ar
                ? ["تقنية المعلومات", "المالية", "الصحة", "التعليم", "التجزئة", "الطاقة", "الحكومي", "أخرى"]
                : ["IT", "Finance", "Healthcare", "Education", "Retail", "Energy", "Government", "Other"]
              ).map((i) => (
                <Button key={i} variant={industry === i ? "default" : "outline"} onClick={() => setIndustry(i)}>
                  {i}
                </Button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-8 space-y-5">
            <h1 className="text-2xl font-extrabold">{ar ? "اختر قالبك الأول" : "Pick your first template"}</h1>
            <div className="grid gap-2 sm:grid-cols-2">
              {defaultTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setTemplateId(tpl.id)}
                  className={`rounded-xl border p-4 text-start transition-colors ${
                    templateId === tpl.id ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"
                  }`}
                >
                  <p className="font-semibold">{tpl.name[lang]}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tpl.description[lang]}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              {ar ? "رجوع" : "Back"}
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)}>{ar ? "التالي" : "Next"}</Button>
          ) : (
            <Button onClick={finish}>{ar ? "ابدأ البناء" : "Start building"}</Button>
          )}
        </div>
      </main>
    </div>
  );
}
