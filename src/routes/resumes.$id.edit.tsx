import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { ResumePreview, getTemplate } from "@/components/resume-preview";
import { AiAssistant } from "@/components/ai-assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { defaultTemplates } from "@/lib/templates";
import { atsScore, keywordGaps, runAtsChecks } from "@/lib/ats";
import { uid, type Resume, type ResumeData, type SectionKey } from "@/lib/types";

export const Route = createFileRoute("/resumes/$id/edit")({
  head: () => ({
    meta: [
      { title: "محرر السيرة الذاتية | سيرتي" },
      { name: "description", content: "محرر متعدد الخطوات مع حفظ تلقائي ومعاينة مباشرة ومساعد كتابة بالذكاء الاصطناعي." },
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

function EditResume() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { ready, user, getResume, updateResume } = useStore();

  const stored = getResume(id);
  const [draft, setDraft] = useState<Resume | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("saved");
  const [step, setStep] = useState<(typeof stepDefs)[number]["key"]>("personal");
  const [jobDescription, setJobDescription] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (stored && !draft) setDraft(stored);
  }, [stored, draft]);

  const scheduleSave = useCallback(
    (next: Resume) => {
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        updateResume(next.id, { title: next.title, templateId: next.templateId, language: next.language, data: next.data });
        setStatus("saved");
      }, 700);
    },
    [updateResume],
  );

  const patch = useCallback(
    (fn: (r: Resume) => Resume) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = fn(structuredClone(prev));
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const setData = useCallback(
    (fn: (d: ResumeData) => void) => patch((r) => { fn(r.data); return r; }),
    [patch],
  );

  const tpl = useMemo(() => (draft ? getTemplate(draft.templateId) : null), [draft]);
  const checks = useMemo(() => (draft ? runAtsChecks(draft.data, tpl?.atsFriendly ?? true) : []), [draft, tpl]);
  const score = checks.length ? atsScore(checks) : 0;
  const gaps = useMemo(
    () => (draft && jobDescription.trim() ? keywordGaps(jobDescription, draft.data) : null),
    [jobDescription, draft],
  );

  if (!ready) return null;
  if (!draft) {
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

  const d = draft.data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Input
            value={draft.title}
            onChange={(e) => patch((r) => ({ ...r, title: e.target.value }))}
            className="h-9 w-52 font-semibold"
            aria-label={ar ? "اسم السيرة" : "Resume name"}
          />
          <Select value={draft.templateId} onValueChange={(v) => patch((r) => ({ ...r, templateId: v }))}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {defaultTemplates.map((x) => (
                <SelectItem key={x.id} value={x.id}>{x.name[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={draft.language} onValueChange={(v) => patch((r) => ({ ...r, language: v as "ar" | "en" }))}>
            <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            {status === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-emerald-accent" />}
            {status === "saving" ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "تم الحفظ" : "Saved"}
          </span>

          <div className="ms-auto flex items-center gap-2">
            <Badge variant="secondary">ATS {score}/100</Badge>
            <Button size="sm" variant="outline" asChild>
              <Link to="/resumes/$id/preview" params={{ id: draft.id }}>
                <Eye className="size-4" />
                {ar ? "معاينة وتنزيل" : "Preview & download"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Form column */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {stepDefs.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={step === s.key ? "default" : "outline"}
                onClick={() => setStep(s.key)}
              >
                {s[lang]}
              </Button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            {step === "personal" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ["fullName", ar ? "الاسم الكامل" : "Full name"],
                  ["jobTitle", ar ? "المسمى الوظيفي" : "Job title"],
                  ["email", ar ? "البريد الإلكتروني" : "Email"],
                  ["phone", ar ? "رقم الجوال" : "Phone"],
                  ["city", ar ? "المدينة" : "City"],
                  ["country", ar ? "الدولة" : "Country"],
                  ["nationality", ar ? "الجنسية" : "Nationality"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={d.personal[key] ?? ""}
                      onChange={(e) => setData((data) => { data.personal[key] = e.target.value; })}
                    />
                  </div>
                ))}
              </div>
            )}

            {step === "summary" && (
              <div className="space-y-2">
                <Label htmlFor="summary">{ar ? "الملخص المهني" : "Professional summary"}</Label>
                <Textarea
                  id="summary"
                  rows={8}
                  value={d.summary}
                  onChange={(e) => setData((data) => { data.summary = e.target.value; })}
                  placeholder={ar ? "٣٠ إلى ٩٠ كلمة تصف خبرتك وأثرك." : "30–90 words describing your experience and impact."}
                />
                <p className="text-xs text-muted-foreground">
                  {ar ? "عدد الكلمات" : "Words"}: {d.summary.trim().split(/\s+/).filter(Boolean).length}
                </p>
              </div>
            )}

            {step === "experience" && (
              <div className="space-y-5">
                {d.experience.map((e, idx) => (
                  <div key={e.id} className="rounded-xl border border-border p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder={ar ? "المسمى الوظيفي" : "Role"} value={e.role} onChange={(ev) => setData((data) => { data.experience[idx]!.role = ev.target.value; })} />
                      <Input placeholder={ar ? "جهة العمل" : "Company"} value={e.company} onChange={(ev) => setData((data) => { data.experience[idx]!.company = ev.target.value; })} />
                      <Input placeholder={ar ? "المدينة" : "Location"} value={e.location ?? ""} onChange={(ev) => setData((data) => { data.experience[idx]!.location = ev.target.value; })} />
                      <div className="flex gap-2">
                        <Input placeholder={ar ? "من" : "From"} value={e.start ?? ""} onChange={(ev) => setData((data) => { data.experience[idx]!.start = ev.target.value; })} />
                        <Input placeholder={ar ? "إلى" : "To"} value={e.end ?? ""} disabled={e.current} onChange={(ev) => setData((data) => { data.experience[idx]!.end = ev.target.value; })} />
                      </div>
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <Checkbox checked={Boolean(e.current)} onCheckedChange={(v) => setData((data) => { data.experience[idx]!.current = Boolean(v); })} />
                      {ar ? "أعمل هنا حالياً" : "I currently work here"}
                    </label>
                    <div className="mt-3 space-y-2">
                      <Label>{ar ? "نقاط الإنجاز" : "Achievement bullets"}</Label>
                      {e.bullets.map((b, bi) => (
                        <div key={bi} className="flex gap-2">
                          <Textarea
                            rows={2}
                            value={b}
                            onChange={(ev) => setData((data) => { data.experience[idx]!.bullets[bi] = ev.target.value; })}
                          />
                          <Button variant="ghost" size="icon" aria-label={ar ? "حذف" : "Delete"} onClick={() => setData((data) => { data.experience[idx]!.bullets.splice(bi, 1); })}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => setData((data) => { data.experience[idx]!.bullets.push(""); })}>
                        <Plus className="size-4" />
                        {ar ? "أضف نقطة" : "Add bullet"}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3 text-destructive"
                      onClick={() => setData((data) => { data.experience.splice(idx, 1); })}
                    >
                      <Trash2 className="size-4" />
                      {ar ? "حذف الخبرة" : "Remove experience"}
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    setData((data) => {
                      data.experience.push({ id: uid(), role: "", company: "", bullets: [""] });
                    })
                  }
                >
                  <Plus className="size-4" />
                  {ar ? "إضافة خبرة" : "Add experience"}
                </Button>
              </div>
            )}

            {step === "education" && (
              <div className="space-y-4">
                {d.education.map((e, idx) => (
                  <div key={e.id} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                    <Input placeholder={ar ? "المؤهل" : "Degree"} value={e.degree} onChange={(ev) => setData((data) => { data.education[idx]!.degree = ev.target.value; })} />
                    <Input placeholder={ar ? "الجهة التعليمية" : "School"} value={e.school} onChange={(ev) => setData((data) => { data.education[idx]!.school = ev.target.value; })} />
                    <div className="flex gap-2">
                      <Input placeholder={ar ? "من" : "From"} value={e.start ?? ""} onChange={(ev) => setData((data) => { data.education[idx]!.start = ev.target.value; })} />
                      <Input placeholder={ar ? "إلى" : "To"} value={e.end ?? ""} onChange={(ev) => setData((data) => { data.education[idx]!.end = ev.target.value; })} />
                    </div>
                    <Input placeholder={ar ? "ملاحظة (التقدير مثلاً)" : "Note (e.g. GPA)"} value={e.note ?? ""} onChange={(ev) => setData((data) => { data.education[idx]!.note = ev.target.value; })} />
                    <Button size="sm" variant="ghost" className="text-destructive sm:col-span-2" onClick={() => setData((data) => { data.education.splice(idx, 1); })}>
                      <Trash2 className="size-4" />
                      {ar ? "حذف" : "Remove"}
                    </Button>
                  </div>
                ))}
                <Button onClick={() => setData((data) => { data.education.push({ id: uid(), degree: "", school: "" }); })}>
                  <Plus className="size-4" />
                  {ar ? "إضافة مؤهل" : "Add education"}
                </Button>
              </div>
            )}

            {step === "skills" && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">{ar ? "المهارات" : "Skills"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {d.skills.map((s, idx) => (
                      <span key={s.id} className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-sm">
                        {s.name}
                        <button
                          onClick={() => setData((data) => { data.skills.splice(idx, 1); })}
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
                      const el = (ev.currentTarget.elements.namedItem("skill") as HTMLInputElement);
                      if (!el.value.trim()) return;
                      const name = el.value.trim();
                      el.value = "";
                      setData((data) => { data.skills.push({ id: uid(), name }); });
                    }}
                  >
                    <Input name="skill" placeholder={ar ? "أضف مهارة واضغط Enter" : "Add a skill and press Enter"} />
                    <Button type="submit" variant="outline">{ar ? "إضافة" : "Add"}</Button>
                  </form>
                </div>

                <div>
                  <Label className="mb-2 block">{ar ? "اللغات" : "Languages"}</Label>
                  {d.languages.map((l, idx) => (
                    <div key={l.id} className="mb-2 flex gap-2">
                      <Input value={l.name} onChange={(ev) => setData((data) => { data.languages[idx]!.name = ev.target.value; })} placeholder={ar ? "اللغة" : "Language"} />
                      <Input value={l.level} onChange={(ev) => setData((data) => { data.languages[idx]!.level = ev.target.value; })} placeholder={ar ? "المستوى" : "Level"} />
                      <Button variant="ghost" size="icon" aria-label={ar ? "حذف" : "Remove"} onClick={() => setData((data) => { data.languages.splice(idx, 1); })}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setData((data) => { data.languages.push({ id: uid(), name: "", level: "" }); })}>
                    <Plus className="size-4" />
                    {ar ? "إضافة لغة" : "Add language"}
                  </Button>
                </div>
              </div>
            )}

            {step === "extras" && (
              <div className="space-y-6">
                {(["certificates", "projects", "achievements", "volunteering", "references"] as const).map((key) => (
                  <div key={key}>
                    <Label className="mb-2 block">{sectionLabels[key][lang]}</Label>
                    {d[key].map((item, idx) => (
                      <div key={item.id} className="mb-2 flex gap-2">
                        <Input value={item.title} placeholder={ar ? "العنوان" : "Title"} onChange={(ev) => setData((data) => { data[key][idx]!.title = ev.target.value; })} />
                        <Input value={item.detail ?? ""} placeholder={ar ? "التفاصيل" : "Detail"} onChange={(ev) => setData((data) => { data[key][idx]!.detail = ev.target.value; })} />
                        <Button variant="ghost" size="icon" aria-label={ar ? "حذف" : "Remove"} onClick={() => setData((data) => { data[key].splice(idx, 1); })}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => setData((data) => { data[key].push({ id: uid(), title: "", detail: "" }); })}>
                      <Plus className="size-4" />
                      {ar ? "إضافة" : "Add"}
                    </Button>
                  </div>
                ))}

                <div>
                  <Label className="mb-2 block">{ar ? "الروابط" : "Links"}</Label>
                  {d.links.map((l, idx) => (
                    <div key={l.id} className="mb-2 flex gap-2">
                      <Input value={l.label} placeholder={ar ? "الاسم" : "Label"} onChange={(ev) => setData((data) => { data.links[idx]!.label = ev.target.value; })} />
                      <Input value={l.url} dir="ltr" placeholder="https://" onChange={(ev) => setData((data) => { data.links[idx]!.url = ev.target.value; })} />
                      <Button variant="ghost" size="icon" aria-label={ar ? "حذف" : "Remove"} onClick={() => setData((data) => { data.links.splice(idx, 1); })}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setData((data) => { data.links.push({ id: uid(), label: "", url: "" }); })}>
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
                        onChange={(ev) => setData((data) => { data.custom[ci]!.title = ev.target.value; })}
                      />
                      {c.items.map((item, ii) => (
                        <div key={item.id} className="mt-2 flex gap-2">
                          <Input value={item.title} placeholder={ar ? "العنصر" : "Item"} onChange={(ev) => setData((data) => { data.custom[ci]!.items[ii]!.title = ev.target.value; })} />
                          <Input value={item.detail ?? ""} placeholder={ar ? "التفاصيل" : "Detail"} onChange={(ev) => setData((data) => { data.custom[ci]!.items[ii]!.detail = ev.target.value; })} />
                          <Button variant="ghost" size="icon" aria-label={ar ? "حذف" : "Remove"} onClick={() => setData((data) => { data.custom[ci]!.items.splice(ii, 1); })}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setData((data) => { data.custom[ci]!.items.push({ id: uid(), title: "", detail: "" }); })}>
                          <Plus className="size-4" />
                          {ar ? "عنصر" : "Item"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setData((data) => { data.custom.splice(ci, 1); })}>
                          {ar ? "حذف القسم" : "Remove section"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setData((data) => { data.custom.push({ id: uid(), title: ar ? "قسم مخصص" : "Custom section", items: [] }); })}>
                    <Plus className="size-4" />
                    {ar ? "إضافة قسم" : "Add section"}
                  </Button>
                </div>
              </div>
            )}

            {step === "order" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {ar ? "رتّب أقسام السيرة الذاتية. الأقسام الفارغة لا تظهر في المعاينة." : "Reorder sections. Empty sections are hidden in the preview."}
                </p>
                {d.sectionOrder.map((key, idx) => (
                  <div key={key} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <span className="text-sm font-medium">{sectionLabels[key][lang]}</span>
                    <div className="ms-auto flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={ar ? "أعلى" : "Move up"}
                        disabled={idx === 0}
                        onClick={() => setData((data) => {
                          const arr = data.sectionOrder;
                          [arr[idx - 1], arr[idx]] = [arr[idx]!, arr[idx - 1]!];
                        })}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={ar ? "أسفل" : "Move down"}
                        disabled={idx === d.sectionOrder.length - 1}
                        onClick={() => setData((data) => {
                          const arr = data.sectionOrder;
                          [arr[idx + 1], arr[idx]] = [arr[idx]!, arr[idx + 1]!];
                        })}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:sticky lg:top-36 lg:h-[calc(100vh-10rem)]">
          <Tabs defaultValue="preview" className="h-full">
            <TabsList className="w-full">
              <TabsTrigger value="preview" className="flex-1">{ar ? "معاينة" : "Preview"}</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">{ar ? "مساعد سيرتي" : "Assistant"}</TabsTrigger>
              <TabsTrigger value="ats" className="flex-1">ATS</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3 h-[calc(100%-3rem)] overflow-auto rounded-2xl bg-secondary/40 p-3">
              <ResumePreview resume={draft} />
            </TabsContent>

            <TabsContent value="ai" className="mt-3 h-[calc(100%-3rem)]">
              <AiAssistant
                resume={draft}
                onApplySummary={(text) => setData((data) => { data.summary = text; })}
              />
            </TabsContent>

            <TabsContent value="ats" className="mt-3 h-[calc(100%-3rem)] overflow-auto rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold">{ar ? "جاهزية ATS" : "ATS readiness"}</p>
                <p className="text-xl font-extrabold text-emerald-accent">{score}/100</p>
              </div>
              <Progress value={score} className="mt-3" />
              <ul className="mt-4 space-y-2.5">
                {checks.map((c) => (
                  <li key={c.id} className="text-sm">
                    <span className={c.passed ? "text-emerald-accent" : "text-destructive"}>{c.passed ? "✓" : "✕"}</span>{" "}
                    <span className="font-medium">{c.label[lang]}</span>
                    {!c.passed && <p className="ms-4 text-xs text-muted-foreground">{c.hint[lang]}</p>}
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2">
                <Label htmlFor="jd">{ar ? "الصق وصف الوظيفة لاستخراج الكلمات المفتاحية" : "Paste a job description for keywords"}</Label>
                <Textarea id="jd" rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
                {gaps && (
                  <div className="text-xs">
                    <p className="font-semibold">
                      {ar ? "مطابقة" : "Matched"}: {gaps.matched}/{gaps.total}
                    </p>
                    {gaps.missing.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {gaps.missing.map((m) => (
                          <Badge key={m} variant="outline" className="text-[10.5px]">{m}</Badge>
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
                            if (!data.skills.some((s) => s.name.toLowerCase() === m)) data.skills.push({ id: uid(), name: m });
                          });
                        });
                        toast.success(ar ? "أضفنا كلمات مقترحة إلى المهارات" : "Suggested keywords added to skills");
                      }}
                    >
                      {ar ? "أضف الكلمات الناقصة إلى المهارات" : "Add missing keywords to skills"}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
