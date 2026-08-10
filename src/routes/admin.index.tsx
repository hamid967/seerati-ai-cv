import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { auditLog, demoUsers } from "@/lib/demo-data";
import { defaultTemplates } from "@/lib/templates";
import { completeness } from "@/lib/ats";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { resumes } = useStore();

  const kpis = [
    { label: ar ? "المستخدمون" : "Users", value: demoUsers.length },
    { label: ar ? "السير الذاتية" : "Resumes", value: demoUsers.reduce((s, u) => s + u.resumes, 0) + resumes.length },
    { label: ar ? "القوالب النشطة" : "Active templates", value: defaultTemplates.filter((t) => t.active).length },
    { label: ar ? "طلبات الذكاء الاصطناعي (٧ أيام)" : "AI requests (7d)", value: 128 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "المؤشرات" : "Overview"}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="mt-2 text-3xl font-extrabold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "بيانات السير الذاتية (بدون محتوى شخصي)" : "Resume metadata (no personal content)"}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ar ? "المعرّف" : "ID"}</TableHead>
                <TableHead>{ar ? "القالب" : "Template"}</TableHead>
                <TableHead>{ar ? "اللغة" : "Language"}</TableHead>
                <TableHead>{ar ? "الاكتمال" : "Completeness"}</TableHead>
                <TableHead>{ar ? "آخر تعديل" : "Updated"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    {ar ? "لا توجد سجلات في هذا المتصفح" : "No records in this browser"}
                  </TableCell>
                </TableRow>
              )}
              {resumes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.templateId}</TableCell>
                  <TableCell>{r.language.toUpperCase()}</TableCell>
                  <TableCell>{completeness(r)}%</TableCell>
                  <TableCell>{new Date(r.updatedAt).toLocaleDateString("en-GB")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "سجل العمليات" : "Audit log"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {auditLog.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-[10.5px]">{a.action}</Badge>
                <span className="text-muted-foreground">{a.actor}</span>
                <span>→ {a.target}</span>
                <span className="ms-auto text-xs text-muted-foreground">{a.at}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
