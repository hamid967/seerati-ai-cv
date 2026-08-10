import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Expand, FileText, Gauge, Minus, Plus, Sparkles } from "lucide-react";
import { ResumePreview, getTemplate } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthGuard, useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import { adviseResumeStudio } from "@/lib/resume-studio";

export const Route = createFileRoute("/resumes/$id/studio")({
  head: () => ({
    meta: [{ title: "Resume Studio Ultra | سيرتي" }, { name: "robots", content: "noindex" }],
  }),
  component: ResumeStudioUltra,
});

function ResumeStudioUltra() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, getResume, updateResume } = useStore();
  const resume = getResume(id);
  const [zoom, setZoom] = useState(86);
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
  const [fullscreen, setFullscreen] = useState(false);

  useAuthGuard();

  const advice = useMemo(
    () => (resume ? adviseResumeStudio(resume, defaultTemplates) : null),
    [resume],
  );

  if (!ready) return null;
  if (!resume || !advice) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-bold">{ar ? "لم نجد هذه السيرة" : "Resume not found"}</p>
        <Button className="mt-5" asChild>
          <Link to="/dashboard">{ar ? "العودة" : "Back"}</Link>
        </Button>
      </div>
    );
  }

  const currentTemplate = getTemplate(resume.templateId);
  const applyDensity = async (density: "compact" | "normal" | "airy") => {
    await updateResume(resume.id, {
      data: { ...resume.data, design: { ...resume.data.design, density } },
    });
  };

  const applyTemplate = async (templateId: string) => {
    await updateResume(resume.id, { templateId });
  };

  return (
    <div
      className={fullscreen ? "fixed inset-0 z-[80] overflow-auto bg-background" : "min-h-screen"}
    >
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3">
          <div className="me-3">
            <p className="font-extrabold">Resume Studio Ultra</p>
            <p className="text-xs text-muted-foreground">{resume.title}</p>
          </div>

          <Select value={pageSize} onValueChange={(v) => setPageSize(v as "a4" | "letter")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4</SelectItem>
              <SelectItem value="letter">US Letter</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-14 text-center text-xs font-bold">{zoom}%</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={() => setFullscreen((v) => !v)}>
            <Expand className="size-4" />
            {fullscreen ? (ar ? "إنهاء التركيز" : "Exit focus") : ar ? "وضع التركيز" : "Focus mode"}
          </Button>

          <Button variant="outline" asChild>
            <Link to="/resumes/$id/edit" params={{ id }}>
              <FileText className="size-4" />
              {ar ? "تحرير المحتوى" : "Edit content"}
            </Link>
          </Button>

          <Button className="ms-auto" asChild>
            <Link to="/resumes/$id/preview" params={{ id }}>
              {ar ? "معاينة وتنزيل" : "Preview & export"}
            </Link>
          </Button>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="seerati-panel p-4">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-emerald-accent" />
              <h2 className="font-bold">{ar ? "Smart Fit" : "Smart Fit"}</h2>
              <Badge variant="secondary" className="ms-auto">
                {advice.load}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {advice.pageHint[lang]}
            </p>
            <Button
              className="mt-3 w-full"
              size="sm"
              onClick={() => void applyDensity(advice.density)}
            >
              {ar ? `تطبيق كثافة ${advice.density}` : `Apply ${advice.density} density`}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {ar
                ? "Smart Fit لا يحذف المحتوى ولا يختلق معلومات؛ يضبط الكثافة فقط."
                : "Smart Fit never deletes content or invents information; it only adjusts spacing density."}
            </p>
          </section>

          <section className="seerati-panel p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-accent" />
              <h2 className="font-bold">{ar ? "مستشار التصميم" : "Design advisor"}</h2>
            </div>
            <div className="mt-3 space-y-2">
              {advice.reasons.map((r, i) => (
                <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                  • {r[lang]}
                </p>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {advice.recommendedTemplateIds.map((templateId) => {
                const tpl = getTemplate(templateId);
                return (
                  <button
                    key={templateId}
                    onClick={() => void applyTemplate(templateId)}
                    className={`w-full rounded-xl border p-3 text-start transition hover:border-emerald-accent ${resume.templateId === templateId ? "border-emerald-accent bg-emerald-accent/5" : "border-border"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tpl.name[lang]}</span>
                      {tpl.atsFriendly && (
                        <Badge variant="outline" className="ms-auto text-[10px]">
                          ATS
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {tpl.description[lang]}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="seerati-panel p-4">
            <p className="text-xs font-bold">{ar ? "القالب الحالي" : "Current template"}</p>
            <p className="mt-1 text-sm font-semibold">{currentTemplate.name[lang]}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {pageSize === "a4" ? "210 × 297 mm" : "8.5 × 11 in"}
            </p>
          </section>
        </aside>

        <section className="relative min-h-[80vh] overflow-auto rounded-3xl border border-border/60 bg-secondary/35 p-4 md:p-8">
          <div
            className="mx-auto origin-top transition-transform duration-200"
            style={{
              width: pageSize === "a4" ? 820 : 850,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <ResumePreview resume={resume} />
          </div>
        </section>
      </main>
    </div>
  );
}
