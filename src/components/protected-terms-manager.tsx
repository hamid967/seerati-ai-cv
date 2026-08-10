import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import {
  addProtectedTerm,
  deleteProtectedTerm,
  listProtectedTerms,
  type ProtectedTerm,
} from "@/lib/career-facts";
import { POLICY_HINT, POLICY_LABEL, type TranslationPolicy } from "@/lib/bilingual-intelligence";

/**
 * Protected terms manager — the user decides which names must survive
 * translation untouched (companies, products, certificates, universities).
 * These rules are passed to the copilot as action context on every
 * translate/rewrite request.
 */
export function ProtectedTermsManager({
  userId,
  onChange,
}: {
  userId: string;
  onChange?: (terms: ProtectedTerm[]) => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [terms, setTerms] = useState<ProtectedTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<{ term: string; policy: TranslationPolicy }>({
    term: "",
    policy: "keep_as_is",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await listProtectedTerms(userId);
      setTerms(list);
      onChange?.(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }, [userId, onChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async () => {
    const clean = draft.term.trim();
    if (!clean) return;
    setBusy(true);
    try {
      await addProtectedTerm(userId, clean, draft.policy);
      setDraft({ term: "", policy: draft.policy });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await deleteProtectedTerm(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "delete_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Lock className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold">{ar ? "المصطلحات المحمية" : "Protected terms"}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {ar
              ? "أضف أسماء الشركات والمنتجات والشهادات والجامعات التي لا يجب ترجمتها. سيلتزم المساعد بهذه القواعد عند الترجمة أو إعادة الصياغة، وتُعرض أي تغييرات للمراجعة قبل التطبيق."
              : "Add company, product, certificate and university names that must not be translated. The copilot follows these rules when translating or rewriting, and every change is shown for review before it is applied."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <Label htmlFor="pt-term" className="text-xs">
            {ar ? "المصطلح" : "Term"}
          </Label>
          <Input
            id="pt-term"
            value={draft.term}
            onChange={(e) => setDraft({ ...draft, term: e.target.value })}
            placeholder={
              ar ? "مثال: أرامكو السعودية، SAP S/4HANA" : "e.g. Saudi Aramco, SAP S/4HANA"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
            }}
          />
        </div>
        <div>
          <Label className="text-xs">{ar ? "السياسة" : "Policy"}</Label>
          <Select
            value={draft.policy}
            onValueChange={(v) => setDraft({ ...draft, policy: v as TranslationPolicy })}
          >
            <SelectTrigger className="min-w-[9.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["keep_as_is", "transliterate", "translate"] as TranslationPolicy[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {POLICY_LABEL[p][lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={add} disabled={busy || !draft.term.trim()} className="w-full sm:w-auto">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {ar ? "إضافة" : "Add"}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{POLICY_HINT[draft.policy][lang]}</p>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">{ar ? "جارٍ التحميل…" : "Loading…"}</p>
        ) : !terms.length ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
            {ar
              ? "لا توجد مصطلحات محمية بعد. الترجمة ستعتمد على تقدير المساعد حتى تضيف قواعدك."
              : "No protected terms yet. Until you add rules, translation relies on the assistant's judgement."}
          </p>
        ) : (
          terms.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.term}</p>
                {t.notes && <p className="truncate text-[11px] text-muted-foreground">{t.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {POLICY_LABEL[t.translationPolicy][lang]}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={ar ? `حذف ${t.term}` : `Delete ${t.term}`}
                  disabled={busy}
                  onClick={() => void remove(t.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
