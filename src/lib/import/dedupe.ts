/**
 * Import pipeline — dedupe stage.
 *
 * Finds items that already exist in the Career Twin (or repeat inside the
 * import itself) so the review screen can offer Merge / Keep both / Replace
 * instead of silently duplicating a job or a degree.
 */
import type { Education, Experience, SkillItem } from "../types";

const norm = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Token overlap ratio, used as a cheap similarity measure. */
export function similarity(a: string, b: string): number {
  const at = new Set(norm(a).split(" ").filter(Boolean));
  const bt = new Set(norm(b).split(" ").filter(Boolean));
  if (!at.size || !bt.size) return 0;
  let hit = 0;
  at.forEach((t) => {
    if (bt.has(t)) hit += 1;
  });
  return hit / Math.max(at.size, bt.size);
}

export type DuplicateKind = "exact" | "likely" | "none";

export type DuplicateHit<T> = {
  incoming: T;
  existing: T | null;
  kind: DuplicateKind;
  score: number;
};

const yearOf = (v?: string) => (v ?? "").match(/(19|20)\d{2}/)?.[0] ?? "";

export function matchExperience(incoming: Experience, existing: Experience[]): DuplicateHit<Experience> {
  let best: { item: Experience; score: number } | null = null;
  for (const e of existing) {
    const score =
      similarity(incoming.company, e.company) * 0.6 + similarity(incoming.role, e.role) * 0.4;
    const sameStart = yearOf(incoming.start) && yearOf(incoming.start) === yearOf(e.start);
    const total = Math.min(1, score + (sameStart ? 0.2 : 0));
    if (!best || total > best.score) best = { item: e, score: total };
  }
  if (!best || best.score < 0.5) return { incoming, existing: null, kind: "none", score: best?.score ?? 0 };
  return {
    incoming,
    existing: best.item,
    kind: best.score >= 0.85 ? "exact" : "likely",
    score: best.score,
  };
}

export function matchEducation(incoming: Education, existing: Education[]): DuplicateHit<Education> {
  let best: { item: Education; score: number } | null = null;
  for (const e of existing) {
    const score =
      similarity(incoming.school, e.school) * 0.6 + similarity(incoming.degree, e.degree) * 0.4;
    if (!best || score > best.score) best = { item: e, score };
  }
  if (!best || best.score < 0.5) return { incoming, existing: null, kind: "none", score: best?.score ?? 0 };
  return {
    incoming,
    existing: best.item,
    kind: best.score >= 0.85 ? "exact" : "likely",
    score: best.score,
  };
}

/** Case/spacing-insensitive skill dedupe, preserving the user's existing entry. */
export function dedupeSkills(incoming: SkillItem[], existing: SkillItem[]): SkillItem[] {
  const seen = new Set(existing.map((s) => norm(s.name)));
  const out: SkillItem[] = [];
  for (const s of incoming) {
    const key = norm(s.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** Drop repeated bullets within one entry, keeping the first phrasing. */
export function dedupeBullets(bullets: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of bullets) {
    const key = norm(b);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(b.trim());
  }
  return out;
}

export type MergeChoice = "merge" | "keep_both" | "replace" | "skip";

export const MERGE_CHOICE_LABEL: Record<MergeChoice, { ar: string; en: string }> = {
  merge: { ar: "دمج", en: "Merge" },
  keep_both: { ar: "أبقِ الاثنين", en: "Keep both" },
  replace: { ar: "استبدال", en: "Replace" },
  skip: { ar: "تجاهل", en: "Skip" },
};

/** Apply the user's choice for one duplicated experience entry. */
export function applyExperienceChoice(
  hit: DuplicateHit<Experience>,
  choice: MergeChoice,
  list: Experience[],
): Experience[] {
  if (choice === "skip" || !hit.existing) {
    return choice === "skip" ? list : [...list, hit.incoming];
  }
  if (choice === "keep_both") return [...list, hit.incoming];
  if (choice === "replace") {
    return list.map((e) => (e.id === hit.existing!.id ? { ...hit.incoming, id: e.id } : e));
  }
  return list.map<Experience>((e) => {
    if (e.id !== hit.existing!.id) return e;
    const start = e.start || hit.incoming.start;
    const end = e.end || hit.incoming.end;
    return {
      ...e,
      role: e.role || hit.incoming.role,
      company: e.company || hit.incoming.company,
      ...(start ? { start } : {}),
      ...(end ? { end } : {}),
      bullets: dedupeBullets([...e.bullets, ...hit.incoming.bullets]),
    };
  });
}
