/**
 * Universal Import Center.
 *
 * Three honest steps: choose a source → review what we extracted → fill the
 * gaps by chatting. Files are read in the browser only; the raw file is never
 * uploaded or stored, and nothing is saved to the career profile until the user
 * approves it field by field.
 */
import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardPaste,
  FileUp,
  Info,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import { loadCareerTwin, saveCareerTwin, twinHealth, type CareerTwin } from "@/lib/career";
import {
  ACCEPT_ATTR,
  EXTRACT_ERROR_MESSAGE,
  extractFileText,
  MAX_FILE_BYTES,
  normalizeExtractedText,
} from "@/lib/file-extract";
import {
  CONNECTORS,
  MODE_BADGE,
  SOURCE_LABEL,
  type Connector,
  type ImportProvenance,
  type SourceType,
} from "@/lib/import-connectors";
import {
  buildImportDraft,
  CONFIDENCE_LABEL,
  draftToTwinPatch,
  type Confidence,
  type ImportDraft,
  type ListCandidate,
  type ListKind,
} from "@/lib/import-map";
import { ResumeCopilot, type CopilotGap } from "@/components/resume-copilot";
import { describeProgress, RESUME_LANGUAGE_LABEL, type ResumeLanguage } from "@/lib/ai-actions";
import { uid } from "@/lib/types";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "مركز الاستيراد | سيرتي — Import your career data" },
      {
        name: "description",
        content:
          "استورد بياناتك المهنية من LinkedIn أو Indeed أو بيت.كوم أو ملف PDF/DOCX، راجع كل حقل قبل الحفظ، ثم أكمل الناقص بالمحادثة.",
      },
      { property: "og:title", content: "مركز الاستيراد | سيرتي" },
      { property: "og:description", content: "استيراد آمن لبياناتك المهنية، بمراجعة كاملة قبل الحفظ." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ImportCenterPage,
});

type Step = "source" | "review" | "gaps";

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  high: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  low: "bg-destructive/10 text-destructive",
};

const LIST_LABEL: Record<ListKind, { ar: string; en: string }> = {
  experience: { ar: "الخبرات", en: "Experience" },
  education: { ar: "التعليم", en: "Education" },
  skills: { ar: "المهارات", en: "Skills" },
  languages: { ar: "اللغات", en: "Languages" },
  certificates: { ar: "الشهادات والدورات", en: "Certificates & courses" },
  projects: { ar: "المشاريع", en: "Projects" },
};

function ImportCenterPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useStore();
  useAuthGuard();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("source");
  const [connector, setConnector] = useState<Connector>(CONNECTORS[0] as Connector);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [twin, setTwin] = useState<CareerTwin | null>(null);
  const [recap, setRecap] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [resumeLang, setResumeLang] = useState<ResumeLanguage>(ar ? "ar" : "en");
  const fileRef = useRef<HTMLInputElement>(null);

  const health = useMemo(() => twinHealth(twin), [twin]);

  async function toReview(text: string, sourceType: SourceType, fileName?: string) {
    const clean = normalizeExtractedText(text);
    if (clean.replace(/\s/g, "").length < 40) {
      setError(ar ? "النص قصير جداً للاستيراد." : "The text is too short to import.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const loaded = user ? await loadCareerTwin(user.id) : null;
      setTwin(loaded);
      setDraft(
        buildImportDraft({
          text: clean,
          sourceType,
          sourceLabel: connector.name[ar ? "ar" : "en"],
          ...(fileName ? { fileName } : {}),
          lang,
          twin: loaded,
        }),
      );
      setStep("review");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    const outcome = await extractFileText(file);
    setBusy(false);
    if (!outcome.ok) {
      setError(EXTRACT_ERROR_MESSAGE[outcome.reason][ar ? "ar" : "en"]);
      return;
    }
    const sourceType: SourceType =
      connector.id === "other"
        ? outcome.kind === "pdf"
          ? "device_pdf"
          : outcome.kind === "docx"
            ? "device_docx"
            : "device_txt"
        : connector.sourceType;
    await toReview(outcome.text, sourceType, outcome.fileName);
  }

  /* ------------------------------ step: source ----------------------------- */

  if (step === "source") {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {ar ? "مركز الاستيراد" : "Import center"}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            {ar
              ? "أحضر بياناتك المهنية من أي منصة، وسنحوّلها إلى ملف مهني منظم. تراجع كل حقل قبل الحفظ."
              : "Bring your career data from any platform and we turn it into a structured profile. You review every field before it is saved."}
          </p>
        </header>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-2 p-4 text-sm md:flex-row md:items-center">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <p>
              {ar
                ? "الملف يُقرأ في متصفحك فقط ولا يُرفع ولا يُحفظ. لا نطلب كلمات مرور المنصات ولا نسحب البيانات من روابط محمية."
                : "Your file is read in your browser only — never uploaded or stored. We never ask for platform passwords and never pull data from protected links."}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.map((item) => {
            const active = item.id === connector.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setConnector(item);
                  setError(null);
                }}
                className={`rounded-xl border p-4 text-start transition ${
                  active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{item.name[ar ? "ar" : "en"]}</span>
                  <Badge variant="secondary" className="text-[11px]">
                    {MODE_BADGE[item.modes[0] as "export_file"][ar ? "ar" : "en"]}
                  </Badge>
                </div>
                <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {item.steps[ar ? "ar" : "en"].map((s, i) => (
                    <li key={i}>
                      {i + 1}. {s}
                    </li>
                  ))}
                </ol>
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {ar ? `استيراد من: ${connector.name.ar}` : `Import from: ${connector.name.en}`}
            </CardTitle>
            <CardDescription>
              {ar
                ? `الصيغ المدعومة: PDF نصي، DOCX، TXT، MD — حتى ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} ميجابايت.`
                : `Supported: text PDF, DOCX, TXT, MD — up to ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connector.note && (
              <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                {connector.note[ar ? "ar" : "en"]}
              </p>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void onFile(file);
              }}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Upload className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {ar ? "اسحب الملف وأفلته هنا" : "Drag and drop your file here"}
              </p>
              <p className="text-xs text-muted-foreground">
                {ar ? "أو استخدم الأزرار أدناه — الملف يُقرأ في متصفحك فقط." : "Or use the buttons below — the file is read in your browser only."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fileRef.current?.click()} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                {ar ? "ارفع ملفاً" : "Upload a file"}
              </Button>
              <Button variant="outline" onClick={() => setPasteMode((v) => !v)} disabled={busy}>
                <ClipboardPaste className="size-4" />
                {ar ? "الصق النص" : "Paste text"}
              </Button>
              <Input
                ref={fileRef}
                type="file"
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void onFile(file);
                }}
              />
            </div>

            {pasteMode && (
              <div className="space-y-2">
                <Textarea
                  rows={8}
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder={ar ? "الصق نص سيرتك الذاتية هنا…" : "Paste your resume text here…"}
                />
                <Button
                  onClick={() => void toReview(pasted, connector.id === "other" ? "paste" : connector.sourceType)}
                  disabled={busy || pasted.trim().length < 40}
                >
                  {ar ? "تحليل النص" : "Analyse text"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}

            {error && (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------ step: review ----------------------------- */

  if (step === "review" && draft) {
    const setListItem = (kind: ListKind, id: string, include: boolean) =>
      setDraft((d) =>
        d
          ? {
              ...d,
              [kind]: (d[kind] as ListCandidate<unknown>[]).map((x) => (x.id === id ? { ...x, include } : x)),
            }
          : d,
      );

    const lists: ListKind[] = ["experience", "education", "skills", "languages", "certificates", "projects"];

    async function save(next: "gaps" | "only") {
      if (!user || !draft) return;
      setBusy(true);
      try {
        const { patch, sections, count } = draftToTwinPatch(draft, twin);
        if (!count) {
          toast.info(ar ? "لم تختر أي عنصر للحفظ." : "No item selected to save.");
          return;
        }
        const provenance: ImportProvenance = {
          id: uid(),
          sourceType: draft.sourceType,
          sourceLabel: SOURCE_LABEL[draft.sourceType][ar ? "ar" : "en"],
          importedAt: new Date().toISOString(),
          userVerified: true,
          sections,
        };
        await saveCareerTwin(user.id, {
          ...patch,
          importHistory: [...(twin?.importHistory ?? []), provenance],
        });
        const refreshed = await loadCareerTwin(user.id);
        setTwin(refreshed);
        toast.success(
          ar ? `تم حفظ ${count} عنصراً في ملفك المهني.` : `Saved ${count} item${count === 1 ? "" : "s"} to your profile.`,
        );
        setRecap(
          sections.map((s) =>
            ar ? `تم استيراد قسم: ${s}` : `Imported section: ${s}`,
          ),
        );
        if (next === "gaps") setStep("gaps");
        else navigate({ to: "/career-twin" });

      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{ar ? "راجع ما استخرجناه" : "Review what we extracted"}</h1>
          <p className="text-sm text-muted-foreground">
            {ar
              ? "لا شيء يُحفظ قبل موافقتك. الحقول ذات الثقة المنخفضة تحتاج تحققاً منك."
              : "Nothing is saved before you approve it. Low-confidence fields need your check."}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{SOURCE_LABEL[draft.sourceType][ar ? "ar" : "en"]}</Badge>
            {draft.fileName && <span>{draft.fileName}</span>}
            <span>
              {ar ? "لغة المصدر:" : "Source language:"}{" "}
              {draft.detectedLanguage === "mixed" ? (ar ? "مختلطة" : "Mixed") : draft.detectedLanguage.toUpperCase()}
            </span>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "الأقسام المكتشفة" : "Detected sections"}</CardTitle>
            <CardDescription>
              {ar
                ? "ثقة نوعية فقط — لا نسب مئوية مضللة."
                : "Qualitative confidence only — no misleading percentages."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(["experience", "education", "skills", "languages", "certificates", "projects"] as ListKind[]).map(
              (kind) => {
                const items = draft[kind] as ListCandidate<Record<string, unknown>>[];
                if (!items.length) return null;
                const worst: Confidence = items.some((i) => i.confidence === "low")
                  ? "low"
                  : items.some((i) => i.confidence === "medium")
                    ? "medium"
                    : "high";
                return (
                  <span
                    key={kind}
                    className={`rounded-full px-3 py-1 text-xs ${CONFIDENCE_STYLE[worst]}`}
                  >
                    {LIST_LABEL[kind][ar ? "ar" : "en"]} · {items.length} ·{" "}
                    {CONFIDENCE_LABEL[worst][ar ? "ar" : "en"]}
                  </span>
                );
              },
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "المعلومات الأساسية" : "Core details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {draft.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {ar ? "لم نتعرّف على معلومات أساسية في هذا المصدر." : "No core details were detected in this source."}
              </p>
            )}
            {draft.fields.map((field) => (
              <div key={field.key} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`f-${field.key}`}
                      checked={field.include}
                      onCheckedChange={(v) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                fields: d.fields.map((x) =>
                                  x.key === field.key ? { ...x, include: v === true } : x,
                                ),
                              }
                            : d,
                        )
                      }
                    />
                    <label htmlFor={`f-${field.key}`} className="text-sm font-medium">
                      {field.label[ar ? "ar" : "en"]}
                    </label>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${CONFIDENCE_STYLE[field.confidence]}`}>
                    {CONFIDENCE_LABEL[field.confidence][ar ? "ar" : "en"]}
                  </span>
                </div>
                <Textarea
                  className="mt-2"
                  rows={field.key === "summary" ? 4 : 1}
                  value={field.value}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            fields: d.fields.map((x) => (x.key === field.key ? { ...x, value: e.target.value } : x)),
                          }
                        : d,
                    )
                  }
                />
                {field.existing && (
                  <div className="mt-2 space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-2">
                    <p className="text-xs text-amber-700 dark:text-amber-500">
                      {ar ? "تعارض مع ملفك الحالي:" : "Conflict with your current profile:"} {field.existing}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={field.include ? "outline" : "secondary"}
                        onClick={() =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  fields: d.fields.map((x) =>
                                    x.key === field.key ? { ...x, include: false } : x,
                                  ),
                                }
                              : d,
                          )
                        }
                      >
                        {ar ? "أبقِ الحالي" : "Keep existing"}
                      </Button>
                      <Button
                        size="sm"
                        variant={field.include ? "secondary" : "outline"}
                        onClick={() =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  fields: d.fields.map((x) =>
                                    x.key === field.key ? { ...x, include: true } : x,
                                  ),
                                }
                              : d,
                          )
                        }
                      >
                        {ar ? "استخدم المستورد" : "Use imported"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  fields: d.fields.map((x) =>
                                    x.key === field.key
                                      ? { ...x, include: true, value: `${field.existing} — ${x.value}` }
                                      : x,
                                  ),
                                }
                              : d,
                          )
                        }
                      >
                        {ar ? "دمج يدوي" : "Merge manually"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {lists.map((kind) => {
          const items = draft[kind] as ListCandidate<Record<string, unknown>>[];
          if (!items.length) return null;
          return (
            <Card key={kind}>
              <CardHeader>
                <CardTitle className="text-base">
                  {LIST_LABEL[kind][ar ? "ar" : "en"]} · {items.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => {
                  const v = item.value;
                  const title =
                    (v["role"] as string) ||
                    (v["degree"] as string) ||
                    (v["name"] as string) ||
                    (v["title"] as string) ||
                    "";
                  const sub =
                    (v["company"] as string) ||
                    (v["school"] as string) ||
                    (v["level"] as string) ||
                    (v["detail"] as string) ||
                    "";
                  return (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <Checkbox
                        checked={item.include}
                        onCheckedChange={(val) => setListItem(kind, item.id, val === true)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{title || sub}</p>
                        {title && sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
                        {Boolean(v["start"] || v["end"]) && (
                          <p className="text-xs text-muted-foreground">
                            {String(v["start"] ?? "")} – {String(v["end"] ?? "")}
                          </p>
                        )}
                        {item.duplicate && (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
                            {ar ? "موجود مسبقاً في ملفك — غير محدد افتراضياً." : "Already on your profile — unticked by default."}
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${CONFIDENCE_STYLE[item.confidence]}`}>
                        {CONFIDENCE_LABEL[item.confidence][ar ? "ar" : "en"]}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {draft.missingSections.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 text-sm">
              <p className="mb-1 font-medium">{ar ? "أقسام لم يحتوِها المصدر" : "Sections this source did not contain"}</p>
              <p className="text-muted-foreground">
                {draft.missingSections.map((k) => LIST_LABEL[k][ar ? "ar" : "en"]).join(ar ? "، " : ", ")} —{" "}
                {ar ? "سنكملها معك بالمحادثة بعد الحفظ." : "we will fill these with you by chatting after saving."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save("gaps")} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {ar ? "اعتماد واستكمال مع المساعد" : "Approve and continue with the copilot"}
          </Button>
          <Button variant="outline" onClick={() => void save("only")} disabled={busy}>
            <Upload className="size-4" />
            {ar ? "استيراد فقط" : "Import only"}
          </Button>
          <Button variant="ghost" onClick={() => setStep("source")} disabled={busy}>
            {ar ? "رجوع" : "Back"}
          </Button>
        </div>

      </div>
    );
  }

  /* ------------------------------- step: gaps ------------------------------ */

  const gaps: CopilotGap[] = [];
  if (!twin?.identity.summary) {
    gaps.push({
      key: "summary",
      label: { ar: "الملخص المهني", en: "Professional summary" },
      question: {
        ar: "بجملة أو جملتين: ما تخصصك وأهم أثر حققته في عملك؟",
        en: "In one or two sentences: what is your specialisation and biggest impact at work?",
      },
    });
  }
  if (!twin?.identity.headline) {
    gaps.push({
      key: "headline",
      label: { ar: "المسمى المهني", en: "Headline" },
      question: { ar: "ما المسمى الوظيفي الذي تستهدفه؟", en: "Which job title are you targeting?" },
    });
  }
  if (!twin?.achievements.length) {
    gaps.push({
      key: "achievement",
      label: { ar: "إنجاز", en: "Achievement" },
      question: {
        ar: "اذكر إنجازاً واحداً حققته مؤخراً، وسأصيغه كنقطة مهنية.",
        en: "Name one recent achievement and I will turn it into a resume bullet.",
      },
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{ar ? "أكمل ملفك المهني" : "Finish your profile"}</h1>
        <p className="text-sm text-muted-foreground">
          {ar
            ? `اكتمال ملفك الآن ${health.score}%. أكمل الناقص بالمحادثة، وكل اقتراح يُحفظ بعد موافقتك فقط.`
            : `Your profile is ${health.score}% complete. Fill the gaps by chatting — every suggestion is saved only after you approve it.`}
        </p>
      </header>

      {gaps.length > 0 ? (
        <ResumeCopilot
          gaps={gaps}
          targetRole={twin?.identity.headline ?? ""}
          currentValue={(key) =>
            key === "summary" ? (twin?.identity.summary ?? "") : key === "headline" ? (twin?.identity.headline ?? "") : ""
          }
          onApply={async (key, value) => {
            if (!user) return;
            if (key === "summary" || key === "headline") {
              const identity = {
                ...(twin?.identity ?? { fullName: "", headline: "", email: "", phone: "", city: "", summary: "" }),
                [key]: value,
              };
              await saveCareerTwin(user.id, { identity });
            } else {
              await saveCareerTwin(user.id, {
                achievements: [...(twin?.achievements ?? []), { id: uid(), text: value }],
              });
            }
            setTwin(await loadCareerTwin(user.id));
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {ar ? "ملفك المهني يحتوي الأساسيات. تابع إلى السيرة الذاتية." : "Your profile has the essentials. Continue to your resume."}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate({ to: "/career-twin" })}>
          {ar ? "افتح ملفي المهني" : "Open my career profile"}
          <ArrowRight className="size-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/resumes/new" })}>
          {ar ? "أنشئ سيرة ذاتية" : "Create a resume"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setDraft(null);
            setPasted("");
            setStep("source");
          }}
        >
          {ar ? "استيراد مصدر آخر" : "Import another source"}
        </Button>
      </div>
    </div>
  );
}
