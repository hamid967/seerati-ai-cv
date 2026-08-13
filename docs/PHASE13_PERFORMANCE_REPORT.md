# Phase 13 — Performance and Browser Hardening Report

**Repository:** `hamid967/seerati-ai-cv`  
**Branch:** `feat/phase-13-performance`  
**Base commit:** `1519c71` (`origin/main`, merged Release Hardening PR #42)  
**Review commit:** `d6e09b0` (`feat/phase-13-performance`)
**Official CI run:** [Release Hardening run 31664665020](https://github.com/hamid967/seerati-ai-cv/actions/runs/31664665020) — successful on Chromium, Firefox, WebKit, and Lighthouse.
**Scope:** Public-page performance, template-gallery rendering, anonymous guest critical path, and regression safety.  
**Data policy:** All measurements used synthetic demo content. No CV text, prompts, responses, tokens, or personal identifiers were uploaded to reports or artifacts.

## Executive summary

Phase 13 reduces the public critical path without weakening the privacy-first anonymous architecture. The homepage hero image is now served as a local WebP asset, the Floating Seerati Assistant is lazy-loaded after the first pointer/keyboard interaction or a five-second safety timeout, and the template gallery starts with lightweight previews rather than rendering every full resume preview. Full `ResumeThumb` rendering is loaded only for the selected preview and comparison dialog. The gallery also uses `content-visibility: auto` to avoid painting off-screen content while preserving server-rendered markup and crawlability.

The release-hardening suite passes on Chromium, Firefox, and WebKit. Chromium completed the full blocking journey, including Network Privacy, axe, keyboard navigation, Arabic/English PDF text checks, and print visual regression. Firefox and WebKit completed the browser-matrix E2E and keyboard checks. Network Privacy and PDF gates remain blocking and passed.

Lighthouse remains in the staged, non-blocking performance-warning phase. The final two-run CI sample passed the command and produced reports for `/`, `/templates`, `/features`, `/privacy`, and `/assistant`; accessibility, best practices, and SEO assertions remained successful. Performance variance still produces warnings on `/` and `/assistant`, so this report does **not** promote performance to a release blocker.

## Change manifest

| Area                  | Change                                                                                                                             | Acceptance evidence                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Homepage asset        | Replaced the local 83 KB JPEG hero with a 27 KB WebP asset and added image preload metadata.                                       | Build succeeds; final artifact contains `hero-resume-*.webp`.                                 |
| Guest critical path   | Converted `FloatingSeeratiAssistant` to a lazy import and deferred activation until user interaction or five seconds.              | Runtime profile shows no floating-assistant chunk in the initial anonymous route measurement. |
| Template gallery      | Replaced initial full `ResumeThumb` cards with CSS lightweight previews.                                                           | Initial `/templates` DOM reduced from 3,302 to 337 nodes.                                     |
| Full preview behavior | Lazy-loads `ResumeThumb` only in selected-template and comparison dialogs.                                                         | Full preview code remains available on explicit preview/compare actions.                      |
| Off-screen rendering  | Added `content-visibility: auto` and an intrinsic size to the gallery grid.                                                        | Build and Lighthouse route checks pass.                                                       |
| Firefox stability     | Retries transient `NS_BINDING_ABORTED`/detached-frame navigation during assistant setup, while keeping the third failure blocking. | Firefox final regression passed.                                                              |

## Runtime profile: before and after

The profile was run against a production build with the repository's synthetic demo data. JavaScript transfer includes route resources observed during the profile window; it is not a claim about all eventual interaction code.

| Route        | Baseline DOM | Final DOM |     Change | Baseline JS transfer | Final JS transfer | Change |
| ------------ | -----------: | --------: | ---------: | -------------------: | ----------------: | -----: |
| `/`          |          239 |       237 |      −0.8% |            311,157 B |         289,377 B |  −7.0% |
| `/templates` |        3,302 |       337 | **−89.8%** |            312,127 B |         291,117 B |  −6.7% |
| `/assistant` |          334 |       343 |      +2.7% |            317,479 B |         314,719 B |  −0.9% |

The template-gallery result is the primary Phase 13 win: the initial DOM is reduced by 2,965 nodes while the complete gallery remains available through the existing interaction flow. The assistant route itself is intentionally not stripped of its capability content; its small DOM increase reflects the unified Assistant Hub and remains covered by privacy, accessibility, and browser tests.

## Lighthouse evidence

The official Lighthouse CI configuration ran two samples per route in the local production preview for this phase. The route set was `/`, `/templates`, `/features`, `/privacy`, and `/assistant`. The command completed successfully and wrote ten JSON reports under the local `artifacts/lighthouse/` directory; those generated artifacts are excluded from the PR to avoid noisy or accidental report retention.

| Route        | Performance samples |        LCP samples | Status                                                         |
| ------------ | ------------------: | -----------------: | -------------------------------------------------------------- |
| `/`          |          0.78, 0.79 | 4,250 ms, 4,232 ms | Warning; non-blocking variance/budget breach                   |
| `/templates` |          0.80, 0.79 | 3,947 ms, 4,103 ms | Warning; improved DOM and near budget                          |
| `/features`  |          0.80, 0.84 | 3,991 ms, 3,382 ms | Warning threshold variance                                     |
| `/privacy`   |          0.86, 0.86 | 3,239 ms, 3,244 ms | Informational performance warning only                         |
| `/assistant` |          0.72, 0.70 | 4,509 ms, 4,585 ms | Warning; requires a separate assistant-route optimization pass |

A targeted single-run check after the lightweight gallery change measured `/templates` at Performance **0.84**, LCP **3,382 ms**, TBT **103 ms**, and **275** DOM elements. Because the CI configuration intentionally runs repeated samples, the two-run values above are the authoritative release evidence and show why performance remains staged rather than blocking.

## Hardening and release gates

| Gate                                          | Result                                  | Blocking interpretation                             |
| --------------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| Chromium assistant capabilities               | Passed                                  | No blocking E2E failure.                            |
| Firefox assistant capabilities                | Passed after transient navigation retry | No persistent browser failure.                      |
| WebKit assistant capabilities                 | Passed                                  | No blocking E2E failure.                            |
| Network Privacy anonymous journey             | Passed on Chromium                      | Blocking privacy gate remains green.                |
| axe Arabic/English and public routes          | Passed on Chromium                      | No critical or serious violations.                  |
| Keyboard navigation                           | Passed on Chromium, Firefox, and WebKit | 20 interactive elements reached in Chromium.        |
| Arabic/English PDF selectable text            | Passed on Chromium                      | Blocking PDF gate remains green.                    |
| Arabic/English print visual regression        | Passed on Chromium                      | Blocking print/PDF presentation gate remains green. |
| Lighthouse accessibility, best practices, SEO | Passed                                  | No quality regression observed.                     |
| Lighthouse performance                        | Warning only                            | Kept non-blocking per staged rollout policy.        |

The screen visual regression remains diagnostic unless it represents print/PDF output. The blocking visual gates are Arabic and English print/PDF checks, and both passed with zero reported difference in the final Chromium run.

## Privacy and safety review

The implementation does not add persistence, analytics, URL state, Supabase writes, or logging for anonymous CV content. The new performance code only changes loading and rendering boundaries. The lazy assistant import does not alter its capability routing or privacy policy. The gallery previews use synthetic template metadata and do not serialize user CV state. The release-hardening network inspection remains the authoritative check for unauthorized guest writes or personal payload leakage.

## Known limitations and next recommended slice

Performance is improved but not yet a stable `Performance >= 0.90` release gate. The most important remaining work is a dedicated `/assistant` performance pass, followed by three-run Lighthouse calibration on stable CI runners. Candidate work includes isolating non-critical assistant capability code, reducing route-level hydration work, and reviewing font and CSS delivery. These are proposed follow-up actions, not claims of completion in this PR.

The local environment showed transient resource pressure when multiple Wrangler/workerd previews and Lighthouse Chromium instances were left running concurrently. The official PR run initially exposed two transient runner failures: cancelled asset requests and a WebKit navigation interruption. The hardening retry policy now treats those known navigation cancellations as retryable while retaining all real network failures as blocking. The rerun completed successfully across Chromium, Firefox, WebKit, and Lighthouse. This is an environment note, not an application failure.

## Final CI evidence

The official GitHub Actions run [31664665020](https://github.com/hamid967/seerati-ai-cv/actions/runs/31664665020) completed successfully for review commit `d6e09b0`. Its three browser jobs passed, the Lighthouse public-route job passed, and the separate Seerati CI quality and route-smoke checks were successful on the same branch. GitHub reported only the existing Node.js 20 deprecation annotations for third-party actions; no application or release-gate failure remained.

## Reproducibility commands

```bash
bun run lint
bun run build
BASE_URL=http://127.0.0.1:4188 BROWSER_ONLY=chromium bun run test:release-hardening
BASE_URL=http://127.0.0.1:4188 BROWSER_ONLY=firefox bun run test:release-hardening
BASE_URL=http://127.0.0.1:4188 BROWSER_ONLY=webkit bun run test:release-hardening
BASE_URL=http://127.0.0.1:4189 bun run test:lighthouse
```

The preview server must be started from the production `.output/server/wrangler.json` artifact and readiness must be checked before browser or Lighthouse execution. Generated browser screenshots and Lighthouse reports should be retained only in CI when needed for review.

## References

1. [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) — official Lighthouse CI project and assertion workflow.
2. [Playwright Network](https://playwright.dev/docs/network) — official network inspection and request interception documentation.
3. [Chrome DevTools Protocol Network domain](https://chromedevtools.github.io/devtools-protocol/tot/Network/) — official network-domain reference.
4. [Web Vitals and Lighthouse LCP guidance](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/) — definition and interpretation of Largest Contentful Paint.
