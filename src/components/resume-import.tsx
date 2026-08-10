import { useMemo, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseResumeText, type ParsedResume } from "@/lib/resume-import";
import type { ResumeData } from "@/lib/types";

/**
 * Import step: paste (or load a .txt/.md file into) existing resume text,
 * then review every extracted section before anything is saved.
 * Nothing is persisted here — the parent decides what to do with the
 * confirmed `Partial<ResumeData>`.
 */
export function ResumeImport({
  lang,
  onConfirm,
  onSkip,
}: {
  lang: "ar" | "en";
  onConfirm: (data: Partial<ResumeData>) => void;
  onSkip: () => void;
}) {
  const ar = lang === "ar";
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);

  const canParse = text.trim().length > 20;

  const handleFile = (file: File) => {
    if (!/\.(txt|md)$/i.test(file.name)) {
      toast.error(
        ar
          ? "صيغ PDF وWord غير مدعومة حالياً — الصق النص مباشرة"
          : "PDF/DOCX aren’t supported yet — please paste the text instead",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
      // We only keep the extracted text in state; the file itself is never
      // uploaded anywhere and is discarded once read.
    };
    reader.readAsText(file);
  };

  const runParse = () => {
    const result = parseResumeText(text, lang);
    setParsed(result);
  };

  const sectionsFound = useMemo(() => {
    if (!parsed) return [];
    const s: string[] = [];
    if (parsed.summary) s.push(ar ? "الملخص" : "Summary");
    if (parsed.experience?.length) s.push(ar ? "الخبرات" : "Experience");
    if (parsed.education?.length) s.push(ar ? "التعليم" : "Education");
    if (parsed.skills?.length) s.push(ar ? "المهارات" : "Skills");
    if (parsed.languages?.length) s.push(ar ? "اللغات" : "Languages");
    if (parsed.certificates?.length) s.push(ar ? "الدورات والشهادات" : "Certificates");
    if (parsed.projects?.length) s.push(ar ? "المشاريع" : "Projects");
    return s;
  }, [parsed, ar]);

  if (!parsed) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {ar
            ? "الصق نص سيرتك الذاتية الحالية أدناه، وسنحاول تنظيمها في أقسام جاهزة للتحرير."
            : "Paste the text of your current resume below and we’ll try to organise it into editable sections."}
        </p>
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          {ar
            ? "ملاحظة: لا يدعم الاستيراد حالياً ملفات PDF أو Word — الصق النص، أو اختر ملف نصي (.txt أو .md)."
            : "Note: PDF and Word import isn’t available yet — paste the text, or choose a .txt/.md file."}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="import-file" className="flex items-center gap-1.5 text-sm">
            <Upload className="size-3.5" />
            {ar ? "اختياري: تحميل ملف نصي" : "Optional: load a text file"}
          </Label>
          <Input
            id="import-file"
            type="file"
            accept=".txt,.md,text/plain"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="import-text">{ar ? "نص السيرة الذاتية" : "Resume text"}</Label>
          <Textarea
            id="import-text"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              ar
                ? "الصق هنا: الملخص، الخبرات، التعليم، المهارات…"
                : "Paste here: summary, experience, education, skills…"
            }
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runParse} disabled={!canParse}>
            <FileText className="size-4" />
            {ar ? "استخرج الأقسام" : "Extract sections"}
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            {ar ? "تخطي الاستيراد" : "Skip import"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ReviewParsed
      lang={lang}
      parsed={parsed}
      sectionsFound={sectionsFound}
      onBack={() => setParsed(null)}
      onConfirm={onConfirm}
    />
  );
}

function ReviewParsed({
  lang,
  parsed,
  sectionsFound,
  onBack,
  onConfirm,
}: {
  lang: "ar" | "en";
  parsed: ParsedResume;
  sectionsFound: string[];
  onBack: () => void;
  onConfirm: (data: Partial<ResumeData>) => void;
}) {
  const ar = lang === "ar";
  const [draft, setDraft] = useState<ParsedResume>(parsed);

  const removeAt = <
    K extends "experience" | "education" | "skills" | "languages" | "certificates" | "projects",
  >(
    key: K,
    idx: number,
  ) => {
    setDraft((d) => ({
      ...d,
      [key]: ((d[key] as unknown[]) ?? []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">
          {ar ? "راجع ما استخرجناه قبل الاستخدام" : "Review what we extracted before using it"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {sectionsFound.length
            ? ar
              ? `الأقسام المكتشفة: ${sectionsFound.join("، ")}`
              : `Detected sections: ${sectionsFound.join(", ")}`
            : ar
              ? "لم نتمكن من التعرّف على عناوين أقسام واضحة — يمكنك المتابعة يدوياً بدلاً من ذلك."
              : "We couldn’t detect clear section headings — you may prefer the manual path instead."}
        </p>
      </div>

      {(draft.contact.emails.length > 0 ||
        draft.contact.phones.length > 0 ||
        draft.contact.links.length > 0) && (
        <div className="rounded-lg border border-border p-3 text-xs">
          <p className="mb-1 font-semibold">
            {ar ? "بيانات تواصل مكتشفة" : "Detected contact info"}
          </p>
          <p className="text-muted-foreground">
            {[...draft.contact.emails, ...draft.contact.phones, ...draft.contact.links].join(
              "  ·  ",
            ) || "—"}
          </p>
        </div>
      )}

      {draft.summary && (
        <div className="space-y-1.5">
          <Label>{ar ? "الملخص" : "Summary"}</Label>
          <Textarea
            rows={3}
            value={draft.summary}
            onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
          />
        </div>
      )}

      {(["experience", "education", "certificates", "projects"] as const).map((key) =>
        draft[key] && (draft[key] as unknown[]).length ? (
          <ListSection
            key={key}
            title={
              key === "experience"
                ? ar
                  ? "الخبرات"
                  : "Experience"
                : key === "education"
                  ? ar
                    ? "التعليم"
                    : "Education"
                  : key === "certificates"
                    ? ar
                      ? "الدورات والشهادات"
                      : "Certificates"
                    : ar
                      ? "المشاريع"
                      : "Projects"
            }
            items={
              key === "experience"
                ? (draft.experience ?? []).map((e) => e.bullets.join(" — "))
                : key === "education"
                  ? (draft.education ?? []).map((e) => e.degree)
                  : ((draft[key] as { title: string }[]) ?? []).map((s) => s.title)
            }
            onRemove={(i) => removeAt(key, i)}
          />
        ) : null,
      )}

      {draft.skills && draft.skills.length > 0 && (
        <ListSection
          title={ar ? "المهارات" : "Skills"}
          items={draft.skills.map((s) => s.name)}
          onRemove={(i) => removeAt("skills", i)}
        />
      )}

      {draft.languages && draft.languages.length > 0 && (
        <ListSection
          title={ar ? "اللغات" : "Languages"}
          items={draft.languages.map((l) => l.name)}
          onRemove={(i) => removeAt("languages", i)}
        />
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={() => onConfirm(draft)}>
          {ar ? "استخدم هذه البيانات" : "Use this data"}
        </Button>
        <Button variant="outline" onClick={onBack}>
          {ar ? "رجوع للنص" : "Back to text"}
        </Button>
      </div>
    </div>
  );
}

function ListSection({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: string[];
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{title}</Label>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={`${title}-${i}`}
            className="flex items-start justify-between gap-2 rounded-lg border border-border bg-secondary/30 p-2 text-sm"
          >
            <span className="text-start">{item || "—"}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="remove"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
