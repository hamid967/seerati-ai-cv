/**
 * Import pipeline — conflict stage.
 *
 * A conflict is a field where the import and the existing Career Twin both hold
 * a value and they disagree. Nothing is written until the user picks a side, so
 * an import can never quietly overwrite what the user already confirmed.
 */

export type ConflictResolution = "keep_existing" | "use_imported" | "merge_manually";

export const RESOLUTION_LABEL: Record<ConflictResolution, { ar: string; en: string }> = {
  keep_existing: { ar: "أبقِ الحالي", en: "Keep existing" },
  use_imported: { ar: "استخدم المستورد", en: "Use imported" },
  merge_manually: { ar: "دمج يدوي", en: "Merge manually" },
};

export type FieldConflict = {
  key: string;
  label: { ar: string; en: string };
  existing: string;
  imported: string;
  resolution: ConflictResolution;
  /** Filled by the user when they choose manual merge. */
  manual?: string;
};

const same = (a: string, b: string) =>
  a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

/** Compare a set of scalar fields and return only the real disagreements. */
export function detectConflicts(
  fields: Array<{ key: string; label: { ar: string; en: string }; existing: string; imported: string }>,
): FieldConflict[] {
  return fields
    .filter((f) => f.existing.trim() && f.imported.trim() && !same(f.existing, f.imported))
    .map((f) => ({ ...f, resolution: "keep_existing" as ConflictResolution }));
}

/** The value that will actually be written for one conflict. */
export function resolvedValue(c: FieldConflict): string {
  if (c.resolution === "use_imported") return c.imported;
  if (c.resolution === "merge_manually") return (c.manual ?? "").trim() || c.existing;
  return c.existing;
}

export const unresolvedManual = (list: FieldConflict[]): FieldConflict[] =>
  list.filter((c) => c.resolution === "merge_manually" && !(c.manual ?? "").trim());
