import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import { ResumePreview } from "@/components/resume-preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { baseDesign, defaultTemplates } from "@/lib/templates";
import {
  createTemplate,
  deleteOrDeactivateTemplate,
  fetchTemplates,
  logAudit,
  saveTemplate,
  templateUsage,
} from "@/lib/db";
import { demoResumeData } from "@/lib/demo-data";
import type { Resume, TemplateDef } from "@/lib/types";

export const Route = createFileRoute("/admin/templates")({
  component: AdminTemplates,
});

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

function AdminTemplates() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const qc = useQueryClient();
  const { data: cloudTemplates } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: () => fetchTemplates(true),
  });
  const { data: usage } = useQuery({ queryKey: ["template-usage"], queryFn: templateUsage });

  const [templates, setTemplates] = useState<TemplateDef[]>(defaultTemplates);
  const [selectedId, setSelectedId] = useState(defaultTemplates[0]!.id);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (cloudTemplates && cloudTemplates.length > 0) {
      setTemplates(cloudTemplates);
      setSelectedId((id) => (cloudTemplates.some((t) => t.id === id) ? id : cloudTemplates[0]!.id));
    }
  }, [cloudTemplates]);

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0]!;
  const usedCount = usage?.[selected.id] ?? 0;

  const update = (patch: Partial<TemplateDef>) =>
    setTemplates((list) => list.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));
  const updateDesign = (patch: Partial<TemplateDef["design"]>) =>
    setTemplates((list) =>
      list.map((t) => (t.id === selectedId ? { ...t, design: { ...t.design, ...patch } } : t)),
    );

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-templates"] });
    await qc.invalidateQueries({ queryKey: ["templates"] });
    await qc.invalidateQueries({ queryKey: ["template-usage"] });
  };

  const previewResume: Resume = {
    id: "preview",
    ownerId: "preview",
    title: selected.name[lang],
    templateId: selected.id,
    language: lang,
    data: demoResumeData(),
    status: "complete",
    completionScore: 100,
    atsScore: 86,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveTemplate(selected);
    setSaving(false);
    if (res.error) {
      toast.error(ar ? "تعذّر الحفظ" : "Could not save");
      return;
    }
    await logAudit("template.update", selected.id, { active: selected.active, order: selected.order });
    await refresh();
    toast.success(ar ? "تم حفظ القالب" : "Template saved");
  };

  const handleCreate = async () => {
    const base = { ...defaultTemplates[0]!, design: { ...baseDesign } };
    const id = `custom-${Date.now().toString(36)}`;
    const tpl: TemplateDef = {
      ...base,
      id,
      name: { ar: "قالب جديد", en: "New template" },
      description: { ar: "وصف القالب الجديد", en: "New template description" },
      active: false,
      order: templates.length + 1,
    };
    const res = await createTemplate(tpl);
    if (res.error) {
      toast.error(ar ? "تعذّر إنشاء القالب" : "Could not create the template");
      return;
    }
    await logAudit("template.create", id);
    await refresh();
    setSelectedId(id);
    toast.success(ar ? "تم إنشاء قالب جديد (غير نشط)" : "New template created (inactive)");
  };

  const handleDuplicate = async () => {
    const id = `${slug(selected.id)}-copy-${Date.now().toString(36).slice(-4)}`;
    const tpl: TemplateDef = {
      ...selected,
      id,
      name: { ar: `${selected.name.ar} (نسخة)`, en: `${selected.name.en} (copy)` },
      active: false,
      order: templates.length + 1,
    };
    const res = await createTemplate(tpl);
    if (res.error) {
      toast.error(ar ? "تعذّر النسخ" : "Could not duplicate");
      return;
    }
    await logAudit("template.duplicate", id, { from: selected.id });
    await refresh();
    setSelectedId(id);
    toast.success(ar ? "تم نسخ القالب" : "Template duplicated");
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    const res = await deleteOrDeactivateTemplate(selected.id);
    if (res.error) {
      toast.error(ar ? "تعذّر التنفيذ" : "Operation failed");
      return;
    }
    await logAudit(res.deleted ? "template.delete" : "template.deactivate", selected.id, {
      usedBy: usedCount,
    });
    await refresh();
    toast.success(
      res.deleted
        ? ar
          ? "تم حذف القالب"
          : "Template deleted"
        : ar
          ? "القالب مستخدم في سير ذاتية قائمة، فتم تعطيله بدلاً من حذفه."
          : "Template is in use by existing resumes, so it was deactivated instead of deleted.",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "القوالب" : "Templates"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleDuplicate()}>
            <Copy className="size-4" />
            {ar ? "نسخ" : "Duplicate"}
          </Button>
          <Button size="sm" onClick={() => void handleCreate()}>
            <Plus className="size-4" />
            {ar ? "قالب جديد" : "New template"}
          </Button>
        </div>
      </div>

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
                    <SelectItem key={t.id} value={t.id}>
                      {t.name[lang]} {t.active ? "" : ar ? "— معطّل" : "— inactive"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ar ? "مستخدم في" : "Used by"} {usedCount} {ar ? "سيرة ذاتية" : "resume(s)"} · <span className="font-mono">{selected.id}</span>
              </p>
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
                <Label>{ar ? "الوصف بالعربية" : "Arabic description"}</Label>
                <Textarea rows={2} value={selected.description.ar} onChange={(e) => update({ description: { ...selected.description, ar: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "الوصف بالإنجليزية" : "English description"}</Label>
                <Textarea rows={2} dir="ltr" value={selected.description.en} onChange={(e) => update({ description: { ...selected.description, en: e.target.value } })} />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="supportsPhoto">{ar ? "يدعم الصورة الشخصية" : "Supports photo"}</Label>
                <Switch
                  id="supportsPhoto"
                  checked={selected.design.supportsPhoto}
                  onCheckedChange={(v) => updateDesign({ supportsPhoto: v })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{ar ? "اللون المميز" : "Accent colour"}</Label>
                <Input type="color" value={selected.design.accent} onChange={(e) => updateDesign({ accent: e.target.value })} className="h-10 p-1" />
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "خط العناوين" : "Heading font"}</Label>
                <Select value={selected.design.headingFont} onValueChange={(v) => updateDesign({ headingFont: v as TemplateDef["design"]["headingFont"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "التباعد" : "Spacing"}</Label>
                <Select value={selected.design.spacing} onValueChange={(v) => updateDesign({ spacing: v as TemplateDef["design"]["spacing"] })}>
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
                <Select value={selected.design.sectionStyle} onValueChange={(v) => updateDesign({ sectionStyle: v as TemplateDef["design"]["sectionStyle"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">{ar ? "خط سفلي" : "Underline"}</SelectItem>
                    <SelectItem value="bar">{ar ? "شريط" : "Bar"}</SelectItem>
                    <SelectItem value="plain">{ar ? "بدون" : "Plain"}</SelectItem>
                    <SelectItem value="caps">{ar ? "أحرف كبيرة" : "Caps"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "التخطيط" : "Layout"}</Label>
                <Select value={selected.design.layout} onValueChange={(v) => updateDesign({ layout: v as TemplateDef["design"]["layout"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">{ar ? "عمود واحد" : "Single column"}</SelectItem>
                    <SelectItem value="sidebar">{ar ? "عمود جانبي" : "Sidebar"}</SelectItem>
                    <SelectItem value="sidebar-left">{ar ? "عمود جانبي يسار" : "Sidebar (left)"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "ترويسة" : "Header"}</Label>
                <Select value={selected.design.header} onValueChange={(v) => updateDesign({ header: v as TemplateDef["design"]["header"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stack">{ar ? "عمودية" : "Stack"}</SelectItem>
                    <SelectItem value="banner">{ar ? "شريط ملوّن" : "Banner"}</SelectItem>
                    <SelectItem value="centered">{ar ? "وسط" : "Centered"}</SelectItem>
                    <SelectItem value="split">{ar ? "مقسّمة" : "Split"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ar ? "شكل النقاط" : "Bullet"}</Label>
                <Select value={selected.design.bullet} onValueChange={(v) => updateDesign({ bullet: v as TemplateDef["design"]["bullet"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disc">●</SelectItem>
                    <SelectItem value="dash">—</SelectItem>
                    <SelectItem value="square">■</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => void handleSave()}>
                {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ القالب" : "Save template"}
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" />
                {ar ? "حذف" : "Delete"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {ar
                ? "تُسجَّل كل عمليات القوالب في سجل العمليات، ولا يُحذف قالب مستخدم في سير قائمة بل يُعطَّل."
                : "Every template operation is written to the audit log; templates in use are deactivated instead of deleted."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {ar ? "معاينة حية" : "Live preview"}
              {!selected.atsFriendly && (
                <Badge variant="destructive" className="text-[10.5px]">
                  {ar ? "غير مُحسَّن لـ ATS" : "Not ATS optimised"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-auto bg-secondary/40 p-3">
            <ResumePreview resume={previewResume} template={selected} />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ar ? "حذف القالب؟" : "Delete this template?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {usedCount > 0
                ? ar
                  ? `هذا القالب مستخدم في ${usedCount} سيرة ذاتية، لذلك سيتم تعطيله فقط للحفاظ على تلك السير.`
                  : `This template is used by ${usedCount} resume(s), so it will only be deactivated to keep those resumes intact.`
                : ar
                  ? "لا توجد سير ذاتية تستخدم هذا القالب، وسيُحذف نهائياً."
                  : "No resumes use this template; it will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>{ar ? "تأكيد" : "Confirm"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
