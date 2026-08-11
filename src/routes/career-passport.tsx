import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ClipboardCopy, Download, ExternalLink, IdCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import { loadCareerTwin, type CareerTwin } from "@/lib/career";
import {
  buildCareerPassport,
  passportExport,
  passportGroupText,
} from "@/lib/career-passport";

export const Route = createFileRoute("/career-passport")({
  head: () => ({
    meta: [
      { title: "جوازي المهني | سيرتي — Saudi Career Passport" },
      {
        name: "description",
        content: "بياناتك المهنية المنظمة والجاهزة للنسخ وإعادة الاستخدام في رحلات التقديم الوظيفي.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CareerPassportPage,
});

function CareerPassportPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, ready } = useStore();
  useAuthGuard();
  const [twin, setTwin] = useState<CareerTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    void loadCareerTwin(user.id).then((data) => {
      if (!active) return;
      setTwin(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [ready, user]);

  const passport = useMemo(() => (twin ? buildCareerPassport(twin) : null), [twin]);

  const copyGroup = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600);
      toast.success(ar ? "تم النسخ" : "Copied");
    } catch {
      toast.error(ar ? "تعذر النسخ من المتصفح." : "Clipboard access was unavailable.");
    }
  };

  const downloadJson = () => {
    if (!twin) return;
    const blob = new Blob([JSON.stringify(passportExport(twin), null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "seerati-career-passport.json";
    a.click();
    URL.revokeObjectURL(href);
  };

  if (!ready || !user || loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!twin || !passport) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p className="font-bold">{ar ? "تعذر تحميل جوازك المهني." : "Could not load your career passport."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/career-twin">{ar ? "فتح ملفي المهني" : "Open Career Twin"}</Link>
        </Button>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IdCard className="size-6 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight">
              {ar ? "جوازي المهني السعودي" : "Saudi Career Passport"}
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {ar
              ? "نسخة منظمة من بياناتك المهنية تساعدك على تعبئة نماذج التوظيف بسرعة وباتساق. انسخ الحقول التي تحتاجها فقط."
              : "A structured version of your career data for faster, more consistent application forms. Copy only the fields you need."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/career-twin">
              <ExternalLink className="size-4" />
              {ar ? "تحديث البيانات" : "Update data"}
            </Link>
          </Button>
          <Button onClick={downloadJson}>
            <Download className="size-4" />
            {ar ? "تصدير JSON" : "Export JSON"}
          </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[180px_1fr] md:items-center">
          <div>
            <p className="text-xs text-muted-foreground">{ar ? "اكتمال الجواز" : "Passport completeness"}</p>
            <p className="mt-1 text-3xl font-extrabold">{passport.completeness}%</p>
            <Progress className="mt-2" value={passport.completeness} />
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs leading-6">
            <div className="flex gap-2">
              <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
              <p>
                {ar
                  ? "الجواز أداة داخل سيرتي لتنظيم بياناتك ونسخها. لا يتصل تلقائيًا بأي منصة حكومية أو جهة توظيف، ولا يرسل بياناتك إلى طرف خارجي."
                  : "The passport is a Seerati organization and copy tool. It does not automatically connect to government portals or employers, and it does not submit your data externally."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {passport.warnings.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {passport.warnings.map((warning) => (
            <div key={warning.en} className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs">
              {warning[lang]}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {passport.groups.map((group) => {
          const text = passportGroupText(group, lang);
          return (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-base">{group.label[lang]}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!group.fields.length}
                  onClick={() => void copyGroup(group.id, text)}
                >
                  {copied === group.id ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
                  {copied === group.id ? (ar ? "نُسخ" : "Copied") : ar ? "نسخ المجموعة" : "Copy group"}
                </Button>
              </CardHeader>
              <CardContent>
                {!group.fields.length ? (
                  <p className="text-xs text-muted-foreground">
                    {ar ? "لا توجد بيانات في هذه المجموعة بعد." : "No data in this group yet."}
                  </p>
                ) : (
                  <dl className="space-y-3">
                    {group.fields.map((item) => (
                      <div key={item.key} className="rounded-xl border bg-card p-3">
                        <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          {item.label[lang]}
                          {item.sensitive ? (
                            <Badge variant="outline" className="text-[10px]">
                              {ar ? "بيانات اتصال" : "Contact data"}
                            </Badge>
                          ) : null}
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
