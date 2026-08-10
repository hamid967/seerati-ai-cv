import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي | سيرتي — Seerati Account" },
      { name: "description", content: "إدارة بيانات حسابك في سيرتي ومتابعة استخدامك من أصل ٣ سير ذاتية." },
      { property: "og:title", content: "حسابي في سيرتي" },
      { property: "og:description", content: "بياناتك الشخصية وحد الاستخدام." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { user, ready, resumes, updateProfile, maxResumes } = useStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useAuthGuard();

  useEffect(() => {
    if (user) {
      setName(user.fullName);
      setRole(user.targetRole ?? "");
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{ar ? "حسابي" : "My account"}</h1>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">{ar ? "البيانات الشخصية" : "Profile"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullname">{ar ? "الاسم الكامل" : "Full name"}</Label>
              <Input id="fullname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target">{ar ? "المسمى المستهدف" : "Target role"}</Label>
              <Input id="target" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input value={user.email} disabled dir="ltr" />
            </div>
            <Button
              onClick={() => {
                updateProfile({ fullName: name, targetRole: role });
                toast.success(ar ? "تم تحديث بياناتك" : "Profile updated");
              }}
            >
              {ar ? "حفظ" : "Save"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">{ar ? "الاستخدام" : "Usage"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {ar ? "السير الذاتية" : "Resumes"}: {resumes.length}/{maxResumes}
            </p>
            <Progress value={(resumes.length / maxResumes) * 100} className="mt-3" />
            <p className="mt-3 text-xs text-muted-foreground">
              {ar
                ? "الحد مطبّق في الواجهة حالياً، ومحضّر للتطبيق على الخادم عبر قاعدة بيانات مع سياسات RLS."
                : "The limit is enforced in the UI today and prepared for server-side enforcement with RLS."}
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
