# Seerati AI CV — Repository Audit

## Scope

The repository is a TanStack Start application using React 19, TypeScript, Vite, Bun/npm scripts, Tailwind CSS v4, Radix UI, Supabase, AI SDK abstractions, and browser PDF helpers. The primary builder routes are `/assistant`, `/import`, `/resumes/new`, `/resumes/$id/edit`, `/resumes/$id/preview`, `/ats`, and `/templates`.

## Current data flow

Authenticated resumes are loaded from the `resumes` table through `src/lib/store.tsx` and updated through RLS-protected Supabase calls. Anonymous resumes previously used `localStorage` through `src/lib/guest-store.ts`; this was replaced with an in-memory module store. Optional recovery is exposed only through consent-gated `sessionStorage` helpers and is not enabled by default.

AI requests are routed through server-side helpers under `src/lib/ai*.server.ts` and `src/lib/ai.functions.ts`. Client components request only the action they need. Future work should keep prompts bounded and redact personal fields from diagnostics.

## Findings

The most important privacy risk was automatic guest persistence and migration into cloud storage after authentication. The anonymous path also lacked a visible deletion control and an inactivity expiry. The first implementation now removes that default persistence, prevents automatic migration, adds a visible privacy status, adds explicit deletion, and expires anonymous state after 20 minutes of inactivity.

PDF generation currently includes browser rendering helpers and a print fallback. It requires regression fixtures for Arabic, English, bilingual, long URLs, and page breaks before production sign-off. The existing ATS surface is advisory and should remain explicitly non-guaranteeing.

## Remaining verification

Run `npm install`, `npm run lint`, `npm run build`, and `npm run qa` in CI. Browser-level network inspection is still required to prove that anonymous CV content is absent from Supabase, analytics, and error telemetry.
