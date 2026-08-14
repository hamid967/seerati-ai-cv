# Guest Lifecycle Hardening Plan

## Product direction

Seerati AI CV will provide an Arabic-first and English-equivalent professional CV workflow in which a visitor can start with Noura, create or import a resume, edit it, run local ATS analysis, preview, print, and export without registration. Anonymous CV content is memory-only by default. A user may choose an authenticated account for cloud persistence, but guest content must never migrate implicitly.

## Delivery roadmap

| Wave                            | Product outcome                                                                                                                                  | Required evidence                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 0 — Guest lifecycle hardening   | Guest data can be created, updated, expired, and deleted without residual in-memory metadata or cloud persistence.                               | Lifecycle regression, storage/reload check, changed-route network inspection.          |
| 1 — Complete visitor workflow   | Noura, editor, templates, import, ATS, local job match, cover letter, preview, PDF, and print are coherent in Arabic and English.                | Browser journeys, PDF/print visual regression, RTL/LTR and mobile coverage.            |
| 2 — Evidence-bound intelligence | Noura produces evidence-linked proposals that require user review and explicit application.                                                      | Fixture evaluation, schema checks, approval/diff coverage, no invented personal facts. |
| 3 — Reliability and performance | Public routes meet accepted accessibility, browser, performance, and release-hardening gates.                                                    | Preview Lighthouse baseline/budgets, axe/keyboard, browser matrix, safe monitoring.    |
| 4 — Optional account value      | Cloud persistence, account-only Career Twin, and optional migration/recovery UX are introduced only with explicit consent and clear explanation. | Consent, migration, deletion, RLS, and authenticated-flow verification.                |

## This implementation wave

This pull request implements **Wave 0 only**. It is intentionally limited to the review finding in PR #59 and its proof obligations.

| Area                     | Required change                                                                                       | Acceptance check                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Guest session deletion   | Clear module-held `GuestResumeSession` when the final guest resume is deleted through `persistGuest`. | `deleteResume(last guest resume)` makes `readGuestResumeSession()` return `null`.          |
| Browser lifecycle        | Exercise normal guest creation and explicit deletion in a real browser route flow.                    | ATS reports the transparent demo fallback after deletion.                                  |
| Privacy network coverage | Exercise `/resumes/new`, `/import`, and `/ats` with synthetic data while recording requests.          | No Supabase or selected analytics mutation; synthetic CV marker absent from outbound URLs. |
| Documentation            | State actual scope, known exclusions, and rollback.                                                   | This document and the PR body distinguish completed Wave 0 from later work.                |

## Privacy requirements

- No guest CV content in `localStorage`, URL state, analytics, logs, IndexedDB, Cache Storage, or cloud persistence by default.
- Session recovery, if offered, must require explicit consent and deletion must remove both recovery data and consent.
- No anonymous Supabase account, resume row, Career Twin write, or automatic guest-to-account migration.
- Synthetic test data only. Never upload request bodies or personal data as CI artifacts.

## Release gates

The change cannot be represented as release-ready unless formatting, lint, TypeScript, build, QA, focused guest smoke, browser smoke, Network Privacy inspection, and the existing browser/Lighthouse CI checks pass. Network Privacy, Arabic PDF/Print, and the free no-registration path are blocking gates.

## Exclusions and rollback

This wave does not implement account migration, guest recovery UI, `/jobs/$id` workspaces, Career Twin pages, extended JSON/plain-text export verification, or mobile navigation. Roll back by reverting the implementation commit; the change has no database migration, DNS change, or deployment configuration change.
