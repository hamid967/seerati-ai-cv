import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { fetchAdminUsers, logAudit, setUserRole, type AdminUser } from "@/lib/db";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

const dt = (v: string | null) => (v ? new Date(v).toLocaleDateString("en-GB") : "—");

function AdminUsers() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { maxResumes } = useStore();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [detail, setDetail] = useState<AdminUser | null>(null);

  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "user" }) => {
      const res = await setUserRole(id, role);
      if (res.error) throw new Error(res.error);
      await logAudit("role.set.ui", id, { role });
    },
    onSuccess: async () => {
      toast.success(ar ? "تم تحديث الدور" : "Role updated");
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      await qc.invalidateQueries({ queryKey: ["admin-audit"] });
      setDetail(null);
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("cannot_demote_self")
          ? ar
            ? "لا يمكنك إزالة دورك الإداري عن نفسك."
            : "You cannot remove your own admin role."
          : ar
            ? "تعذّر تحديث الدور"
            : "Could not update the role",
      ),
  });

  const term = q.trim().toLowerCase();
  const list = (data ?? [])
    .filter((u) => u.email.toLowerCase().includes(term) || u.fullName.toLowerCase().includes(term))
    .filter((u) => roleFilter === "all" || u.role === roleFilter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "المستخدمون" : "Users"}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "بحث وتصفية" : "Search & filter"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? "بريد أو اسم" : "Email or name"} />
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "كل الأدوار" : "All roles"}</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="user">user</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 overflow-x-auto">
            {isError ? (
              <p className="py-6 text-center text-sm text-destructive">
                {ar ? "تعذّر تحميل المستخدمين." : "Could not load users."}
              </p>
            ) : isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ar ? "المستخدم" : "User"}</TableHead>
                    <TableHead>{ar ? "الدور" : "Role"}</TableHead>
                    <TableHead>{ar ? "السير الذاتية" : "Resumes"}</TableHead>
                    <TableHead>{ar ? "آخر نشاط" : "Last activity"}</TableHead>
                    <TableHead>{ar ? "تاريخ التسجيل" : "Joined"}</TableHead>
                    <TableHead>{ar ? "التهيئة" : "Onboarding"}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        {ar ? "لا توجد نتائج" : "No results"}
                      </TableCell>
                    </TableRow>
                  )}
                  {list.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium">{u.fullName || "—"}</p>
                        <p dir="ltr" className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.resumeCount}/{maxResumes}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{dt(u.lastActivity)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{dt(u.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={u.onboarded ? "outline" : "secondary"}>
                          {u.onboarded ? (ar ? "مكتملة" : "Done") : ar ? "غير مكتملة" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setDetail(u)}>
                          {ar ? "تفاصيل" : "Details"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {ar
              ? "تغيير الأدوار يتم عبر دالة قاعدة بيانات آمنة تتحقق من صلاحية المسؤول، ولا يمكن تعديل جدول الأدوار مباشرة من المتصفح."
              : "Role changes run through a guarded database function; the roles table cannot be written directly from the browser."}
          </p>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.fullName || detail?.email}</DialogTitle>
            <DialogDescription>
              {ar
                ? "تظهر بيانات وصفية فقط لكل سيرة ذاتية، دون محتواها الشخصي."
                : "Only resume metadata is shown here — never the personal content."}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-5 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">{ar ? "البريد" : "Email"}: </span><span dir="ltr">{detail.email}</span></p>
                <p><span className="text-muted-foreground">{ar ? "الوظيفة المستهدفة" : "Target role"}: </span>{detail.targetRole || "—"}</p>
                <p><span className="text-muted-foreground">{ar ? "سنوات الخبرة" : "Experience"}: </span>{detail.yearsExperience || "—"}</p>
                <p><span className="text-muted-foreground">{ar ? "القطاع" : "Industry"}: </span>{detail.industry || "—"}</p>
              </div>

              <div className="space-y-2">
                <Label>{ar ? "الدور" : "Role"}</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={detail.role}
                    onValueChange={(v) => roleMutation.mutate({ id: detail.id, role: v as "admin" | "user" })}
                  >
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {roleMutation.isPending && (
                    <span className="text-xs text-muted-foreground">{ar ? "جارٍ التحديث…" : "Updating…"}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{ar ? "السير الذاتية (بيانات وصفية)" : "Resumes (metadata)"}</Label>
                {detail.resumeMeta.length === 0 ? (
                  <p className="text-muted-foreground">{ar ? "لا توجد سير ذاتية." : "No resumes."}</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.resumeMeta.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                        <span className="font-mono">{r.id.slice(0, 8)}</span>
                        <Badge variant="secondary">{r.status}</Badge>
                        <span>{ar ? "الاكتمال" : "Completion"} {r.completion}%</span>
                        <span>ATS {r.ats}</span>
                        <span className="ms-auto text-muted-foreground">{dt(r.updatedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
