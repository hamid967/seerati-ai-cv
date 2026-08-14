# Release Readiness Report

**Scope:** Full-system audit and hardening branch
**Release posture:** **Conditionally ready for review; not approved for autonomous merge**

## Gate summary

| Gate                           | Local evidence                                                                                      | CI evidence required after PR                                 | Release disposition                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| Locked dependency installation | Passed.                                                                                             | `bun install --frozen-lockfile`.                              | Required.                                         |
| Dependency audit               | Passed with no advisory reported.                                                                   | Quality CI.                                                   | Required.                                         |
| TypeScript                     | Passed after hardening changes.                                                                     | Quality CI.                                                   | Required.                                         |
| Lint and formatting            | Baseline lint: 0 errors, 20 existing warnings; changed files formatted.                             | Full repository formatting/lint CI.                           | Required.                                         |
| Build and client-env guard     | Passed using Node 24.                                                                               | Quality CI.                                                   | Required.                                         |
| AI contract boundary           | New bounded-context smoke passed.                                                                   | Quality CI static QA.                                         | Required.                                         |
| Guest privacy                  | Baseline QA passed; local Chromium network inspection passed.                                       | Chromium guest/recovery/parity smokes.                        | **Blocking**.                                     |
| Accessibility and keyboard     | Local Chromium axe and keyboard checks passed.                                                      | Chromium, Firefox, WebKit matrix.                             | **Blocking** for critical/serious axe violations. |
| PDF and print                  | Local Arabic/English PDF and print assertions passed.                                               | Browser matrix visual/PDF jobs.                               | **Blocking** for Arabic PDF failure.              |
| Lighthouse                     | 21 local runs passed accessibility and best-practices gates; performance/LCP/SEO warnings recorded. | Lighthouse workflow.                                          | Warning gate under current policy.                |
| Live production hydration      | Workflow now targets `https://hrhbs.com`.                                                           | Production browser smoke after PR.                            | Required before release decision.                 |
| Remote RLS migration           | Static policy reviewed only.                                                                        | Owner-approved migration and synthetic two-user verification. | Required for database-policy release.             |

## Blocking conditions

The following conditions remain release-blocking under the project policy:

1. Any Network Privacy failure, anonymous guest persistence, or unexpected remote guest write.
2. Any Arabic PDF or print failure.
3. Any broken free guest route that introduces a registration wall for a core feature.
4. Any build, TypeScript, or quality-gate failure.
5. Any critical or serious axe violation in the browser hardening matrix.
6. Any remote RLS policy mismatch after the deferred migration is applied.

## Non-blocking warnings recorded

| Item                          | Evidence                                                                                                       | Treatment                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Local performance scores      | `lighthouse@13.4.1` medians range from 0.60 to 0.65; these values are not comparable to the historical runner. | Use this branch as the baseline and measure a real optimisation experiment before tightening a budget. |
| Jobs and cover-letter LCP/SEO | Median LCP is 4,356 ms and 4,035 ms; SEO is 0.63.                                                              | Review noindex/utility-route policy; warnings under the current mixed-route configuration.             |
| Visual baseline deltas        | Interactive assistant screenshots differed by 4.99% (Arabic) and 6.30% (English); print stayed below 0.30%.    | Non-blocking visual-review warning; inspect CI artifacts before acceptance.                            |
| Existing lint warnings        | 20 warnings and 0 errors at baseline.                                                                          | Track separately; no blanket suppression introduced.                                                   |
| Deferred hub timing           | The hardening suite now waits for the rendered capability-hub title rather than a fixed delay.                 | CI uses a production preview; monitor the first PR matrix run.                                         |

## Required deployment sequence

A reviewer should first inspect the generated dependency lock and AI request contract changes. Once the Draft PR passes all CI matrix jobs, an authorized owner may approve the remote migration in an approved Supabase environment, run synthetic two-user RLS verification, and check the `hrhbs.com` production browser smoke. Only after those gates pass should a separate owner-driven merge or deploy decision be considered.

No release, deploy, migration, domain change, or merge was executed by this audit.

## Rollback readiness

The changes are reversible through Git commits and do not alter production data. If a rollback is needed, revert the workflow/dependency commit first only if the prior CI bootstrap remains supported; otherwise keep the locked test tooling and revert the isolated AI validation/error-hardening commit separately. Re-run the full gate set after any rollback.
