import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Palette, Settings, ShieldAlert, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | سيرتي" },
      { name: "description", content: "لوحة إدارة سيرتي: المؤشرات، المستخدمون، القوالب، الإعدادات وسجل العمليات." },
      { property: "og:title", content: "لوحة الإدارة | سيرتي" },
      { property: "og:description", content: "إدارة المنصة والقوالب والمستخدمين." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, user } = useStore();
  const navigate = useNavigate();

  useAuthGuard();

  if (!ready) return null;

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">{ar ? "هذه الصفحة للمسؤولين فقط" : "Admins only"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ar ? "حسابك لا يمتلك صلاحية admin." : "Your account does not have the admin role."}
          </p>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">{ar ? "العودة إلى لوحتي" : "Back to dashboard"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: ar ? "المؤشرات" : "Overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/users", label: ar ? "المستخدمون" : "Users", icon: Users, exact: false },
    { to: "/admin/templates", label: ar ? "القوالب" : "Templates", icon: Palette, exact: false },
    { to: "/admin/settings", label: ar ? "الإعدادات" : "Settings", icon: Settings, exact: false },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {ar ? "الإدارة" : "Administration"}
          </p>
          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
                activeProps={{ className: "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold bg-secondary text-foreground" }}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
