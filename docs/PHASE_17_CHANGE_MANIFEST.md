# Phase 17 — Change Manifest

## Objective

Deliver an original, Saudi-first premium experience named **Saudi Future Professional** without migrating to Webflow, copying paid templates, changing privacy/AI/ATS logic unnecessarily, or weakening performance and release gates.

## Team operating model

The work is coordinated as 10 squads of five employees each: product/owner, backend/Supabase, frontend/Assistant, performance/Lighthouse, QA/Playwright, privacy/security, AI/ATS, Saudi career content, design system/UX, and release/documentation. One agent coordinates evidence, proposes reversible changes, runs deterministic checks, and prepares PR material. Human owners retain approval over cultural content, security, visual baselines, release readiness, and merge.

## Expected workstreams

| Workstream               | Expected scope                                                            | Primary acceptance                                                  |
| ------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Research and originality | Webflow/SaaS/AI/editor benchmark; license register                        | Sources recorded; no copied assets or layouts                       |
| Design System 3.0        | Semantic tokens, logical CSS, RTL/LTR, print/A4, motion and focus tokens  | Existing components remain functional; accessibility and print pass |
| Homepage                 | Hero, privacy indicator, lightweight resume preview, CTA story, sections  | Real functionality; no false metrics; LCP/CLS budgets pass          |
| Saudi cities             | Abstract city slider and optional city pages                              | Cultural review; no government logos or unsupported claims          |
| Intro and motion         | Optional first-visit intro with Skip/Escape/reduced motion                | Never blocks HTML/LCP; mobile/keyboard safe                         |
| Template experience      | 24 original free templates, lazy previews and filters                     | Arabic/English, RTL/LTR, A4/PDF/ATS structural checks               |
| Internal surfaces        | Assistant, ATS, jobs, letters, import, builder, account/admin consistency | Privacy and behavior unchanged unless explicitly tested             |
| QA and release           | Browser, mobile, slow network, visual, PDF, privacy, deletion             | No baseline updates to hide regressions; Draft PRs only             |

## Non-goals and exclusions

This manifest does not authorize changing Supabase persistence, guest storage, AI prompts, ATS scoring, account permissions, production telemetry, or admin authorization merely for visual polish. It does not authorize user research with real personal data, public beta recruitment, paid asset acquisition, or claims of employment outcomes.

## Required evidence

Each PR must include a focused diff, screenshots or sanitized visual evidence, mobile and RTL/LTR notes, performance data, accessibility results, privacy results, tests, and rollback commit. Performance and SEO remain staged gates until variance is owner-reviewed. Data deletion and red-team results must be marked pending unless executed with evidence.

## Rollback

The starting rollback point is `05ebfaaa58a93b0ba16276f2c7e44a564aee4c00`. No force push, history rewrite, or merge is permitted without explicit owner approval and successful required checks.
