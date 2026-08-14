# Synthetic Resume Architecture

## Purpose and scope

The **Synthetic Specialty Resume Generator** creates an editable, clearly fictional resume sample through `/assistant?agent=noura`. The catalog contains **thirty-six reviewed specialties**: the initial six specialties plus thirty additional roles across technology, engineering, operations, finance, human resources, sales and marketing, and health. It is an onboarding and learning aid, not a source of employment claims or verified applicant information.

> A synthetic sample is **same-tab and memory-only**. The deterministic path does not create an account, invoke Supabase writes, call an AI provider, or persist a selected specialty, generated resume, template choice, or custom-specialty note.

| Layer                         | Primary files                                                                                               | Responsibility                                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Noura entry                   | `src/routes/assistant.tsx`                                                                                  | Exposes the bilingual sample-resume choice and lazy-loads the flow only after selection.                                                                                |
| Guided flow                   | `src/components/noura/synthetic-sample-flow.tsx`                                                            | Collects specialty, experience level, language, and purpose; presents four template choices and optional AI consent after template selection.                           |
| Taxonomy                      | `src/modules/synthetic-resume/taxonomy.ts`                                                                  | Holds the local bilingual, searchable catalog of 36 reviewed specialties.                                                                                               |
| Content library and generator | `src/modules/synthetic-resume/generator.ts`                                                                 | Provides deterministic fictional content, group-reviewed role fallback, template options, and a sample-only adaptation applicator.                                      |
| Optional adaptation client    | `src/lib/synthetic-adaptation-service.ts`                                                                   | Reads session status before importing or calling the server function; a guest returns a deterministic result without an adaptation request.                             |
| Optional adaptation server    | `src/lib/synthetic-adaptation.functions.ts`, `src/lib/ai-runtime.server.ts`, `src/lib/ai-prompts.server.ts` | Accepts explicit consent and only specialty ID, experience level, and language; applies rate limits, structured validation, timeout, and usage logging without content. |
| Data contracts                | `src/modules/synthetic-resume/types.ts`, `src/lib/types.ts`                                                 | Separates sample fields from user-confirmed fields and records `synthetic-template` or `synthetic-ai` provenance outside rendered resume content.                       |
| Same-tab state                | `src/lib/store.tsx`                                                                                         | Maintains `transientSampleResumes` in React memory; it is not a Supabase, cookie, localStorage, sessionStorage, IndexedDB, or Cache Storage data path.                  |
| Editing and readiness         | `src/components/synthetic-resume/synthetic-sample-notice.tsx`                                               | Shows the fictional-data notice, readiness progress, and explicit core-field review sequence.                                                                           |
| Export and ATS controls       | `src/routes/resumes.$id.preview.tsx`, `src/routes/ats.tsx`                                                  | Blocks final export/content scoring while unresolved sample fields remain and distinguishes structure guidance from verified-content assessment.                        |

## State and content flow

```text
Noura sample choice
  → lazy-loaded synthetic taxonomy search
  → deterministic fictional profile
  → four layout options / optional comparison
  → explicit AI consent (optional, authenticated session only)
      → server receives { specialtyId, experienceLevel, language }
      → schema + anti-fabrication validation
      → AI-adapted fictional wording OR deterministic fallback
  → transient sample resume in same-tab memory
  → editor with sample notice and review metadata
  → preview export gate and ATS boundary
```

The deterministic generator produces a single `ResumeData` source for all four layouts. Layout choices alter presentation only. Optional AI adaptation changes only the sample wording for summary, initial experience bullets, skills, project, and certificate. It does not alter identity placeholders, education, contact details, employer placeholders, or the memory-only lifecycle.

## AI adaptation privacy and safety boundary

AI adaptation is **never automatic**. The template step has an unchecked consent checkbox and an accessible disclosure before the adaptation control is enabled. Pressing the control is the sole trigger for a request.

| Scenario                                                 | Network behavior                                                  | Content result                                                                                                         | Persistence                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Consent is absent                                        | No adaptation request                                             | Deterministic local sample                                                                                             | React memory only after creation                                                       |
| Visitor has no authenticated session                     | No adaptation request                                             | Deterministic local sample with guest fallback notice                                                                  | React memory only after creation                                                       |
| Authenticated user consents and provider succeeds        | Server receives only specialty ID, experience level, and language | Adapted fictional sample; all changed fields are `status: sample`, `source: synthetic-ai`, and `exportApproved: false` | React memory only after creation; aggregate usage record contains no prompt or content |
| Provider, rate-limit, schema, or safety validation fails | No content is accepted from the failed response                   | Deterministic local sample                                                                                             | React memory only after creation                                                       |

The server request schema is strict and rejects extra fields. The prompt does not accept user-entered text, CV text, contact details, locations, employer names, or education. Model output must be JSON with exactly one summary, three responsibilities, four skills, one project, and one certificate. Validation rejects output that contains digits, links, email-like text, employer/university/hospital references, invalid array lengths, empty values, or excessive lengths.

> AI wording is not verified information. It remains an explicitly labelled sample, requires user replacement or confirmation, and cannot pass the existing final export gate merely because it was generated by AI.

## Persistence and account boundary

The Store keeps transient sample resumes separate from both `guestResumes` and authenticated `resumes`. The temporary sample list is not included in guest recovery, guest-to-account migration preview, account-limit calculations, or Supabase insert/update paths. Signing out clears transient samples. Deleting a `sample-` resume clears it from transient memory.

| Data domain                           | Persistence behavior                                                           | Account migration behavior         |
| ------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| Noura flow selections                 | Component memory only                                                          | None                               |
| AI consent UI state and selected mode | Component memory only                                                          | None                               |
| Synthetic sample resume               | Store memory only, same tab                                                    | Excluded from guest migration      |
| AI request selections, when eligible  | Request-scoped server data only                                                | Not stored with the resume         |
| Standard guest resume                 | Existing memory-only guest store; optional consented recovery remains separate | Existing explicit review flow only |
| Authenticated resume                  | Existing Supabase-backed store                                                 | Unchanged                          |

## Performance boundaries

The synthetic flow is loaded through `React.lazy` after the visitor chooses the Noura option. Taxonomy, deterministic role content, and the adaptation client are absent from the normal assistant landing path. The server adaptation function is dynamically imported only after an authenticated, consented user presses the optional control. The deterministic generator does not load an AI SDK, PDF renderer, ATS engine, or full resume previews during initial selection. Full editing, PDF generation, and existing ATS systems remain deferred to their existing routes.

## Exclusions

This slice does not add a content-management console, user-entered custom-specialty generation, personalisation from CV text, automatic translation, a public/guest AI endpoint, server persistence of samples, account migration of samples, cloud analytics carrying sample content, new payment requirements, or production-domain changes. A custom-specialty note stays local to the mounted component and is never sent to the AI endpoint.

## Rollback

Revert the feature commits that add the specialty expansion, `synthetic-adaptation` endpoint/client, consent UI, source metadata, tests, and documentation. The feature is additive and has no database migration, RLS change, environment-variable change, DNS change, or production-domain change.
