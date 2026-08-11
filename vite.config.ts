// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * The build inlines only `import.meta.env.VITE_X` (dot access). Generated files
 * use `import.meta.env["VITE_X"]`, which stays un-inlined and ends up undefined
 * in the production bundle. Rewrite bracket access to dot access before define.
 */
function inlineViteEnvBracketAccess(): Plugin {
  return {
    name: "inline-vite-env-bracket-access",
    enforce: "pre",
    transform(code, id) {
      if (!/\.(t|j)sx?$/.test(id) || !code.includes('import.meta.env["VITE_')) return null;
      return {
        code: code.replace(
          /import\.meta\.env\[\s*["'](VITE_[A-Za-z0-9_]+)["']\s*\]/g,
          (_m, key: string) => `import.meta.env.${key}`,
        ),
        map: null,
      };
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

