# Noura Change Manifest

## Goal

Rebuild `/assistant?agent=noura` as a Saudi professional, local-first, privacy-first experience that helps a guest create a resume without mandatory registration, while preserving direct editing, templates, ATS, import, PDF, and print paths.

## This implementation slice

| Requirement      | Implementation boundary                                               | Acceptance evidence                                               |
| ---------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Noura identity   | Existing validated agent registry plus route-level identity panel     | Arabic/English name, role, policy, and local/AI state are visible |
| One goal first   | Goal-first opening replaces the simultaneous stage/sector/mode form   | The first interaction is a single goal selection                  |
| Privacy truth    | Compact session-status disclosure and corrected guest copy            | No “moves to your account” claim; memory-only default is explicit |
| Preview truth    | No default Saudi country; illustrative preview label where applicable | No city, nationality, or country is inferred without user input   |
| Contextual tools | Capability hub is deferred behind a compact tools action              | Primary goal is not competing with all tools at once              |
| Direct editing   | Existing form, template selection, and live preview remain available  | No existing creation path is removed                              |

## Privacy impact

Guest data remains memory-only by default. No new localStorage, IndexedDB, Cache Storage, URL state, analytics payload, or cloud write is introduced. AI remains explicit and must retain the existing consent and evidence boundaries. No CV content is added to logs or telemetry.

## Exclusions for this slice

A complete conversational state machine, voice mode, 300-case quality corpus, 20–30-person Saudi user study, full browser matrix, PDF visual regression, and production Lighthouse budgets are follow-up gates. They must not be represented as completed by this branch.

## Rollback

Revert the Noura branch commits or remove the route-level Noura surface and privacy-copy changes. The prior `/assistant` wizard and existing agent registry remain recoverable because no database migration or destructive store change is included.

## Required checks

Formatting, TypeScript, lint, build, route-shell, existing Phase 18/19 smoke tests, targeted Noura fixtures, privacy inspection, and manual/browser checks where dependencies are available.
