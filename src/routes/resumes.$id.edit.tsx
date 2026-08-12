import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  Redo2,
  Undo2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getTemplate } from "@/components/resume-preview";
import { ProfessionalResumePreview } from "@/components/professional-resume-preview";
import {
  ResumeEditorLayoutControls,
  ResumeSectionVisibilityControls,
} from "@/components/resume-editor-layout-controls";
import { AiAssistant } from "@/components/ai-assistant";
import { FieldAi } from "@/components/field-ai";
import { GuestNotice } from "@/components/guest-notice";

import { SortableList, SortableItem, reorderArray } from "@/components/sortable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import { defaultTemplates } from "@/lib/templates";
import { analyzeResume, checklist, completeness, keywordCoverage, resumeStatus } from "@/lib/ats";
import { ACCENT_PALETTE, uid, type Resume, type ResumeData, type SectionKey } from "@/lib/types";
import {
  createVersionSnapshot,
  ensureSessionSnapshot,
  listResumeVersions,
  type ResumeVersion,
} from "@/lib/resume-versions";
import { ResumeVariantSwitcher } from "@/components/resume-variant-switcher";
import { BilingualSyncCard } from "@/components/bilingual-sync-card";

export const Route = createFileRoute("/resumes/$id/edit")({
  head: () => ({
    meta: [
      { title: "محرر السيرة الذاتية | سيرتي" },
      {
        name: "description",
        content: "محرر متعدد الخطوات مع حفظ تلقائي ومعاينة مباشرة ومساعد كتابة بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "محرر سيرتي" },
      { property: "og:description", content: "حرّر سيرتك الذاتية وشاهد النتيجة مباشرة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditResume,
});

const stepDefs = [
  { key: "personal", ar: "بيانات شخصية", en: "Personal" },
  { key: "summary", ar: "الملخص", en: "Summary" },
  { key: "experience", ar: "الخبرات", en: "Experience" },
  { key: "education", ar: "التعليم", en: "Education" },
  { key: "skills", ar: "المهارات واللغات", en: "Skills & languages" },
  { key: "extras", ar: "أقسام إضافية", en: "Extra sections" },
  { key: "design", ar: "التصميم", en: "Design" },
  { key: "order", ar: "ترتيب الأقسام", en: "Section order" },
] as const;

const sectionLabels: Record<SectionKey, { ar: string; en: string }> = {
  summary: { ar: "الملخص المهني", en: "Summary" },
  experience: { ar: "الخبرات العملية", en: "Experience" },
  education: { ar: "التعليم", en: "Education" },
  skills: { ar: "المهارات", en: "Skills" },
  languages: { ar: "اللغات", en: "Languages" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  projects: { ar: "المشاريع", en: "Projects" },
  achievements: { ar: "الإنجازات", en: "Achievements" },
  volunteering: { ar: "العمل التطوعي", en: "Volunteering" },
  links: { ar: "الروابط", en: "Links" },
  references: { ar: "المراجع", en: "References" },
  custom: { ar: "أقسام مخصصة", en: "Custom sections" },
};

function swap<T>(arr: T[], a: number, b: number) {
  if (a < 0 || b < 0 || a >= arr.length || b >= arr.length) return;
  [arr[a], arr[b]] = [arr[b]!, arr[a]!];
}

function MoveButtons({
  ar,
  upDisabled,
  downDisabled,
  vertical,
  onMove,
}: {
  ar: boolean;
  upDisabled: boolean;
  downDisabled: boolean;
  vertical?: boolean;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className={vertical ? "flex flex-col gap-1" : "flex gap-1"}>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label={ar ? "تحريك لأعلى" : "Move up"}
        disabled={upDisabled}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className="size-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label={ar ? "تحريك لأسفل" : "Move down"}
        disabled={downDisabled}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="size-3.5" />
      </Button>
    </div>
  );
}

function EditResume() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { ready, user, resumes, getResume, updateResume } = useStore();

  const stored = getResume(id);
  const [draft, setDraft] = useState<Resume | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [step, setStep] = useState<(typeof stepDefs)[number]["key"]>("personal");
  const [sideTab, setSideTab] = useState("preview");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const past = useRef<Resume[]>([]);
  const future = useRef<Resume[]>([]);
  const [, bumpHistory] = useState(0);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);

  useAuthGuard({ allowGuest: true });

  useEffect(() => {
    if (stored && !draft) setDraft(stored);
  }, [stored, draft]);

  const refreshVersions = useCallback(() => {
    setLoadingVersions(true);
    void listResumeVersions(id).then((list) => {
      setVersions(list);
      setLoadingVersions(false);
    });
  }, [id]);

  useEffect(() => {
    if (user) refreshVersions();
  }, [user, refreshVersions]);

  const scheduleSave = useCallback(
    (next: Resume) => {
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const tplNext = getTemplate(next.templateId);
        void updateResume(next.id, {
          title: next.title,
          templateId: next.templateId,
          language: next.language,
          data: next.data,
          status: resumeStatus(next),
          completionScore: completeness(next),
          atsScore: analyzeResume(next, tplNext).score,
        })
          .then(() => setStatus("saved"))
          .catch(() => setStatus("error"));
      }, 700);
    },
    [updateResume],
  );

  const patch = useCallback(
    (fn: (r: Resume) => Resume) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = fn(structuredClone(prev));
        past.current = [...past.current.slice(-49), prev];
        future.current = [];
        bumpHistory((v) => v + 1);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const undo = useCallback(() => {
    setDraft((prev) => {
      const previous = past.current.pop();
      if (!prev || !previous) return prev;
      future.current = [...future.current, prev];
      bumpHistory((v) => v + 1);
      scheduleSave(previous);
      return previous;
    });
  }, [scheduleSave]);

  const redo = useCallback(() => {
    setDraft((prev) => {
      const next = future.current.pop();
      if (!prev || !next) return prev;
      past.current = [...past.current, prev];
      bumpHistory((v) => v + 1);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // Deep link from the dashboard: /resumes/:id/edit#ats opens the ATS panel.
  useEffect(() => {
    if (window.location.hash === "#ats") setSideTab("ats");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const setData = useCallback(
    (fn: (d: ResumeData) => void) =>
      patch((r) => {
        fn(r.data);
        return r;
      }),
    [patch],
  );

  /**
   * AI-approved edits rewrite whole blocks, so we keep a restore point first.
   * ensureSessionSnapshot reuses a recent auto snapshot instead of piling up
   * one row per suggestion in the same session.
   */
  const applyAi = useCallback(
    (reason: string, fn: (d: ResumeData) => void) => {
      const current = draft?.data;
      if (user && current) {
        void ensureSessionSnapshot({
          userId: user.id,
          resumeId: id,
          current,
          reason,
          lang: ar ? "ar" : "en",
          versions,
        }).then((v) => {
          if (v && !versions.some((x) => x.id === v.id)) refreshVersions();
        });
      }
      setData(fn);
    },
    [draft, user, id, ar, versions, refreshVersions, setData],
  );

  const jobDescription = draft?.data.jobDescription ?? "";
  const setJobDescription = useCallback(
    (v: string) =>
      setData((data) => {
        data.jobDescription = v;
      }),
    [setData],
  );

  const tpl = useMemo(() => (draft ? getTemplate(draft.templateId) : null), [draft]);
  const report = useMemo(
    () => (draft ? analyzeResume(draft, tpl ?? undefined, jobDescription) : null),
    [draft, tpl, jobDescription],
  );
  const score = report?.score ?? 0;
  const items = useMemo(() => (draft ? checklist(draft) : []), [draft]);
  const completion = draft ? completeness(draft) : 0;
  const gaps = useMemo(
    () => (draft && jobDescription.trim() ? keywordCoverage(jobDescription, draft.data) : null),
    [jobDescription, draft],
  );

  if (!ready) return null;
  if (!draft) {
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

  const d = draft.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Input
            value={draft.title}
            onChange={(e) => patch((r) => ({ ...r, title: e.target.value }))}
            className="h-9 w-52 font-semibold"
            aria-label={ar ? "اسم السيرة" : "Resume name"}
          />
          <Select
            value={draft.templateId}
            onValueChange={(v) => patch((r) => ({ ...r, templateId: v }))}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {defaultTemplates.map((x) => (
                <SelectItem key={x.id} value={x.id}>
                  {x.name[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={draft.language}
            onValueChange={(v) => patch((r) => ({ ...r, language: v as "ar" | "en" }))}
          >
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>

          <span
            className={`flex items-center gap-1.5 text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
            aria-live="polite"
          >
            {status === "saving" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : status === "error" ? (
              <AlertTriangle className="size-3.5" />
            ) : (
              <Check className="size-3.5 text-emerald-accent" />
            )}
            {status === "saving"
              ? ar
                ? "جارٍ الحفظ…"
                : "Saving…"
              : status === "error"
                ? ar
                  ? "تعذّر الحفظ — سنحاول مع تعديلك القادم"
                  : "Save failed — will retry on next change"
                : ar
                  ? "تم الحفظ"
                  : "Saved"}
          </span>

          <div className="ms-auto flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="size-9"
              aria-label={ar ? "تراجع" : "Undo"}
              title={ar ? "تراجع (Ctrl+Z)" : "Undo (Ctrl+Z)"}
              disabled={past.current.length === 0}
              onClick={undo}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-9"
              aria-label={ar ? "إعادة" : "Redo"}
              title={ar ? "إعادة (Ctrl+Shift+Z)" : "Redo (Ctrl+Shift+Z)"}
              disabled={future.current.length === 0}
              onClick={redo}
            >
              <Redo2 className="size-4" />
            </Button>
            {user ? (
              <ResumeVariantSwitcher
                userId={user.id}
                resumeId={draft.id}
                current={draft.data}
                versions={versions}
                loading={loadingVersions}
                onRestored={(data) => patch((r) => ({ ...r, data }))}
                onChanged={refreshVersions}
              />
            ) : null}
            <Badge variant="secondary">
              {ar ? "الاكتمال" : "Complete"} {completion}%
            </Badge>
            <Badge variant="secondary">ATS {score}/100</Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="lg:hidden">
                  <Eye className="size-4" />
                  {ar ? "معاينة ومساعد" : "Preview & AI"}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="flex h-[90vh] flex-col overflow-hidden">
                <SheetHeader>
                  <SheetTitle>{ar ? "معاينة ومساعد سيرتي" : "Preview & assistant"}</SheetTitle>
                </SheetHeader>
                <Tabs defaultValue="preview" className="mt-2 flex min-h-0 flex-1 flex-col">
                  <TabsList className="w-full">
                    <TabsTrigger value="preview" className="flex-1">
                      {ar ? "معاينة" : "Preview"}
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex-1">
                      {ar ? "مساعد" : "Assistant"}
                    </TabsTrigger>
                    <TabsTrigger value="ats" className="flex-1">
                      ATS
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="preview"
                    className="mt-2 min-h-0 flex-1 overflow-auto rounded-xl bg-secondary/40 p-2"
                  >
                    <ProfessionalResumePreview resume={draft} />
                  </TabsContent>
                  <TabsContent value="ai" className="mt-2 min-h-0 flex-1">
                    <AiAssistant
                      resume={draft}
                      section={step}
                      onApplySummary={(text) =>
                        applyAi("summary", (data) => {
                          data.summary = text;
                        })
                      }
                      onApplyBullets={(bullets) =>
                        applyAi("bullets", (data) => {
                          if (!data.experience.length)
                            data.experience.push({ id: uid(), role: "", company: "", bullets });
                          else data.experience[0]!.bullets = bullets;
                        })
                      }
                      onAddSkills={(skills) =>
                        setData((data) => {
                          skills.forEach((name) => {
                            if (
                              name &&
                              !data.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())
                            )
                              data.skills.push({ id: uid(), name });
                          });
                        })
                      }
                    />
                  </TabsContent>
                  <TabsContent
                    value="ats"
                    className="mt-2 min-h-0 flex-1 overflow-auto rounded-xl border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{ar ? "جاهزية ATS" : "ATS readiness"}</p>
                      <p className="text-lg font-extrabold text-emerald-accent">{score}/100</p>
                    </div>
                    <Progress value={score} className="mt-2" />
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {ar
                        ? "النتيجة إرشادية مبنية على قواعد كتابة معروفة، وليست تقييماً من نظام توظيف فعلي."
                        : "The score is advisory, based on known writing rules — not a verdict from a real ATS."}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {(report?.categories ?? []).map((c) => (
                        <li key={c.id} className="rounded-lg border border-border p-2.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[12px] font-semibold">{c.label[lang]}</span>
                            <span className="text-[12px] text-muted-foreground">
                              {c.earned}/{c.max}
                            </span>
                          </div>
                          {c.tips[0] && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {c.tips[0][lang]}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <BilingualSyncCard current={draft} all={resumes} />
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>

            <Button size="sm" variant="outline" asChild>
              <Link to="/resumes/$id/preview" params={{ id: draft.id }}>
                <Eye className="size-4" />
                {ar ? "معاينة وتنزيل" : "Preview & download"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 pt-4">
        <GuestNotice />
      </div>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[190px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Section navigation */}
        <nav
          aria-label={ar ? "أقسام المحرر" : "Builder sections"}
          className="lg:sticky lg:top-36 lg:self-start"
        >
          <div className="flex gap-1.5 overflow-x-auto lg:flex-col">
            {stepDefs.map((s) => (
              <Button
                key={s.key}
                size="sm"
                className="shrink-0 justify-start lg:w-full"
                variant={step === s.key ? "default" : "outline"}
                onClick={() => setStep(s.key)}
              >
                {s[lang]}
              </Button>
            ))}
          </div>
          <div className="mt-4 hidden rounded-xl border border-border bg-card p-3 lg:block">
            <p className="mb-2 text-xs font-bold">
              {ar ? "قائمة الاكتمال" : "Completion checklist"}
            </p>
            <Progress value={completion} className="mb-2" />
            <ul className="space-y-1">
              {items.map((i) => (
                <li key={i.id}>
                  <button
                    onClick={() => setStep(i.step === "design" ? "design" : i.step)}
                    className="flex w-full items-start gap-1.5 text-start text-[11.5px] hover:underline"
                  >
                    <span className={i.done ? "text-emerald-accent" : "text-muted-foreground"}>
                      {i.done ? "✓" : "○"}
                    </span>
                    <span className={i.done ? "text-muted-foreground" : ""}>{i.label[lang]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Form column */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            {step === "personal" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["fullName", ar ? "الاسم الكامل" : "Full name"],
                    ["jobTitle", ar ? "المسمى الوظيفي" : "Job title"],
                    ["email", ar ? "البريد الإلكتروني" : "Email"],
                    ["phone", ar ? "رقم الجوال" : "Phone"],
                    ["city", ar ? "المدينة" : "City"],
                    ["country", ar ? "الدولة" : "Country"],
                    ["nationality", ar ? "الجنسية" : "Nationality"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={d.personal[key] ?? ""}
                      onChange={(e) =>
                        setData((data) => {
                          data.personal[key] = e.target.value;
                        })
                      }
                    />
                  </div>
                ))}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="targetJob">{ar ? "الوظيفة المستهدفة" : "Target job"}</Label>
                  <Input
                    id="targetJob"
                    value={d.targetJob ?? ""}
                    placeholder={
                      ar
                        ? "مثال: مدير مشاريع أول — قطاع الطاقة"
                        : "e.g. Senior Project Manager — Energy"
                    }
                    onChange={(e) =>
                      setData((data) => {
                        data.targetJob = e.target.value;
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? "نستخدمها في مطابقة الكلمات المفتاحية وفي اقتراحات المساعد."
                      : "Used for keyword matching and assistant suggestions."}
                  </p>
                </div>
              </div>
            )}

            {step === "summary" && (
              <div className="space-y-2">
                <Label htmlFor="summary">{ar ? "الملخص المهني" : "Professional summary"}</Label>
                <Textarea
                  id="summary"
                  rows={8}
                  value={d.summary}
                  onChange={(e) =>
                    setData((data) => {
                      data.summary = e.target.value;
                    })
                  }
                  placeholder={
                    ar
                      ? "٣٠ إلى ٩٠ كلمة تصف خبرتك وأثرك."
                      : "30–90 words describing your experience and impact."
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {ar ? "عدد الكلمات" : "Words"}:{" "}
                  {d.summary.trim().split(/\s+/).filter(Boolean).length}
                </p>
                <FieldAi
                  resume={draft}
                  value={d.summary}
                  section="summary"
                  jobDescription={jobDescription}
                  onApply={(text) =>
                    setData((data) => {
                      data.summary = text;
                    })
                  }
                />
              </div>
            )}

            {step === "experience" && (
              <SortableList
                className="space-y-5"
                ids={d.experience.map((e) => e.id)}
                onReorder={(from, to) =>
                  setData((data) => {
                    reorderArray(data.experience, from, to);
                  })
                }
              >
                {d.experience.map((e, idx) => (
                  <SortableItem
                    key={e.id}
                    id={e.id}
                    ar={ar}
                    className="flex gap-2 rounded-xl border border-border p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex items-center gap-1">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {ar ? "خبرة" : "Experience"} {idx + 1}
                        </span>
                        <div className="ms-auto flex items-center gap-1">
                          <MoveButtons
                            ar={ar}
                            upDisabled={idx === 0}
                            downDisabled={idx === d.experience.length - 1}
                            onMove={(dir) =>
                              setData((data) => {
                                swap(data.experience, idx, idx + dir);
                              })
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setData((data) => {
                                data.experience.splice(idx + 1, 0, {
                                  ...structuredClone(data.experience[idx]!),
                                  id: uid(),
                                });
                              })
                            }
                          >
                            <Copy className="size-4" />
                            {ar ? "تكرار" : "Duplicate"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder={ar ? "المسمى الوظيفي" : "Role"}
                          value={e.role}
                          onChange={(ev) =>
                            setData((data) => {
                              data.experience[idx]!.role = ev.target.value;
                            })
                          }
                        />
                        <Input
                          placeholder={ar ? "جهة العمل" : "Company"}
                          value={e.company}
                          onChange={(ev) =>
                            setData((data) => {
                              data.experience[idx]!.company = ev.target.value;
                            })
                          }
                        />
                        <Input
                          placeholder={ar ? "المدينة" : "Location"}
                          value={e.location ?? ""}
                          onChange={(ev) =>
                            setData((data) => {
                              data.experience[idx]!.location = ev.target.value;
                            })
                          }
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder={ar ? "من" : "From"}
                            value={e.start ?? ""}
                            onChange={(ev) =>
                              setData((data) => {
                                data.experience[idx]!.start = ev.target.value;
                              })
                            }
                          />
                          <Input
                            placeholder={ar ? "إلى" : "To"}
                            value={e.end ?? ""}
                            disabled={e.current}
                            onChange={(ev) =>
                              setData((data) => {
                                data.experience[idx]!.end = ev.target.value;
                              })
                            }
                          />
                        </div>
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={Boolean(e.current)}
                          onCheckedChange={(v) =>
                            setData((data) => {
                              data.experience[idx]!.current = Boolean(v);
                            })
                          }
                        />
                        {ar ? "أعمل هنا حالياً" : "I currently work here"}
                      </label>
                      <div className="mt-3 space-y-3">
                        <Label>{ar ? "نقاط الإنجاز" : "Achievement bullets"}</Label>
                        <SortableList
                          className="space-y-3"
                          ids={e.bullets.map((_, bi) => `${e.id}-b${bi}`)}
                          onReorder={(from, to) =>
                            setData((data) => {
                              reorderArray(data.experience[idx]!.bullets, from, to);
                            })
                          }
                        >
                          {e.bullets.map((b, bi) => (
                            <SortableItem
                              key={`${e.id}-b${bi}`}
                              id={`${e.id}-b${bi}`}
                              ar={ar}
                              className="flex gap-2 rounded-lg bg-secondary/40 p-2.5"
                            >
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex gap-2">
                                  <Textarea
                                    rows={2}
                                    value={b}
                                    onChange={(ev) =>
                                      setData((data) => {
                                        data.experience[idx]!.bullets[bi] = ev.target.value;
                                      })
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0"
                                    aria-label={ar ? "حذف" : "Delete"}
                                    onClick={() =>
                                      setData((data) => {
                                        data.experience[idx]!.bullets.splice(bi, 1);
                                      })
                                    }
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                                <FieldAi
                                  resume={draft}
                                  value={b}
                                  section="experience"
                                  jobDescription={jobDescription}
                                  onApply={(text) =>
                                    setData((data) => {
                                      data.experience[idx]!.bullets[bi] = text;
                                    })
                                  }
                                />
                              </div>
                            </SortableItem>
                          ))}
                        </SortableList>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setData((data) => {
                              data.experience[idx]!.bullets.push("");
                            })
                          }
                        >
                          <Plus className="size-4" />
                          {ar ? "أضف نقطة" : "Add bullet"}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-3 text-destructive"
                        onClick={() =>
                          setData((data) => {
                            data.experience.splice(idx, 1);
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                        {ar ? "حذف الخبرة" : "Remove experience"}
                      </Button>
                    </div>
                  </SortableItem>
                ))}
              </SortableList>
            )}
            {step === "experience" && (
              <Button
                className="mt-5"
                onClick={() =>
                  setData((data) => {
                    data.experience.push({ id: uid(), role: "", company: "", bullets: [""] });
                  })
                }
              >
                <Plus className="size-4" />
                {ar ? "إضافة خبرة" : "Add experience"}
              </Button>
            )}

            {step === "education" && (
              <SortableList
                className="space-y-4"
                ids={d.education.map((e) => e.id)}
                onReorder={(from, to) =>
                  setData((data) => {
                    reorderArray(data.education, from, to);
                  })
                }
              >
                {d.education.map((e, idx) => (
                  <SortableItem
                    key={e.id}
                    id={e.id}
                    ar={ar}
                    className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"
                  >
                    <Input
                      placeholder={ar ? "المؤهل" : "Degree"}
                      value={e.degree}
                      onChange={(ev) =>
                        setData((data) => {
                          data.education[idx]!.degree = ev.target.value;
                        })
                      }
                    />
                    <Input
                      placeholder={ar ? "الجهة التعليمية" : "School"}
                      value={e.school}
                      onChange={(ev) =>
                        setData((data) => {
                          data.education[idx]!.school = ev.target.value;
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder={ar ? "من" : "From"}
                        value={e.start ?? ""}
                        onChange={(ev) =>
                          setData((data) => {
                            data.education[idx]!.start = ev.target.value;
                          })
                        }
                      />
                      <Input
                        placeholder={ar ? "إلى" : "To"}
                        value={e.end ?? ""}
                        onChange={(ev) =>
                          setData((data) => {
                            data.education[idx]!.end = ev.target.value;
                          })
                        }
                      />
                    </div>
                    <Input
                      placeholder={ar ? "ملاحظة (التقدير مثلاً)" : "Note (e.g. GPA)"}
                      value={e.note ?? ""}
                      onChange={(ev) =>
                        setData((data) => {
                          data.education[idx]!.note = ev.target.value;
                        })
                      }
                    />
                    <div className="flex items-center gap-1 sm:col-span-2">
                      <MoveButtons
                        ar={ar}
                        upDisabled={idx === 0}
                        downDisabled={idx === d.education.length - 1}
                        onMove={(dir) =>
                          setData((data) => {
                            swap(data.education, idx, idx + dir);
                          })
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ms-auto"
                        onClick={() =>
                          setData((data) => {
                            data.education.splice(idx + 1, 0, {
                              ...structuredClone(data.education[idx]!),
                              id: uid(),
                            });
                          })
                        }
                      >
                        <Copy className="size-4" />
                        {ar ? "تكرار" : "Duplicate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          setData((data) => {
                            data.education.splice(idx, 1);
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                        {ar ? "حذف" : "Remove"}
                      </Button>
                    </div>
                  </SortableItem>
                ))}
              </SortableList>
            )}
            {step === "education" && (
              <Button
                className="mt-4"
                onClick={() =>
                  setData((data) => {
                    data.education.push({ id: uid(), degree: "", school: "" });
                  })
                }
              >
                <Plus className="size-4" />
                {ar ? "إضافة مؤهل" : "Add education"}
              </Button>
            )}

            {step === "skills" && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">{ar ? "المهارات" : "Skills"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {d.skills.map((s, idx) => (
                      <span
                        key={s.id}
                        className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-sm"
                      >
                        {s.name}
                        <button
                          onClick={() =>
                            setData((data) => {
                              data.skills.splice(idx, 1);
                            })
                          }
                          aria-label={ar ? "حذف المهارة" : "Remove skill"}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      const el = ev.currentTarget.elements.namedItem("skill") as HTMLInputElement;
                      if (!el.value.trim()) return;
                      const name = el.value.trim();
                      el.value = "";
                      setData((data) => {
                        data.skills.push({ id: uid(), name });
                      });
                    }}
                  >
                    <Input
                      name="skill"
                      placeholder={ar ? "أضف مهارة واضغط Enter" : "Add a skill and press Enter"}
                    />
                    <Button type="submit" variant="outline">
                      {ar ? "إضافة" : "Add"}
                    </Button>
                  </form>
                </div>

                <div>
                  <Label className="mb-2 block">{ar ? "اللغات" : "Languages"}</Label>
                  {d.languages.map((l, idx) => (
                    <div key={l.id} className="mb-2 flex gap-2">
                      <Input
                        value={l.name}
                        onChange={(ev) =>
                          setData((data) => {
                            data.languages[idx]!.name = ev.target.value;
                          })
                        }
                        placeholder={ar ? "اللغة" : "Language"}
                      />
                      <Input
                        value={l.level}
                        onChange={(ev) =>
                          setData((data) => {
                            data.languages[idx]!.level = ev.target.value;
                          })
                        }
                        placeholder={ar ? "المستوى" : "Level"}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={ar ? "حذف" : "Remove"}
                        onClick={() =>
                          setData((data) => {
                            data.languages.splice(idx, 1);
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setData((data) => {
                        data.languages.push({ id: uid(), name: "", level: "" });
                      })
                    }
                  >
                    <Plus className="size-4" />
                    {ar ? "إضافة لغة" : "Add language"}
                  </Button>
                </div>
              </div>
            )}

            {step === "extras" && (
              <div className="space-y-6">
                {(
                  [
                    "certificates",
                    "projects",
                    "achievements",
                    "volunteering",
                    "references",
                  ] as const
                ).map((key) => (
                  <div key={key}>
                    <Label className="mb-2 block">{sectionLabels[key][lang]}</Label>
                    {d[key].map((item, idx) => (
                      <div key={item.id} className="mb-2 flex gap-2">
                        <Input
                          value={item.title}
                          placeholder={ar ? "العنوان" : "Title"}
                          onChange={(ev) =>
                            setData((data) => {
                              data[key][idx]!.title = ev.target.value;
                            })
                          }
                        />
                        <Input
                          value={item.detail ?? ""}
                          placeholder={ar ? "التفاصيل" : "Detail"}
                          onChange={(ev) =>
                            setData((data) => {
                              data[key][idx]!.detail = ev.target.value;
                            })
                          }
                        />
                        <MoveButtons
                          ar={ar}
                          upDisabled={idx === 0}
                          downDisabled={idx === d[key].length - 1}
                          onMove={(dir) =>
                            setData((data) => {
                              swap(data[key], idx, idx + dir);
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={ar ? "حذف" : "Remove"}
                          onClick={() =>
                            setData((data) => {
                              data[key].splice(idx, 1);
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setData((data) => {
                          data[key].push({ id: uid(), title: "", detail: "" });
                        })
                      }
                    >
                      <Plus className="size-4" />
                      {ar ? "إضافة" : "Add"}
                    </Button>
                  </div>
                ))}

                <div>
                  <Label className="mb-2 block">{ar ? "الروابط" : "Links"}</Label>
                  {d.links.map((l, idx) => (
                    <div key={l.id} className="mb-2 flex gap-2">
                      <Input
                        value={l.label}
                        placeholder={ar ? "الاسم" : "Label"}
                        onChange={(ev) =>
                          setData((data) => {
                            data.links[idx]!.label = ev.target.value;
                          })
                        }
                      />
                      <Input
                        value={l.url}
                        dir="ltr"
                        placeholder="https://"
                        onChange={(ev) =>
                          setData((data) => {
                            data.links[idx]!.url = ev.target.value;
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={ar ? "حذف" : "Remove"}
                        onClick={() =>
                          setData((data) => {
                            data.links.splice(idx, 1);
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setData((data) => {
                        data.links.push({ id: uid(), label: "", url: "" });
                      })
                    }
                  >
                    <Plus className="size-4" />
                    {ar ? "إضافة رابط" : "Add link"}
                  </Button>
                </div>

                <div>
                  <Label className="mb-2 block">{ar ? "أقسام مخصصة" : "Custom sections"}</Label>
                  {d.custom.map((c, ci) => (
                    <div key={c.id} className="mb-3 rounded-xl border border-border p-3">
                      <Input
                        value={c.title}
                        placeholder={ar ? "عنوان القسم" : "Section title"}
                        onChange={(ev) =>
                          setData((data) => {
                            data.custom[ci]!.title = ev.target.value;
                          })
                        }
                      />
                      {c.items.map((item, ii) => (
                        <div key={item.id} className="mt-2 flex gap-2">
                          <Input
                            value={item.title}
                            placeholder={ar ? "العنصر" : "Item"}
                            onChange={(ev) =>
                              setData((data) => {
                                data.custom[ci]!.items[ii]!.title = ev.target.value;
                              })
                            }
                          />
                          <Input
                            value={item.detail ?? ""}
                            placeholder={ar ? "التفاصيل" : "Detail"}
                            onChange={(ev) =>
                              setData((data) => {
                                data.custom[ci]!.items[ii]!.detail = ev.target.value;
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={ar ? "حذف" : "Remove"}
                            onClick={() =>
                              setData((data) => {
                                data.custom[ci]!.items.splice(ii, 1);
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setData((data) => {
                              data.custom[ci]!.items.push({ id: uid(), title: "", detail: "" });
                            })
                          }
                        >
                          <Plus className="size-4" />
                          {ar ? "عنصر" : "Item"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() =>
                            setData((data) => {
                              data.custom.splice(ci, 1);
                            })
                          }
                        >
                          {ar ? "حذف القسم" : "Remove section"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setData((data) => {
                        data.custom.push({
                          id: uid(),
                          title: ar ? "قسم مخصص" : "Custom section",
                          items: [],
                        });
                      })
                    }
                  >
                    <Plus className="size-4" />
                    {ar ? "إضافة قسم" : "Add section"}
                  </Button>
                </div>
              </div>
            )}

            {step === "design" && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">{ar ? "لون التمييز" : "Accent colour"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_PALETTE.map((c) => {
                      const active = (d.design?.accent ?? tpl?.design.accent) === c;
                      return (
                        <button
                          key={c}
                          aria-label={c}
                          aria-pressed={active}
                          onClick={() =>
                            setData((data) => {
                              data.design = { ...data.design, accent: c };
                            })
                          }
                          className={`size-8 rounded-full border-2 ${active ? "border-foreground" : "border-transparent"}`}
                          style={{ background: c }}
                        />
                      );
                    })}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setData((data) => {
                          const { accent: _drop, ...rest } = data.design ?? {};
                          data.design = rest;
                        })
                      }
                    >
                      {ar ? "لون القالب الأصلي" : "Template default"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{ar ? "كثافة النص والمسافات" : "Text & spacing density"}</Label>
                  <Select
                    value={d.design?.density ?? tpl?.design.spacing ?? "normal"}
                    onValueChange={(v) =>
                      setData((data) => {
                        data.design = {
                          ...data.design,
                          density: v as "compact" | "normal" | "airy",
                        };
                      })
                    }
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">{ar ? "مضغوط" : "Compact"}</SelectItem>
                      <SelectItem value="normal">{ar ? "معتاد" : "Normal"}</SelectItem>
                      <SelectItem value="airy">{ar ? "واسع" : "Airy"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tpl ? (
                  <ResumeEditorLayoutControls
                    ar={ar}
                    design={d.design}
                    template={tpl}
                    onChange={(designPatch) =>
                      setData((data) => {
                        data.design = { ...data.design, ...designPatch };
                      })
                    }
                  />
                ) : null}

                {tpl?.design.supportsPhoto ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={d.design?.showPhoto ?? true}
                        onCheckedChange={(v) =>
                          setData((data) => {
                            data.design = { ...data.design, showPhoto: Boolean(v) };
                          })
                        }
                      />
                      {ar ? "إظهار الصورة الشخصية" : "Show profile photo"}
                    </label>
                    <Input
                      dir="ltr"
                      placeholder="https://…"
                      value={d.personal.photoUrl ?? ""}
                      onChange={(e) =>
                        setData((data) => {
                          data.personal.photoUrl = e.target.value;
                        })
                      }
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? "القالب الحالي لا يعرض صورة شخصية — وهو الخيار الأنسب للتقديم عبر أنظمة ATS."
                      : "The current template has no photo slot, which suits ATS submissions."}
                  </p>
                )}

                {tpl && !tpl.atsFriendly && (
                  <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                    {ar
                      ? "هذا القالب إبداعي وقد تقرأه بعض أنظمة ATS بشكل ناقص. استخدم «كلاسيكي ATS» أو «مبسّط» للتقديم الإلكتروني."
                      : "This creative template may be parsed imperfectly by some ATS. Use Classic ATS or Minimal for online applications."}
                  </p>
                )}
              </div>
            )}

            {step === "order" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {ar
                    ? "رتّب أقسام السيرة الذاتية. الأقسام الفارغة لا تظهر في المعاينة."
                    : "Reorder sections. Empty sections are hidden in the preview."}
                </p>
                <ResumeSectionVisibilityControls
                  ar={ar}
                  sections={d.sectionOrder.map((key) => ({
                    key,
                    label: sectionLabels[key][lang],
                  }))}
                  hiddenSections={d.hiddenSections ?? []}
                  onChange={(hiddenSections) =>
                    setData((data) => {
                      data.hiddenSections = hiddenSections;
                    })
                  }
                />

                <SortableList
                  ids={d.sectionOrder}
                  onReorder={(from, to) =>
                    setData((data) => {
                      reorderArray(data.sectionOrder, from, to);
                    })
                  }
                  className="space-y-2"
                >
                  {d.sectionOrder.map((key, idx) => (
                    <SortableItem
                      key={key}
                      id={key}
                      ar={ar}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="text-sm font-medium">{sectionLabels[key][lang]}</span>
                      <div className="ms-auto flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={ar ? "أعلى" : "Move up"}
                          disabled={idx === 0}
                          onClick={() =>
                            setData((data) => {
                              const arr = data.sectionOrder;
                              [arr[idx - 1], arr[idx]] = [arr[idx]!, arr[idx - 1]!];
                            })
                          }
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={ar ? "أسفل" : "Move down"}
                          disabled={idx === d.sectionOrder.length - 1}
                          onClick={() =>
                            setData((data) => {
                              const arr = data.sectionOrder;
                              [arr[idx + 1], arr[idx]] = [arr[idx]!, arr[idx + 1]!];
                            })
                          }
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </div>
                    </SortableItem>
                  ))}
                </SortableList>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="hidden lg:sticky lg:top-36 lg:block lg:h-[calc(100vh-10rem)]">
          <Tabs value={sideTab} onValueChange={setSideTab} className="flex h-full flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="preview" className="flex-1">
                {ar ? "معاينة" : "Preview"}
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">
                {ar ? "مساعد سيرتي" : "Assistant"}
              </TabsTrigger>
              <TabsTrigger value="ats" className="flex-1">
                ATS
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="preview"
              className="mt-3 min-h-0 flex-1 overflow-auto rounded-2xl bg-secondary/40 p-3"
            >
              <ProfessionalResumePreview resume={draft} />
            </TabsContent>

            <TabsContent value="ai" className="mt-3 min-h-0 flex-1">
              <AiAssistant
                resume={draft}
                section={step}
                onApplySummary={(text) =>
                  applyAi("summary", (data) => {
                    data.summary = text;
                  })
                }
                onApplyBullets={(bullets) =>
                  applyAi("bullets", (data) => {
                    if (!data.experience.length) {
                      data.experience.push({ id: uid(), role: "", company: "", bullets });
                    } else {
                      data.experience[0]!.bullets = bullets;
                    }
                  })
                }
                onAddSkills={(skills) =>
                  setData((data) => {
                    skills.forEach((name) => {
                      if (
                        name &&
                        !data.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())
                      )
                        data.skills.push({ id: uid(), name });
                    });
                  })
                }
              />
            </TabsContent>

            <TabsContent
              value="ats"
              className="mt-3 min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold">{ar ? "جاهزية ATS" : "ATS readiness"}</p>
                <p className="text-xl font-extrabold text-emerald-accent">{score}/100</p>
              </div>
              <Progress value={score} className="mt-3" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {ar
                  ? "النتيجة إرشادية مبنية على قواعد كتابة معروفة، وليست تقييماً من نظام توظيف فعلي."
                  : "The score is advisory, based on known writing rules — not a verdict from a real ATS."}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(report?.categories ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setStep(c.step)}
                    className="rounded-xl border border-border p-3 text-start transition hover:border-accent"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-semibold">{c.label[lang]}</span>
                      <span className="text-[12px] font-bold text-muted-foreground">
                        {c.earned}/{c.max}
                      </span>
                    </div>
                    <Progress value={(c.earned / c.max) * 100} className="mt-2 h-1.5" />
                    {c.tips[0] && (
                      <p className="mt-2 text-[11px] text-muted-foreground">{c.tips[0][lang]}</p>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="jd">
                  {ar
                    ? "الصق وصف الوظيفة لاستخراج الكلمات المفتاحية"
                    : "Paste a job description for keywords"}
                </Label>
                <Textarea
                  id="jd"
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                {gaps && (
                  <div className="text-xs">
                    <p className="font-semibold">
                      {ar ? "التطابق" : "Match"}: {gaps.coverage}% ({gaps.matched.length}/
                      {gaps.total})
                    </p>
                    {gaps.missing.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {gaps.missing.slice(0, 18).map((m) => (
                          <Badge key={m} variant="outline" className="text-[10.5px]">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        setData((data) => {
                          gaps.missing.slice(0, 6).forEach((m) => {
                            if (!data.skills.some((s) => s.name.toLowerCase() === m))
                              data.skills.push({ id: uid(), name: m });
                          });
                        });
                        toast.success(
                          ar
                            ? "أضفنا كلمات مقترحة إلى المهارات"
                            : "Suggested keywords added to skills",
                        );
                      }}
                    >
                      {ar ? "أضف الكلمات الناقصة إلى المهارات" : "Add missing keywords to skills"}
                    </Button>
                  </div>
                )}
              </div>
              <BilingualSyncCard current={draft} all={resumes} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
