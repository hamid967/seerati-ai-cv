/**
 * Client-side document text extraction for the Import Center.
 *
 * Everything runs in the browser: the file is read, its text is extracted and
 * the File object is dropped. Nothing is uploaded to storage and the raw file
 * is never persisted (processing is transient by default).
 *
 * Supported: TXT, MD (native), DOCX (mammoth), text-based PDF (pdf.js).
 * Scanned/image PDFs are reported honestly — we do not run OCR.
 */

export const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

export type FileKind = "txt" | "md" | "docx" | "pdf";

export type ExtractOutcome =
  | { ok: true; text: string; kind: FileKind; fileName: string; pages?: number }
  | { ok: false; reason: ExtractError; kind?: FileKind; fileName: string };

export type ExtractError =
  | "too_large"
  | "unsupported_type"
  | "empty_file"
  | "scanned_pdf"
  | "encrypted_pdf"
  | "parse_failed";

export const EXTRACT_ERROR_MESSAGE: Record<ExtractError, { ar: string; en: string }> = {
  too_large: {
    ar: "حجم الملف أكبر من ٨ ميجابايت. جرّب ملفاً أصغر.",
    en: "The file is larger than 8 MB. Please try a smaller file.",
  },
  unsupported_type: {
    ar: "الصيغة غير مدعومة. المدعوم حالياً: PDF نصي، DOCX، TXT، MD.",
    en: "Unsupported format. Supported today: text PDF, DOCX, TXT, MD.",
  },
  empty_file: { ar: "الملف لا يحتوي نصاً قابلاً للقراءة.", en: "The file has no readable text." },
  scanned_pdf: {
    ar: "الملف صورة ممسوحة ولا يمكن استخراج النص تلقائياً حالياً — الصق النص أو استخدم ملفاً نصياً.",
    en: "This PDF is a scanned image, so text cannot be extracted automatically — paste the text or use a text file.",
  },
  encrypted_pdf: {
    ar: "الملف محمي بكلمة مرور. أزل الحماية ثم أعد المحاولة.",
    en: "This PDF is password protected. Remove the protection and try again.",
  },
  parse_failed: {
    ar: "تعذّر قراءة الملف. جرّب تصديره مرة أخرى أو الصق النص.",
    en: "We could not read this file. Export it again or paste the text instead.",
  },
};

const EXT_KIND: Record<string, FileKind> = {
  txt: "txt",
  md: "md",
  markdown: "md",
  docx: "docx",
  pdf: "pdf",
};

/** MIME types we accept per kind. Empty/unknown MIME is tolerated (mobile pickers). */
const MIME_OK: Record<FileKind, RegExp> = {
  txt: /^(text\/plain|text\/markdown|application\/octet-stream)?$/i,
  md: /^(text\/plain|text\/markdown|application\/octet-stream)?$/i,
  docx: /^(application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/octet-stream|application\/zip)?$/i,
  pdf: /^(application\/pdf|application\/octet-stream)?$/i,
};

export const ACCEPT_ATTR = ".pdf,.docx,.txt,.md";

export function fileKindOf(file: File): FileKind | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = EXT_KIND[ext];
  if (!kind) return null;
  // Validate MIME *and* extension so a renamed binary cannot slip through.
  if (!MIME_OK[kind].test(file.type ?? "")) return null;
  return kind;
}

/** Normalises whitespace and Arabic/Latin punctuation without changing meaning. */
export function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0|\u200f|\u200e/g, " ")
    .replace(/[\u2022\u25aa\u25e6\u00b7]/g, "- ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const arrayBuffer = await file.arrayBuffer();
  const runner = (mammoth as unknown as {
    default?: { extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
    extractRawText?: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  });
  const extractRawText = runner.extractRawText ?? runner.default?.extractRawText;
  if (!extractRawText) throw new Error("mammoth_unavailable");
  const result = await extractRawText({ arrayBuffer });
  return result.value ?? "";
}

async function extractPdf(file: File): Promise<{ text: string; pages: number }> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const chunks: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s{2,}/g, " ");
    chunks.push(line);
  }
  const pages = doc.numPages;
  await doc.cleanup();
  return { text: chunks.join("\n"), pages };
}

/**
 * Reads a user-selected file entirely in the browser and returns its text.
 * The File itself is never uploaded or stored.
 */
export async function extractFileText(file: File): Promise<ExtractOutcome> {
  const fileName = file.name;
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: "too_large", fileName };
  if (file.size === 0) return { ok: false, reason: "empty_file", fileName };

  const kind = fileKindOf(file);
  if (!kind) return { ok: false, reason: "unsupported_type", fileName };

  try {
    if (kind === "txt" || kind === "md") {
      const text = normalizeExtractedText(await file.text());
      if (!text) return { ok: false, reason: "empty_file", kind, fileName };
      return { ok: true, text, kind, fileName };
    }

    if (kind === "docx") {
      const text = normalizeExtractedText(await extractDocx(file));
      if (text.length < 20) return { ok: false, reason: "empty_file", kind, fileName };
      return { ok: true, text, kind, fileName };
    }

    const { text, pages } = await extractPdf(file);
    const clean = normalizeExtractedText(text);
    // A text PDF yields plenty of characters per page; near-empty means it is a scan.
    if (clean.replace(/\s/g, "").length < Math.max(60, pages * 40)) {
      return { ok: false, reason: "scanned_pdf", kind, fileName };
    }
    return { ok: true, text: clean, kind, fileName, pages };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password|encrypt/i.test(message)) return { ok: false, reason: "encrypted_pdf", kind, fileName };
    console.error("[import] extraction failed", kind, message);
    return { ok: false, reason: "parse_failed", kind, fileName };
  }
}

/** Detects the dominant script of a text block. */
export function detectLanguage(text: string): "ar" | "en" | "mixed" {
  const arabic = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (!arabic && !latin) return "en";
  const total = arabic + latin;
  const arabicShare = arabic / total;
  if (arabicShare > 0.75) return "ar";
  if (arabicShare < 0.25) return "en";
  return "mixed";
}
