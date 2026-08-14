# Synthetic Resume Test Results

## Evidence status

This document records evidence collected on `feat/synthetic-ai-specialty-expansion` before its Draft Pull Request. It distinguishes executed local checks from checks that must run again in GitHub Actions after the branch is pushed.

| Check                                                     | Result                   | Evidence                                                                                                                                           |
| --------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expanded deterministic generator smoke                    | Passed                   | `bun scripts/synthetic-resume-smoke.ts`; checks all 36 specialties in Arabic and English across student, graduate, mid, and manager levels.        |
| Adaptation contract smoke                                 | Passed                   | `bun scripts/synthetic-adaptation-contract-smoke.ts`; checks restricted prompt inputs, accepted JSON shape, and rejection of employer-like output. |
| TypeScript strict compilation                             | Passed                   | `bun x tsc --noEmit`.                                                                                                                              |
| Production build                                          | Passed                   | `npm run build` with the project-required Node `v24.14.0`, including the client-environment guard.                                                 |
| Synthetic Chromium browser smoke                          | Passed                   | `BASE_URL=http://127.0.0.1:4175 node scripts/synthetic-resume-browser-smoke.mjs` against a local TanStack development server.                      |
| ESLint                                                    | Pending final validation | To run after documentation and final formatting updates.                                                                                           |
| Repository QA                                             | Pending final validation | Includes the new `test:synthetic-adaptation` command.                                                                                              |
| Existing guest recovery and visitor-parity browser smokes | Pending final validation | Final quality phase.                                                                                                                               |
| Release Hardening matrix                                  | Pending Draft PR run     | Chromium, Firefox, WebKit, and Lighthouse workflow.                                                                                                |

> The shell's default Node was `v22.13.0`, which does not satisfy this repository's `>=24 <25` engine and failed before the application build started. The executed build used installed Node `v24.14.0`; this is an environment-selection note, not an application defect.

## Deterministic and adaptation coverage

`scripts/synthetic-resume-smoke.ts` asserts the catalog has six initial specialties plus thirty reviewed additions. For every specialty it generates Arabic and English profiles at four experience levels and verifies the four template options, placeholder contacts, sample metadata, and export block. It also applies a fixture adaptation and proves that the changed fields retain `status: sample`, receive `source: synthetic-ai`, have `exportApproved: false`, preserve `contentMode: ai-adapted`, and keep the resume blocked from final export.

`scripts/synthetic-adaptation-contract-smoke.ts` exercises the server-only prompt/validation module without calling a provider. It verifies that the request prompt is built from specialization ID, level, language, and literal consent only. It accepts the exact required schema and rejects unsafe output with an employer-like reference. The endpoint itself also enforces strict Zod validation, authenticated middleware, existing rate limits, provider timeout/retry behavior, and deterministic failure response.

## Browser and network coverage

`scripts/synthetic-resume-browser-smoke.mjs` creates a synthetic software-development resume through Noura on an iPhone-sized Arabic viewport. It uses keyboard activation for the entry and level selection, selects and compares templates, opens the editor, proves that unchanged placeholder confirmation is rejected, attempts Text PDF export, downloads only the labelled sample file, and verifies the ATS sample boundary.

At the template stage it verifies that the AI adaptation button is disabled before the consent checkbox is checked. It checks consent in a guest session, presses the optional adaptation control, observes the bilingual guest-fallback disclosure, and fails if a request targets the adaptation server function or carries `adapt_sample`. The test also fails if the synthetic marker reaches an outbound request, if a cloud persistence mutation endpoint is called, or if sample-related data appears in localStorage, sessionStorage, IndexedDB, or Cache Storage by default.

The same script opens an Android-sized English viewport, follows English specialty search and selection, verifies the consent requirement, checks reduced motion, and verifies no horizontal overflow.

## Known test limits

The current browser smoke does not invoke a live authenticated provider; doing so would require a controlled authenticated fixture and provider environment. Its substitute evidence is the strict endpoint schema, server contract smoke, deterministic application test, and explicit guest no-network path. It also does not automate confirmation of every sample field and successful final PDF export, since the release safety requirement is the blocking state before confirmation. The feature has no administrative content console, public/guest AI endpoint, or custom-specialty AI generation.
