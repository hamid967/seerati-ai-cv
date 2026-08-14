# Synthetic Resume Release Readiness

## Release decision model

The Synthetic Specialty Resume Generator is eligible for review only when its privacy, fictional-content, export-safety, and existing guest-path checks are green. It must remain a Draft Pull Request until the owner reviews the final diff and explicitly approves any merge.

| Gate                           | Required status                                                                   | Initial implementation status                       |
| ------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| No-registration entry          | Noura option works for a visitor                                                  | Implemented and browser-tested                      |
| Default memory-only behavior   | No sample CV content in persistent browser storage or Supabase                    | Implemented and browser-tested                      |
| No automatic account migration | Transient sample is excluded from guest migration                                 | Implemented in Store separation                     |
| Synthetic content safety       | No real personal, employer, university, client, credential, or achievement claims | Implemented in deterministic library and unit smoke |
| Field review                   | Placeholder cannot be confirmed unchanged                                         | Implemented and browser-tested                      |
| Export safety                  | Final PDF/text/clipboard actions are gated while samples remain                   | Implemented and browser-tested                      |
| ATS boundary                   | No final content score for unresolved samples                                     | Implemented and browser-tested                      |
| Accessibility                  | Keyboard, RTL/LTR, reduced motion, mobile overflow                                | Browser-tested in initial smoke                     |
| Quality                        | Format, lint, TypeScript, build, QA                                               | Final validation pending                            |
| CI                             | Quality, route smoke, browser matrix, Lighthouse                                  | Pending Draft PR run                                |

## Privacy review

The anonymous sample path performs local deterministic generation. It has no required authentication call, account write, resume insert, analytics payload, AI prompt, remote content fetch, URL serialization, or default storage write. Existing site language preference is outside the synthetic data path and contains no resume or specialty content.

The synthetic browser smoke treats these conditions as blocking: an outbound request containing the synthetic marker, a POST/PUT/PATCH/DELETE request to Supabase persistence endpoints, or a sample-related persistence key in browser storage.

## Known exclusions

The following request items are intentionally out of scope for the first six-specialty slice: an admin content-management interface, audit log/reviewer/version UI, 30-specialty catalog, AI adaptation, bilingual combined resume, full-screen rendered template comparison, a final verified-PDF success E2E, job-tracker integration, and ongoing production monitoring. None is represented as shipped.

## Rollback

The feature is additive and has no migration. Revert the feature commit from the PR to remove the Noura option, lazy flow, synthetic modules, transient Store channel, notices, guards, tests, documentation, and CI step. Then run the existing guest-first and release-hardening suites to validate the rollback.

## Deployment boundaries

The production scope remains `https://hrhbs.com`. This change does not alter DNS, custom domains, authentication configuration, Supabase schema, RLS policies, production secrets, billing, or deployment provider settings.
