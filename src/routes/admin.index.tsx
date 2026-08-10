import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { fetchAdminUsers, fetchAuditLog, fetchResumeMeta, fetchTemplates } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const fetchAiCount = async () => {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);
  return count ?? 0;
};

function AdminOverview() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const users = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });
  const meta = useQuery({ queryKey: ["admin-resume-meta"], queryFn: fetchResumeMeta });
  const templates = useQuery({ queryKey: ["admin-templates"], queryFn: () => fetchTemplates(true) });
  const audit = useQuery({ queryKey: ["admin-audit"], queryFn: fetchAuditLog });
  const ai = useQuery({ queryKey: ["admin-ai-count"], queryFn: fetchAiCount });

  const kpis = [
    { label: ar ? "المستخدمون" : "Users", value: users.data?.length ?? 0 },
    {
      label: ar ? "السير الذاتية" : "Resumes",
      value: (users.data ?? []).reduce((s, u) => s + u.resumeCount, 0),
    },
    {
      label: ar ? "القوالب النشطة" : "Active templates",
      value: (templates.data ?? []).filter((t) => t.active).length,
    },
    { label: ar ? "طلبات الذكاء الاصطناعي (٧ أيام)" : "AI requests (7d)", value: ai.data ?? 0 },
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
          <CardTitle className="text-base">
            {ar ? "بيانات السير الذاتية (بدون محتوى شخصي)" : "Resume metadata (no personal content)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {meta.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar ? "المعرّف" : "ID"}</TableHead>
                  <TableHead>{ar ? "القالب" : "Template"}</TableHead>
                  <TableHead>{ar ? "اللغة" : "Language"}</TableHead>
                  <TableHead>{ar ? "آخر تعديل" : "Updated"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(meta.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      {ar ? "لا توجد سجلات" : "No records"}
                    </TableCell>
                  </TableRow>
                )}
                {(meta.data ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                    <TableCell>{r.templateId}</TableCell>
                    <TableCell>{r.language.toUpperCase()}</TableCell>
                    <TableCell>{new Date(r.updatedAt).toLocaleDateString("en-GB")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "سجل العمليات" : "Audit log"}</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (audit.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {ar ? "لا توجد عمليات مسجّلة بعد." : "No recorded actions yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {(audit.data ?? []).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-[10.5px]">{a.action}</Badge>
                  <span>→ {a.target ?? "—"}</span>
                  <span className="ms-auto text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
