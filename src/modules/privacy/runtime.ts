import { z } from "zod";

export const StorageModeSchema = z.enum(["memory", "consented-recovery", "authenticated-cloud"]);
export type StorageMode = z.infer<typeof StorageModeSchema>;

export const TransmissionRequestSchema = z.object({
  action: z.string().trim().min(1).max(80),
  allowedFactIds: z.array(z.string().trim().min(1).max(120)).max(200),
  requestedLocale: z.enum(["ar", "en"]),
  sensitivity: z.enum(["public", "personal", "sensitive"]),
  consentAiProcessing: z.boolean(),
  maximumPayloadCharacters: z.number().int().positive().max(100_000),
});
export type TransmissionRequest = z.infer<typeof TransmissionRequestSchema>;

export type TransmissionPreview = {
  allowed: boolean;
  action: string;
  factCount: number;
  requestedLocale: "ar" | "en";
  sensitivity: TransmissionRequest["sensitivity"];
  reason: "consent-required" | "facts-required" | "allowed" | "payload-limit";
};

export type DeletionReceipt = {
  deletedAt: string;
  clearedMemory: boolean;
  clearedRecovery: boolean;
  revokedObjectUrls: number;
  cancelledRequests: number;
};

export class PrivacyPolicyError extends Error {
  constructor(public readonly reason: TransmissionPreview["reason"]) {
    super(`Privacy policy rejected the operation: ${reason}`);
    this.name = "PrivacyPolicyError";
  }
}

export class PrivacyRuntime {
  private mode: StorageMode = "memory";
  private sessionRecoveryConsent = false;
  private readonly objectUrls = new Set<string>();
  private readonly requests = new Set<AbortController>();

  getStorageMode(): StorageMode {
    return this.mode;
  }

  setAuthenticatedCloud(enabled: boolean): void {
    this.mode = enabled
      ? "authenticated-cloud"
      : this.sessionRecoveryConsent
        ? "consented-recovery"
        : "memory";
  }

  setSessionRecoveryConsent(enabled: boolean): void {
    this.sessionRecoveryConsent = enabled;
    if (this.mode !== "authenticated-cloud") this.mode = enabled ? "consented-recovery" : "memory";
  }

  hasSessionRecoveryConsent(): boolean {
    return this.sessionRecoveryConsent;
  }

  previewTransmission(input: TransmissionRequest): TransmissionPreview {
    const request = TransmissionRequestSchema.parse(input);
    if (!request.consentAiProcessing) {
      return {
        allowed: false,
        action: request.action,
        factCount: request.allowedFactIds.length,
        requestedLocale: request.requestedLocale,
        sensitivity: request.sensitivity,
        reason: "consent-required",
      };
    }
    if (request.allowedFactIds.length === 0) {
      return {
        allowed: false,
        action: request.action,
        factCount: 0,
        requestedLocale: request.requestedLocale,
        sensitivity: request.sensitivity,
        reason: "facts-required",
      };
    }
    if (request.maximumPayloadCharacters <= 0) {
      return {
        allowed: false,
        action: request.action,
        factCount: request.allowedFactIds.length,
        requestedLocale: request.requestedLocale,
        sensitivity: request.sensitivity,
        reason: "payload-limit",
      };
    }
    return {
      allowed: true,
      action: request.action,
      factCount: request.allowedFactIds.length,
      requestedLocale: request.requestedLocale,
      sensitivity: request.sensitivity,
      reason: "allowed",
    };
  }

  assertTransmissionAllowed(input: TransmissionRequest): void {
    const preview = this.previewTransmission(input);
    if (!preview.allowed) throw new PrivacyPolicyError(preview.reason);
  }

  trackObjectUrl(url: string): void {
    if (url.startsWith("blob:")) this.objectUrls.add(url);
  }

  registerRequest(controller: AbortController): void {
    this.requests.add(controller);
  }

  releaseRequest(controller: AbortController): void {
    this.requests.delete(controller);
  }

  async clearSession(): Promise<DeletionReceipt> {
    const deletedAt = new Date().toISOString();
    let cancelledRequests = 0;
    for (const controller of this.requests) {
      if (!controller.signal.aborted) {
        controller.abort("privacy-delete");
        cancelledRequests += 1;
      }
    }
    this.requests.clear();
    let revokedObjectUrls = 0;
    if (typeof URL !== "undefined") {
      for (const url of this.objectUrls) {
        URL.revokeObjectURL(url);
        revokedObjectUrls += 1;
      }
    }
    this.objectUrls.clear();
    this.sessionRecoveryConsent = false;
    this.mode = "memory";
    return {
      deletedAt,
      clearedMemory: true,
      clearedRecovery: true,
      revokedObjectUrls,
      cancelledRequests,
    };
  }
}

export const createPrivacyRuntime = () => new PrivacyRuntime();
