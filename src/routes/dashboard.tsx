import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, FileText, MoreVertical, Pencil, Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getTemplate } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n, useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { RESUME_LIMIT } from "@/lib/types";
import { atsScore, completeness, runAtsChecks } from "@/lib/ats";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحتي | سيرتي — Seerati Dashboard" },
      { name: "description", content: "أدر سيرك الذاتية: إنشاء، استنساخ، إعادة تسمية، حذف، ومتابعة نسبة الاكتمال." },
      { property: "og:title", content: "لوحة التحكم | سيرتي" },
      { property: "og:description", content: "كل سيرك الذاتية في مكان واحد." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { user, ready, resumes, atLimit, duplicateResume, deleteResume, updateResume, createResume } = useStore();
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
          <Skeleton className="h-10 w-52" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t("dash_title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {ar ? `مرحباً ${user.fullName}` : `Welcome, ${user.fullName}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="min-w-32">
              <p className="text-xs text-muted-foreground">
                {t("usage")} {resumes.length}/{RESUME_LIMIT}
              </p>
              <Progress value={(resumes.length / RESUME_LIMIT) * 100} className="mt-2" />
            </div>
            <Button asChild disabled={atLimit}>
              <Link to="/resumes/new">
                <Plus className="size-4" />
                {t("dash_new")}
              </Link>
            </Button>
          </div>
        </div>

        {atLimit && (
          <p className="mt-4 rounded-lg border border-border bg-secondary px-4 py-3 text-sm">{t("limit_reached")}</p>
        )}

        {resumes.length === 0 ? (
          <Card className="mt-10 border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-secondary">
                <FileText className="size-6 text-primary" />
              </span>
              <div>
                <p className="text-lg font-bold">{t("empty_resumes")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("empty_resumes_d")}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link to="/resumes/new">{t("dash_new")}</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const created = createResume({
                      title: ar ? "سيرة تجريبية" : "Demo resume",
                      templateId: "saudi-professional",
                      language: "ar",
                      seed: true,
                    });
                    if (created) toast.success(ar ? "أضفنا سيرة تجريبية" : "Demo resume added");
                  }}
                >
                  {ar ? "جرّب ببيانات تجريبية" : "Try with demo data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => {
              const tpl = getTemplate(r.templateId);
              const score = atsScore(runAtsChecks(r.data, tpl.atsFriendly));
              return (
                <Card key={r.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold leading-tight">{r.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("template")}: {tpl.name[lang]} · {r.language.toUpperCase()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={ar ? "خيارات" : "Options"}>
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate({ to: "/resumes/$id/edit", params: { id: r.id } })}>
                            <Pencil className="size-4" /> {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate({ to: "/resumes/$id/preview", params: { id: r.id } })}>
                            <Eye className="size-4" /> {t("preview")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRenaming({ id: r.id, title: r.title })}>
                            {t("rename")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const copy = duplicateResume(r.id);
                              toast[copy ? "success" : "error"](copy ? t("duplicate") : t("limit_reached"));
                            }}
                          >
                            <Copy className="size-4" /> {t("duplicate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              deleteResume(r.id);
                              toast.success(ar ? "تم الحذف" : "Deleted");
                            }}
                          >
                            <Trash2 className="size-4" /> {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("completeness")}</span>
                        <span className="font-semibold">{completeness(r)}%</span>
                      </div>
                      <Progress value={completeness(r)} />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="secondary">ATS {score}/100</Badge>
                      <span className="text-xs text-muted-foreground">
                        {t("updated")}: {new Date(r.updatedAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}
                      </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Button size="sm" className="flex-1" asChild>
                        <Link to="/resumes/$id/edit" params={{ id: r.id }}>{t("edit")}</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link to="/resumes/$id/preview" params={{ id: r.id }}>{t("preview")}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={Boolean(renaming)} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rename")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renaming?.title ?? ""}
            onChange={(e) => setRenaming((r) => (r ? { ...r, title: e.target.value } : r))}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                if (renaming) {
                  updateResume(renaming.id, { title: renaming.title.trim() || renaming.title });
                  toast.success(ar ? "تم التحديث" : "Updated");
                }
                setRenaming(null);
              }}
            >
              {ar ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
