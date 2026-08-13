# Phase 18 Architecture

## Architectural decision

Phase 18 will not convert Seerati into a Monorepo. The current application remains the integration shell, while domain boundaries are introduced incrementally under `src/modules/` or equivalent stable `src/lib` boundaries. Existing ResumeData, template, ATS, import, PDF, and Supabase code remains the compatibility surface until replacement behavior is proven.

## Target dependency direction

```text
UI/routes
  -> application use cases
    -> domain modules
      -> schemas and deterministic engines
        -> provider interfaces
          -> concrete providers
```

Domain modules must not import React components, route files, browser navigation, Supabase clients, or concrete AI providers. Providers may depend on runtime adapters, but business rules must depend only on interfaces and validated inputs.

## Initial module map

| Module | Initial responsibility | First consumer | Privacy classification |
|---|---|---|---|
| `career` | CareerProfileGraph, facts, provenance, consent types, ResumeData adapters | Contract tests and future editor adapter | Personal data; memory-only for guest |
| `privacy` | Storage mode, consent, expiry, deletion, transmission preview | Guest store and AI request boundary | Policy/runtime metadata; never content telemetry |
| `providers` | AI, parser, PDF, storage, error interfaces and mocks | Contract tests | Provider metadata only |
| `document` | Future ResumeDocument conversion and deterministic layout contracts | Structural tests first | Derived personal document |
| `templates` | Manifest and renderer compatibility contracts | Existing 24-template registry | Personal document output |
| `ats` | Evidence-linked deterministic rules | Existing ATS and lint adapters | Personal data plus job input |
| `matching` | Evidence-linked job matching | Existing job-match adapter | Personal data plus job description |
| `import` | Safe parse stages and candidate facts | Existing import pipeline | Uploaded personal data; local by default |
| `export` | PDF/print/text/JSON output contracts | Existing PDF path | Personal document output |
| `evaluation` | Synthetic fixtures and scoring reports | CI only | Synthetic data only |

## CareerProfileGraph boundary

`CareerProfileGraph` is the future canonical domain model. During Wave 1 it is implemented as a validated graph plus adapters:

```text
ResumeData -> fromResumeData() -> CareerProfileGraph
CareerProfileGraph -> toResumeData() -> ResumeData
```

The adapter must preserve unknown or unsupported sections through an explicit compatibility field or loss report. Silent field loss is prohibited. The graph must distinguish source facts from AI suggestions and accepted user values.

The first graph slice includes Identity, Contact, TargetRole, ProfessionalSummary, Experience, Achievement, Education, Skill, Language, Certification, Link, Provenance, and Consent. Publications, awards, memberships, references, custom sections, and advanced evidence relationships remain extension points until their consumers exist.

## Privacy Runtime boundary

The runtime exposes policy operations, not storage implementation details:

```ts
getStorageMode(): "memory" | "consented-recovery" | "authenticated-cloud"
requestRecoveryConsent(): Promise<ConsentResult>
clearSession(): Promise<DeletionReceipt>
previewTransmission(request): TransmissionPreview
assertTransmissionAllowed(request): void
registerObjectUrl(url): void
revokeObjectUrls(): void
cancelPendingRequests(): void
```

Memory-only is the default. The runtime must be able to prove that guest operations do not call authenticated storage APIs, write analytics content, or serialize resume content into URLs or logs.

## Provider boundary

Each provider exposes a typed interface and a mock implementation. Concrete providers are selected outside domain rules. Every request carries timeout, cancellation, consent state, allowed fact IDs, locale, sensitivity, and maximum payload metadata. Provider errors normalize into a safe error model that excludes prompts, document text, and provider response bodies from logs.

## Migration strategy

Migration is incremental and reversible. Each new module must provide:

1. Public TypeScript interface.
2. Zod schemas for runtime validation.
3. Deterministic transformation or service logic.
4. Unit and contract fixtures.
5. Explicit error model.
6. Privacy classification and performance budget.
7. Documentation and rollback note.

No database migration is part of Wave 1. Authenticated persistence is postponed until the graph adapter, consent model, deletion semantics, RLS review, and live migration inventory are complete.

## Performance strategy

The initial bundle remains limited to the shell, language, privacy status, first action, and lightweight template preview. AI, import parsers, full PDF, full ATS, matching, interview, portfolio, and admin are route- or action-loaded. Any new module must include a bundle impact note and a route budget check.

## Release strategy

Each Wave is delivered through focused PRs. A Wave cannot be considered complete because files exist; it requires a consumer, tests, fixtures, privacy evidence, performance evidence, and a rollback path. No PR is merged without explicit owner approval.
