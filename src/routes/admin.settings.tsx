import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { aiService } from "@/lib/ai-service";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [limit, setLimit] = useState(3);
  const [aiPerDay, setAiPerDay] = useState(50);
  const [faq, setFaq] = useState(
    ar
      ? "هل القوالب متوافقة مع ATS؟ | خمسة قوالب بعمود واحد مناسبة للتقديم الإلكتروني."
      : "Are templates ATS friendly? | Five single-column templates suit online applications.",
  );
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "الإعدادات" : "Settings"}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "إعدادات الذكاء الاصطناعي" : "AI settings"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span>{ar ? "المزوّد الحالي" : "Current provider"}:</span>
            <Badge variant="secondary">{aiService.providerId}</Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {ar
              ? "المزوّد يعمل خلف طبقة خدمة واحدة. عند الربط بمزود حقيقي تُضاف المفاتيح كأسرار على الخادم فقط ولا تظهر في الواجهة."
              : "The provider sits behind a single service layer. When a real provider is connected, keys are stored as server-side secrets only."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{ar ? "اسم الموديل (مكان مخصص)" : "Model name (placeholder)"}</Label>
              <Input placeholder="provider/model" dir="ltr" disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aiday">{ar ? "حد طلبات الذكاء الاصطناعي يومياً" : "Daily AI request limit"}</Label>
              <Input id="aiday" type="number" value={aiPerDay} onChange={(e) => setAiPerDay(Number(e.target.value))} />
            </div>
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
            <Input id="limit" type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
          </div>
          <p className="text-xs text-muted-foreground">
            {ar
              ? "الحد يُفرض في الواجهة الآن، ومحضّر للفرض على الخادم عبر مشغّل قاعدة بيانات (raise exception عند التجاوز)."
              : "Enforced in the UI today; prepared for server-side enforcement via a database trigger."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "المحتوى والأسئلة الشائعة" : "Content & FAQ"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="faq">{ar ? "سؤال | جواب في كل سطر" : "One “question | answer” per line"}</Label>
          <Textarea id="faq" rows={6} value={faq} onChange={(e) => setFaq(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "إعدادات عامة" : "General"}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="maint">{ar ? "وضع الصيانة" : "Maintenance mode"}</Label>
          <Switch id="maint" checked={maintenance} onCheckedChange={setMaintenance} />
        </CardContent>
      </Card>

      <Button onClick={() => toast.success(ar ? "تم حفظ الإعدادات في هذه الجلسة" : "Settings saved for this session")}>
        {ar ? "حفظ" : "Save"}
      </Button>
    </div>
  );
}
