# Synthetic Resume Release Readiness

## Release decision model

The Synthetic Specialty Resume Generator is eligible for review only when its privacy, fictional-content, export-safety, optional-AI, and existing guest-path checks are green. It must remain a Draft Pull Request until the owner reviews the final diff and explicitly approves any merge.

| Gate | Required status | Current implementation evidence |
| --- | --- | --- |
| No-registration entry | Noura option works for a visitor | Implemented and browser-tested. |
| Default memory-only behavior | No sample CV content in persistent browser storage or Supabase | Implemented and browser-tested. |
| No automatic account migration | Transient sample is excluded from guest migration | Implemented in Store separation. |
| Deterministic catalog | 36 reviewed bilingual specialties generate a safe local sample | Taxonomy and all-specialty deterministic smoke. |
| Synthetic content safety | No real personal, employer, university, client, credential, or achievement claims | Deterministic library, AI prompt/validator, and contract smoke. |
| Explicit AI consent | Checkbox is unchecked and adaptation control is disabled before consent | Browser-tested in Arabic and English. |
| Guest AI boundary | A no-session visitor sends no adaptation request and receives a local fallback | Browser-tested network assertion. |
| AI request minimisation | Endpoint accepts only `consent`, specialty ID, level, and language | Strict Zod schema and server-function contract. |
| AI output validation | Malformed or unsafe output never reaches a sample | Exact JSON-shape and anti-fabrication contract smoke. |
| AI provenance and review | Applied output stays `sample`, `synthetic-ai`, unapproved | Deterministic adaptation metadata smoke. |
| Field review | Placeholder cannot be confirmed unchanged | Existing editor and browser coverage. |
| Export safety | Final PDF/text/clipboard actions are gated while samples remain | Existing browser-tested export guard; source-neutral metadata. |
| ATS boundary | No final content score for unresolved samples | Existing browser-tested ATS boundary. |
| Accessibility | Keyboard, RTL/LTR, reduced motion, mobile overflow, consent control | Browser-tested on Arabic iPhone and English Android viewports. |
| Quality | Format, lint, TypeScript, build, QA | Final validation required before PR delivery. |
| CI | Quality, route smoke, browser matrix, Lighthouse | Pending Draft PR run. |

## Privacy review

The anonymous sample path performs local deterministic generation. It has no required authentication call, account write, resume insert, analytics payload, AI prompt, remote content fetch, URL serialization, or default storage write. Existing site language preference is outside the synthetic data path and contains no resume or specialty content.

The optional AI path is not an exception to visitor privacy. It is available only after visible consent and a button press in an authenticated session. Before dynamically importing the server function, the client checks for a session; visitors remain local and must never generate a request to the adaptation endpoint. When an eligible request is made, it contains only the predefined product selections. Usage logging contains task/provider/status/token metadata and no prompt, response, or resume text.

The synthetic browser smoke treats these conditions as blocking: an outbound request containing the synthetic marker, a POST/PUT/PATCH/DELETE request to Supabase persistence endpoints, a sample-related persistence key in browser storage, an enabled adaptation control without consent, or a guest adaptation endpoint request.

## Known exclusions

This release scope excludes a content-management interface, reviewer/version UI, user-entered custom-specialty generation, public guest access to the AI endpoint, personalisation from CV or job-description text, combined bilingual resumes, full-screen rendered template comparison, a final verified-PDF success E2E, job-tracker integration, and ongoing production monitoring. The catalog covers 36 reviewed examples; it does not claim complete occupational coverage.

## Rollback

The feature is additive and has no migration. Revert the commits that add the specialty expansion, AI adaptation function/client, consent UI, metadata provenance, tests, documentation, and CI command. Then run the existing guest-first and release-hardening suites to validate the rollback.

## Deployment boundaries

The production scope remains `https://hrhbs.com`. This change does not alter DNS, custom domains, authentication configuration, Supabase schema, RLS policies, production secrets, billing, or deployment provider settings.
