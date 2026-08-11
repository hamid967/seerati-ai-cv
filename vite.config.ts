// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Public backend connection values. These are publishable (safe in the client
 * bundle) and act as a last-resort fallback so a build environment that fails
 * to inject `VITE_SUPABASE_*` can never ship a bundle that throws
 * "Missing Supabase environment variable(s)" during hydration.
 */
const PUBLIC_ENV_FALLBACKS: Record<string, string> = {
  VITE_SUPABASE_URL: "https://ywqufkamftsacnzxvjsr.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_k3uH2g9DrFup3niIq5AviQ_XRsk-HJP",
  VITE_SUPABASE_PROJECT_ID: "ywqufkamftsacnzxvjsr",
};

function resolvePublicEnv(key: string): string | undefined {
  const value = process.env[key];
  if (value) return value;
  // Server-side twins carry the same public values in some environments.
  const serverTwin = process.env[key.replace(/^VITE_/, "")];
  if (serverTwin) return serverTwin;
  return PUBLIC_ENV_FALLBACKS[key];
}

/**
 * The build inlines only `import.meta.env.VITE_X` (dot access). Generated files
 * use `import.meta.env["VITE_X"]`, which stays un-inlined and ends up undefined
 * in the production bundle. Rewrite bracket access to dot access, and for the
 * public backend connection keys inline the literal value directly so the
 * client bundle never depends on define-order or env-injection timing.
 */
function inlineViteEnvBracketAccess(): Plugin {
  return {
    name: "inline-vite-env-bracket-access",
    enforce: "pre",
    transform(code, id) {
      if (!/\.(t|j)sx?$/.test(id)) return null;
      if (!code.includes("import.meta.env")) return null;

      const next = code
        .replace(
          /import\.meta\.env\[\s*["'](VITE_[A-Za-z0-9_]+)["']\s*\]/g,
          (_m, key: string) => `import.meta.env.${key}`,
        )
        .replace(/import\.meta\.env\.(VITE_[A-Za-z0-9_]+)/g, (match, key: string) => {
          if (!(key in PUBLIC_ENV_FALLBACKS)) return match;
          const value = resolvePublicEnv(key);
          return value ? JSON.stringify(value) : match;
        });

      if (next === code) return null;
      return { code: next, map: null };
    },
  };
}

export default defineConfig({
  plugins: [inlineViteEnvBracketAccess()],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
