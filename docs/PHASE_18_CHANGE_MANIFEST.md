# Phase 18 Change Manifest

## Scope

This manifest starts the full Phase 18 program with the smallest safe implementation slice: domain schema foundations, privacy runtime contracts, provider boundaries, and deterministic fixtures. Later Waves remain planned but cannot be represented as complete until they have working consumers and evidence.

## Required behavior

The implementation must provide a validated `CareerProfileGraph` that can round-trip existing `ResumeData` without silent loss; provenance and consent metadata that distinguish user facts, imported candidates, translated values, derived rules, and AI suggestions; a unified privacy runtime with memory-only guest default; and typed provider interfaces with mock implementations.

The guest path must remain free, registration-optional, memory-only by default, free of watermarks, and free of remote upload unless the user explicitly consents. No new telemetry may contain CV text, job descriptions, prompts, responses, names, emails, phone numbers, employers, or uploaded files.

## Affected files and modules

| Area | Planned paths | Change type |
|---|---|---|
| Career graph | `src/modules/career/` | New domain schemas, adapters, fixtures, and tests |
| Privacy | `src/modules/privacy/` | New runtime contracts and tests; adapter around guest-store |
| Providers | `src/modules/providers/` | New interfaces, mocks, normalized errors, and contract tests |
| Documentation | `docs/PHASE_18_*.md` | Baseline, architecture, manifest, and decision records |
| CI | Existing QA scripts/workflows | Add only focused contract gates after local pass |
| Database | None in Wave 1 | Explicitly deferred pending live migration inventory |
| UI routes | None initially | Avoid route regressions and bundle growth |

## Acceptance checks

| Gate | Acceptance condition |
|---|---|
| Schema | Malformed graph input fails safely; valid graph has stable IDs, locale, provenance, and sensitivity. |
| Round-trip | `ResumeData -> Graph -> ResumeData` preserves supported data and emits a loss report for unsupported data. |
| Privacy | Guest graph remains in memory; consented recovery is explicit; deletion clears memory and recovery. |
| Transmission | Provider request without consent or allowed fact IDs is rejected before provider invocation. |
| Mock providers | AI, parser, PDF, storage, and error providers satisfy interfaces and deterministic fixtures. |
| Security | No secrets, personal fixtures, or provider content in client bundle, logs, or artifacts. |
| Performance | No new route is added to the initial bundle; module budget is documented. |
| CI | Lint, typecheck, build, existing QA, and focused Wave 1 tests pass. |

## Exclusions from Wave 1

Wave 1 does not add authenticated CareerProfileGraph tables, a new editor, a new AI provider, semantic ATS, job scraping, a Service Worker, public portfolio publishing, DOCX generation, or admin dashboards. It does not claim production readiness or completed Phase 18 functionality.

## Migration and compatibility

The current `ResumeData`, guest store, Supabase account path, template registry, ATS engine, import pipeline, and PDF export remain authoritative runtime consumers until adapters pass round-trip and regression checks. Unsupported fields must be preserved or reported explicitly. No existing route is rewritten in this slice.

## Rollback

Rollback is a revert of the Wave 1 commit(s) or removal of the new module directories and focused tests. No database rollback is required because Wave 1 creates no migration. The Phase 18 branch is based on `f5840d7` and must not rewrite pushed history.

## Follow-on Waves

Wave 2 covers deterministic Document Engine, Template Plugin SDK, and export compatibility. Wave 3 covers evidence-locked AI, taxonomy, ATS, and matching. Wave 4 covers versioning, workspace, cover letters, interview, and portfolio. Wave 5 covers admin, observability, security, and performance hardening. Each Wave receives a separate manifest update and focused PR.
