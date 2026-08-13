# Phase 19 Change Manifest

## Goal

Phase 19 turns Seerati into an adaptive professional experience without turning the product into an uncontrolled chatbot. Intelligence is layered, local-first, explainable, consent-gated, reversible, and safe when AI or network services fail.

## First implementation wave

The first wave implements the five programs explicitly requested as the starting point: **Intent Router**, **Next Best Action Engine**, **Adaptive Onboarding**, **Resume Health Engine**, and **Privacy Preview**. Existing Phase 18 Job Match, Explainable ATS, Privacy Runtime, CareerProfileGraph, and local guest store remain the source of truth.

| Program             | Initial contract                                                                                        | Runtime boundary         |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------ |
| Intent Router       | bilingual/mixed-language intent, confidence, required/missing context, next action, fallback            | deterministic local only |
| Next Best Action    | ranked action, explanation, confidence, consent, local/remote, fallback, surface                        | deterministic local only |
| Adaptive Onboarding | persona-aware question sequence, reason, completion, skip, stopping point                               | session memory only      |
| Resume Health       | completeness, clarity, achievement strength, duplication, chronology, ATS, privacy, PDF readiness       | deterministic local only |
| Privacy Preview     | session data summary, proposed AI payload, reason, provider, expiry, save state, delete/cancel controls | no payload transmission  |

## Privacy requirements

Guest content remains memory-only by default. No new localStorage, cookies, analytics payload, URL content, or cloud write is introduced. Any future session recovery must be explicit consent, separately modeled, and deleted by the existing Privacy Runtime. AI is not called by the first wave.

## Acceptance checks

The first wave must have strict Zod contracts, deterministic fixtures, Arabic/English/mixed-language tests, low-confidence clarification behavior, synthetic data only, no AI/network dependency, and route-shell/build compatibility. Resume Health must not claim employment outcomes. Privacy Preview must never log CV text or prompt content.

## Rollback

Each program is additive under `src/modules/intelligence/*`. Removing the new exports and UI wiring restores the Phase 18 behavior. No database migration is allowed in this wave.

## Evaluation checkpoint

A deterministic harness now covers 500 synthetic Arabic and English intent cases. The current result is 500/500 correct (100% intent accuracy) with zero network calls and zero personal data. This does not yet cover the complete final evaluation matrix, which remains a later hardening wave.

## Explicit exclusions

This wave does not add a new chatbot, remote AI call, account migration, long-term guest profile, geolocation, automatic template changes, automatic content edits, or hidden analytics. Generative AI, learning/evaluation harnesses, and deeper UI integration are later waves.
