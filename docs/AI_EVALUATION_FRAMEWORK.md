# Phase 15 AI Evaluation Framework

## Evaluation dimensions

The harness will evaluate factual consistency, anti-hallucination behavior, Arabic and English quality, bilingual fact preservation, structured output validity, diff acceptance, undo, instruction following, safety refusal, timeout/outage handling, cancellation, rate limiting, fallback, and session preservation.

## Evidence requirements

Every model run must record only metadata: provider, model version, prompt version, dataset hash, date, configuration, aggregate scores, and regressions. Raw CV text, prompts, responses, authentication headers, and direct identifiers are excluded from artifacts.

## Acceptance thresholds

The proposed thresholds are zero fabricated employers/qualifications/dates/certifications/metrics, structured output success ≥99.5%, factual consistency ≥98%, translation fact preservation ≥99%, quality score ≥4/5, zero critical safety failures, p95 latency ≤8 seconds, and fallback within 3 seconds after a provider failure. These are targets, not achieved results, until a real model-output run is executed and independently reviewed.

## Current implementation stage

Phase 15 currently provides the deterministic 300-case fixture and schema harness. It does not yet claim model-output quality, because no raw model evaluation has been run or stored. The next safe step is a metadata-only batch runner using the approved server-side model boundary and a reviewed cost/retention policy.
