# Phase 17 Visual QA Report

## Scope

The required visual matrix covers homepage, hero, intro scenes, Saudi cities, templates, Assistant, builder, ATS, jobs, cover letters, mobile, dark mode, and print. It must run in Arabic RTL and English LTR across Chromium, Firefox, and WebKit, with desktop, mobile, tablet, 200% zoom, reduced motion, keyboard, PDF, and A4 print contexts.

## Current implementation evidence

The homepage value story and Saudi city story are implemented with existing UI primitives, semantic HTML, CSS gradients, and no new external assets. Format, TypeScript, build, and diff checks passed after the slice. Full browser and visual evidence is still required against the final Phase 17 branch.

## Review policy

A human reviewer must inspect before/after screenshots for hierarchy, text wrapping, cultural tone, contrast, focus, overflow, RTL/LTR direction, and print fidelity. Visual baselines must never be updated automatically to hide a regression. Differences are accepted only when the change is intentional, documented, and does not violate accessibility, privacy, or performance budgets.
