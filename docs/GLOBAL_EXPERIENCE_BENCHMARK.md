# Global Experience Benchmark

**Status:** Research baseline for Phase 15; not a claim of superiority.

## Purpose

This benchmark studies public product experiences in resume builders and adjacent productivity products. It considers the sequence from value proposition to first action, CTA clarity, product preview, template discovery, AI explanation, ATS explanation, trust, privacy language, mobile implications, and speed to the editor. It does not copy layouts, text, logos, imagery, templates, or interaction choreography.

## Public references

| Product                  | Public experience observed                                                                                                                                 | Useful question for Seerati                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Enhancv                  | Leads with a direct resume-building CTA and combines AI writing, ATS checking, tailoring, templates, and a product explanation on one public journey. [1]  | Can the first screen show one useful action without loading the complete editor?                             |
| Teal                     | Frames resume creation as part of a wider job-search workflow, including job tracking, insights, bookmarking, and a create/search/apply/grow sequence. [2] | Can Seerati make the next career action obvious while preserving guest privacy?                              |
| Novorésumé               | Uses a free AI-powered builder promise, template categories, editor previews, ATS education, and AI assistance as the main path. [3]                       | Can Seerati explain AI assistance as grounded suggestions rather than automatic authorship?                  |
| Canva Resume | Emphasizes visual template breadth, drag-and-drop design, asset upload, and export/share options. [4] | Can Seerati offer a calm template choice without allowing decorative complexity to harm ATS or print output? |
| Rezi | Organizes the journey around build, score, and target, with keyword and ATS-oriented feedback. [5] | Can Seerati make each advisory check explainable and user-controlled? |
| Kickresume | Combines creation, examples, AI writing, templates, cover letters, and an explicit privacy/security narrative. [6] | Can Seerati show privacy at the first action without adding a consent wall to guest creation? |
| Resume.io | Uses a dense conversion narrative around speed, AI, recruiter assistance, and career services. [7] | Can Seerati remain concise and factual instead of using outcome guarantees? |
| FlowCV | Leads with a free-first path, templates, guided entry, import, PDF export, and privacy messaging. [8] | Can Seerati preserve a free guest path while keeping memory-only boundaries explicit? |
| Linear | Makes the product interaction visible early and explains the product through purpose, agents, speed, plan, build, review, and monitor. [9] | Can Seerati demonstrate value before exposing the full feature catalog? |
| Notion | Uses a concise value proposition followed by a small number of capability lanes and concrete workflows. [10] | Can Seerati keep hierarchy clear in Arabic and English? |
| OpenAI | Separates product modes and pairs capability explanation with safety and privacy language. [11] | Can Seerati explain AI boundaries without imitating another product's interaction or identity? |


## Comparative dimensions

### Visual sequence and value proposition

The strongest public journeys make the product legible before asking the visitor to understand a large feature catalog. Seerati should therefore use a compact header, one benefit-led hero, a lightweight resume preview, and a short path to creation. The preview must be a static or locally-rendered representation, not the complete editor or PDF engine.

### CTA placement and editor access

A primary CTA should be visible in the first viewport and should not require registration for basic guest creation. Secondary actions may expose import and templates, but they must not compete with the primary creation path. The first action should be measurable as a route transition or local state change without sending CV content to analytics.

### AI and ATS explanation

Public competitors commonly present AI and ATS as benefits. Seerati should differentiate through transparency: AI suggestions must be grounded in user-provided facts, acceptance must remain user-controlled, and ATS should be described as an advisory rules-based assessment rather than a guarantee of hiring outcomes.

### Trust and privacy

Seerati's strongest defensible distinction is the combination of Arabic-first Saudi career context, registration-optional entry, and memory-only guest boundaries. This should be shown beside the first CTA and repeated at the point where a user considers recovery or export. No claim should imply that the service guarantees interviews, hiring, ATS passage, or government endorsement.

### Mobile and performance

The mobile path should retain the same first action, privacy disclosure, and language choice while reducing decorative motion and preview detail. Intro animation is optional and must be dynamically loaded after the primary page content, never as the LCP element.

## Design guardrails

The benchmark is advisory. It does not authorize copying competitor layouts, wording, images, templates, logos, color systems, or animation sequences. Every Seerati component must be justified by a user task, an accessibility requirement, a privacy requirement, or a measured conversion/performance hypothesis.

## References

[1]: https://enhancv.com/ "Enhancv public resume builder"
[2]: https://www.tealhq.com/ "Teal public product page"
[3]: https://novoresume.com/ "Novorésumé public resume builder"
[4]: https://www.canva.com/resumes/ "Canva public resume product page"
[5]: https://www.rezi.ai/ "Rezi public resume product page"
[6]: https://www.kickresume.com/en/ "Kickresume public resume product page"
[7]: https://resume.io/ "Resume.io public resume product page"
[8]: https://flowcv.com/ "FlowCV public resume product page"
[9]: https://linear.app/ "Linear public product page"
[10]: https://www.notion.com/ "Notion public product page"
[11]: https://openai.com/chatgpt/overview/ "OpenAI ChatGPT public product overview"
