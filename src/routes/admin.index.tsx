import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { fetchAdminStats, fetchAuditLog, fetchTemplates } from "@/lib/db";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats });
  const templates = useQuery({ queryKey: ["admin-templates"], queryFn: () => fetchTemplates(true) });
  const audit = useQuery({ queryKey: ["admin-audit", 12], queryFn: () => fetchAuditLog(12) });

  const s = stats.data;
  const nameOf = (id: string) =>
    (templates.data ?? []).find((t) => t.id === id)?.name[lang] ?? id;

  const kpis = [
    { label: ar ? "إجمالي المستخدمين" : "Total users", value: s?.totalUsers },
    { label: ar ? "مستخدمون جدد (٣٠ يوماً)" : "New users (30d)", value: s?.newUsers30d },
    { label: ar ? "إجمالي السير الذاتية" : "Total resumes", value: s?.totalResumes },
    { label: ar ? "متوسط السير لكل مستخدم" : "Avg resumes / user", value: s?.avgResumesPerUser },
    { label: ar ? "عمليات الذكاء الاصطناعي" : "AI actions (all time)", value: s?.aiTotal },
    { label: ar ? "عمليات الذكاء الاصطناعي (٣٠ يوماً)" : "AI actions (30d)", value: s?.ai30d },
  ];

  if (stats.isError) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-center gap-3 py-8 text-sm">
          <AlertTriangle className="size-5 text-destructive" />
          {ar ? "تعذّر تحميل مؤشرات المنصة. حدّث الصفحة." : "Could not load platform metrics. Please refresh."}
        </CardContent>
      </Card>
    );
  }

  const totalStatus = (s?.drafts ?? 0) + (s?.complete ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "المؤشرات" : "Overview"}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              {stats.isLoading ? (
                <Skeleton className="mt-3 h-8 w-16" />
              ) : (
                <p className="mt-2 text-3xl font-extrabold">{k.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "المسودات مقابل المكتملة" : "Draft vs complete"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : totalStatus === 0 ? (
              <p className="text-sm text-muted-foreground">{ar ? "لا توجد سير ذاتية بعد." : "No resumes yet."}</p>
            ) : (
              <>
                <div>
                  <p className="mb-1 flex justify-between text-sm">
                    <span>{ar ? "مسودة" : "Draft"}</span>
                    <span className="font-semibold">{s?.drafts}</span>
                  </p>
                  <Progress value={((s?.drafts ?? 0) / totalStatus) * 100} />
                </div>
                <div>
                  <p className="mb-1 flex justify-between text-sm">
                    <span>{ar ? "مكتملة" : "Complete"}</span>
                    <span className="font-semibold">{s?.complete}</span>
                  </p>
                  <Progress value={((s?.complete ?? 0) / totalStatus) * 100} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "ترتيب استخدام القوالب" : "Template usage ranking"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (s?.templateRanking ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{ar ? "لا يوجد استخدام بعد." : "No usage yet."}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(s?.templateRanking ?? []).map((row, i) => (
                  <li key={row.id} className="flex items-center gap-2">
                    <span className="w-5 text-xs text-muted-foreground">#{i + 1}</span>
                    <span className="font-medium">{nameOf(row.id)}</span>
                    <span className="ms-auto font-mono text-xs">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "أحدث التسجيلات" : "Recent signups"}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {stats.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar ? "الاسم" : "Name"}</TableHead>
                  <TableHead>{ar ? "البريد" : "Email"}</TableHead>
                  <TableHead>{ar ? "تاريخ التسجيل" : "Joined"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(s?.recentSignups ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      {ar ? "لا توجد سجلات" : "No records"}
                    </TableCell>
                  </TableRow>
                )}
                {(s?.recentSignups ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName || "—"}</TableCell>
                    <TableCell dir="ltr" className="text-xs">{u.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "أحدث العمليات الإدارية" : "Recent admin events"}</CardTitle>
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
                  <span className="text-muted-foreground">{a.actorEmail ?? "—"}</span>
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
