# Dependency and File Map

## System topology

```text
Route → Page → Components → Hooks/Store → Services/Modules → Data / AI / PDF

/assistant → assistant.tsx → Noura flow, capability hub, sample flow
           → StoreProvider + Noura evidence plan
           → legacy adapter / runAiTask (authenticated only)
           → Supabase RLS usage metadata or local deterministic guest path

/templates → templates.tsx → TemplateIntelligenceGuide + TemplateGallery3D
           → template-signals + template-recommendation
           → local template definitions only

/resumes/:id/edit → editor route → resume sections + sample notice
                 → StoreProvider
                 → guest memory OR authenticated Supabase resume row

/resumes/:id/studio → studio route → design recommendation cards
                   → template signals + local template definitions
                   → selected template ID only

/resumes/:id/preview → preview route → ProfessionalResumePreview
                    → ATS text / export guard / PDF exporter
                    → html2canvas + jsPDF loaded only on final image-PDF action
```

## Route groups

| Group                   | Routes                                                                                                              | Primary boundaries                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Marketing               | `/`, `/intro`, `/features`, `/team`, `/templates`, `/privacy`, `/terms`                                             | `SiteHeader`/`SiteFooter`, local UI state, no guest resume persistence. |
| Guest tools             | `/assistant`, `/ats`, `/import`, `/resumes/new`, `/resumes/:id/edit`, `/resumes/:id/preview`, `/resumes/:id/studio` | Guest memory store, explicit recovery consent, optional AI disclosure.  |
| Authenticated workspace | `/dashboard`, `/account`, `/jobs`, `/cover-letters`, resume routes                                                  | Supabase session, owner-scoped RLS data access.                         |
| Administration          | `/admin` and children                                                                                               | Client UI gate plus server-side RLS/admin role enforcement.             |
| Service metadata        | `/mcp`, `/.mcp/*`, `/.well-known/oauth-protected-resource`, `/sitemap.xml`                                          | MCP handlers and generated routing metadata.                            |

## High-value file map

| Layer             | Source of truth                                                                                            | Responsibility                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Router            | `src/routeTree.gen.ts`, `src/router.tsx`                                                                   | Generated route tree plus router instance. Do not manually edit the generated tree.                   |
| Root runtime      | `src/routes/__root.tsx`, `src/server.ts`, `src/start.ts`                                                   | SSR shell, public runtime bootstrap, safe server error handling.                                      |
| Guest lifecycle   | `src/lib/guest-store.ts`, `src/lib/guest-session.ts`, `src/lib/store.tsx`                                  | Memory-only document state, consented recovery, expiry, deletion, explicit migration.                 |
| Auth and database | `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `supabase/migrations/`    | Browser auth client, server service client, authenticated middleware, RLS policy history.             |
| General AI        | `src/lib/ai.functions.ts`, `ai-validate.ts`, `ai-runtime.server.ts`, `ai-prompts.server.ts`, `ai-types.ts` | Server-only gateway call, rate limits, bounded request validation, output validation, usage metadata. |
| Noura privacy     | `src/modules/ai/noura-evidence.ts`, `src/modules/privacy/`                                                 | Evidence graph, remote-safe field filtering, transmission preview, consent gate.                      |
| Synthetic samples | `src/modules/synthetic-resume/`, `src/lib/synthetic-adaptation.*`                                          | Deterministic sample data, review metadata, optional restricted adaptation, export lock.              |
| Templates         | `src/lib/templates.ts`, `template-signals.ts`, `src/modules/intelligence/template-recommendation.ts`       | Definitions, explainable local signals, deterministic recommendations.                                |
| Export            | `src/lib/pdf.ts`, `src/lib/ats.ts`, `src/routes/resumes.$id.preview.tsx`                                   | Lazy image-PDF export, printable text PDF, ATS plain text, sample safety gate.                        |
| Test and CI       | `scripts/`, `.github/workflows/`, `scripts/lighthouse-ci.mjs`                                              | Deterministic smoke tests, route QA, browser hardening, Lighthouse collection.                        |

## Data-flow constraints

| Flow                | Permitted data                                                                  | Prohibited or gated data                                                                   |
| ------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Anonymous editing   | In-memory resume object in the active tab.                                      | Default localStorage, IndexedDB, Cache Storage, remote writes, automatic account transfer. |
| Consented recovery  | One normalized guest resume in `sessionStorage`, expiry-bound.                  | Recovery without explicit consent; retained recovery after delete/revocation.              |
| General AI          | Explicit task input and bounded, allowlisted context for an authenticated user. | Arbitrary nested resume objects, opaque metadata, raw provider-error exposure.             |
| Noura evidence      | Non-sensitive allowed career facts after consent and preview.                   | Full name, contacts, sensitive facts, payloads beyond the declared cap.                    |
| Synthetic AI sample | `consent: true`, specialty ID, experience level, language.                      | CV text, free text, contact data, automatic approval or final export.                      |
| PDF export          | Rendered resume DOM after sample review.                                        | Final PDF/print/plain-text export with unapproved sample fields.                           |

## Architecture observations

The module graph scan detected only the expected `routeTree.gen.ts → router.tsx` cycle created by the TanStack Router generated tree. This is not a product-source cycle and no edit is recommended. The otherwise meaningful dependencies remain separated by route, store, server-function, and service boundaries.
