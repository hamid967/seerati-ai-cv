# Seerati Supreme Execution Plan

**Program:** Seerati AI CV and Noura Adaptive Career Copilot  
**Official production scope:** `https://hrhbs.com` only  
**Current baseline:** `origin/main` at `c1cb62f`  
**Program authority:** Seerati Supreme Program Director

> This document distinguishes **merged evidence**, **Wave 1 delivery**, and **proposed later work**. It does not claim that a documented requirement is implemented.

## Program principles

Seerati provides free resume creation, print, and PDF export without a watermark. Guest use is anonymous and memory-only by default; registration is optional; Arabic RTL and English LTR must remain first-class. Noura is a professional Saudi-context career agent, not a generic chatbot. It must use user-provided facts, disclose AI boundaries, and offer reviewable diffs rather than automatic content edits.

No code or infrastructure task may introduce guest persistence, implicit account migration, DNS changes, a new production domain, paid services, remote AI transmission, or database migration without an independently reviewed change manifest and owner approval.

## Current merged baseline

| Capability                                                                  | Current status                                      | Evidence                |
| --------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------- |
| Noura Foundation goal-first entry, privacy disclosure, contextual tools     | Merged                                              | PR #53                  |
| Local intelligence coach, smart interview surfaces, 500-case intent harness | Merged                                              | PRs #51–#53             |
| Adaptive journey state machine and Phase 20 requirements                    | Merged                                              | PRs #54–#55             |
| Cross-browser hardening, Network Privacy, PDF/print and Lighthouse baseline | Passing on the merged PR evidence                   | PRs #54–#55             |
| Full CareerProfileGraph question engine, evidence-AI gateway, diff/undo UI  | Proposed / not represented as complete by this plan | Requires separate Waves |

## Wave roadmap

| Wave                                         | Scope                                                                                                       | PR policy                                     | Exit gate                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Wave 1 — Runtime and Foundation Evidence** | Node/Bun decision, baseline reproducibility, Foundation and journey evidence, governance documents          | One Draft PR; no merge without owner approval | Build, QA, privacy, deletion, browsers, PDF/print, Lighthouse evidence                       |
| **Wave 2 — Career Facts and Questions**      | CareerProfileGraph delta, one-question engine, achievement evidence, preview synchronization                | Separate Draft PR                             | Fact provenance, no guest persistence, Arabic/English fixtures, integration tests            |
| **Wave 3 — Evidence-Locked AI**              | Payload preview, PII minimization, provider adapter, schema validation, diff/approval/undo                  | Separate Draft PR                             | Consent/network gates, zero sensitive hallucinations, failure fallback, 300-case corpus seed |
| **Wave 4 — Career Review and ATS**           | Resume Health, template recommendation, explainable ATS and job matching surfaces                           | Separate Draft PR                             | Explainability, no outcome guarantees, user-controlled actions                               |
| **Wave 5 — Document and Mobile Quality**     | Saudi Intelligent Workspace polish, mobile sequencing, import hardening, PDF/print and accessibility deltas | Separate Draft PR                             | RTL/LTR, A4, text selection, browser matrix, WCAG evidence                                   |
| **Wave 6 — Evaluation and Beta Readiness**   | Quality corpus, security review, performance budgets, privacy-safe observability, beta decision             | Separate Draft PR(s)                          | No P0/P1, critical/high security findings closed, reviewed performance budget                |

## Critical path and dependency rules

Wave 1 must establish the runtime and proof baseline before structural product expansion. Wave 2 must produce a single fact source and question contract before remote generation. Wave 3 cannot transmit user data until evidence selection, payload preview, schema validation, and explicit approval are independently verified. Waves 4–6 must not weaken the current free guest, privacy, PDF, or browser guarantees.

## Program release gates

| Gate                  | Required evidence                                               | Blocking condition                                              |
| --------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| Build and runtime     | Pinned runtime, reproducible install, typecheck and build       | Build error or undocumented runtime drift                       |
| Privacy               | Memory-only guest, synthetic network inspection, deletion proof | Guest content persistence, consent bypass, unredacted telemetry |
| Document export       | Arabic/English PDF and print inspection                         | Invalid Arabic text, clipping, missing free export, watermark   |
| Browser/accessibility | Chromium, Firefox, WebKit, keyboard, RTL/LTR, reduced motion    | Functional free path or critical accessibility failure          |
| AI                    | Consent, evidence lock, structured output, reviewable diff      | Automatic editing or factual fabrication                        |
| Security              | Upload, auth, RLS, headers, prompt injection tests              | Critical or high unresolved finding                             |
| Performance           | Three-run route baselines and owner-reviewed budgets            | Agreed budget breach or removed measurement evidence            |

## Change control

Every implementation PR needs a Task ID, named owner and reviewer, file ownership, acceptance criteria, privacy/security/performance/accessibility impact, synthetic-only test plan, CI run URL, screenshots or artifact evidence when relevant, known limitations, and a rollback point. The Release Director issues Go/No-Go only from evidence; the owner alone authorizes merging.
