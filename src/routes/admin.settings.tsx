import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { aiService } from "@/lib/ai-service";
import { fetchAppSettings, logAudit, saveAppSettings, type AppSettings } from "@/lib/db";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [form, setForm] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchAppSettings()
      .then((s) => {
        if (!s) setError(true);
        else setForm(s);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const patch = (p: Partial<AppSettings>) => setForm((f) => (f ? { ...f, ...p } : f));

  const save = async () => {
    if (!form) return;
    if (form.maxResumes < 1 || form.maxResumes > 20) {
      toast.error(ar ? "الحد يجب أن يكون بين 1 و20" : "The limit must be between 1 and 20");
      return;
    }
    setSaving(true);
    const res = await saveAppSettings(form);
    setSaving(false);
    if (res.error) {
      toast.error(ar ? "فشل الحفظ" : "Save failed");
      return;
    }
    await logAudit("settings.update", "app_settings", {
      maxResumes: form.maxResumes,
      maintenance: form.maintenance,
      defaultLanguage: form.defaultLanguage,
      aiMode: form.aiMode,
      aiProvider: form.aiProvider,
    });
    toast.success(ar ? "تم حفظ الإعدادات" : "Settings saved");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="py-8 text-sm text-destructive">
          {ar ? "تعذّر تحميل الإعدادات العامة." : "Could not load global settings."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "الإعدادات" : "Settings"}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "إعدادات عامة" : "General"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="site">{ar ? "اسم الموقع" : "Site name"}</Label>
              <Input id="site" value={form.siteName} onChange={(e) => patch({ siteName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo">{ar ? "رابط الشعار" : "Logo URL"}</Label>
              <Input
                id="logo"
                dir="ltr"
                placeholder="https://…"
                value={form.logoUrl ?? ""}
                onChange={(e) => patch({ logoUrl: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "اللغة الافتراضية" : "Default language"}</Label>
              <Select value={form.defaultLanguage} onValueChange={(v) => patch({ defaultLanguage: v as "ar" | "en" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية (RTL)</SelectItem>
                  <SelectItem value="en">English (LTR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <Label htmlFor="maint">{ar ? "وضع الصيانة" : "Maintenance mode"}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {ar ? "يُستخدم لإظهار تنبيه صيانة عام." : "Used to surface a global maintenance notice."}
              </p>
            </div>
            <Switch id="maint" checked={form.maintenance} onCheckedChange={(v) => patch({ maintenance: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "حدود الاستخدام" : "Usage limits"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="limit">{ar ? "الحد الأقصى للسير الذاتية لكل مستخدم" : "Max resumes per user"}</Label>
            <Input
              id="limit"
              type="number"
              min={1}
              max={20}
              value={form.maxResumes}
              onChange={(e) => patch({ maxResumes: Number(e.target.value) })}
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {ar
              ? "هذه القيمة مصدر الحقيقة: مشغّل قاعدة البيانات يقرأها عند كل إنشاء سيرة ويمنع التجاوز، وواجهة لوحة التحكم تعرض الحد نفسه. القيمة الافتراضية للخطة الحالية هي 3 (المسموح 1–20)."
              : "This value is the source of truth: the database trigger reads it on every resume insert and blocks overflow, and the dashboard shows the same limit. The default for the current plan is 3 (allowed range 1–20)."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "إعدادات الذكاء الاصطناعي" : "AI settings"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span>{ar ? "المزوّد العامل حالياً" : "Runtime provider"}:</span>
            <Badge variant="secondary">{aiService.providerId}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{ar ? "وضع الذكاء الاصطناعي" : "AI mode"}</Label>
              <Select value={form.aiMode} onValueChange={(v) => patch({ aiMode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">mock</SelectItem>
                  <SelectItem value="live">live</SelectItem>
                  <SelectItem value="disabled">disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prov">{ar ? "اسم المزوّد" : "Provider name"}</Label>
              <Input
                id="prov"
                dir="ltr"
                placeholder="provider-name"
                value={form.aiProvider ?? ""}
                onChange={(e) => patch({ aiProvider: e.target.value || null })}
              />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {ar
              ? "لا تُخزَّن أي مفاتيح أو أسرار هنا؛ الحقول إدارية فقط (اسم المزوّد والوضع). مفاتيح المزوّد الحقيقي تُضاف كأسرار على الخادم لاحقاً."
              : "No keys or secrets are stored here; these fields are administrative only (provider name and mode). Real provider keys are added as server-side secrets later."}
          </p>
        </CardContent>
      </Card>

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ" : "Save"}
      </Button>
    </div>
  );
}
