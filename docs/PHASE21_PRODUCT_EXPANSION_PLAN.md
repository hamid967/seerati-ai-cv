# Phase 21: Product Expansion Plan

## Purpose

This plan expands Seerati AI CV through independent, reviewable waves. It preserves the guest-first contract: anonymous work is memory-only by default, no CV content is placed in `localStorage`, IndexedDB, Cache Storage, URLs, analytics, or cloud persistence without an explicit and visible choice.

> **Status convention:** Items labelled **implemented in Wave 1** are code in the `feat/phase21-application-tools` branch. All other items are proposed scope until their own branch, tests, and Draft PR exist.

| Wave | Scope                                                                                                                    | Guest boundary                                                                            | Delivery                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------- |
| 1    | Application Center, application readiness checklist, discovery links to matching, ATS, cover letters, and job workspaces | Checklist state is React memory only; no job or resume content is collected by the center | `feat/phase21-application-tools` |
| 2    | Interview practice and career-development guidance                                                                       | Text-only, local-first practice; no voice capture by default                              | Separate Draft PR                |
| 3    | Specialized resume sections and application-tracking improvements                                                        | Guest drafts remain memory-only; account persistence stays opt-in and owner-scoped        | Separate Draft PR                |

## Wave 1: Application Center — Implemented

The Application Center is a new application route at `/application-center`. It gives guests and signed-in users a single starting point for a role-targeted application pack. The route exposes existing product tools rather than reproducing them: job matching, keyword scanning, cover-letter preparation, and ATS readiness.

The local readiness checklist includes five review steps: setting a job target, selecting a resume version, mapping job keywords, preparing a cover letter grounded in evidence, and reviewing the final pack. Its completion state is held in component memory and can be cleared immediately. The interface explicitly states that it does not save or automatically send resume or job-description content.

## Wave 2: Interview and Career Guidance — Proposed

The next branch should activate a dedicated `/interviews` route based on the existing evidence-grounded interview engine. It should add a text-only STAR practice surface, make missing evidence visible, and avoid recording audio or sending a prompt before explicit consent. A separate career-guidance section should offer role goals, skill-gap reflection, and curated next-step plans without presenting them as employment predictions.

| Proposed section        | Intended user value                                   | Guardrail                                                   |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Interview practice      | Structured STAR rehearsal by role and job description | No audio capture; no employer-outcome claim                 |
| Evidence answer builder | Turn verified facts into reviewable answer outlines   | Mark missing facts; never invent achievements               |
| Career direction plan   | Choose a goal and map skill or portfolio next steps   | Local or account-scoped state only; no background profiling |

## Wave 3: Specialized Sections and Job Tracking — Proposed

The final planned branch should extend structured resume support for projects, publications, licences, portfolios, volunteering, and references. It should also improve the existing job workspace with a clearer application timeline, follow-up reminders that are user-initiated, and exportable account-owned data. It must not create guest cloud records or silently migrate guest content into an account.

| Proposed section            | Intended data model                               | Privacy rule                                                  |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| Projects and portfolios     | Title, summary, evidence link, optional outcome   | User-entered content stays in memory for guests               |
| Publications and licences   | Credential metadata and optional verification URL | Never infer or fabricate a credential                         |
| Volunteering and references | Structured optional resume sections               | Do not expose contact details in public telemetry or logs     |
| Job follow-up timeline      | Status, date, owner-entered note                  | Guest timeline remains local; account persistence is explicit |

## Acceptance Gates

Each wave must pass TypeScript, lint, build, the repository QA suite, and a route/browser smoke test. New guest interactions must be inspected for unauthorized storage and network writes. A wave opens as a Draft PR only; no merge or deployment occurs without explicit owner approval.

## Rollback

Each wave uses a dedicated branch and reversible commit. If a feature causes a regression, revert its branch commit or the merged commit, then rerun the corresponding smoke test, TypeScript, lint, build, and relevant browser checks.
