# Phase 18 Competitor Review

## Scope and legal boundary

This review uses only publicly accessible official product pages. It records advertised product capabilities; it does not reverse-engineer code, copy templates, scrape private content, or reproduce protected visual systems. Seerati's templates and assets remain original.

## Public feature matrix

| Product       | Confirmed public claims                                                                                                                                            | Observed / verified here          | Inferred or unknown                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------- |
| Enhancv       | ATS-friendly builder, AI writing, ATS check, one-click tailoring, parsing, skills finder, translation, job tracker, interview help, cover letters, job match       | Official landing-page claims only | Internal provider architecture, storage model, evidence graph, privacy implementation |
| Teal          | AI resumes, keyword recommendations, job tracker, job insights, Chrome extension, cover letters, interview practice, resume/job matching, free and premium tiers   | Official landing-page claims only | Network behavior, persistence boundaries, model evaluation, source provenance         |
| Kickresume    | AI resume and cover-letter builders, 40+ templates, resume checker, examples, personal website, mobile support, proofreading, EU/privacy statements                | Official landing-page claims only | Internal ATS rules, AI grounding, guest storage, implementation of privacy controls   |
| FlowCV        | Free first resume, unlimited watermark-free downloads, 50+ templates, imports, multiple languages including RTL, cover letters, text-based PDFs, account auto-save | Official landing-page claims only | PDF renderer internals, network payloads, retention, exact ATS parsing behavior       |
| Rezi          | Requires official-page retrieval before final inclusion                                                                                                            | Not verified in this review       | All implementation details remain unknown                                             |
| Resume.io     | Requires official-page retrieval before final inclusion                                                                                                            | Not verified in this review       | All implementation details remain unknown                                             |
| Novorésumé    | Requires official-page retrieval before final inclusion                                                                                                            | Not verified in this review       | All implementation details remain unknown                                             |
| Jobscan       | Official search result indicates ATS resume builder/checker; official page must be retrieved before final citation                                                 | Search lead only                  | Internal implementation and data handling                                             |
| Resume Worded | Requires official-page retrieval before final inclusion                                                                                                            | Not verified in this review       | All implementation details remain unknown                                             |
| Canva         | Official resume-builder page was identified; feature claims require page retrieval before final citation                                                           | Search lead only                  | Internal implementation and data handling                                             |

## Differentiation decisions for Seerati

Seerati should not compete by copying template aesthetics or matching vendor marketing language. Its defensible differentiators are an Arabic-first RTL career graph, explicit provenance for every fact, memory-only guest boundaries, visible AI transmission preview, approval-gated suggestions, explainable ATS findings, Saudi-context vocabulary labelled as non-official, and original watermark-free templates.

The comparison also reinforces a product boundary: a job tracker or portfolio feature must not silently convert anonymous resume content into cloud persistence. Any account recovery, workspace sync, or public publishing requires an explicit consent state, a visible privacy disclosure, deletion behavior, and a separate network test.

## Review confidence

- **Confirmed:** product capabilities explicitly advertised on the cited official pages.
- **Observed:** no competitor private product behavior was inspected in this pass.
- **Inferred:** architecture or policy hypotheses that must not be presented as facts.
- **Unknown:** claims not disclosed by official sources.

## Sources

1. [Enhancv official site](https://enhancv.com/)
2. [Teal official site](https://www.tealhq.com/)
3. [Kickresume official site](https://www.kickresume.com/en/)
4. [FlowCV official site](https://flowcv.com/)
5. [Jobscan official resume builder lead](https://www.jobscan.co/resume-builder)
6. [Canva official resume builder lead](https://www.canva.com/create/resumes/)
