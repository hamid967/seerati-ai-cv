import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
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
      {
        name: "description",
        content: "إدارة بيانات حسابك في سيرتي ومتابعة استخدامك من أصل ٣ سير ذاتية.",
      },
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
  const { user, resumes, updateProfile, maxResumes } = useStore();
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
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {ar
                ? "حد السير الذاتية مفروض على مستوى قاعدة البيانات، وليس مجرد منع بصري في الواجهة. إذا وصل حسابك للحد فلن تُنشأ سيرة إضافية حتى لو أُرسل الطلب مباشرة إلى الخادم."
                : "The resume limit is enforced at the database layer, not only in the interface. Once your account reaches the limit, an additional resume is rejected even if the request is sent directly to the backend."}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" />
              {ar ? "بياناتي وخصوصيتي" : "My data & privacy"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {ar
                ? "راجع ما تخزنه سيرتي عن ملفك المهني، صدّر بياناتك بصيغة JSON، أو نفّذ الحذف الانتقائي من مركز الخصوصية."
                : "Review what Seerati stores about your career profile, export your data as JSON, or run selective deletion from the Privacy Center."}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/privacy-center">{ar ? "فتح مركز الخصوصية" : "Open Privacy Center"}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
