/**
 * Import pipeline — provenance stage.
 *
 * Every imported item keeps a label describing where it came from and whether
 * the user verified it. The raw file, the raw text and any chat content are
 * never stored — only the source type, a human label and timestamps.
 */
import type { SourceType } from "../import-connectors";

export type Provenance = {
  sourceType: SourceType;
  sourceLabel: string;
  importedAt: string;
  userVerified: boolean;
};

export function makeProvenance(sourceType: SourceType, sourceLabel: string): Provenance {
  return {
    sourceType,
    sourceLabel: sourceLabel.slice(0, 120),
    importedAt: new Date().toISOString(),
    userVerified: false,
  };
}

export const markVerified = (p: Provenance): Provenance => ({ ...p, userVerified: true });

/** File names can carry personal data, so only the extension is kept as a label. */
export function safeFileLabel(fileName: string): string {
  const ext = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  return ext ? `file${ext}` : "file";
}

/** Stamp the fact/evidence columns used by the Career Fact Graph. */
export const provenanceColumns = (p: Provenance) => ({
  sourceType: p.sourceType,
  sourceLabel: p.sourceLabel,
});
