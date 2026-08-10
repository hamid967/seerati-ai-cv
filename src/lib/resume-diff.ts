/**
 * Deterministic resume diff.
 *
 * Compares two resume snapshots field by field and returns a flat, displayable
 * list of changes grouped by section. No AI, no heuristics: the same two
 * snapshots always produce the same diff, which is what makes "Restore" and
 * "Compare" trustworthy.
 *
 * Arrays of resume items are matched by `id` first (so reordering is not
 * reported as an edit), then by index for id-less arrays such as bullets.
 */
import type { ResumeData, SectionKey } from "./types";

export type DiffKind = "added" | "removed" | "changed";

export type FieldDiff = {
  /** Dotted path, e.g. "experience.exp_1.bullets.0" or "personal.email". */
  path: string;
  /** Section this path belongs to, for grouping in the UI. */
  section: string;
  /** Human label for the changed field, bilingual where we know it. */
  label: { ar: string; en: string };
  kind: DiffKind;
  before: string;
  after: string;
};

export type SectionDiff = {
  section: string;
  label: { ar: string; en: string };
  changes: FieldDiff[];
  added: number;
  removed: number;
  changed: number;
};

export type ResumeDiff = {
  /** True when the two snapshots are field-for-field identical. */
  identical: boolean;
  total: number;
  sections: SectionDiff[];
  changes: FieldDiff[];
};

const SECTION_LABEL: Record<string, { ar: string; en: string }> = {
  personal: { ar: "البيانات الشخصية", en: "Personal details" },
  summary: { ar: "الملخص المهني", en: "Professional summary" },
  targetJob: { ar: "الوظيفة المستهدفة", en: "Target job" },
  jobDescription: { ar: "الوصف الوظيفي", en: "Job description" },
  experience: { ar: "الخبرات", en: "Experience" },
  education: { ar: "التعليم", en: "Education" },
  skills: { ar: "المهارات", en: "Skills" },
  languages: { ar: "اللغات", en: "Languages" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  projects: { ar: "المشاريع", en: "Projects" },
  achievements: { ar: "الإنجازات", en: "Achievements" },
  volunteering: { ar: "العمل التطوعي", en: "Volunteering" },
  links: { ar: "الروابط", en: "Links" },
  references: { ar: "التزكيات", en: "References" },
  custom: { ar: "أقسام مخصّصة", en: "Custom sections" },
  sectionOrder: { ar: "ترتيب الأقسام", en: "Section order" },
  hiddenSections: { ar: "الأقسام المخفية", en: "Hidden sections" },
  design: { ar: "التصميم", en: "Design" },
};

export const sectionLabel = (section: string) =>
  SECTION_LABEL[section] ?? { ar: section, en: section };

const text = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(text).filter(Boolean).join(", ");
  return JSON.stringify(v);
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Short readable title for one resume item, used in diff labels. */
function itemTitle(item: unknown): string {
  if (!isRecord(item)) return text(item);
  for (const key of ["role", "degree", "title", "name", "label"]) {
    const v = item[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

function pushScalar(
  out: FieldDiff[],
  section: string,
  path: string,
  label: { ar: string; en: string },
  before: unknown,
  after: unknown,
) {
  const b = text(before);
  const a = text(after);
  if (b === a) return;
  const kind: DiffKind = !b ? "added" : !a ? "removed" : "changed";
  out.push({ path, section, label, kind, before: b, after: a });
}

/** Diff two objects of scalars (personal details, design, one list item). */
function diffObject(
  out: FieldDiff[],
  section: string,
  basePath: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  prefix?: string,
) {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  for (const key of keys.sort()) {
    const b = before[key];
    const a = after[key];
    if (Array.isArray(b) || Array.isArray(a)) {
      diffPrimitiveList(
        out,
        section,
        `${basePath}.${key}`,
        (b as unknown[]) ?? [],
        (a as unknown[]) ?? [],
        prefix ? `${prefix} · ${key}` : key,
      );
      continue;
    }
    pushScalar(
      out,
      section,
      `${basePath}.${key}`,
      { ar: prefix ? `${prefix} · ${key}` : key, en: prefix ? `${prefix} · ${key}` : key },
      b,
      a,
    );
  }
}

/** Index-matched diff for arrays of plain values (bullets, sectionOrder). */
function diffPrimitiveList(
  out: FieldDiff[],
  section: string,
  basePath: string,
  before: unknown[],
  after: unknown[],
  label: string,
) {
  const len = Math.max(before.length, after.length);
  for (let i = 0; i < len; i++) {
    pushScalar(
      out,
      section,
      `${basePath}.${i}`,
      { ar: `${label} ${i + 1}`, en: `${label} ${i + 1}` },
      before[i],
      after[i],
    );
  }
}

/** Id-matched diff for lists of resume items. */
function diffItemList(
  out: FieldDiff[],
  section: string,
  before: unknown[],
  after: unknown[],
) {
  const keyOf = (item: unknown, index: number) =>
    isRecord(item) && typeof item['id'] === "string" && item['id'] ? item['id'] : `#${index}`;

  const beforeMap = new Map(before.map((it, i) => [keyOf(it, i), it]));
  const afterMap = new Map(after.map((it, i) => [keyOf(it, i), it]));

  for (const [key, item] of beforeMap) {
    if (afterMap.has(key)) continue;
    out.push({
      path: `${section}.${key}`,
      section,
      label: { ar: `عنصر محذوف: ${itemTitle(item)}`, en: `Removed item: ${itemTitle(item)}` },
      kind: "removed",
      before: itemTitle(item),
      after: "",
    });
  }
  for (const [key, item] of afterMap) {
    if (beforeMap.has(key)) continue;
    out.push({
      path: `${section}.${key}`,
      section,
      label: { ar: `عنصر جديد: ${itemTitle(item)}`, en: `New item: ${itemTitle(item)}` },
      kind: "added",
      before: "",
      after: itemTitle(item),
    });
  }
  for (const [key, beforeItem] of beforeMap) {
    const afterItem = afterMap.get(key);
    if (!afterItem) continue;
    if (isRecord(beforeItem) && isRecord(afterItem)) {
      diffObject(out, section, `${section}.${key}`, beforeItem, afterItem, itemTitle(afterItem));
    } else {
      pushScalar(out, section, `${section}.${key}`, sectionLabel(section), beforeItem, afterItem);
    }
  }
}

const LIST_SECTIONS: SectionKey[] = [
  "experience",
  "education",
  "skills",
  "languages",
  "certificates",
  "projects",
  "achievements",
  "volunteering",
  "links",
  "references",
  "custom",
];

/** Compare two resume snapshots. Tolerant of partial/unknown snapshot shapes. */
export function diffResumeData(
  before: Partial<ResumeData> | null | undefined,
  after: Partial<ResumeData> | null | undefined,
): ResumeDiff {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const changes: FieldDiff[] = [];

  diffObject(
    changes,
    "personal",
    "personal",
    isRecord(b['personal']) ? b['personal'] : {},
    isRecord(a['personal']) ? a['personal'] : {},
  );

  for (const key of ["summary", "targetJob", "jobDescription"] as const) {
    pushScalar(changes, key, key, sectionLabel(key), b[key], a[key]);
  }

  for (const section of LIST_SECTIONS) {
    diffItemList(
      changes,
      section,
      Array.isArray(b[section]) ? (b[section] as unknown[]) : [],
      Array.isArray(a[section]) ? (a[section] as unknown[]) : [],
    );
  }

  for (const key of ["sectionOrder", "hiddenSections"] as const) {
    const bl = Array.isArray(b[key]) ? (b[key] as unknown[]) : [];
    const al = Array.isArray(a[key]) ? (a[key] as unknown[]) : [];
    if (text(bl) !== text(al)) {
      pushScalar(changes, key, key, sectionLabel(key), bl, al);
    }
  }

  diffObject(
    changes,
    "design",
    "design",
    isRecord(b['design']) ? b['design'] : {},
    isRecord(a['design']) ? a['design'] : {},
  );

  const bySection = new Map<string, FieldDiff[]>();
  for (const c of changes) {
    const list = bySection.get(c.section) ?? [];
    list.push(c);
    bySection.set(c.section, list);
  }

  const sections = Array.from(bySection.entries()).map<SectionDiff>(([section, list]) => ({
    section,
    label: sectionLabel(section),
    changes: list,
    added: list.filter((c) => c.kind === "added").length,
    removed: list.filter((c) => c.kind === "removed").length,
    changed: list.filter((c) => c.kind === "changed").length,
  }));

  return {
    identical: changes.length === 0,
    total: changes.length,
    sections,
    changes,
  };
}

/** One-line bilingual summary of a diff, safe to store as a change summary. */
export function describeDiff(diff: ResumeDiff, lang: "ar" | "en"): string {
  const ar = lang === "ar";
  if (diff.identical) return ar ? "لا تغييرات" : "No changes";
  const added = diff.changes.filter((c) => c.kind === "added").length;
  const removed = diff.changes.filter((c) => c.kind === "removed").length;
  const changed = diff.changes.filter((c) => c.kind === "changed").length;
  const parts = [
    added ? (ar ? `${added} إضافة` : `${added} added`) : "",
    changed ? (ar ? `${changed} تعديل` : `${changed} changed`) : "",
    removed ? (ar ? `${removed} حذف` : `${removed} removed`) : "",
  ].filter(Boolean);
  const names = diff.sections
    .map((s) => (ar ? s.label.ar : s.label.en))
    .slice(0, 3)
    .join(ar ? "، " : ", ");
  return `${parts.join(ar ? " · " : " · ")} — ${names}`;
}
