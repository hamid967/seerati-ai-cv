# Phase 17 Release Readiness

## Current decision

**Status: Development/Staging only.** The implemented Phase 17 slice now includes the semantic Design System 3.0 layer, homepage Saudi Future Professional value story, abstract Saudi city story, optional/skippable intro, bilingual accessible Mega Menu, and template-gallery search/filter discovery. The QA and Release Hardening gates are green, but the current Lighthouse calibration remains above the requested LCP budget, so this does not certify production readiness.

## Evidence already available

Formatting, TypeScript, production build, official QA, guest memory-only smoke, Network Privacy, axe, keyboard navigation, Chromium/Firefox/WebKit, PDF/Print, and three-run Lighthouse calibration have evidence under `audit/phase17/`. The code adds no new persistence, analytics payload, AI/ATS behavior, or external asset dependency. The repository contains 24 active default templates, documented in `PREMIUM_TEMPLATE_CATALOG.md`, and the new city story remains CSS-only.

## Gates still required

The final branch still requires data deletion browser evidence, mobile and slow-network checks, reduced motion, screen-reader review, 200% zoom, a broader visual-regression review, and human originality/cultural review. The completed evidence covers the full QA route suite, Network Privacy, guest memory-only smoke, Chromium/Firefox/WebKit, axe, keyboard, PDF/Print, and three-run Lighthouse on production preview. User-study results remain pending.

## Blocking findings unless evidence changes

The LCP target remains a measured performance gap: the latest three-run production-like preview reports a median of 4.241s on `/assistant`, with homepage and template routes also above 4s. Performance scores range from 77–82 on the measured routes, while CLS remains at or below 0.036 and accessibility/best-practices scores are 100. AI output quality, ATS precision/recall/F1, complete deletion browser evidence, full red-team execution, and Saudi user-study results must not be represented as complete without evidence. Missing asset licenses, critical privacy findings, PDF/Arabic failures, route failures, or browser regressions block release.

## Delivery and rollback

Phase 17 must be delivered as focused PRs or a clearly scoped Draft PR. No merge is permitted without explicit owner approval and green required checks. The rollback point for the current branch is `05ebfaaa58a93b0ba16276f2c7e44a564aee4c00`; the latest implementation commits remain reversible and must not be force-pushed or rewritten.
