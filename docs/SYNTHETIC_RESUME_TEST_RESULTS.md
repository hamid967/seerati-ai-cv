# Synthetic Resume Test Results

## Evidence status

This document records evidence collected on the feature branch before the Draft Pull Request. It distinguishes executed local checks from checks that will run again in GitHub Actions after the branch is pushed.

| Check                                 | Result                                        | Evidence                                                                                                                    |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Existing Noura adaptive baseline      | Passed                                        | `bun run test:noura-adaptive`                                                                                               |
| Existing Phase 20 journey baseline    | Passed                                        | `bun run test:phase20-journey`                                                                                              |
| Existing Guest-First baseline         | Passed                                        | `bun run test:guest-first`                                                                                                  |
| Synthetic generator unit smoke        | Passed                                        | `bun run test:synthetic-resume`                                                                                             |
| TypeScript strict compilation         | Passed                                        | `tsc --noEmit` after implementation                                                                                         |
| Focused ESLint                        | Passed with existing repository warnings only | No lint errors in changed files                                                                                             |
| Production build                      | Passed                                        | `bun run build` including client environment guard                                                                          |
| Synthetic Chromium browser smoke      | Passed                                        | Noura flow, iPhone Arabic, Android English, keyboard, reduced motion, export gate, ATS boundary, storage and network checks |
| Existing guest recovery browser smoke | To be run in final validation                 | Final quality phase                                                                                                         |
| Existing visitor-parity browser smoke | To be run in final validation                 | Final quality phase                                                                                                         |
| Release Hardening matrix              | To be run after Draft PR is pushed            | Chromium, Firefox, WebKit, Lighthouse                                                                                       |

## Unit coverage

`scripts/synthetic-resume-smoke.ts` covers the six-specialty taxonomy; Arabic and English outputs; student, graduate, mid-level, and manager experience mappings; deterministic placeholder contact details; four template choices; default `sample` metadata; explicit field confirmation; and the fact that confirming one field cannot approve remaining sample fields.

## Browser coverage

`scripts/synthetic-resume-browser-smoke.mjs` creates a synthetic software-development resume through Noura on an iPhone-sized Arabic viewport. It uses keyboard activation for the entry and level selection, compares two templates, opens the editor, proves that unchanged placeholder confirmation is rejected, attempts a Text PDF export, downloads only the labelled sample file, and verifies the ATS sample boundary.

The same script opens an Android-sized English viewport, runs the English specialty search and selection path, checks reduced motion, and verifies no horizontal overflow. It records requests and fails if the synthetic marker reaches an outbound request or a cloud persistence mutation endpoint. It also fails if sample-related data appears in localStorage, sessionStorage, IndexedDB, or Cache Storage by default.

## Known test limits

The initial browser smoke does not yet automate confirmation of every sample field and a successful final PDF export because the slice intentionally prioritises the safety gate before the expanded guided-replacement workflow. It does not test the future administrative content console, AI adaptation fallback, or the deferred specialty catalog because those capabilities are not part of this initial release.
