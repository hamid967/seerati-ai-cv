# Phase 14 — Assistant 2.0 and LCP Optimization Report

**Project:** Seerati AI CV  
**Branch:** `feat/phase-14-assistant-lcp`  
**Base:** `origin/main` at `37a428f`  
**Objective:** Launch a faster, more interactive Saudi career journey while preserving anonymous memory-only boundaries and improving Largest Contentful Paint (LCP).

## Executive summary

Phase 14 introduces **Assistant 2.0** as a guided visitor journey instead of an immediately loaded capability dashboard. The first interaction now captures language, account status, sector, target role, and creation mode before the heavier Capability Hub and ResumePreview surfaces are loaded. Anonymous visitors retain access to basic job matching and cover-letter drafting without forced registration, database writes, analytics mutations, or personal-data persistence.

The route-level LCP work is partially successful. Immediate rendering of the privacy disclosure and deferred capability surfaces reduced the `/assistant` runtime DOM from **334 to 177 nodes** and removed measured long tasks from the route profile. A direct three-run Chromium measurement after the change produced LCP values of **4.369s, 3.374s, and 3.386s**, with a median of **3.386s**. This is an improvement over the baseline runs of **4.367s, 4.374s, and 4.354s**, but it does **not yet meet the required <2.5s median target**. Lighthouse therefore remains a warning gate rather than a release-blocking gate in this phase.

## Delivered changes

| Area                | Implementation                                                                                          | Privacy/performance effect                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Assistant 2.0       | Added initial path-selection step for language, visitor status, sector, target role, and creation mode. | Makes the journey adaptive without requiring registration for the first useful action.             |
| Deferred loading    | Capability Hub and ResumePreview are deferred until the visitor selects the relevant path.              | Reduces initial DOM and synchronous work on `/assistant`.                                          |
| Privacy disclosure  | Guest privacy notice renders immediately, without waiting for auth resolution.                          | Improves perceived loading and makes memory-only boundaries visible at first paint.                |
| Guest job matching  | Added `GuestJobMatch` using local, in-memory matching.                                                  | No Supabase rows, analytics mutations, or account requirement.                                     |
| Guest cover letters | Added `GuestCoverLetter` using local, in-memory drafting.                                               | Basic drafting remains available anonymously; no persistence or forced sign-up.                    |
| Guest parity smoke  | Added `scripts/phase14-guest-smoke.mjs`.                                                                | Verifies `/jobs`, `/cover-letters`, and `/assistant` for anonymous parity and forbidden mutations. |
| CI hardening        | Added guest smoke to Release Hardening and calibrated Lighthouse to three runs per route.               | Makes privacy parity part of the release path and reduces single-run Lighthouse noise.             |
| Route coverage      | Lighthouse coverage includes `/`, `/templates`, `/assistant`, `/jobs`, and `/cover-letters`.            | Public critical paths are measured together.                                                       |

## LCP measurements

Measurements were collected locally against the production preview using Chromium and three runs per route. The values below are milliseconds.

| Route        |         Baseline sample |          Phase 14 sample | Current interpretation                                                   |
| ------------ | ----------------------: | -----------------------: | ------------------------------------------------------------------------ |
| `/assistant` |      4367 / 4374 / 4354 |       4369 / 3374 / 3386 | Median improved from **4367ms** to **3386ms**, but remains above 2500ms. |
| `/`          | Existing route baseline | 448ms runtime LCP sample | No regression observed in the runtime profile.                           |
| `/templates` | Existing route baseline | 224ms runtime LCP sample | No regression observed in the runtime profile.                           |

The `/assistant` variability indicates that the route still has a warm/cold-start or runtime scheduling component. The next performance iteration should isolate the remaining blocking work with a trace and reduce the initial JavaScript path further; Phase 14 intentionally does not claim the <2.5s target is complete.

### Runtime profile after the change

The post-change runtime profile recorded **177 DOM nodes**, **14 interactive elements**, and **no long tasks** for `/assistant`. The privacy disclosure and the first path-selection content were visible before capability exploration. This confirms the intended architectural direction even though Lighthouse's stricter median target remains unmet.

## Privacy and guest-boundary verification

Anonymous journeys were tested on `/assistant`, `/jobs`, and `/cover-letters`. The guest smoke suite passed with no unauthorized Supabase or analytics mutation requests. Guest matching and drafting use in-memory state only and do not write CV content, job matches, cover letters, or personal fields to persistent storage.

The release policy remains unchanged:

> **Network Privacy failure, Arabic PDF failure, or loss of the free no-registration path is a blocking release finding.**

All three requirements passed in the latest local validation.

## Release Hardening results

The latest local validation was executed on the Phase 14 branch after the final GuestNotice and browser retry fixes.

| Check                                |                       Chromium |                        Firefox |                         WebKit | Result |
| ------------------------------------ | -----------------------------: | -----------------------------: | -----------------------------: | ------ |
| Assistant capability-card navigation |                           Pass |                           Pass |                           Pass | Green  |
| Keyboard navigation                  | Pass — 16 interactive elements | Pass — 13 interactive elements | Pass — 16 interactive elements | Green  |
| Network Privacy Inspection           |                           Pass |              Included in suite |              Included in suite | Green  |
| axe critical/serious checks          |                           Pass |              Included in suite |              Included in suite | Green  |
| Arabic PDF integrity                 |                           Pass |              Included in suite |              Included in suite | Green  |
| English PDF integrity                |                           Pass |              Included in suite |              Included in suite | Green  |
| Arabic print regression              |         Pass, 0.02% difference |              Included in suite |              Included in suite | Green  |
| English print regression             |         Pass, 0.02% difference |              Included in suite |              Included in suite | Green  |
| Guest parity smoke                   |                           Pass | N/A — dedicated Chromium smoke | N/A — dedicated Chromium smoke | Green  |

The final Chromium run reported an **English assistant visual difference of 1.08%**, which is above the configured 1% visual warning threshold but is not a blocking finding. Arabic assistant visual difference was **0.98%**. PDF and print checks were clean. This warning should be reviewed during visual-baseline maintenance but does not indicate a privacy, accessibility, navigation, or PDF integrity failure.

## CI status and links

The branch is ready for the Draft Pull Request. The final CI links must be appended after the pushed commit has completed the six required checks.

| Required check | CI run link        | Status                 |
| -------------- | ------------------ | ---------------------- |
| Chromium       | Pending final push | Pending                |
| Firefox        | Pending final push | Pending                |
| WebKit         | Pending final push | Pending                |
| Lighthouse     | Pending final push | Pending / warning gate |
| Quality        | Pending final push | Pending                |
| Route smoke    | Pending final push | Pending                |

## Release decision

**Recommendation: approve the Draft PR for owner review, but do not merge yet.** The privacy-first guest boundaries, browser matrix, accessibility, PDF, print, and route-level smoke gates are green locally. The only outstanding product-performance requirement is the LCP target: `/assistant` has improved materially but its local three-run median remains **3.386s**, above the required **2.5s**. Lighthouse should remain non-blocking for this PR, with the target tracked as the next performance iteration.

No merge is authorized by this report. Merge remains subject to explicit owner approval after reviewing the Draft PR and the final CI results.

## Follow-up work for the next performance iteration

1. Capture a cold-start Lighthouse trace for `/assistant` and identify the remaining 1.0–1.5 seconds of render delay.
2. Split the initial assistant route bundle further, especially auth/provider and editor-adjacent code that is not required for the first path-selection step.
3. Re-test with three-run median reporting and preserve the current privacy, PDF, keyboard, and browser release gates.
4. Promote Lighthouse from warning to blocking only after the `/assistant` median is below 2.5 seconds across the agreed CI environment.
