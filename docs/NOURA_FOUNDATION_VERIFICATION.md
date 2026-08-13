# Noura Foundation Verification

**Repository:** `hamid967/seerati-ai-cv`  
**Branch:** `feat/noura-intelligent-career-experience`  
**HEAD verified:** `03df1ff6be5170a79feee70d76bc2d2d15ea4306` (`03df1ff`)

**PR:** [#53](https://github.com/hamid967/seerati-ai-cv/pull/53) — Draft, not merged  
**Verification date:** 2026-08-13

## Executive result

The current Noura Foundation route was verified without adding product features. The Arabic and English goal-first entry point shows Noura's identity and professional role, presents one goal question, keeps the capability hub behind the tools button, does not show an assumed country or city, and exposes the current privacy deletion control. The local browser harness passed the Chromium, Firefox, and WebKit desktop/mobile matrix with reduced-motion context, keyboard traversal, no horizontal overflow, no console errors, no resume storage keys, and no guest mutation or Supabase write requests.

The Foundation release gates were rerun after a minimal print-area and guest-smoke alignment fix. Build, QA, Data Deletion/guest parity, PDF/Print, Network Privacy, and the Chromium/Firefox/WebKit desktop/mobile checks now pass locally. The GitHub CI runs associated with the previous `668550c` commit failed; a new CI run is required for `03df1ff`. The branch remains Draft and must not be merged until the new CI checks are reviewed.

## Commit and CI evidence

| Item                  | Evidence                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Verified commit       | `03df1ff6be5170a79feee70d76bc2d2d15ea4306`                                                |
| PR                    | [#53](https://github.com/hamid967/seerati-ai-cv/pull/53)                                  |
| Seerati CI run        | [31712419004](https://github.com/hamid967/seerati-ai-cv/actions/runs/31712419004), failed |
| Release Hardening run | [31712419040](https://github.com/hamid967/seerati-ai-cv/actions/runs/31712419040), failed |
| PR status             | Open, Draft, not merged                                                                   |

## Commands and results

| Command or gate                    | Result                                                     | Notes                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install`                      | Passed through `npm exec bun -- install --frozen-lockfile` | Bun is not on the base PATH; the equivalent Bun runtime was used.                                                                         |
| `bun run lint`                     | Passed with 20 warnings                                    | No lint errors. Warnings are existing Fast Refresh and hook dependency warnings.                                                          |
| TypeScript `noEmit`                | Passed                                                     | No type errors.                                                                                                                           |
| `bun run build`                    | Passed                                                     | Vite/TanStack production build and client environment guard completed.                                                                    |
| `bun run qa`                       | Passed                                                     | Existing route, AI, templates, RTL, premium, and environment checks passed.                                                               |
| `bun run check:routes-shell`       | Passed                                                     | App shell wiring passed.                                                                                                                  |
| `test:noura-foundation`            | Passed                                                     | Noura identity, seven goals, and no assumed country in generated data.                                                                    |
| Phase 19 intelligence smoke        | Passed                                                     | Existing Phase 19 contract checks passed.                                                                                                 |
| Phase 19 evaluation                | Passed                                                     | 500/500 synthetic cases; 100% intent accuracy.                                                                                            |
| Phase 14 guest/data-deletion smoke | Passed                                                     | Updated only the stale assistant selectors to `/assistant?agent=noura` and the current goal-first copy; guest mutation assertions passed. |
| Network Privacy harness            | Passed                                                     | No non-GET mutation, no Supabase write, no persistence endpoint mutation, no CV/PII markers in request bodies.                            |
| Data deletion control              | Passed                                                     | Current route exposes `حذف بياناتي الآن` / `Delete my data now`; guest parity smoke passed without persistence writes.                    |
| PDF/Print Arabic                   | Passed                                                     | `print-area` now exposes the resume preview to print CSS; generated PDF contains `اسمك الكامل`.                                           |
| PDF/Print English                  | Passed                                                     | `print-area` now exposes the resume preview to print CSS; generated PDF contains `Your name`.                                             |

## Browser verification

The temporary verification harness `scripts/noura-foundation-verification.mjs` exercised `/assistant?agent=noura` in Arabic and English at desktop and mobile widths. It ran each browser independently to avoid resource contention.

| Browser  | Arabic desktop/mobile | English desktop/mobile | Keyboard | Reduced motion | Network/privacy |
| -------- | --------------------: | ---------------------: | -------: | -------------: | --------------: |
| Chromium |                Passed |                 Passed |   Passed |         Passed |          Passed |
| Firefox  |                Passed |                 Passed |   Passed |         Passed |          Passed |
| WebKit   |                Passed |                 Passed |   Passed |         Passed |          Passed |

The harness also verified no horizontal overflow, no assumed city/country/nationality in the initial preview, and no contradictory migration copy such as **“تُنقل لحسابك عند التسجيل”** or **“moves to your account when you sign up.”**

## Required UI assertions

| Assertion                                                  |                     Result |
| ---------------------------------------------------------- | -------------------------: |
| Noura name visible in Arabic and English                   |                     Passed |
| Noura role visible in Arabic and English                   |                     Passed |
| One goal question shown first                              |                     Passed |
| Seven goal choices under that question                     |                     Passed |
| Old multi-question stage prompt absent                     |                     Passed |
| Assumed Saudi Arabia/city/nationality absent               |                     Passed |
| Capability hub hidden before tools action                  |                     Passed |
| Import and ATS visible after tools action                  |                     Passed |
| Privacy deletion control visible                           |                     Passed |
| Editor, templates, ATS, import, preview route availability | Passed at route HTTP level |
| PDF content preservation                                   |                     Passed |

## Screenshots and artifacts

The generated synthetic artifacts are stored locally under `artifacts/noura-foundation/`. They include Arabic and English desktop/mobile captures, Tools panel, Privacy details, print captures, and Arabic/English PDFs.

The requested named captures are available as:

- `chromium-ar-desktop.png`
- `chromium-en-desktop.png`
- `chromium-ar-mobile.png`
- `chromium-en-mobile.png`
- `tools-panel.png`
- `privacy-details.png`
- `noura-ar-print.png`
- `noura-en-print.png`
- `noura-ar.pdf`
- `noura-en.pdf`

The browser captures are verification evidence, not an approval baseline. They must not be promoted to blocking visual baselines until the owner reviews them.

## Privacy evidence

The anonymous route did not expose resume, CV, draft, or document keys in `localStorage` or `sessionStorage`. The harness inspected the IndexedDB and Cache Storage APIs but did not write to them. No guest non-GET requests or Supabase persistence writes were observed during the Foundation journey. No captured request body contained synthetic CV/PII markers, prompts, responses, addresses, names, emails, or phone markers. No application changes were made during this verification.

## Known exclusions and blockers

The verification did not claim full Noura Phase 2 adaptive conversation, journey-specific state machines, achievement interviewing, diff/undo flows, offline recovery, live AI failure recovery, or mobile bottom navigation. Those belong to the separate Phase 2 request and were intentionally excluded from this Foundation-only verification.

The Phase 14 guest smoke and assistant PDF contract were updated with the smallest compatible changes. The PDF fix adds the existing `print-area` contract to the current live resume preview; it does not add a new user-facing feature. The previous GitHub CI failures remain historical evidence for `668550c`; CI must be rerun for `03df1ff`. Full Noura Phase 2 adaptive conversation remains intentionally excluded.

## Rollback

The minimal product/test fix is revertible at `03df1ff`; the Foundation implementation before it is `668550c`. Verification harnesses, screenshots, and this report are committed separately for review. No merge is allowed until the new CI run is green and the owner approves.

## Final decision

**Do not merge PR #53 yet.** Local Build, QA, Network Privacy, Data Deletion parity, PDF/Print, and browser checks pass after `03df1ff`, but GitHub CI must complete successfully for the new commit and the owner must approve the Draft PR.
