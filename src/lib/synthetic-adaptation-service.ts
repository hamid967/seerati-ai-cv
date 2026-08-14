import type { SyntheticAdaptationContent, SyntheticAdaptationRequest } from "./ai-types";

export type SyntheticAdaptationResult =
  | {
      kind: "adapted";
      content: SyntheticAdaptationContent;
    }
  | {
      kind: "deterministic";
      reason: "guest" | "unavailable" | "not-consented";
    };

/**
 * Mirrors the general AI boundary: a visitor without a Supabase session must not
 * invoke the authenticated server function. This only reads auth state; it never
 * writes sample data to browser storage.
 */
async function hasSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.access_token);
  } catch {
    return false;
  }
}

export async function canUseSyntheticAdaptation() {
  return hasSession();
}

export async function adaptSyntheticSample(
  request: SyntheticAdaptationRequest,
): Promise<SyntheticAdaptationResult> {
  if (request.consent !== true) return { kind: "deterministic", reason: "not-consented" };
  if (!(await hasSession())) return { kind: "deterministic", reason: "guest" };

  try {
    const { runSyntheticAdaptation } = await import("./synthetic-adaptation.functions");
    const response = await runSyntheticAdaptation({ data: request });
    if (!response.ok) return { kind: "deterministic", reason: "unavailable" };
    return {
      kind: "adapted",
      content: {
        summary: response.content.summary,
        responsibilities: response.content.responsibilities,
        skills: response.content.skills,
        project: response.content.project,
        certificate: response.content.certificate,
      },
    };
  } catch {
    return { kind: "deterministic", reason: "unavailable" };
  }
}
