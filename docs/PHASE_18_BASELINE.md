# Phase 18 Baseline

**Branch:** `feat/phase-18-career-operating-system`
**Base:** `origin/main` at `f5840d74e718d15990855a7851f9612f886fc2d2`
**Repository:** `hamid967/seerati-ai-cv`
**Production target:** `https://cv.hrhbs.com`

## Architecture

Seerati is currently a TanStack Start application using React 19, Vite 8, Tailwind v4, shadcn components, and a remote hosted Supabase project. The repository is not a Monorepo and does not currently contain `packages/` or `src/modules/`; domain logic is distributed primarily across `src/lib`, `src/components`, and `src/routes`.

The current product already contains Resume/ResumeData types, a guest-store boundary, Supabase account persistence, ATS and resume-lint logic, job matching, import stages, PDF export, 24 active templates, assistant routes, and release-hardening scripts. Phase 18 must therefore use adapters and compatibility layers before replacing existing models.

## Bundle and performance

Phase 17 established the current performance baseline against a Wrangler production-like preview. CLS was within the target on the measured public routes, but LCP and Performance Score were not yet within the intended product budgets.

| Route | Median LCP | Median CLS | Median Performance |
|---|---:|---:|---:|
| `/` | 4.194s | 0.000 | 78 |
| `/assistant` | 4.241s | 0.000 | 77 |
| `/templates` | 4.031s | 0.000 | 79 |
| `/jobs` | 4.216s | 0.036 | 77 |

Phase 18 must not add large engines to the initial bundle. The initial route should retain only shell, language, privacy status, first action, and lightweight preview concerns.

## Privacy

Anonymous resume content is held in module memory through `src/lib/guest-store.ts`. Optional session recovery uses `sessionStorage` only after explicit consent. Authenticated data uses Supabase and RLS. The guest contract is memory-only by default, no remote upload by default, and immediate deletion of memory plus consented recovery.

The Phase 18 Privacy Runtime must make these states explicit:

| Mode | Location | Persistence | User action |
|---|---|---|---|
| Memory-only | Browser memory | Tab/session lifetime | Delete now clears memory |
| Consented recovery | `sessionStorage` | Explicitly consented browser recovery | Delete clears recovery and consent |
| Authenticated cloud | Supabase/RLS | Account-controlled | Export/delete through account controls |

No guest content may be placed in analytics, URLs, logs, or request metadata. AI transmission requires an explicit preview and approval boundary.

## AI

The project contains assistant and AI service integrations plus action-specific safety checks. Phase 18 must add a shared request contract rather than bypassing existing provider logic. Initial actions should be limited to `improve_bullet`, `write_summary`, and `translate`, with synthetic fixtures and user approval.

## ATS and job matching

The repository contains deterministic ATS analysis, resume linting, keyword scanning, recruiter-oriented analysis, and job-match logic. Existing scores are advisory and must remain explainable. Phase 18 should add provenance and evidence IDs to findings before introducing semantic matching or new aggregate scores.

## PDF and templates

The project contains A4 resume rendering, Arabic/English fixtures, PDF export, print visual regression, 24 original active templates, RTL support, and premium 3D quality guards. Phase 18 must preserve selectable/searchable text, RTL/LTR behavior, no watermark, free export, and the existing compatibility surface.

## Browser and CI baseline

Phase 17 passed the official QA suite, Network Privacy, axe checks, keyboard navigation, Chromium/Firefox/WebKit capability navigation, Arabic/English PDF checks, and print regression. The GitHub CI quality failure caused by Markdown formatting was fixed in Phase 17; the final PR checks were successful.

## Database and migrations

The repository contains Supabase migrations. `AGENTS.md` records that `20260810090000_validate_stage4_owned_relationships.sql` exists in the repository but has not yet been applied to the live remote database. No Phase 18 migration may be added until the applied/pending state is confirmed and recorded.

## Baseline conclusion

The safe implementation route is additive: introduce domain schemas and adapters, add privacy/provider contracts, preserve current UI and storage behavior, and prove round-trip and privacy invariants before migrating any route or database table.
