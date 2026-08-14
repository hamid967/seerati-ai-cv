# Synthetic Resume Architecture

## Purpose and scope

The **Synthetic Specialty Resume Generator** creates an editable, clearly fictional resume sample through `/assistant?agent=noura`. The initial release is intentionally limited to six specialties: software development, accounting, civil engineering, human resources, nursing, and sales. It is designed as an onboarding and learning aid, not as a source of employment claims or verified applicant information.

> The initial implementation creates a **same-tab, memory-only** sample. It does not create an account, invoke Supabase writes, call an AI provider, or persist the selected specialty, generated resume, template choice, or custom-specialty note.

| Layer                         | Primary files                                                 | Responsibility                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Noura entry                   | `src/routes/assistant.tsx`                                    | Exposes the bilingual sample-resume choice and lazy-loads the flow only after selection.                                                         |
| Guided flow                   | `src/components/noura/synthetic-sample-flow.tsx`              | Collects specialty, experience level, language, and purpose; presents four template choices and two-template comparison.                         |
| Taxonomy                      | `src/modules/synthetic-resume/taxonomy.ts`                    | Holds the initial bilingual, searchable six-specialty catalog.                                                                                   |
| Content library and generator | `src/modules/synthetic-resume/generator.ts`                   | Provides deterministic, reviewed fictional content and reusable template options.                                                                |
| Data contracts                | `src/modules/synthetic-resume/types.ts`, `src/lib/types.ts`   | Separates sample fields from user-confirmed fields and keeps metadata out of rendered resume content.                                            |
| Same-tab state                | `src/lib/store.tsx`                                           | Maintains `transientSampleResumes` in React memory; it is not a Supabase, cookie, localStorage, or sessionStorage data path.                     |
| Editing and readiness         | `src/components/synthetic-resume/synthetic-sample-notice.tsx` | Shows the fictional-data notice, readiness progress, and explicit core-field review sequence.                                                    |
| Export and ATS controls       | `src/routes/resumes.$id.preview.tsx`, `src/routes/ats.tsx`    | Blocks final export/content scoring while unresolved sample fields remain and distinguishes structure guidance from verified-content assessment. |

## State flow

The Noura flow stores its selection UI state inside the mounted component. Once the visitor chooses one of four layouts, `createTransientSampleResume` creates a resume with an identifier beginning with `sample-`. The Store exposes that resume through `getResume` so the existing editor and preview can render it, but it deliberately keeps the value in `transientSampleRef` and React state only.

```text
Noura sample choice
  → synthetic taxonomy search
  → deterministic profile generator
  → four layout options / optional comparison
  → transient sample resume in same-tab memory
  → editor with sample notice and review metadata
  → preview export gate and ATS boundary
```

The generator creates a single structured `ResumeData` source for all four layouts. The layouts change presentation only; they never generate different career facts for the same sample request.

## Persistence and account boundary

The Store keeps transient sample resumes separate from both `guestResumes` and authenticated `resumes`. The temporary sample list is not included in guest recovery, guest-to-account migration preview, account-limit calculations, or Supabase insert/update paths. Signing out clears transient samples. Deleting a `sample-` resume clears it from transient memory.

| Data domain             | Persistence behavior                                                           | Account migration behavior         |
| ----------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| Noura flow selections   | Component memory only                                                          | None                               |
| Synthetic sample resume | Store memory only, same tab                                                    | Excluded from guest migration      |
| Standard guest resume   | Existing memory-only guest store; optional consented recovery remains separate | Existing explicit review flow only |
| Authenticated resume    | Existing Supabase-backed store                                                 | Unchanged                          |

## Performance boundaries

The synthetic flow is loaded through `React.lazy` after the visitor chooses the new Noura option. The six-specialty taxonomy and role library are therefore absent from the normal assistant landing path. The generator is deterministic and local; it does not load an AI SDK, PDF renderer, ATS engine, or full resume previews during initial selection. Full editing, PDF generation, and existing ATS systems remain deferred to their existing routes.

## Initial exclusions

This slice does not add an administrative content-management console, broad 30-specialty coverage, multi-page rendering decisions, user-entered custom-specialty generation, cloud analytics, an AI adaptation endpoint, or automatic translation. A custom specialty note is temporary and directs the visitor to select the closest covered specialty; it is not sent or retained.

## Rollback

Revert the feature commit that introduces the synthetic-resume module, transient store channel, Noura lazy flow, sample notices, export/ATS guards, and related tests. The feature is additive and has no database migration, RLS change, environment-variable change, DNS change, or production-domain change.
