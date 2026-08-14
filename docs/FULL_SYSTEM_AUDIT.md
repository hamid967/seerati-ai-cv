# Full System Audit

**Scope:** Phase 15 full system audit, integration hardening and optimization

**Branch:** `chore/full-system-audit-and-optimization`

**Baseline:** `67db48b` (current `origin/main` at audit start)
**Data policy:** Synthetic fixtures only. No real CV content, credentials, or production mutations were used.

## Executive conclusion

The reviewed application has a sound guest-first baseline: anonymous resumes are held in module/React memory by default, recovery requires explicit consent, authenticated persistence is separated from guest state, and the core QA suite passed before modifications. No P0 defect was established by the static and local dynamic evidence collected in this audit.

The audit found delivery and privacy-hardening gaps. The AI request validator accepted arbitrary nested context objects although the prompt consumes only a small allowlist; the general AI endpoint logged and returned provider error messages that can contain provider diagnostics or user text; and the release-hardening command relied on transient CI-only tool installation rather than a locked development dependency graph. The historical Lighthouse client also carried unresolved transitive advisories, and the MCP route generator could leave Prettier-incompatible output after a build. These defects were corrected in this branch. A production-smoke workflow was also corrected to use `https://hrhbs.com`, the declared production domain.

## Change manifest

| Area                     | Required behavior                                                                       | Implemented change                                                                                                     | Evidence                                                           |
| ------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| AI input boundary        | Only data needed by the generic prompt may cross the endpoint.                          | Added bounded, structural context validation and dropped arbitrary properties.                                         | `scripts/ai-request-validation-smoke.ts`                           |
| AI errors and logs       | Provider diagnostics must not expose prompt or CV content.                              | Replaced raw error logging and error-response messages with `logServerFailure` and stable codes.                       | `src/lib/ai.functions.ts`                                          |
| Release verification     | Browser, axe, visual, PDF, and Lighthouse tools must be reproducible from the lockfile. | Added pinned browser tooling, replaced the vulnerable historical Lighthouse client, and removed temporary CI installs. | `package.json`, `bun.lock`, workflows, `scripts/lighthouse-ci.mjs` |
| MCP generation stability | Generated source must still conform to repository lint after Vite regeneration.         | Added a post-generation Prettier plugin while preserving the MCP generator consent banner.                             | `vite.config.ts`; frozen install, build, and lint evidence         |
| Production scope         | Live smoke must target the official domain only.                                        | Updated production browser smoke base URL to `https://hrhbs.com`.                                                      | `.github/workflows/production-browser-smoke.yml`                   |

## Audited boundaries

| Boundary                    | Result                                                                                                                                                                                                                | Evidence                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Routes and module graph     | No product-source circular dependency found. The only detected cycle is the expected generated TanStack Router relationship `routeTree.gen.ts → router.tsx`.                                                          | Madge scan; `src/routeTree.gen.ts` is generated and not edited.                             |
| Guest state and deletion    | Guest resume content is memory-only by default. Optional session recovery uses `sessionStorage` only after explicit consent, and deletion clears memory, consent, recovery payload, and module-held session metadata. | `src/lib/guest-store.ts`, `src/lib/guest-session.ts`, `src/lib/store.tsx`; guest QA passed. |
| Auth and RLS                | Browser auth persistence is distinct from guest content. Account data mutations are session-bound; migrations define owner-scoped RLS policies.                                                                       | `src/integrations/supabase/client.ts`, `src/lib/store.tsx`, `supabase/migrations/`.         |
| Noura and AI                | The evidence path excludes full name, contact fields, and sensitive facts. Synthetic adaptation is separately consented and accepts selections only.                                                                  | `src/modules/ai/noura-evidence.ts`, `src/lib/synthetic-adaptation.functions.ts`.            |
| PDF and samples             | PDF libraries are dynamically imported. Final export and print are blocked when a synthetic sample still has unreviewed fields.                                                                                       | `src/lib/pdf.ts`, `src/routes/resumes.$id.preview.tsx`.                                     |
| Templates and accessibility | Local, explainable template signals are already wired into gallery and studio. Chromium hardening passed axe, keyboard, RTL/LTR, privacy, PDF, and print gates after tooling was made reproducible.                   | `scripts/release-hardening.mjs`.                                                            |

## Findings and disposition

| ID     | Severity | Root cause                                                                                               | Impact                                                                                                 | Resolution                                                                                    | Regression evidence                                                              |
| ------ | -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| AUD-01 | P1       | `parseAiRequest` treated `context` as an unconstrained object.                                           | Arbitrary nested fields could be retained and potentially increase AI payload scope.                   | Allowlisted `AiContext`, field limits, answer-map limits, and structural validation.          | `test:ai-request-validation`                                                     |
| AUD-02 | P1       | `runAiTask` derived and emitted raw gateway error messages.                                              | Provider errors can contain prompt fragments or implementation diagnostics in logs/client responses.   | Safe operational logging and stable error codes only.                                         | Code review plus TypeScript and AI request smoke.                                |
| AUD-03 | P1       | Release-hardening libraries were installed only as CI no-save tools.                                     | A clean local install could not execute the documented release test.                                   | Pinned dev dependencies in lockfile; workflows use normal frozen installation.                | Local Chromium hardening passed.                                                 |
| AUD-04 | P1       | Production browser smoke pointed at a retired/non-official host.                                         | Production hydration checks could validate the wrong domain.                                           | Workflow now targets `https://hrhbs.com`.                                                     | Workflow configuration review.                                                   |
| AUD-05 | P2       | Local Lighthouse performance scores remain warning-level (0.60–0.65 median under the final runner).      | A controlled responsive-image/critical-path experiment is still required before budgets are tightened. | Measured and documented; no speculative visual change applied.                                | `PERFORMANCE_BEFORE_AFTER.md`                                                    |
| AUD-06 | P2       | Stage 4 ownership `VALIDATE CONSTRAINT` migration remains unapplied to the remote project.               | Repo policy is stronger than the deferred remote database state.                                       | Documented as owner-operated deployment gate; no remote mutation was attempted.               | `AGENTS.md`, migration `20260810090000_validate_stage4_owned_relationships.sql`. |
| AUD-07 | P1       | The MCP Vite generator can write source that violates the repository Prettier rule during startup/build. | A later lint or dirty checkout can fail even though the generated route behavior is correct.           | A post-generation formatter preserves generator ownership and restores repository formatting. | Frozen install, Node 24 build, and lint after regeneration.                      |

## Explicit exclusions

This audit did not create production users, write to remote Supabase, apply migrations, call the AI gateway with real content, publish to `hrhbs.com`, alter DNS, or merge a pull request. Chromium, Firefox, and WebKit desktop hardening ran locally. iPhone and Android viewport emulation remain explicit follow-up evidence for the PR or owner release review.

## Rollback

The changes are isolated to AI validation/error handling, test dependencies, CI workflow configuration, MCP generated-route formatting, and documentation. Revert the audit commits in reverse order, then run `bun install --frozen-lockfile`, TypeScript, QA, and the Chromium release-hardening command before restoring a prior workflow state. No data migration rollback is required.
