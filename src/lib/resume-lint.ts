/**
 * Seerati Resume Quality — deterministic lint engine.
 *
 * Every rule here is a plain, explainable check on the resume data. No model is
 * involved and no ATS vendor is queried, so the number is an internal quality /
 * ATS-readiness heuristic, never a claim about what a specific employer's system
 * will do. The assistant may explain a rule, but it cannot change the result.
 */
import type { Resume, ResumeData } from "./types";
import type { FactGraph } from "./career-facts";

export type LintSeverity = "error" | "warning" | "info";

export type LintCategory = "structure" | "content" | "evidence" | "keywords" | "readability";

export const LINT_CATEGORY_LABEL: Record<LintCategory, { ar: string; en: string }> = {
  structure: { ar: "البنية", en: "Structure" },
  content: { ar: "المحتوى", en: "Content" },
  evidence: { ar: "الأدلة", en: "Evidence" },
  keywords: { ar: "الكلمات المفتاحية", en: "Keywords" },
  readability: { ar: "سهولة القراءة", en: "Readability" },
};

export type LintFinding = {
  rule: string;
  category: LintCategory;
  severity: LintSeverity;
  message: { ar: string; en: string };
  /** Optional pointer, e.g. an experience id or a link label. */
  where?: string;
};

export type LintCategoryScore = {
  category: LintCategory;
  earned: number;
  max: number;
  findings: LintFinding[];
};

export type LintReport = {
  /** 0–100 Seerati Resume Quality (heuristic, not a vendor ATS score). */
  score: number;
  label: { ar: string; en: string };
  categories: LintCategoryScore[];
  findings: LintFinding[];
};

const WEIGHTS: Record<LintCategory, number> = {
  structure: 25,
  content: 25,
  evidence: 20,
  keywords: 15,
  readability: 15,
};

const WEAK_STARTS = [
  "مسؤول عن",
  "مسئول عن",
  "العمل على",
  "المساعدة في",
  "responsible for",
  "worked on",
  "helped with",
  "duties included",
  "tasked with",
];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const parseYm = (v?: string): number | null => {
  if (!v) return null;
  const m = v.match(/(\d{4})(?:[-/](\d{1,2}))?/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : 1;
  if (year < 1950 || year > new Date().getFullYear() + 1) return null;
  return year * 12 + (month - 1);
};

const isValidUrl = (raw: string): boolean => {
  const v = raw.trim();
  if (!v) return false;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    return u.hostname.includes(".") && !/\s/.test(v);
  } catch {
    return false;
  }
};

/* --------------------------------- rules ---------------------------------- */

function structureRules(d: ResumeData): LintFinding[] {
  const out: LintFinding[] = [];
  const p = d.personal;
  const missing: string[] = [];
  if (!p.fullName.trim()) missing.push("name");
  if (!p.email.trim()) missing.push("email");
  if (!p.phone.trim()) missing.push("phone");
  if (!p.city.trim()) missing.push("city");
  if (missing.length) {
    out.push({
      rule: "missing_contact_fields",
      category: "structure",
      severity: "error",
      message: {
        ar: `بيانات تواصل ناقصة: ${missing.length} حقل أساسي.`,
        en: `Missing contact fields: ${missing.join(", ")}.`,
      },
    });
  }
  if (p.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email.trim())) {
    out.push({
      rule: "invalid_email",
      category: "structure",
      severity: "error",
      message: { ar: "صيغة البريد الإلكتروني غير صحيحة.", en: "Email format looks invalid." },
    });
  }
  for (const l of d.links) {
    if (l.url.trim() && !isValidUrl(l.url)) {
      out.push({
        rule: "invalid_link",
        category: "structure",
        severity: "warning",
        message: { ar: `رابط غير صالح: ${l.label || l.url}`, en: `Invalid link: ${l.label || l.url}` },
        where: l.id,
      });
    }
  }
  if (!d.experience.length) {
    out.push({
      rule: "no_experience",
      category: "structure",
      severity: "error",
      message: { ar: "لا توجد خبرات مضافة.", en: "No experience entries yet." },
    });
  }
  if (!d.education.length) {
    out.push({
      rule: "no_education",
      category: "structure",
      severity: "warning",
      message: { ar: "لا يوجد قسم تعليم.", en: "Education section is empty." },
    });
  }
  const visible = d.sectionOrder.filter((s) => !(d.hiddenSections ?? []).includes(s));
  if (visible.length > 9) {
    out.push({
      rule: "too_many_sections",
      category: "structure",
      severity: "warning",
      message: {
        ar: "عدد الأقسام الظاهرة كبير — أخفِ ما لا يخدم الوظيفة المستهدفة.",
        en: "Too many visible sections — hide the ones the target job does not need.",
      },
    });
  }
  const customTitles = d.custom.map((c) => c.title.trim()).filter(Boolean);
  if (customTitles.some((t) => t.length > 32 || /[.!؟?]$/.test(t))) {
    out.push({
      rule: "section_title_consistency",
      category: "structure",
      severity: "info",
      message: {
        ar: "عناوين الأقسام المخصصة يجب أن تكون قصيرة وبدون ترقيم.",
        en: "Custom section titles should stay short and punctuation-free.",
      },
    });
  }
  return out;
}

function contentRules(d: ResumeData): LintFinding[] {
  const out: LintFinding[] = [];
  if (!d.summary.trim()) {
    out.push({
      rule: "empty_summary",
      category: "content",
      severity: "error",
      message: { ar: "الملخص المهني فارغ.", en: "Professional summary is empty." },
    });
  } else if (words(d.summary) < 20) {
    out.push({
      rule: "short_summary",
      category: "content",
      severity: "warning",
      message: { ar: "الملخص قصير جداً (أقل من 20 كلمة).", en: "Summary is very short (under 20 words)." },
    });
  }

  const seen = new Map<string, number>();
  for (const exp of d.experience) {
    if (!exp.bullets.filter((b) => b.trim()).length) {
      out.push({
        rule: "empty_bullets",
        category: "content",
        severity: "error",
        message: {
          ar: `لا توجد نقاط لخبرة «${exp.role || exp.company}».`,
          en: `No bullets for "${exp.role || exp.company}".`,
        },
        where: exp.id,
      });
    }
    for (const b of exp.bullets) {
      const t = b.trim();
      if (!t) continue;
      const key = t.toLowerCase().replace(/\s+/g, " ");
      seen.set(key, (seen.get(key) ?? 0) + 1);
      if (WEAK_STARTS.some((w) => t.toLowerCase().startsWith(w))) {
        out.push({
          rule: "weak_bullet",
          category: "content",
          severity: "warning",
          message: {
            ar: `نقطة تصف مهمة بدل إنجاز: «${t.slice(0, 48)}…»`,
            en: `Bullet describes a duty, not an outcome: "${t.slice(0, 48)}…"`,
          },
          where: exp.id,
        });
      }
      if (words(t) > 45) {
        out.push({
          rule: "long_paragraph",
          category: "readability",
          severity: "warning",
          message: {
            ar: "نقطة طويلة جداً — قسّمها إلى نقطتين.",
            en: "Bullet is too long — split it into two.",
          },
          where: exp.id,
        });
      }
    }
    const s = parseYm(exp.start);
    const e = exp.current ? null : parseYm(exp.end);
    if (exp.start && !s) {
      out.push({
        rule: "inconsistent_dates",
        category: "content",
        severity: "warning",
        message: { ar: "تاريخ بداية غير مفهوم.", en: "Start date is not parseable." },
        where: exp.id,
      });
    }
    if (s && e && e < s) {
      out.push({
        rule: "suspicious_range",
        category: "content",
        severity: "error",
        message: { ar: "تاريخ النهاية قبل تاريخ البداية.", en: "End date is before the start date." },
        where: exp.id,
      });
    }
    if (s && e && e - s > 12 * 45) {
      out.push({
        rule: "suspicious_range",
        category: "content",
        severity: "warning",
        message: { ar: "مدة الخبرة تبدو غير منطقية.", en: "Experience duration looks implausible." },
        where: exp.id,
      });
    }
  }
  for (const [, count] of seen) {
    if (count > 1) {
      out.push({
        rule: "duplicate_bullet",
        category: "content",
        severity: "warning",
        message: { ar: "توجد نقاط مكرّرة بين الخبرات.", en: "Duplicate bullets found across roles." },
      });
      break;
    }
  }

  // Overlapping full-time ranges: flagged once, since it can be intentional.
  const ranges = d.experience
    .map((x) => ({ id: x.id, s: parseYm(x.start), e: x.current ? 99999 : parseYm(x.end) }))
    .filter((r): r is { id: string; s: number; e: number } => r.s !== null && r.e !== null);
  for (let i = 0; i < ranges.length; i += 1) {
    for (let j = i + 1; j < ranges.length; j += 1) {
      const a = ranges[i]!;
      const b = ranges[j]!;
      if (Math.min(a.e, b.e) - Math.max(a.s, b.s) > 6) {
        out.push({
          rule: "date_overlap",
          category: "content",
          severity: "info",
          message: {
            ar: "تداخل واضح بين فترتي عمل — وضّح إن كان بدوام جزئي أو استشارياً.",
            en: "Two roles overlap by months — clarify if part-time or consulting.",
          },
        });
        i = ranges.length;
        break;
      }
    }
  }
  return out;
}

const NUM_RE = /\d[\d,.]*\s*%?/g;

function evidenceRules(d: ResumeData, graph?: FactGraph): LintFinding[] {
  const out: LintFinding[] = [];
  const verifiedNumbers = new Set<string>();
  const verifiedSkills = new Set<string>();
  if (graph) {
    for (const e of graph.evidence) {
      if (!e.verified) continue;
      for (const n of `${e.metricValue} ${e.description} ${e.title}`.match(NUM_RE) ?? []) {
        verifiedNumbers.add(n.trim());
      }
    }
    for (const f of graph.facts) {
      if (f.verificationStatus !== "verified") continue;
      for (const n of `${f.title} ${f.value}`.match(NUM_RE) ?? []) verifiedNumbers.add(n.trim());
      if (f.type === "skill") verifiedSkills.add(f.title.trim().toLowerCase());
    }
  }

  const quantified = d.experience
    .flatMap((x) => x.bullets)
    .filter((b) => /\d/.test(b));
  if (!quantified.length && d.experience.length) {
    out.push({
      rule: "no_quantified_bullet",
      category: "evidence",
      severity: "warning",
      message: {
        ar: "لا توجد نقطة واحدة بأثر قابل للقياس.",
        en: "Not a single bullet carries a measurable outcome.",
      },
    });
  }

  if (graph) {
    for (const b of quantified) {
      const unbacked = (b.match(NUM_RE) ?? [])
        .map((n) => n.trim())
        .filter(
          (n) => !verifiedNumbers.has(n) && !/^(19|20)\d{2}$/.test(n) && n.replace(/\D/g, "").length > 1,
        );
      if (unbacked.length) {
        out.push({
          rule: "unverifiable_metric",
          category: "evidence",
          severity: "warning",
          message: {
            ar: `رقم غير موثّق في خزانة الأدلة: ${unbacked.join(", ")}`,
            en: `Metric not backed by the evidence vault: ${unbacked.join(", ")}`,
          },
        });
      }
    }
    const unbackedSkills = d.skills.filter((s) => !verifiedSkills.has(s.name.trim().toLowerCase()));
    if (unbackedSkills.length) {
      out.push({
        rule: "skills_without_evidence",
        category: "evidence",
        severity: "info",
        message: {
          ar: `${unbackedSkills.length} مهارة بلا دليل مرتبط.`,
          en: `${unbackedSkills.length} skills have no linked evidence.`,
        },
      });
    }
  } else if (d.skills.length) {
    out.push({
      rule: "skills_without_evidence",
      category: "evidence",
      severity: "info",
      message: {
        ar: "لم يتم ربط المهارات بخزانة الأدلة بعد.",
        en: "Skills are not linked to the evidence vault yet.",
      },
    });
  }
  return out;
}

function keywordRules(d: ResumeData): LintFinding[] {
  const out: LintFinding[] = [];
  const jd = (d.jobDescription ?? "").trim();
  if (!d.targetJob?.trim()) {
    out.push({
      rule: "no_target_job",
      category: "keywords",
      severity: "warning",
      message: { ar: "لم تحدّد الوظيفة المستهدفة.", en: "No target job set." },
    });
  }
  if (!jd) {
    out.push({
      rule: "no_job_description",
      category: "keywords",
      severity: "info",
      message: {
        ar: "أضف وصف الوظيفة لقياس تغطية الكلمات المفتاحية.",
        en: "Paste the job description to measure keyword coverage.",
      },
    });
    return out;
  }
  const hay = JSON.stringify(d).toLowerCase();
  const stop = new Set(["and", "the", "with", "for", "من", "في", "على", "مع", "عن"]);
  const terms = Array.from(
    new Set(
      jd
        .toLowerCase()
        .split(/[^\p{L}\p{N}+#.]+/u)
        .filter((t) => t.length > 3 && !stop.has(t)),
    ),
  ).slice(0, 40);
  const missing = terms.filter((t) => !hay.includes(t));
  if (terms.length && missing.length / terms.length > 0.5) {
    out.push({
      rule: "low_keyword_coverage",
      category: "keywords",
      severity: "warning",
      message: {
        ar: `تغطية منخفضة لكلمات الوصف الوظيفي (${terms.length - missing.length}/${terms.length}).`,
        en: `Low job-description keyword coverage (${terms.length - missing.length}/${terms.length}).`,
      },
    });
  }
  return out;
}

function readabilityRules(d: ResumeData): LintFinding[] {
  const out: LintFinding[] = [];
  if (words(d.summary) > 120) {
    out.push({
      rule: "long_paragraph",
      category: "readability",
      severity: "warning",
      message: { ar: "الملخص طويل — اجعله 3-5 أسطر.", en: "Summary is long — keep it 3–5 lines." },
    });
  }
  const bulletCount = d.experience.reduce((n, x) => n + x.bullets.filter((b) => b.trim()).length, 0);
  const density =
    bulletCount * 18 +
    words(d.summary) +
    d.skills.length * 4 +
    d.education.length * 20 +
    d.certificates.length * 12;
  if (density > 900) {
    out.push({
      rule: "page_density_high",
      category: "readability",
      severity: "warning",
      message: {
        ar: "كثافة المحتوى عالية — قد تتجاوز صفحتين عند الطباعة.",
        en: "Content density is high — it may spill past two pages.",
      },
    });
  } else if (density < 200) {
    out.push({
      rule: "page_density_low",
      category: "readability",
      severity: "info",
      message: {
        ar: "المحتوى قليل — الصفحة ستبدو فارغة.",
        en: "Content is sparse — the page will look empty.",
      },
    });
  }
  for (const exp of d.experience) {
    if (exp.bullets.filter((b) => b.trim()).length > 8) {
      out.push({
        rule: "too_many_bullets",
        category: "readability",
        severity: "info",
        message: {
          ar: "أكثر من 8 نقاط في وظيفة واحدة — أبقِ الأقوى.",
          en: "More than 8 bullets in one role — keep the strongest.",
        },
        where: exp.id,
      });
    }
  }
  return out;
}

const PENALTY: Record<LintSeverity, number> = { error: 12, warning: 6, info: 2 };

/** Run every deterministic rule and return an explained, category-split score. */
export function lintResume(
  input: Resume | ResumeData,
  graph?: FactGraph,
): LintReport {
  const d = "data" in input ? input.data : input;
  const findings = [
    ...structureRules(d),
    ...contentRules(d),
    ...evidenceRules(d, graph),
    ...keywordRules(d),
    ...readabilityRules(d),
  ];

  const categories = (Object.keys(WEIGHTS) as LintCategory[]).map<LintCategoryScore>((category) => {
    const own = findings.filter((f) => f.category === category);
    const max = WEIGHTS[category];
    const penalty = own.reduce((sum, f) => sum + PENALTY[f.severity], 0);
    return { category, max, earned: Math.max(0, max - Math.min(max, penalty)), findings: own };
  });

  const score = Math.round(categories.reduce((sum, c) => sum + c.earned, 0));
  return {
    score,
    label: { ar: "جودة السيرة (سيرتي)", en: "Seerati Resume Quality" },
    categories,
    findings,
  };
}

/** A short, honest explanation the assistant may narrate — it never sets the score. */
export function explainFinding(f: LintFinding, lang: "ar" | "en"): string {
  const ar = lang === "ar";
  const cat = ar ? LINT_CATEGORY_LABEL[f.category].ar : LINT_CATEGORY_LABEL[f.category].en;
  return `${cat} — ${ar ? f.message.ar : f.message.en}`;
}
