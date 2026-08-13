import { PrivacyPreviewSchema, type PrivacyPreview } from "./contracts";

export type PrivacyPreviewInput = {
  dataLocation?: "memory" | "consented_recovery" | "account";
  availableFields: string[];
  requestedFields: string[];
  reason: string;
  provider?: string;
  expiresAt?: string | null;
  consentAiProcessing: boolean;
  saveState?: "not_saved" | "consented" | "account_saved";
};

export function buildPrivacyPreview(input: PrivacyPreviewInput): PrivacyPreview {
  const fieldsIncluded = input.consentAiProcessing
    ? input.requestedFields.filter((field) => input.availableFields.includes(field))
    : [];
  const fieldsExcluded = input.availableFields.filter((field) => !fieldsIncluded.includes(field));
  return PrivacyPreviewSchema.parse({
    dataLocation: input.dataLocation ?? "memory",
    fieldsIncluded,
    fieldsExcluded,
    reason: input.reason,
    provider: input.consentAiProcessing ? (input.provider ?? "not_selected") : "none",
    expiresAt: input.expiresAt ?? null,
    saveState: input.saveState ?? "not_saved",
    canDelete: true,
    canCancel: true,
    sendsContent: fieldsIncluded.length > 0,
  });
}
