import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { ResumePreview, getTemplate } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { atsScore, runAtsChecks, toPlainText } from "@/lib/ats";

export const Route = createFileRoute("/resumes/$id/preview")({
  head: () => ({
    meta: [
      { title: "معاينة وتنزيل | سيرتي" },
      { name: "description", content: "معاينة الطباعة وتنزيل السيرة الذاتية بصيغة PDF أو نسخة نصية متوافقة مع أنظمة التوظيف." },
      { property: "og:title", content: "معاينة السيرة الذاتية" },
      { property: "og:description", content: "تنزيل PDF أو نسخة نصية ATS." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreviewResume,
});

function PreviewResume() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { ready, user, getResume } = useStore();
  const resume = getResume(id);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  if (!ready) return null;

  if (!resume) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-lg font-bold">{ar ? "لم نجد هذه السيرة الذاتية" : "Resume not found"}</p>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">{ar ? "العودة إلى لوحتي" : "Back to dashboard"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tpl = getTemplate(resume.templateId);
  const score = atsScore(runAtsChecks(resume.data, tpl.atsFriendly));

  const downloadTxt = () => {
    const blob = new Blob([toPlainText(resume)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.title || "resume"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(ar ? "تم تنزيل النسخة النصية" : "Plain text downloaded");
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <SiteHeader />
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-5">
        <div>
          <h1 className="text-xl font-extrabold">{resume.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {tpl.name[lang]} · {resume.language.toUpperCase()} · ATS {score}/100
          </p>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          {tpl.atsFriendly && <Badge variant="secondary" className="self-center">ATS</Badge>}
          <Button variant="outline" asChild>
            <Link to="/resumes/$id/edit" params={{ id: resume.id }}>
              <FileText className="size-4" />
              {ar ? "تحرير" : "Edit"}
            </Link>
          </Button>
          <Button variant="outline" onClick={downloadTxt}>
            <Download className="size-4" />
            {ar ? "نسخة نصية ATS" : "ATS plain text"}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            {ar ? "تنزيل PDF" : "Download PDF"}
          </Button>
        </div>
      </div>

      <p className="mx-auto max-w-5xl px-4 pb-4 text-xs text-muted-foreground">
        {ar
          ? "يفتح زر التنزيل نافذة الطباعة — اختر «حفظ كـ PDF» للحصول على ملف يحفظ اتجاه النص العربي."
          : "The download button opens the print dialog — choose “Save as PDF” to keep Arabic text direction intact."}
      </p>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <div id="print-area">
          <ResumePreview resume={resume} />
        </div>
      </div>
    </div>
  );
}
