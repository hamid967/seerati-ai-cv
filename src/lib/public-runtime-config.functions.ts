import { createServerFn } from "@tanstack/react-start";

export type PublicRuntimeConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  configured: boolean;
};

/**
 * Returns browser-safe connection metadata only.
 * Never add secret/service-role credentials to this response.
 */
export const getPublicRuntimeConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicRuntimeConfig> => {
    const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
    const supabasePublishableKey =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";

    return {
      supabaseUrl,
      supabasePublishableKey,
      configured: Boolean(supabaseUrl && supabasePublishableKey),
    };
  },
);
