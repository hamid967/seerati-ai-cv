import { parseCareerProfileGraph, type CareerProfileGraph } from "@/modules/career";
import type {
  AIProvider,
  AIRequest,
  AIResponse,
  ErrorProvider,
  PDFProvider,
  PdfRequest,
  ParserProvider,
  ParseRequest,
  ParseCandidate,
  ProviderError,
  StorageProvider,
  ProviderContext,
} from "./contracts";
import { providerError } from "./contracts";

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
}

export class MockAIProvider implements AIProvider {
  readonly id = "mock-ai";
  async suggest(request: AIRequest): Promise<AIResponse | { error: ProviderError }> {
    assertNotAborted(request.signal);
    if (!request.consentAiProcessing)
      return providerError("consent_required", this.id, "AI consent is required.");
    const allowed = new Set(request.allowedFactIds);
    const evidenceFactIds = request.graph.facts
      .filter((fact) => allowed.has(fact.id))
      .map((fact) => fact.id);
    if (!evidenceFactIds.length)
      return providerError("invalid_request", this.id, "At least one allowed fact is required.");
    return {
      provider: this.id,
      suggestions: [
        {
          id: `mock-${request.action}`,
          action: request.action,
          proposedValue:
            request.locale === "ar"
              ? "اقتراح تجريبي يحتاج موافقة المستخدم"
              : "Synthetic suggestion requiring user approval",
          evidenceFactIds,
          requiresApproval: true,
        },
      ],
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }
}

export class MockParserProvider implements ParserProvider {
  readonly id = "mock-parser";
  async parse(request: ParseRequest) {
    assertNotAborted(request.signal);
    const source: ParseCandidate["source"] = request.mimeType.includes("pdf")
      ? "imported_pdf"
      : request.mimeType.includes("word")
        ? "imported_docx"
        : "imported_text";

    return {
      candidates: request.text.trim()
        ? [
            {
              fieldPath: "summary.text",
              value: request.text.trim().slice(0, 2000),
              confidence: 0.5,
              source,
            },
          ]
        : [],
    };
  }
}

export class MockPDFProvider implements PDFProvider {
  readonly id = "mock-pdf";
  async export(request: PdfRequest) {
    assertNotAborted(request.signal);
    const payload = JSON.stringify({
      templateId: request.templateId,
      direction: request.direction,
      format: request.format,
      factCount: request.graph.facts.length,
    });
    return { bytes: new TextEncoder().encode(payload), mimeType: "application/pdf" as const };
  }
}

export class MockStorageProvider implements StorageProvider {
  readonly id = "mock-storage";
  private readonly records = new Map<string, CareerProfileGraph>();
  async save(graph: CareerProfileGraph, context: ProviderContext) {
    assertNotAborted(context.signal);
    const parsed = parseCareerProfileGraph(graph);
    const id = parsed.id;
    this.records.set(id, parsed);
    return { id };
  }
  async load(id: string, context: ProviderContext) {
    assertNotAborted(context.signal);
    const graph = this.records.get(id);
    return graph
      ? parseCareerProfileGraph(graph)
      : providerError("storage_failed", this.id, "Record not found.");
  }
  async delete(id: string, context: ProviderContext) {
    assertNotAborted(context.signal);
    this.records.delete(id);
    return { deleted: true as const };
  }
}

export class MockErrorProvider implements ErrorProvider {
  readonly id = "mock-error";
  readonly errors: Array<{ error: ProviderError; requestId: string }> = [];
  report(error: ProviderError, context: Pick<ProviderContext, "requestId">): void {
    this.errors.push({ error, requestId: context.requestId });
  }
}
