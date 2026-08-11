export const PRODUCT_EVENTS = [
  "career_passport_viewed",
  "career_passport_group_copied",
  "career_passport_exported",
  "arabic_intelligence_viewed",
  "resume_studio_opened",
  "application_readiness_viewed",
  "tailoring_plan_viewed",
  "tailoring_change_applied",
  "tailoring_change_undone",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

export type SafeAnalyticsValue = string | number | boolean | null;
export type SafeAnalyticsProperties = Record<string, SafeAnalyticsValue>;

const FORBIDDEN_KEYS = /(?:name|email|phone|mobile|summary|description|resume|bullet|experience|company|jobtitle|job_title|url|link|evidence|fact|text|content|message)/i;
const MAX_VALUE_LENGTH = 80;

/**
 * Analytics contract intentionally excludes career content and identity data.
 * It emits an in-browser CustomEvent only; no external analytics provider is
 * configured here. A future adapter must consume only this sanitized payload.
 */
export function sanitizeAnalyticsProperties(properties: SafeAnalyticsProperties = {}) {
  const safe: SafeAnalyticsProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_KEYS.test(key)) continue;
    if (typeof value === "string") {
      safe[key] = value.slice(0, MAX_VALUE_LENGTH);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean" || value === null) {
      safe[key] = value;
    }
  }
  return safe;
}

export function trackProductEvent(
  name: ProductEventName,
  properties: SafeAnalyticsProperties = {},
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("seerati:product-event", {
      detail: {
        name,
        properties: sanitizeAnalyticsProperties(properties),
        occurredAt: new Date().toISOString(),
      },
    }),
  );
}
