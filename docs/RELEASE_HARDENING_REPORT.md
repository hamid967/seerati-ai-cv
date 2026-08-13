# Seerati AI CV — Release Hardening Report

**Date:** 2026-08-13  
**Source:** latest `origin/main` after merge commit `ed3b42a4347d4868fb1dcaab872b029347973bc6`  
**Branch:** `chore/release-hardening`  
**Release decision:** **Draft PR only — not merged**

## Executive summary

The release-hardening suite was implemented and executed against a production artifact built from the latest `origin/main`. The anonymous/free path, Network Privacy Inspection, assistant capability journeys, axe accessibility gates, keyboard navigation, PDF generation, Arabic/English print visual regression, and Chromium/Firefox/WebKit navigation checks passed after remediation.

Lighthouse CI also runs on the five public routes. Accessibility, Best Practices, and SEO are blocking assertions and passed in the final run. Performance remains a warning gate while the first production baseline is reviewed: the final local run measured approximately **0.76 on `/`** and **0.63–0.65 on `/templates`**, with LCP above the initial 4-second target. This is explicitly documented rather than hidden by lowering the measured scores.

## Implemented hardening coverage

| Area                    | Evidence                                                                                                         | Final status                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `/assistant` E2E        | All capability cards navigate without application error; protected guest cards may redirect to `/auth` by design | PASS                           |
| Network Privacy         | Anonymous assistant journey produced no unauthorized mutation or personal payload                                | PASS / blocking                |
| Free path               | Guest journey completed without the previous `401` app-settings failure                                          | PASS / blocking                |
| axe                     | `/assistant`, `/`, `/templates`, `/features`, and `/privacy` checked in Arabic; assistant checked in English     | PASS / blocking                |
| Keyboard                | 20 interactive elements reached in Chromium, Firefox, and WebKit                                                 | PASS                           |
| Browser matrix          | Chromium, Firefox, WebKit                                                                                        | PASS                           |
| PDF Arabic              | Generated PDF contains expected Arabic text                                                                      | PASS / blocking                |
| PDF English             | Generated PDF contains expected English text                                                                     | PASS / blocking                |
| Print visual regression | Arabic and English assistant print snapshots at 0.00% difference after approved baseline update                  | PASS / blocking                |
| Lighthouse              | Five public routes, two runs per route                                                                           | PASS with performance warnings |

## Critical and high findings remediated

### Guest-path unauthorized request

The guest store no longer triggers an unnecessary `app_settings` request for anonymous users. The guest path now uses the safe local default and preserves the privacy boundary. This removed the observed `401` from the free journey.

### Accessibility progress semantics

The assistant progress bar now has an explicit Arabic/English accessible label. The final axe run reported no critical or serious violations on the assistant or the selected public routes.

### Homepage crawlability

The marketing homepage no longer redirects first-time visitors automatically to the intro route during initial render. The intro experience remains available as a route, while the canonical homepage can now be crawled and measured by Lighthouse.

### External font blocking

The render-blocking Google Fonts stylesheet and preconnect links were removed from the root document. The CSS retains system fallback stacks, making the app less dependent on third-party font availability and eliminating Firefox font-download noise from the matrix.

### Homepage contrast and accessible language control

Low-contrast emerald text on the public homepage was changed to a darker accessible shade. The language control accessible name now includes its visible `EN` or `ع` label, resolving the Lighthouse label/content mismatch.

### Protected guest routes

The capability smoke suite distinguishes public guest destinations from protected destinations. `/jobs` and `/cover-letters` may redirect an anonymous visitor to `/auth`; this is the expected privacy-preserving behavior. Application errors and unexpected redirects remain blocking.

### Baseline integrity

The release-hardening script now copies approved screenshots into baselines only when `UPDATE_RELEASE_BASELINE=1` is explicitly set. Normal runs compare against committed baselines and fail on visual drift.

## Lighthouse results and policy

Lighthouse was run using the official `@lhci/cli` package, not the unrelated `lhci` package. The configuration covers:

- `/`
- `/templates`
- `/features`
- `/privacy`
- `/assistant`

Two runs are collected per route. Accessibility, Best Practices, and SEO remain blocking at 0.90 minimum. Performance is currently a warning assertion at 0.80 minimum so that the project can establish a real baseline without masking the result. The measured performance warnings are:

| Route        |      Approx. Performance |           Approx. LCP | Policy                                   |
| ------------ | -----------------------: | --------------------: | ---------------------------------------- |
| `/`          |                     0.76 |                  4.7s | Warning; follow-up optimization required |
| `/templates` |                0.63–0.65 |                  4.2s | Warning; follow-up optimization required |
| `/features`  | Above blocking threshold | Within observed range | Measured                                 |
| `/privacy`   | Above blocking threshold | Within observed range | Measured                                 |
| `/assistant` | Above blocking threshold | Within observed range | Measured                                 |

The performance warnings are not release-blocking in this PR because no stable production RUM baseline exists yet. The next performance PR should reduce the templates DOM/JavaScript cost, inspect the template gallery chunk, and then promote Performance and LCP to blocking assertions.

## CI/CD additions

The Draft PR adds `.github/workflows/release-hardening.yml` with:

1. A Chromium/Firefox/WebKit matrix.
2. Production build and Wrangler artifact startup.
3. Playwright E2E and keyboard checks.
4. Network Privacy Inspection.
5. axe checks.
6. Arabic/English PDF and print visual regression.
7. Separate official Lighthouse CI job with artifacts.
8. Concurrency cancellation and read-only repository permissions.

The workflow uses synthetic CI Supabase values and does not require production credentials. It must not upload request bodies, CV text, prompts, AI responses, or personal identifiers as artifacts.

## Files added or changed

- `.github/workflows/release-hardening.yml`
- `lighthouserc.cjs`
- `scripts/release-hardening.mjs`
- `tests/release-baselines/assistant-ar.png`
- `tests/release-baselines/assistant-en.png`
- `tests/release-baselines/assistant-ar-print.png`
- `tests/release-baselines/assistant-en-print.png`
- `docs/RELEASE_HARDENING_REPORT.md`
- `package.json`
- `src/lib/store.tsx`
- `src/routes/assistant.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/components/site-header.tsx`

## Acceptance decision

**Blocking release gates passed:** Network Privacy, anonymous/free journey, PDF Arabic, PDF English, axe critical/serious findings, keyboard navigation, and browser matrix execution.

**Non-blocking follow-up:** Lighthouse Performance and LCP remain above the initial target on `/` and `/templates`. They are tracked as a measured warning and must be promoted to a blocking gate after the next optimization cycle and production RUM baseline review.

**Final CI verification (2026-08-13):** Draft PR [#42](https://github.com/hamid967/seerati-ai-cv/pull/42) at commit `867f601a564dfcaddadd9c4a8286015005132ac2` is **CLEAN** and remains a Draft. All six required checks passed: Chromium, Firefox, WebKit, Lighthouse public routes, quality, and route-smoke. CI run: [31660368836](https://github.com/hamid967/seerati-ai-cv/actions/runs/31660368836).

**Merge policy:** This change is intentionally prepared as a Draft Pull Request. It must not be merged without explicit owner approval.
