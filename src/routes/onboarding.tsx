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
import { ResumeInterview } from "@/components/resume-interview";
import { ResumeImport } from "@/components/resume-import";
import type { ResumeData } from "@/lib/types";

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
  const { user, ready, resumes, updateProfile, createResume, updateResume } = useStore();
  const STEPS = 5;
  const [step, setStep] = useState(1);
  const [path, setPath] = useState<"choose" | "manual" | "interview" | "import">("choose");
  const [importedData, setImportedData] = useState<Partial<ResumeData> | null>(null);
  const [fullName, setFullName] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [years, setYears] = useState("1-3");
  const [industry, setIndustry] = useState("");
  const [cvLang, setCvLang] = useState<"ar" | "en">(lang);
  const [hasCv, setHasCv] = useState<"yes" | "no">("no");
  const [templateId, setTemplateId] = useState("saudi-professional");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.fullName && !fullName) setFullName(user.fullName);
  }, [user, fullName]);

  useAuthGuard();

  const finish = async () => {
    setSaving(true);
    await updateProfile({
      onboarded: true,
      fullName: fullName.trim() || user?.fullName || "",
      targetRole,
      yearsExperience: years,
      industry,
    });
    if (resumes.length > 0) {
      setSaving(false);
      navigate({ to: "/dashboard" });
      return;
    }
    const created = await createResume({
      title: targetRole ? (ar ? `سيرة ${targetRole}` : `${targetRole} resume`) : ar ? "سيرتي الذاتية" : "My resume",
      templateId,
      language: cvLang,
      jobTitle: targetRole || currentTitle,
    });
    if (created && importedData) {
      await updateResume(created.id, {
        data: { ...created.data, ...importedData, personal: { ...created.data.personal, ...(importedData.personal ?? {}) } },
      });
    }
    setSaving(false);
    if (created) {
      toast.success(ar ? "أنشأنا لك سيرة ذاتية للبدء" : "We created a resume to get you started");
      navigate({ to: "/resumes/$id/edit", params: { id: created.id } });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const interviewing = step === STEPS && path === "interview";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className={`mx-auto px-4 py-12 ${interviewing ? "max-w-3xl" : "max-w-xl"}`}>
        <p className="text-xs font-semibold text-muted-foreground">
          {ar ? `الخطوة ${step} من ${STEPS}` : `Step ${step} of ${STEPS}`}
        </p>
        <Progress value={(step / STEPS) * 100} className="mt-3" />


        {step === 1 && (
          <section className="mt-8 space-y-5">
            <h1 className="text-2xl font-extrabold">{ar ? "لنتعرّف عليك" : "Let’s get to know you"}</h1>
            <div className="space-y-1.5">
              <Label htmlFor="name">{ar ? "الاسم الكامل" : "Full name"}</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current">{ar ? "مسمّاك الحالي" : "Current job title"}</Label>
              <Input
                id="current"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder={ar ? "مثال: أخصائي تقارير" : "e.g. Reporting Specialist"}
              />
            </div>
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
          <section className="mt-8 space-y-6">
            <h1 className="text-2xl font-extrabold">{ar ? "لغة السيرة وحالتك الحالية" : "Resume language & current status"}</h1>
            <div className="space-y-2">
              <Label>{ar ? "بأي لغة تريد سيرتك؟" : "Which language should the resume use?"}</Label>
              <div className="flex gap-2">
                <Button variant={cvLang === "ar" ? "default" : "outline"} onClick={() => setCvLang("ar")}>العربية</Button>
                <Button variant={cvLang === "en" ? "default" : "outline"} onClick={() => setCvLang("en")}>English</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ar ? "هل لديك سيرة ذاتية سابقة؟" : "Do you already have a resume?"}</Label>
              <div className="flex gap-2">
                <Button variant={hasCv === "yes" ? "default" : "outline"} onClick={() => setHasCv("yes")}>
                  {ar ? "نعم" : "Yes"}
                </Button>
                <Button variant={hasCv === "no" ? "default" : "outline"} onClick={() => setHasCv("no")}>
                  {ar ? "لا، سأبدأ من الصفر" : "No, starting fresh"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {hasCv === "yes"
                  ? ar
                    ? "سنبدأ بمسودة فارغة يمكنك نسخ محتوى سيرتك القديمة إليها قسماً بقسم."
                    : "We’ll start a draft so you can paste your existing content section by section."
                  : ar
                    ? "سيساعدك «مساعد سيرتي» في صياغة الملخص والنقاط من الصفر."
                    : "The Seerati Assistant will help you draft the summary and bullets from scratch."}
              </p>
            </div>
          </section>
        )}

        {step === 4 && (
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

        {step === 5 && path === "choose" && (
          <section className="mt-8 space-y-4">
            <h1 className="text-2xl font-extrabold">{ar ? "كيف تريد أن نبدأ؟" : "How would you like to start?"}</h1>
            <p className="text-sm text-muted-foreground">
              {ar
                ? "اختر الطريقة الأنسب لك — يمكنك تعديل كل شيء لاحقاً في المحرّر."
                : "Pick whichever suits you — everything stays editable in the builder."}
            </p>
            <div className="grid gap-3">
              <button
                onClick={() => setPath("interview")}
                className="rounded-xl border border-border p-4 text-start transition-colors hover:bg-secondary/60"
              >
                <p className="font-semibold">{ar ? "أنشئ سيرتي معي" : "Build my resume with me"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ar
                    ? "أسئلة قصيرة يجيب عليها المساعد معك، ونبني الأقسام تدريجياً."
                    : "A short guided interview that fills your sections step by step."}
                </p>
              </button>
              <button
                onClick={() => void finish()}
                className="rounded-xl border border-border p-4 text-start transition-colors hover:bg-secondary/60"
              >
                <p className="font-semibold">{ar ? "سأكتبها بنفسي" : "I’ll write it myself"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ar ? "ننشئ مسودة فارغة وتفتح المحرّر مباشرة." : "We create an empty draft and open the builder."}
                </p>
              </button>
              {hasCv === "yes" && (
                <button
                  onClick={() => setPath("import")}
                  className="rounded-xl border border-border p-4 text-start transition-colors hover:bg-secondary/60"
                >
                  <p className="font-semibold">{ar ? "استيراد سيرتي السابقة" : "Import my existing resume"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ar
                      ? "الصق نص سيرتك (أو ملف .txt) ونستخرج الأقسام لمراجعتها."
                      : "Paste your resume text (or a .txt file) and review the extracted sections."}
                  </p>
                </button>
              )}
            </div>
          </section>
        )}

        {step === 5 && path === "interview" && (
          <div className="mt-8">
            <ResumeInterview
              lang={cvLang}
              templateId={templateId}
              initial={{ fullName, currentTitle, targetJob: targetRole, years, industry }}
              onCancel={() => setPath("choose")}
            />
          </div>
        )}

        {step === 5 && path === "import" && (
          <div className="mt-8">
            <ResumeImport
              lang={cvLang}
              onConfirm={(data) => {
                setImportedData(data);
                void finish();
              }}
              onSkip={() => setPath("choose")}
            />
          </div>
        )}

        {(step < STEPS || path === "choose") && (
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                {ar ? "رجوع" : "Back"}
              </Button>
            )}
            {step < STEPS && <Button onClick={() => setStep((s) => s + 1)}>{ar ? "التالي" : "Next"}</Button>}
          </div>
        )}
      </main>
    </div>
  );
}

