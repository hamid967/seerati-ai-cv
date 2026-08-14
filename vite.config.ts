// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { format, resolveConfig } from "prettier";

const MCP_GENERATED_ROUTE_FILES = [
  "src/routes/mcp.ts",
  "src/routes/[.mcp]/list-tools.ts",
  "src/routes/[.mcp]/invoke-tool/$tool.ts",
  "src/routes/[.well-known]/oauth-protected-resource.ts",
] as const;

function formatGeneratedMcpRoutes() {
  let projectRoot = process.cwd();

  const applyPrettier = async () => {
    await Promise.all(
      MCP_GENERATED_ROUTE_FILES.map(async (relativePath) => {
        const file = resolve(projectRoot, relativePath);
        const source = await readFile(file, "utf8");
        const options = (await resolveConfig(file)) ?? {};
        const formatted = await format(source, { ...options, filepath: file });
        if (formatted !== source) await writeFile(file, formatted, "utf8");
      }),
    );
  };

  return {
    name: "seerati:format-generated-mcp-routes",
    enforce: "post" as const,
    configResolved: async (config: { root: string }) => {
      projectRoot = config.root;
      await applyPrettier();
    },
    buildStart: applyPrettier,
  };
}

/**
 * Public backend connection values. These are publishable (safe in the client
 * bundle) and act as a last-resort fallback so a build environment that fails
 * to inject `VITE_SUPABASE_*` can never ship a bundle that throws
 * "Missing Supabase environment variable(s)" during hydration.
 */
const PUBLIC_ENV_FALLBACKS = {
  VITE_SUPABASE_URL: "https://ywqufkamftsacnzxvjsr.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_k3uH2g9DrFup3niIq5AviQ_XRsk-HJP",
  VITE_SUPABASE_PROJECT_ID: "ywqufkamftsacnzxvjsr",
} as const;

function resolvePublicEnv(key: keyof typeof PUBLIC_ENV_FALLBACKS): string {
  const value = process.env[key];
  if (value) return value;
  // Server-side twins carry the same public values in some environments.
  const serverTwin = process.env[key.replace(/^VITE_/, "")];
  if (serverTwin) return serverTwin;
  return PUBLIC_ENV_FALLBACKS[key];
}

export default defineConfig({
  vite: {
    plugins: [mcpPlugin(), formatGeneratedMcpRoutes()],
    // Vite's `define` replacement is applied directly to the browser bundle.
    // Keeping these publishable values here prevents hydration from depending
    // on whether a particular build runner exported VITE_* variables.
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(resolvePublicEnv("VITE_SUPABASE_URL")),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        resolvePublicEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        resolvePublicEnv("VITE_SUPABASE_PROJECT_ID"),
      ),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
