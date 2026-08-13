# Phase 17 — Baseline

**Branch:** `feat/phase-17-premium-saudi-webflow-experience`  
**Base:** `origin/main` at `05ebfaaa58a93b0ba16276f2c7e44a564aee4c00`  
**Date:** 2026-08-13  
**Status:** Baseline recorded before Phase 17 implementation.

## Scope

Phase 17 upgrades the existing Seerati AI CV product toward an original Saudi Future Professional experience while preserving TanStack Start, React, TypeScript, Tailwind, Arabic/English support, guest privacy, optional registration, free creation/printing, and existing Phase 15/16 release gates. This is not a Webflow migration and does not authorize copying paid templates, layouts, code, assets, or text.

## Baseline quality

The following non-mutating checks passed on the base commit and were saved in `audit/phase17/baseline-quality.log`:

| Gate                              | Result                         |
| --------------------------------- | ------------------------------ |
| ESLint                            | Pass                           |
| TypeScript `--noEmit`             | Pass                           |
| Production build                  | Pass                           |
| Client Supabase environment guard | Pass; 126 public files scanned |

The baseline build confirms the current application already separates heavy PDF/editor assets into generated server/client chunks. Phase 17 must not increase initial JavaScript by more than 35 KB, must not add more than 100 ms to LCP, and must preserve the current guest memory-only and privacy boundaries.

## Existing constraints

Guest content remains memory-only by default. No real CVs, prompts, identities, user research responses, or production payloads may enter source, logs, screenshots, CI artifacts, or pull requests. AI/ATS claims require measured evidence and human review. Every visual change requires RTL/LTR, Light/Dark, keyboard, mobile, print/PDF, privacy, and performance validation.

## Generated files not part of the baseline commit

`.lighthouseci/` and `artifacts/` are local generated outputs from earlier work. They are intentionally excluded from Phase 17 commits unless a sanitized, explicitly scoped evidence artifact is required.
