import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GuestNotice } from "@/components/guest-notice";
import { useI18n } from "@/lib/i18n";

import { useAuthGuard, useStore } from "@/lib/store";
import { defaultTemplates } from "@/lib/templates";

export const Route = createFileRoute("/resumes/new")({
  validateSearch: z.object({ template: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "سيرة ذاتية جديدة | سيرتي" },
      { name: "description", content: "اختر القالب واللغة وابدأ سيرتك الذاتية الجديدة في سيرتي." },
      { property: "og:title", content: "إنشاء سيرة ذاتية جديدة" },
      { property: "og:description", content: "اختر قالباً ولغة وابدأ فوراً." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewResume,
});

function NewResume() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { atLimit, isGuest, createResume } = useStore();

  const [title, setTitle] = useState(ar ? "سيرتي الذاتية" : "My resume");
  const [templateId, setTemplateId] = useState(search.template ?? "classic-ats");
  const [resumeLang, setResumeLang] = useState<"ar" | "en">(lang);
  const [seed, setSeed] = useState(false);

  useAuthGuard({ allowGuest: true });

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ar ? "سيرة ذاتية جديدة" : "New resume"}
        </h1>

        <GuestNotice className="mt-5" />

        {atLimit ? (
          <p className="mt-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm">
            {isGuest
              ? ar
                ? "كزائر يمكنك العمل على سيرة واحدة في هذه الجلسة. يمكنك حذفها وبدء سيرة جديدة أو اختيار الحفظ في حساب لاحقاً."
                : "As a guest, you can work on one resume in this session. Delete it to start another or choose account saving later."
              : ar
                ? "وصلت الحد الأقصى (٣ سير ذاتية). احذف واحدة للمتابعة."
                : "You reached the 3-resume limit. Delete one to continue."}
          </p>
        ) : (
          <>
            <div className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title">{ar ? "اسم السيرة الذاتية" : "Resume name"}</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <Label className="mb-2 block">{ar ? "لغة السيرة" : "Resume language"}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={resumeLang === "ar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setResumeLang("ar")}
                    >
                      العربية
                    </Button>
                    <Button
                      variant={resumeLang === "en" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setResumeLang("en")}
                    >
                      English
                    </Button>
                  </div>
                </div>
                <div className="ms-auto flex items-center gap-2">
                  <Switch id="seed" checked={seed} onCheckedChange={setSeed} />
                  <Label htmlFor="seed" className="text-sm">
                    {ar ? "ابدأ ببيانات تجريبية" : "Start with demo data"}
                  </Label>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">{ar ? "القالب" : "Template"}</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {defaultTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setTemplateId(tpl.id)}
                      className={`rounded-xl border p-4 text-start transition-colors ${
                        templateId === tpl.id
                          ? "border-primary bg-secondary"
                          : "border-border hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{tpl.name[lang]}</p>
                        {tpl.atsFriendly && (
                          <Badge variant="outline" className="text-[10px]">
                            ATS
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {tpl.description[lang]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-8"
              onClick={async () => {
                const created = await createResume({
                  title: title.trim() || "Resume",
                  templateId,
                  language: resumeLang,
                  seed,
                });
                if (!created) {
                  toast.error(ar ? "تعذّر الإنشاء" : "Could not create");
                  return;
                }
                toast.success(
                  isGuest
                    ? ar
                      ? "تم إنشاء السيرة في هذه الجلسة. الحفظ في حساب اختياري لاحقاً."
                      : "Your resume is ready in this session. Saving to an account is optional later."
                    : ar
                      ? "تم إنشاء السيرة وفتح المحرر."
                      : "Your resume is ready in the editor.",
                );
                navigate({ to: "/resumes/$id/edit", params: { id: created.id } });
              }}
            >
              {isGuest
                ? ar
                  ? "إنشاء وفتح المحرر"
                  : "Create and open editor"
                : ar
                  ? "إنشاء والانتقال للمحرر"
                  : "Create and open editor"}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
