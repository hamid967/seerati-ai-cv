/**
 * Bilingual sync audit.
 *
 * Compares this resume with the user's counterpart resume in the other
 * language and reports, per section, whether both sides carry content. Fully
 * deterministic (see `detectUnsyncedSections`) — no AI, no invented content.
 */
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { SECTION_LABEL, SYNC_LABEL, detectUnsyncedSections } from "@/lib/bilingual-intelligence";
import { useI18n } from "@/lib/i18n";
import type { Resume } from "@/lib/types";

export function BilingualSyncCard({ current, all }: { current: Resume; all: Resume[] }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const other = current.language === "ar" ? "en" : "ar";

  const counterpart = useMemo(
    () => all.find((r) => r.id !== current.id && r.language === other),
    [all, current.id, other],
  );

  const rows = useMemo(
    () => (counterpart ? detectUnsyncedSections(current.data, counterpart.data) : []),
    [counterpart, current.data],
  );

  const gaps = rows.filter((r) => r.status !== "in_sync" && r.status !== "empty");

  if (!counterpart) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border p-3">
        <p className="text-[12px] font-semibold">{ar ? "التوافق بين اللغتين" : "Bilingual sync"}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {ar
            ? `لا توجد نسخة ${other === "en" ? "إنجليزية" : "عربية"} لمقارنتها. أنشئ نسخة بلغة أخرى لمقارنة الأقسام تلقائياً.`
            : `No ${other === "en" ? "English" : "Arabic"} counterpart to compare. Create one to audit section parity.`}
        </p>
        <Button asChild size="sm" variant="outline" className="mt-2">
          <Link to="/resumes/new">{ar ? "إنشاء نسخة بلغة أخرى" : "Create the other language"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold">{ar ? "التوافق بين اللغتين" : "Bilingual sync"}</p>
        <Badge variant={gaps.length ? "outline" : "secondary"} className="text-[10px]">
          {gaps.length
            ? ar
              ? `${gaps.length} فروق`
              : `${gaps.length} gaps`
            : ar
              ? "متوافق"
              : "In sync"}
        </Badge>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {ar ? "المقارنة مع: " : "Compared with: "}
        {counterpart.title}
      </p>
      <ul className="mt-2 space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-2 text-[11px]">
            <span>{SECTION_LABEL[r.key][ar ? "ar" : "en"]}</span>
            <span
              className={
                r.status === "in_sync" ? "text-muted-foreground" : "font-semibold text-foreground"
              }
            >
              {SYNC_LABEL[r.status][ar ? "ar" : "en"]}
            </span>
          </li>
        ))}
      </ul>
      <Button asChild size="sm" variant="outline" className="mt-3">
        <Link to="/resumes/$id/edit" params={{ id: counterpart.id }}>
          {ar ? "افتح النسخة الأخرى" : "Open the counterpart"}
        </Link>
      </Button>
    </div>
  );
}
