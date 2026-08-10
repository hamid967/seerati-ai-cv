/**
 * Import pipeline — connectors stage.
 *
 * Only official exports and user-pasted text are supported. There is no
 * scraping and no password-based access to any job platform, so a card can
 * never claim a direct connection it does not have.
 */
export {
  CONNECTORS,
  MODE_BADGE,
  SOURCE_LABEL,
  connectorById,
  type Connector,
  type ConnectorMode,
  type SourceType,
} from "../import-connectors";

export const ACCEPTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx", ".pdf"] as const;

export const ACCEPTED_MIME = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/** 8 MB is plenty for a resume and keeps browser parsing responsive. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type FileGate =
  { ok: true; kind: "txt" | "md" | "docx" | "pdf" } | { ok: false; reason: "size" | "type" };

/** Validate a picked file by extension, MIME and size before any parsing. */
export function gateFile(file: { name: string; type: string; size: number }): FileGate {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "size" };
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) return { ok: true, kind: "txt" };
  if (name.endsWith(".md") || name.endsWith(".markdown")) return { ok: true, kind: "md" };
  if (name.endsWith(".docx")) return { ok: true, kind: "docx" };
  if (name.endsWith(".pdf")) return { ok: true, kind: "pdf" };
  if (file.type === "text/plain") return { ok: true, kind: "txt" };
  return { ok: false, reason: "type" };
}
