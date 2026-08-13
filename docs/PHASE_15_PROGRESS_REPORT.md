# Phase 15 — Saudi Validation, Security Red-Team and Controlled Beta

**Branch:** `feat/phase-15-saudi-validation`  
**Base:** `origin/main` at `19bfffa7fe43dbf1f70ad550ef59021f7716fb0d`  
**Current implementation commit:** `d3f10a6`
**Status:** Draft PR candidate; do not merge without owner approval.

## Executive result

Phase 15 establishes a reproducible foundation for Saudi AI/ATS validation and makes a focused performance change to `/assistant`: the route no longer statically imports `resume-preview` only to resolve a template, and `ai-service` is loaded only when AI drafting is invoked. A lightweight `template-utils` helper keeps the initial route chunk independent from the preview renderer. The built Assistant client chunk remains approximately 20KB in the measured build, while PDF/editor assets remain separate lazy assets.

The branch also adds a deterministic 300-case synthetic Golden Dataset, fixture/schema harness, AI evaluation framework, ATS validation method, Saudi career rubric, privacy/deletion policy, threat model, red-team plan, beta privacy contract, and theme/intro performance specifications.

## Evidence

| Area                         | Result                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| Baseline commit              | `19bfffa`                                                                                   |
| Format/type/build            | Pass after current changes                                                                  |
| Static QA/AI contracts/RTL   | Pass                                                                                        |
| QA routes                    | Pass on clean single dev server: 23/23 routes                                               |
| Chromium hardening           | Pass after duplicate-key fix; known English visual warning 1.08%                            |
| Firefox hardening            | Pass                                                                                        |
| WebKit hardening             | Pass                                                                                        |
| Guest parity/privacy         | Pass                                                                                        |
| Lighthouse                   | Pass on Wrangler production-like runtime; 3× per route; LCP/performance/SEO warnings remain |
| Synthetic dataset            | Pass; 300 cases; hash `a0f156d9bc623f026ee93501522856667f8602107c790ce6cab84eeaa36aa2`      |
| AI output quality            | Not measured yet                                                                            |
| ATS F1/precision/recall      | Not measured yet                                                                            |
| Full deletion browser matrix | Pending                                                                                     |
| Full security red-team       | Pending                                                                                     |
| Saudi user beta              | Not started; correctly blocked                                                              |
| Global benchmark             | Pass as research artifact; 11 public references reviewed without copying assets             |
| Theme/intro foundation       | Pass locally; semantic tokens enabled, intro remains optional and non-critical              |

## Performance decision

The current change reduces initial Assistant route coupling and adds a lightweight semantic theme layer, but the Lighthouse target is not yet achieved. On the Wrangler production-like runtime, three-run medians were approximately `/assistant` 4.206s, `/jobs` 4.209s, `/cover-letters` 3.892s, `/` 3.964s, `/features` 3.676s, `/privacy` 3.069s, and `/templates` 3.804s. The `/assistant` runs were 3.226s, 4.219s, and 4.206s, showing variance as well as a median above 2.5s. These are measured results, not a pass. Performance remains non-blocking until the owner reviews variance and the provider/bundle graph is improved.

The Vite preview command is not a valid production runtime for this TanStack Start/Nitro build because it expects `dist/server/server.js`; the measured Lighthouse run therefore used the generated `.output/server` through Wrangler with HTTP 200 readiness. This runtime fact is recorded so future CI runs do not confuse a preview boot failure with an application performance result.

## Security and privacy decision

Development and staging work may continue with synthetic data. Closed Beta, Limited Production, Public Launch, and marketing claims are **Not Ready** from this branch until deletion, red-team, model safety, and owner-reviewed beta gates pass. Guest memory-only boundaries and existing Network Privacy checks remain protected.

## Known limitations

The AI harness currently validates fixture structure and reproducibility, not model responses. The ATS documents define method and thresholds but do not claim parser accuracy. The Saudi rubric is ready for independent reviewers, but no human panel results exist. The global benchmark covers Enhancv, Rezi, Teal, Kickresume, Resume.io, Novorésumé, FlowCV, Canva, Linear, Notion, and OpenAI as public references; observations are qualitative and do not establish competitor superiority. The semantic theme foundation is enabled without a broad redesign, and the cinematic intro remains optional, session-scoped, keyboard-skippable, reduced-motion aware, and outside the `/assistant` critical path.

## Rollback

Rollback is the prior merged Phase 14 commit `19bfffa`. No force push, history rewrite, or merge is authorized by this report.
