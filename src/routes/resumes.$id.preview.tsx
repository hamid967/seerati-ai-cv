import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCopy, Download, FileText, Loader2, Printer, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { ProfessionalResumePreview } from "@/components/professional-resume-preview";
import { getTemplate } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { analyzeResume, toPlainText } from "@/lib/ats";
import { exportResumePdf } from "@/lib/pdf";
import { normalizeResumeDesign, PAGE_SIZES } from "@/lib/resume-layout";

export const Route = createFileRoute("/resumes/$id/preview")({
  head: () => ({
    meta: [
      { title: "معاينة وتنزيل | سيرتي" },
      {
        name: "description",
        content:
          "معاينة الطباعة وتنزيل السيرة الذاتية بصيغة PDF أو نسخة نصية متوافقة مع أنظمة التوظيف.",
      },
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
  const { ready, user, getResume } = useStore();
  const resume = getResume(id);
  const [exportingImagePdf, setExportingImagePdf] = useState(false);
  const stamped = useRef<string | null>(null);

  useAuthGuard();

  useEffect(() => {
    if (!ready || !user || stamped.current === id) return;
    stamped.current = id;
    void supabase.from("resumes").update({ last_viewed_at: new Date().toISOString() }).eq("id", id);
  }, [ready, user, id]);

  if (!ready) return null;
  if (!resume) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-lg font-bold">
            {ar ? "لم نجد هذه السيرة الذاتية" : "Resume not found"}
          </p>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">{ar ? "العودة إلى لوحتي" : "Back to dashboard"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tpl = getTemplate(resume.templateId);
  const score = analyzeResume(resume, tpl).score;
  const design = normalizeResumeDesign(resume.data.design);
  const page = PAGE_SIZES[design.pageSize];

  const fileBase = (() => {
    const name = (resume.data.personal.fullName || resume.title || "resume").trim();
    const slug = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join("-")
      .replace(/[\\/:*?"<>|]/g, "");
    return `${slug || "resume"}-CV`;
  })();

  const printPdf = () => {
    const previous = document.title;
    const style = document.createElement("style");
    style.id = "seerati-dynamic-page-size";
    style.textContent = `@page { size: ${page.widthMm}mm ${page.heightMm}mm; margin: 0; }`;
    document.head.appendChild(style);
    document.title = fileBase;
    window.print();
    window.setTimeout(() => {
      document.title = previous;
      style.remove();
    }, 1000);
  };

  const downloadImagePdf = async () => {
    const el = document.getElementById("print-area");
    if (!el) {
      toast.error(ar ? "تعذّر العثور على السيرة الذاتية" : "Could not find the resume content");
      return;
    }
    setExportingImagePdf(true);
    try {
      await exportResumePdf(el, fileBase, design.pageSize);
      toast.success(ar ? "تم تنزيل ملف PDF" : "PDF downloaded");
    } catch {
      toast.error(ar ? "تعذّر إنشاء ملف PDF" : "Failed to generate the PDF");
    } finally {
      setExportingImagePdf(false);
    }
  };

  const copyTxt = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(resume));
      toast.success(ar ? "تم نسخ النسخة النصية" : "Plain text copied");
    } catch {
      toast.error(ar ? "تعذّر النسخ — استخدم زر التنزيل" : "Copy failed — use the download button");
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([toPlainText(resume)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileBase}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(ar ? "تم تنزيل النسخة النصية" : "Plain text downloaded");
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-5">
        <div>
          <h1 className="text-xl font-extrabold">{resume.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {tpl.name[lang]} · {resume.language.toUpperCase()} · ATS {score}/100 · {page.label} ·{" "}
            {design.marginMm}mm
          </p>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          {tpl.atsFriendly ? (
            <Badge variant="secondary" className="self-center">
              ATS
            </Badge>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/resumes/$id/edit" params={{ id: resume.id }}>
              <FileText className="size-4" />
              {ar ? "تحرير" : "Edit"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/resumes/$id/studio" params={{ id: resume.id }}>
              <WandSparkles className="size-4" />
              {ar ? "استوديو التصميم" : "Design studio"}
            </Link>
          </Button>
          <Button variant="outline" onClick={downloadTxt}>
            <Download className="size-4" />
            {ar ? "نسخة نصية ATS" : "ATS plain text"}
          </Button>
          <Button variant="outline" onClick={() => void copyTxt()}>
            <ClipboardCopy className="size-4" />
            {ar ? "نسخ النص" : "Copy text"}
          </Button>
          <Button variant="outline" onClick={printPdf}>
            <Printer className="size-4" />
            {ar ? "PDF نصي (طباعة)" : "Print / text PDF"}
          </Button>
          <Button onClick={() => void downloadImagePdf()} disabled={exportingImagePdf}>
            {exportingImagePdf ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {ar ? "تنزيل PDF عالي الدقة" : "Download high-res PDF"}
          </Button>
        </div>
      </div>

      <p className="mx-auto max-w-6xl px-4 pb-4 text-xs text-muted-foreground">
        {ar
          ? `حجم الورق الفعلي: ${page.label} (${page.widthMm} × ${page.heightMm} مم). الطباعة وPDF عالي الدقة يستخدمان نفس إعدادات Studio المحفوظة.`
          : `Actual paper size: ${page.label} (${page.widthMm} × ${page.heightMm} mm). Print and high-resolution PDF use the same saved Studio settings.`}
      </p>

      <div className="mx-auto max-w-6xl overflow-auto px-4 pb-16">
        <div id="print-area" className="mx-auto w-max">
          <ProfessionalResumePreview resume={resume} />
        </div>
      </div>
    </div>
  );
}
