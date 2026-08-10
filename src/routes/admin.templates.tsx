import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResumePreview } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { defaultTemplates } from "@/lib/templates";
import { fetchTemplates, logAudit, saveTemplate } from "@/lib/db";
import { demoResumeData } from "@/lib/demo-data";
import type { Resume, TemplateDef } from "@/lib/types";

export const Route = createFileRoute("/admin/templates")({
  component: AdminTemplates,
});

function AdminTemplates() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: cloudTemplates } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: () => fetchTemplates(true),
  });
  const [templates, setTemplates] = useState<TemplateDef[]>(defaultTemplates);
  const [selectedId, setSelectedId] = useState(defaultTemplates[0]!.id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cloudTemplates && cloudTemplates.length > 0) {
      setTemplates(cloudTemplates);
      setSelectedId((id) => (cloudTemplates.some((t) => t.id === id) ? id : cloudTemplates[0]!.id));
    }
  }, [cloudTemplates]);

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0]!;

  const update = (patch: Partial<TemplateDef>) =>
    setTemplates((list) => list.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));
  const updateDesign = (patch: Partial<TemplateDef["design"]>) =>
    setTemplates((list) =>
      list.map((t) => (t.id === selectedId ? { ...t, design: { ...t.design, ...patch } } : t)),
    );

  const previewResume: Resume = {
    id: "preview",
    ownerId: "preview",
    title: selected.name[lang],
    templateId: selected.id,
    language: lang,
    data: demoResumeData(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "مصمم القوالب" : "Template designer"}</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "خصائص القالب" : "Template properties"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{ar ? "القالب" : "Template"}</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{ar ? "الاسم بالعربية" : "Arabic name"}</Label>
                <Input value={selected.name.ar} onChange={(e) => update({ name: { ...selected.name, ar: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "الاسم بالإنجليزية" : "English name"}</Label>
                <Input value={selected.name.en} onChange={(e) => update({ name: { ...selected.name, en: e.target.value } })} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "الفئة" : "Category"}</Label>
                <Select value={selected.category} onValueChange={(v) => update({ category: v as TemplateDef["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["ats", "modern", "executive", "minimal", "creative"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "ترتيب العرض" : "Display order"}</Label>
                <Input type="number" value={selected.order} onChange={(e) => update({ order: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{ar ? "رابط الصورة المصغّرة" : "Thumbnail URL"}</Label>
                <Input placeholder="https://…" dir="ltr" />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              {[
                { key: "supportsRTL" as const, label: ar ? "يدعم العربية (RTL)" : "Supports RTL" },
                { key: "atsFriendly" as const, label: ar ? "متوافق مع ATS" : "ATS friendly" },
                { key: "active" as const, label: ar ? "نشط" : "Active" },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between">
                  <Label htmlFor={row.key}>{row.label}</Label>
                  <Switch id={row.key} checked={selected[row.key]} onCheckedChange={(v) => update({ [row.key]: v } as Partial<TemplateDef>)} />
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{ar ? "اللون المميز" : "Accent colour"}</Label>
                <Input type="color" value={selected.design.accent} onChange={(e) => updateDesign({ accent: e.target.value })} className="h-10 p-1" />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "خط العناوين" : "Heading font"}</Label>
                <Select value={selected.design.headingFont} onValueChange={(v) => updateDesign({ headingFont: v as "sans" | "serif" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "التباعد" : "Spacing"}</Label>
                <Select value={selected.design.spacing} onValueChange={(v) => updateDesign({ spacing: v as "compact" | "normal" | "airy" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">{ar ? "مضغوط" : "Compact"}</SelectItem>
                    <SelectItem value="normal">{ar ? "عادي" : "Normal"}</SelectItem>
                    <SelectItem value="airy">{ar ? "واسع" : "Airy"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "نمط العناوين" : "Section style"}</Label>
                <Select value={selected.design.sectionStyle} onValueChange={(v) => updateDesign({ sectionStyle: v as "line" | "bar" | "plain" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">{ar ? "خط سفلي" : "Underline"}</SelectItem>
                    <SelectItem value="bar">{ar ? "شريط" : "Bar"}</SelectItem>
                    <SelectItem value="plain">{ar ? "بدون" : "Plain"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{ar ? "التخطيط" : "Layout"}</Label>
                <Select value={selected.design.layout} onValueChange={(v) => updateDesign({ layout: v as "single" | "sidebar" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">{ar ? "عمود واحد" : "Single column"}</SelectItem>
                    <SelectItem value="sidebar">{ar ? "مع عمود جانبي" : "With sidebar"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const res = await saveTemplate(selected);
                setSaving(false);
                if (res.error) {
                  toast.error(ar ? "تعذّر الحفظ" : "Could not save");
                  return;
                }
                await logAudit("template.update", selected.id);
                toast.success(ar ? "تم حفظ القالب" : "Template saved");
              }}
            >
              {ar ? "حفظ القالب" : "Save template"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "معاينة حية" : "Live preview"}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-auto bg-secondary/40 p-3">
            <ResumePreview resume={previewResume} template={selected} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
