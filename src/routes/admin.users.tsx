import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { fetchAdminUsers } from "@/lib/db";
import { RESUME_LIMIT } from "@/lib/types";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });

  const term = q.trim().toLowerCase();
  const list = (data ?? []).filter(
    (u) => u.email.toLowerCase().includes(term) || u.fullName.toLowerCase().includes(term),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "المستخدمون" : "Users"}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "بحث" : "Search"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? "بريد أو اسم" : "Email or name"} />
          <div className="mt-5 overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ar ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{ar ? "البريد" : "Email"}</TableHead>
                    <TableHead>{ar ? "الدور" : "Role"}</TableHead>
                    <TableHead>{ar ? "السير الذاتية" : "Resumes"}</TableHead>
                    <TableHead>{ar ? "تاريخ الانضمام" : "Joined"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        {ar ? "لا توجد نتائج" : "No results"}
                      </TableCell>
                    </TableRow>
                  )}
                  {list.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName || "—"}</TableCell>
                      <TableCell dir="ltr" className="text-xs">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.resumeCount}/{RESUME_LIMIT}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("en-GB")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {ar
              ? "تُقرأ هذه البيانات عبر سياسات وصول تسمح للمسؤول فقط."
              : "This table is read through admin-only access policies."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
