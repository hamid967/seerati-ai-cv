import { z } from "zod";

export const ReleaseCardSchema = z.object({
  id: z.string(),
  kind: z.enum(["template", "ats-rule", "ai-action", "taxonomy", "content"]),
  version: z.string(),
  status: z.enum(["draft", "active", "deprecated"]),
  updatedAt: z.string().datetime(),
  auditId: z.string(),
});
export type ReleaseCard = z.infer<typeof ReleaseCardSchema>;
export const FeatureFlagSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  updatedAt: z.string().datetime(),
  auditId: z.string(),
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export const ProviderHealthSchema = z.object({
  providerId: z.string(),
  status: z.enum(["healthy", "degraded", "unavailable"]),
  checkedAt: z.string().datetime(),
  latencyMs: z.number().nonnegative(),
});
export type ProviderHealth = z.infer<typeof ProviderHealthSchema>;

export class MetadataRegistry {
  private readonly releases = new Map<string, ReleaseCard>();
  private readonly flags = new Map<string, FeatureFlag>();
  private readonly health = new Map<string, ProviderHealth>();

  setRelease(card: ReleaseCard): ReleaseCard {
    const parsed = ReleaseCardSchema.parse(card);
    this.releases.set(parsed.id, parsed);
    return structuredClone(parsed);
  }
  setFlag(flag: FeatureFlag): FeatureFlag {
    const parsed = FeatureFlagSchema.parse(flag);
    this.flags.set(parsed.id, parsed);
    return structuredClone(parsed);
  }
  setProviderHealth(value: ProviderHealth): ProviderHealth {
    const parsed = ProviderHealthSchema.parse(value);
    this.health.set(parsed.providerId, parsed);
    return structuredClone(parsed);
  }
  snapshot() {
    return {
      releases: [...this.releases.values()],
      flags: [...this.flags.values()],
      health: [...this.health.values()],
    };
  }
}

export const createMetadataRegistry = () => new MetadataRegistry();
