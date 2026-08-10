import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { fetchAuditLog } from "@/lib/db";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAudit,
});

function AdminAudit() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");

  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-audit", 200], queryFn: () => fetchAuditLog(200) });

  const actions = useMemo(
    () => [...new Set((data ?? []).map((a) => a.action))].sort(),
    [data],
  );

  const term = q.trim().toLowerCase();
  const list = (data ?? [])
    .filter((a) => action === "all" || a.action === action)
    .filter((a) => !from || new Date(a.createdAt) >= new Date(from))
    .filter(
      (a) =>
        !term ||
        a.action.toLowerCase().includes(term) ||
        (a.target ?? "").toLowerCase().includes(term) ||
        (a.actorEmail ?? "").toLowerCase().includes(term),
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{ar ? "سجل العمليات" : "Audit log"}</h1>
      <p className="text-sm text-muted-foreground">
        {ar
          ? "سجل غير قابل للتعديل أو الحذف، ويقرأه المسؤولون فقط."
          : "Append-only log, readable by admins only."}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "تصفية" : "Filters"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? "بحث في العملية أو الهدف" : "Search action or target"} />
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "كل العمليات" : "All actions"}</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="mt-5 overflow-x-auto">
            {isError ? (
              <p className="py-6 text-center text-sm text-destructive">
                {ar ? "تعذّر تحميل السجل." : "Could not load the log."}
              </p>
            ) : isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ar ? "الوقت" : "Timestamp"}</TableHead>
                    <TableHead>{ar ? "المنفّذ" : "Actor"}</TableHead>
                    <TableHead>{ar ? "العملية" : "Action"}</TableHead>
                    <TableHead>{ar ? "الهدف" : "Entity"}</TableHead>
                    <TableHead>{ar ? "تفاصيل" : "Metadata"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        {ar ? "لا توجد سجلات مطابقة" : "No matching entries"}
                      </TableCell>
                    </TableRow>
                  )}
                  {list.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell dir="ltr" className="text-xs">{a.actorEmail ?? a.actorId?.slice(0, 8) ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10.5px]">{a.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.target ? a.target.slice(0, 12) : "—"}</TableCell>
                      <TableCell className="max-w-56 truncate text-xs text-muted-foreground" dir="ltr">
                        {a.metadata ? JSON.stringify(a.metadata) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
