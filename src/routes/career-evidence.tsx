import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Paperclip, Plus, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard } from "@/lib/store";
import { AchievementInterview } from "@/components/achievement-interview";
import {
  createEvidence,
  createFact,
  deleteEvidence,
  deleteFact,
  describeVault,
  EVIDENCE_TYPES,
  EVIDENCE_TYPE_LABEL,
  FACT_TYPES,
  FACT_TYPE_LABEL,
  listEvidence,
  listFacts,
  updateEvidence,
  updateFact,
  VERIFICATION_LABEL,
  type CareerEvidence,
  type CareerFact,
  type EvidenceType,
  type FactType,
} from "@/lib/career-facts";
import { loadCareerTwin } from "@/lib/career";

export const Route = createFileRoute("/career-evidence")({
  head: () => ({
    meta: [
      { title: "خزانة الأدلة | سيرتي — Career Evidence Vault" },
      {
        name: "description",
        content:
          "خزانة الأدلة المهنية في سيرتي: سجّل إنجازاتك ومهاراتك وأرقامك ومشاريعك وشهاداتك وقصص STAR، واربط كل حقيقة بدليل موثّق قبل استخدامها في سيرتك الذاتية.",
      },
      { property: "og:title", content: "خزانة الأدلة المهنية | سيرتي" },
      {
        property: "og:description",
        content: "كل رقم في سيرتك يحتاج دليلاً. أنشئ حقائقك الموثّقة واربط الأدلة بها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvidenceVaultPage,
});

type FilterId = "all" | FactType;

function EvidenceVaultPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { ready, user } = useAuthGuard();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [facts, setFacts] = useState<CareerFact[]>([]);
  const [evidence, setEvidence] = useState<CareerEvidence[]>([]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [busy, setBusy] = useState(false);

  const [factDraft, setFactDraft] = useState<{ type: FactType; title: string; value: string }>({
    type: "achievement",
    title: "",
    value: "",
  });
  const [evDraft, setEvDraft] = useState<{
    factId: string;
    evidenceType: EvidenceType;
    title: string;
    metricValue: string;
    metricUnit: string;
    sourceUrl: string;
    description: string;
  }>({
    factId: "",
    evidenceType: "metric",
    title: "",
    metricValue: "",
    metricUnit: "",
    sourceUrl: "",
    description: "",
  });

  const refresh = useCallback(async (userId: string) => {
    setLoading(true);
    setError("");
    try {
      const [f, e] = await Promise.all([listFacts(userId), listEvidence(userId)]);
      setFacts(f);
      setEvidence(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void refresh(user.id);
  }, [user, refresh]);

  const graph = useMemo(() => ({ facts, evidence }), [facts, evidence]);
  const vault = describeVault(graph, ar ? "ar" : "en");

  const shown = useMemo(
    () => (filter === "all" ? facts : facts.filter((f) => f.type === filter)),
    [facts, filter],
  );

  const addFact = async () => {
    if (!user || !factDraft.title.trim()) return;
    setBusy(true);
    try {
      const created = await createFact(user.id, {
        type: factDraft.type,
        title: factDraft.title,
        value: factDraft.value,
        sourceType: "manual",
        sourceLabel: ar ? "إدخال يدوي" : "Manual entry",
      });
      if (created) setFacts((l) => [created, ...l]);
      setFactDraft({ type: factDraft.type, title: "", value: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setBusy(false);
    }
  };

  const addEvidence = async () => {
    if (!user || !evDraft.title.trim()) return;
    setBusy(true);
    try {
      const created = await createEvidence(user.id, {
        factId: evDraft.factId || null,
        evidenceType: evDraft.evidenceType,
        title: evDraft.title,
        description: evDraft.description,
        metricValue: evDraft.metricValue,
        metricUnit: evDraft.metricUnit,
        sourceUrl: evDraft.sourceUrl,
        verified: false,
      });
      if (created) setEvidence((l) => [created, ...l]);
      setEvDraft({ ...evDraft, title: "", metricValue: "", metricUnit: "", sourceUrl: "", description: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleFactVerified = async (f: CareerFact) => {
    const next = f.verificationStatus === "verified" ? "needs_review" : "verified";
    setFacts((l) => l.map((x) => (x.id === f.id ? { ...x, verificationStatus: next } : x)));
    try {
      await updateFact(f.id, { verificationStatus: next });
    } catch {
      setError(ar ? "تعذّر تحديث الحالة." : "Could not update the status.");
    }
  };

  const toggleEvidenceVerified = async (e: CareerEvidence) => {
    setEvidence((l) => l.map((x) => (x.id === e.id ? { ...x, verified: !x.verified } : x)));
    try {
      await updateEvidence(e.id, { verified: !e.verified });
    } catch {
      setError(ar ? "تعذّر تحديث الدليل." : "Could not update the evidence.");
    }
  };

  const removeFact = async (id: string) => {
    setFacts((l) => l.filter((f) => f.id !== id));
    setEvidence((l) => l.map((e) => (e.factId === id ? { ...e, factId: null } : e)));
    try {
      await deleteFact(id);
    } catch {
      setError(ar ? "تعذّر الحذف." : "Delete failed.");
    }
  };

  const removeEvidence = async (id: string) => {
    setEvidence((l) => l.filter((e) => e.id !== id));
    try {
      await deleteEvidence(id);
    } catch {
      setError(ar ? "تعذّر الحذف." : "Delete failed.");
    }
  };

  /** Pull achievements and skills already in the Career Twin into the vault. */
  const importFromTwin = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const twin = await loadCareerTwin(user.id);
      if (!twin) return;
      const existing = new Set(facts.map((f) => `${f.type}:${f.title.trim().toLowerCase()}`));
      const created: CareerFact[] = [];
      for (const a of twin.achievements.slice(0, 20)) {
        const key = `achievement:${a.text.trim().toLowerCase()}`;
        if (!a.text.trim() || existing.has(key)) continue;
        existing.add(key);
        const row = await createFact(user.id, {
          type: "achievement",
          title: a.text,
          value: a.metric ?? "",
          sourceType: "career_twin",
          sourceLabel: ar ? "ملفي المهني" : "Career profile",
          verificationStatus: a.verified ? "verified" : "needs_review",
        });
        if (row) created.push(row);
      }
      for (const s of twin.skills.slice(0, 30)) {
        const key = `skill:${s.name.trim().toLowerCase()}`;
        if (!s.name.trim() || existing.has(key)) continue;
        existing.add(key);
        const row = await createFact(user.id, {
          type: "skill",
          title: s.name,
          value: s.evidence ?? "",
          sourceType: "career_twin",
          sourceLabel: ar ? "ملفي المهني" : "Career profile",
          verificationStatus: s.verified ? "verified" : "needs_review",
        });
        if (row) created.push(row);
      }
      if (created.length) setFacts((l) => [...created, ...l]);
      if (!created.length) setError(ar ? "لا يوجد جديد لاستيراده." : "Nothing new to import.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "import_failed");
    } finally {
      setBusy(false);
    }
  };

  if (!ready || (!user && loading)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {ar ? "خزانة الأدلة المهنية" : "Career evidence vault"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-[1.9] text-muted-foreground">
            {ar
              ? "كل ما يقوله المساعد عنك يجب أن يكون موجوداً هنا. سجّل الحقائق واربطها بدليل، والأرقام غير الموثّقة تبقى «تحتاج مراجعة» ولا تُستخدم كحقيقة."
              : "Everything the assistant says about you must exist here. Record facts, link evidence, and any unbacked figure stays “needs review” instead of being treated as fact."}
          </p>
        </div>
        <Button variant="outline" onClick={importFromTwin} disabled={busy}>
          <Paperclip className="me-2 h-4 w-4" />
          {ar ? "استيراد من ملفي المهني" : "Import from career profile"}
        </Button>
      </header>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
        <p className="font-bold">{vault.headline}</p>
        <ul className="mt-1 space-y-1 text-muted-foreground">
          {vault.items.map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      </div>

      {error ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="h-4 w-4" />
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <AchievementInterview userId={user.id} onSaved={() => void refresh(user.id)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="flex flex-wrap gap-2">
            {(["all", ...FACT_TYPES] as FilterId[]).map((id) => (
              <Button
                key={id}
                size="sm"
                variant={filter === id ? "default" : "outline"}
                onClick={() => setFilter(id)}
              >
                {id === "all"
                  ? ar
                    ? "الكل"
                    : "All"
                  : ar
                    ? FACT_TYPE_LABEL[id].ar
                    : FACT_TYPE_LABEL[id].en}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : !shown.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-bold">{ar ? "لا توجد حقائق بعد" : "No facts yet"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {ar
                  ? "أضف أول إنجاز على اليمين، أو استورد ما هو موجود في ملفك المهني."
                  : "Add your first achievement, or import what already exists in your career profile."}
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {shown.map((f) => {
                const linked = evidence.filter((e) => e.factId === f.id);
                const verified = f.verificationStatus === "verified";
                return (
                  <li key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {ar ? FACT_TYPE_LABEL[f.type].ar : FACT_TYPE_LABEL[f.type].en}
                      </Badge>
                      <Badge variant={verified ? "default" : "outline"}>
                        {verified ? <ShieldCheck className="me-1 h-3 w-3" /> : null}
                        {ar
                          ? VERIFICATION_LABEL[f.verificationStatus].ar
                          : VERIFICATION_LABEL[f.verificationStatus].en}
                      </Badge>
                      {f.sourceLabel ? (
                        <span className="text-xs text-muted-foreground">{f.sourceLabel}</span>
                      ) : null}
                      <div className="ms-auto flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toggleFactVerified(f)}>
                          {verified ? (ar ? "إلغاء التوثيق" : "Unverify") : ar ? "توثيق" : "Verify"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={ar ? "حذف" : "Delete"}
                          onClick={() => removeFact(f.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-bold leading-[1.9]">{f.title}</p>
                    {f.value ? (
                      <p className="mt-1 text-sm leading-[1.9] text-muted-foreground">{f.value}</p>
                    ) : null}
                    {linked.length ? (
                      <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                        {linked.map((e) => (
                          <li key={e.id} className="flex flex-wrap items-center gap-2">
                            <ShieldCheck
                              className={`h-3.5 w-3.5 ${e.verified ? "text-emerald-accent" : "opacity-40"}`}
                            />
                            <span>{e.title}</span>
                            {e.metricValue ? (
                              <span className="font-bold">
                                {e.metricValue} {e.metricUnit}
                              </span>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ms-auto h-6 px-2"
                              onClick={() => toggleEvidenceVerified(e)}
                            >
                              {e.verified ? (ar ? "غير موثّق" : "Mark unverified") : ar ? "موثّق" : "Mark verified"}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              aria-label={ar ? "حذف الدليل" : "Delete evidence"}
                              onClick={() => removeEvidence(e.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 border-t border-border pt-3 text-xs text-amber-600 dark:text-amber-400">
                        {ar ? "لا يوجد دليل مرتبط بهذه الحقيقة." : "No evidence linked to this fact."}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {evidence.some((e) => !e.factId) ? (
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="font-bold">{ar ? "أدلة غير مرتبطة" : "Unlinked evidence"}</p>
              <ul className="mt-2 space-y-2 text-sm">
                {evidence
                  .filter((e) => !e.factId)
                  .map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {ar ? EVIDENCE_TYPE_LABEL[e.evidenceType].ar : EVIDENCE_TYPE_LABEL[e.evidenceType].en}
                      </Badge>
                      <span>{e.title}</span>
                      <Select
                        value=""
                        onValueChange={(v) => {
                          setEvidence((l) => l.map((x) => (x.id === e.id ? { ...x, factId: v } : x)));
                          void updateEvidence(e.id, { factId: v });
                        }}
                      >
                        <SelectTrigger className="ms-auto h-8 w-44">
                          <SelectValue placeholder={ar ? "اربط بحقيقة" : "Link to a fact"} />
                        </SelectTrigger>
                        <SelectContent>
                          {facts.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.title.slice(0, 40)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={ar ? "حذف" : "Delete"}
                        onClick={() => removeEvidence(e.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="font-bold">{ar ? "إضافة حقيقة" : "Add a fact"}</p>
            <div className="mt-3 space-y-3">
              <div>
                <Label>{ar ? "النوع" : "Type"}</Label>
                <Select
                  value={factDraft.type}
                  onValueChange={(v) => setFactDraft((d) => ({ ...d, type: v as FactType }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FACT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ar ? FACT_TYPE_LABEL[t].ar : FACT_TYPE_LABEL[t].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fact-title">{ar ? "العنوان" : "Title"}</Label>
                <Input
                  id="fact-title"
                  value={factDraft.title}
                  maxLength={200}
                  onChange={(e) => setFactDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder={ar ? "خفضت زمن المعالجة" : "Reduced processing time"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fact-value">{ar ? "التفاصيل" : "Details"}</Label>
                <Textarea
                  id="fact-value"
                  value={factDraft.value}
                  maxLength={1000}
                  rows={3}
                  onChange={(e) => setFactDraft((d) => ({ ...d, value: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <Button className="w-full" disabled={busy || !factDraft.title.trim()} onClick={addFact}>
                <Plus className="me-1 h-4 w-4" />
                {ar ? "أضف الحقيقة" : "Add fact"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="font-bold">{ar ? "إضافة دليل" : "Add evidence"}</p>
            <div className="mt-3 space-y-3">
              <div>
                <Label>{ar ? "النوع" : "Type"}</Label>
                <Select
                  value={evDraft.evidenceType}
                  onValueChange={(v) => setEvDraft((d) => ({ ...d, evidenceType: v as EvidenceType }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ar ? EVIDENCE_TYPE_LABEL[t].ar : EVIDENCE_TYPE_LABEL[t].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ev-title">{ar ? "العنوان" : "Title"}</Label>
                <Input
                  id="ev-title"
                  value={evDraft.title}
                  maxLength={200}
                  onChange={(e) => setEvDraft((d) => ({ ...d, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="ev-value">{ar ? "القيمة" : "Value"}</Label>
                  <Input
                    id="ev-value"
                    value={evDraft.metricValue}
                    maxLength={40}
                    onChange={(e) => setEvDraft((d) => ({ ...d, metricValue: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ev-unit">{ar ? "الوحدة" : "Unit"}</Label>
                  <Input
                    id="ev-unit"
                    value={evDraft.metricUnit}
                    maxLength={40}
                    onChange={(e) => setEvDraft((d) => ({ ...d, metricUnit: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ev-url">{ar ? "رابط المصدر (اختياري)" : "Source link (optional)"}</Label>
                <Input
                  id="ev-url"
                  value={evDraft.sourceUrl}
                  maxLength={500}
                  onChange={(e) => setEvDraft((d) => ({ ...d, sourceUrl: e.target.value }))}
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>{ar ? "اربط بحقيقة (اختياري)" : "Link to a fact (optional)"}</Label>
                <Select
                  value={evDraft.factId}
                  onValueChange={(v) => setEvDraft((d) => ({ ...d, factId: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={ar ? "بدون ربط" : "Unlinked"} />
                  </SelectTrigger>
                  <SelectContent>
                    {facts.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.title.slice(0, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                variant="outline"
                disabled={busy || !evDraft.title.trim()}
                onClick={addEvidence}
              >
                <Plus className="me-1 h-4 w-4" />
                {ar ? "أضف الدليل" : "Add evidence"}
              </Button>
              <p className="text-xs leading-[1.8] text-muted-foreground">
                {ar
                  ? "الأدلة خاصة بك ولا تُنشر. لا نحفظ الملف الأصلي، فقط ما تكتبه هنا."
                  : "Evidence is private and never published. The original file is not stored — only what you type here."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
