/**
 * Cover letter panel — generation is grounded in stored evidence and every
 * draft is passed through a claims check before it can be saved. The user, not
 * the model, decides what is true here.
 */
import { useState } from "react";
import { AlertTriangle, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { CareerTwin } from "@/lib/career";
import type { FactGraph } from "@/lib/career-facts";
import {
  checkCoverLetterClaims,
  generateCoverLetter,
  saveCoverLetter,
  type ClaimIssue,
  type CoverLetter,
} from "@/lib/cover-letters";
import type { ResumeData } from "@/lib/types";

type Props = {
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  graph: FactGraph;
  twin: CareerTwin | null;
  resumeData: ResumeData | null;
  resumeId?: string | null;
  existing?: CoverLetter | null;
  onSaved?: () => void;
};

export function CoverLetterPanel({
  userId,
  jobId,
  jobTitle,
  company,
  jobDescription,
  graph,
  twin,
  resumeData,
  resumeId,
  existing,
  onSaved,
}: Props) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [opening, setOpening] = useState(existing?.opening ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [closing, setClosing] = useState(existing?.closing ?? "");
  const [issues, setIssues] = useState<ClaimIssue[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const fullText = [opening, body, closing].filter(Boolean).join("\n\n");

  const runCheck = () => {
    const found = checkCoverLetterClaims({
      text: fullText,
      graph,
      resume: resumeData,
      twin,
      jobCompany: company,
    });
    setIssues(found);
    return found;
  };

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const draft = await generateCoverLetter({
        graph,
        jobTitle,
        company,
        jobDescription,
        lang: ar ? "ar" : "en",
      });
      setOpening(draft.opening);
      setBody(draft.body);
      setClosing(draft.closing);
      setIssues(
        checkCoverLetterClaims({
          text: [draft.opening, draft.body, draft.closing].filter(Boolean).join("\n\n"),
          graph,
          resume: resumeData,
          twin,
          jobCompany: company,
        }),
      );
      toast.success(
        ar
          ? "أُنشئت مسودة — راجع الادعاءات قبل الحفظ."
          : "Draft ready — review the claims before saving.",
      );
    } catch {
      toast.error(ar ? "تعذّر إنشاء المسودة." : "Could not create the draft.");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!fullText.trim()) return;
    const found = runCheck();
    if (found.length) {
      toast.error(
        ar
          ? "هناك ادعاءات غير مدعومة — عدّلها أو أضف دليلاً ثم احفظ."
          : "Unsupported claims remain — edit them or add evidence, then save.",
      );
      return;
    }
    setSaving(true);
    try {
      const saved = await saveCoverLetter(userId, {
        ...(existing?.id ? { id: existing.id } : {}),
        jobId,
        resumeId: resumeId ?? null,
        title: `${jobTitle} — ${company}`,
        language: ar ? "ar" : "en",
        opening,
        body,
        closing,
      });
      if (!saved) throw new Error("save failed");
      toast.success(ar ? "تم حفظ خطاب التقديم." : "Cover letter saved.");
      onSaved?.();
    } catch {
      toast.error(ar ? "تعذّر الحفظ." : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="cover-letter">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4" />
          {ar ? "خطاب تقديم مبني على الأدلة" : "Evidence-grounded cover letter"}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => void handleGenerate()} disabled={busy}>
          <Sparkles className="size-4" />
          {busy ? (ar ? "جارِ الكتابة…" : "Drafting…") : ar ? "اكتب مسودة" : "Draft"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs leading-[1.9] text-muted-foreground">
          {ar
            ? "المساعد يقرأ فقط حقائقك الموثقة وخزانة الأدلة ونص الوصف الوظيفي — لا يخترع أرقاماً أو شركات."
            : "The assistant reads only your verified facts, evidence vault and the job description — it invents no numbers or companies."}
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="cl-opening">{ar ? "الافتتاحية" : "Opening"}</Label>
          <Textarea
            id="cl-opening"
            rows={2}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cl-body">{ar ? "المتن" : "Body"}</Label>
          <Textarea id="cl-body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cl-closing">{ar ? "الخاتمة" : "Closing"}</Label>
          <Textarea
            id="cl-closing"
            rows={2}
            value={closing}
            onChange={(e) => setClosing(e.target.value)}
          />
        </div>

        {issues !== null && (
          <div className="rounded-xl border border-border p-3">
            {issues.length === 0 ? (
              <p className="flex items-center gap-2 text-xs font-semibold text-emerald-accent">
                <ShieldCheck className="size-4" />
                {ar
                  ? "كل الادعاءات مدعومة بما لديك."
                  : "Every claim is supported by your own data."}
              </p>
            ) : (
              <>
                <p className="flex items-center gap-2 text-xs font-bold">
                  <AlertTriangle className="size-4 text-amber-500" />
                  {ar ? "ادعاءات تحتاج مراجعة" : "Claims needing review"}
                </p>
                <ul className="mt-2 space-y-2">
                  {issues.map((i) => (
                    <li key={`${i.kind}-${i.value}`} className="text-xs leading-[1.8]">
                      <Badge variant="outline" className="me-1.5 text-[10.5px]">
                        {i.value}
                      </Badge>
                      <span className="text-muted-foreground">{ar ? i.note.ar : i.note.en}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={runCheck} disabled={!fullText.trim()}>
            {ar ? "افحص الادعاءات" : "Check claims"}
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || !fullText.trim()}>
            {saving ? (ar ? "جارِ الحفظ…" : "Saving…") : ar ? "احفظ الخطاب" : "Save letter"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
