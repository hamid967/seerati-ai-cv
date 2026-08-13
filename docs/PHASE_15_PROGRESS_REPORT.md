# Phase 15 — Saudi Validation, Security Red-Team and Controlled Beta

**Branch:** `feat/phase-15-saudi-validation`  
**Base:** `origin/main` at `19bfffa7fe43dbf1f70ad550ef59021f7716fb0d`  
**Current implementation commit:** `28d93e2`  
**Status:** Draft PR candidate; do not merge without owner approval.

## Executive result

Phase 15 establishes a reproducible foundation for Saudi AI/ATS validation and makes a focused performance change to `/assistant`: the route no longer statically imports `resume-preview` only to resolve a template, and `ai-service` is loaded only when AI drafting is invoked. A lightweight `template-utils` helper keeps the initial route chunk independent from the preview renderer. The built Assistant client chunk remains approximately 20KB in the measured build, while PDF/editor assets remain separate lazy assets.

The branch also adds a deterministic 300-case synthetic Golden Dataset, fixture/schema harness, AI evaluation framework, ATS validation method, Saudi career rubric, privacy/deletion policy, threat model, red-team plan, beta privacy contract, and theme/intro performance specifications.

## Evidence

| Area | Result |
|---|---|
| Baseline commit | `19bfffa` |
| Format/type/build | Pass after current changes |
| Static QA/AI contracts/RTL | Pass |
| QA routes | Pass on clean single dev server: 23/23 routes |
| Chromium hardening | Pass; known English visual warning 1.08% |
| Firefox hardening | Pass |
| WebKit hardening | Pass |
| Guest parity/privacy | Pass |
| Lighthouse | Completed 3× per route; existing LCP/performance/SEO warnings remain |
| Synthetic dataset | Pass; 300 cases; hash `a0f156d9bc623f026ee93501522856667f8602107c790ce6cab84eeaa36aa2` |
| AI output quality | Not measured yet |
| ATS F1/precision/recall | Not measured yet |
| Full deletion browser matrix | Pending |
| Full security red-team | Pending |
| Saudi user beta | Not started; correctly blocked |

## Performance decision

The current change reduces initial Assistant route coupling, but the Lighthouse target is not yet achieved. The existing cold Lighthouse baseline remains materially above median LCP 2.5s, so this branch does not convert performance into a blocking gate or claim completion. The next P0 is bundle graph and cold-start tracing for auth/store/provider initialization.

## Security and privacy decision

Development and staging work may continue with synthetic data. Closed Beta, Limited Production, Public Launch, and marketing claims are **Not Ready** from this branch until deletion, red-team, model safety, and owner-reviewed beta gates pass. Guest memory-only boundaries and existing Network Privacy checks remain protected.

## Known limitations

The AI harness currently validates fixture structure and reproducibility, not model responses. The ATS documents define method and thresholds but do not claim parser accuracy. The Saudi rubric is ready for independent reviewers, but no human panel results exist. The global theme and cinematic intro are specified but intentionally not enabled as a broad redesign because `/assistant` still has an LCP gap.

## Rollback

Rollback is the prior merged Phase 14 commit `19bfffa`. No force push, history rewrite, or merge is authorized by this report.
