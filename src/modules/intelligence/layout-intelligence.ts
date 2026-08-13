export type LayoutIssue = {
  id: string;
  severity: "warning" | "critical";
  message: { ar: string; en: string };
  suggestion: { ar: string; en: string };
  autoApplied: false;
};

export type LayoutInput = {
  text: string;
  pageCount: 1 | 2;
  sectionCount: number;
  headingCount: number;
  linkLengths?: number[];
  direction: "rtl" | "ltr";
};

export function inspectLayout(input: LayoutInput): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const words = input.text.trim().split(/\s+/).filter(Boolean).length;
  if (input.pageCount === 1 && words > 650)
    issues.push({
      id: "overflow",
      severity: "critical",
      message: { ar: "النص قد يتجاوز صفحة واحدة.", en: "The content may overflow one page." },
      suggestion: {
        ar: "راجع الانتقال إلى صفحتين أو اختصر النص بعد المراجعة.",
        en: "Review a two-page layout or shorten the text after review.",
      },
      autoApplied: false,
    });
  if (input.headingCount > 0 && input.sectionCount / input.headingCount < 1.4)
    issues.push({
      id: "short_sections",
      severity: "warning",
      message: {
        ar: "توجد أقسام قصيرة قد تبدو مجزأة.",
        en: "Some sections may appear fragmented.",
      },
      suggestion: {
        ar: "راجع ترتيب الأقسام أو دمج الأقسام القصيرة.",
        en: "Review ordering or combine short sections.",
      },
      autoApplied: false,
    });
  if ((input.linkLengths ?? []).some((length) => length > 70))
    issues.push({
      id: "long_link",
      severity: "warning",
      message: {
        ar: "يوجد رابط طويل قد يسبب ازدحاماً.",
        en: "A long link may cause layout pressure.",
      },
      suggestion: {
        ar: "استخدم نص رابط مختصراً وراجع PDF.",
        en: "Use a shorter link label and review the PDF.",
      },
      autoApplied: false,
    });
  if (input.direction === "rtl" && /[A-Za-z]{20,}/.test(input.text))
    issues.push({
      id: "bidi",
      severity: "warning",
      message: {
        ar: "يوجد نص لاتيني طويل داخل تخطيط عربي.",
        en: "Long Latin text appears in an RTL layout.",
      },
      suggestion: {
        ar: "راجع اتجاه الرابط أو المصطلح قبل التصدير.",
        en: "Review the direction of the link or term before export.",
      },
      autoApplied: false,
    });
  return issues;
}
