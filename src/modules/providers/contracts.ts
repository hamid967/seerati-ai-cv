import { z } from "zod";
import type { CareerProfileGraph } from "@/modules/career";

export const ProviderErrorCodeSchema = z.enum([
  "invalid_request",
  "consent_required",
  "timeout",
  "cancelled",
  "rate_limited",
  "unavailable",
  "parse_failed",
  "export_failed",
  "storage_failed",
  "unknown",
]);
export type ProviderErrorCode = z.infer<typeof ProviderErrorCodeSchema>;

export type ProviderError = {
  code: ProviderErrorCode;
  retryable: boolean;
  provider: string;
  safeMessage: string;
};

export type ProviderContext = {
  requestId: string;
  locale: "ar" | "en";
  timeoutMs: number;
  signal?: AbortSignal;
  sensitivity: "public" | "personal" | "sensitive";
};

export type AIAction =
  | "write_summary"
  | "improve_bullet"
  | "suggest_skills"
  | "extract_achievement"
  | "translate"
  | "shorten"
  | "expand"
  | "match_job"
  | "review_resume"
  | "write_cover_letter"
  | "prepare_interview";

export type AIRequest = ProviderContext & {
  action: AIAction;
  graph: CareerProfileGraph;
  allowedFactIds: string[];
  consentAiProcessing: boolean;
  targetRole?: string;
  outputSchemaVersion: 1;
};

export type AISuggestion = {
  id: string;
  action: AIAction;
  proposedValue: string;
  evidenceFactIds: string[];
  requiresApproval: true;
};

export type AIResponse = {
  provider: string;
  suggestions: AISuggestion[];
  usage?: { inputTokens?: number; outputTokens?: number };
};

export interface AIProvider {
  readonly id: string;
  suggest(request: AIRequest): Promise<AIResponse | { error: ProviderError }>;
}

export type ParseRequest = ProviderContext & {
  filenameLabel: string;
  mimeType: string;
  text: string;
};

export type ParseCandidate = {
  fieldPath: string;
  value: string;
  confidence: number;
  source: "imported_pdf" | "imported_docx" | "imported_text";
};

export interface ParserProvider {
  readonly id: string;
  parse(
    request: ParseRequest,
  ): Promise<{ candidates: ParseCandidate[] } | { error: ProviderError }>;
}

export type PdfRequest = ProviderContext & {
  graph: CareerProfileGraph;
  templateId: string;
  direction: "rtl" | "ltr";
  format: "visual" | "ats" | "print";
};

export interface PDFProvider {
  readonly id: string;
  export(
    request: PdfRequest,
  ): Promise<{ bytes: Uint8Array; mimeType: "application/pdf" } | { error: ProviderError }>;
}

export interface StorageProvider {
  readonly id: string;
  save(
    graph: CareerProfileGraph,
    context: ProviderContext,
  ): Promise<{ id: string } | { error: ProviderError }>;
  load(
    id: string,
    context: ProviderContext,
  ): Promise<CareerProfileGraph | { error: ProviderError }>;
  delete(
    id: string,
    context: ProviderContext,
  ): Promise<{ deleted: true } | { error: ProviderError }>;
}

export interface ErrorProvider {
  readonly id: string;
  report(error: ProviderError, context: Pick<ProviderContext, "requestId">): void;
}

export function providerError(
  code: ProviderErrorCode,
  provider: string,
  safeMessage: string,
  retryable = false,
): { error: ProviderError } {
  return { error: { code, provider, safeMessage, retryable } };
}
