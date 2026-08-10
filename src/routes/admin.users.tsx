import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { demoUsers } from "@/lib/demo-data";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [q, setQ] = useState("");
  const list = demoUsers.filter(
    (u) => u.email.includes(q.toLowerCase()) || u.fullName.includes(q),
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
                {list.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell dir="ltr" className="text-xs">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>{u.resumes}/3</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.joined}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {ar
              ? "بيانات تجريبية للعرض. عند تفعيل قاعدة البيانات ستُقرأ عبر سياسات RLS تسمح للمسؤول فقط."
              : "Demo data. Once the database is enabled this table is read through admin-only RLS policies."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
