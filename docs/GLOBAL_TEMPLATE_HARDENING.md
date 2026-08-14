# Global Template Hardening

## Scope

This change hardens the repository's dependency and server-error boundaries while extending the template experience with **explainable global signals** and consistent icons. It remains additive: it does not change account requirements, guest resume persistence, Supabase schema, RLS, billing, DNS, or the production domain.

## Audit summary

The review began from `origin/main` commit `9c24bb5`. Baseline lint completed with existing warnings and no errors; strict TypeScript compiled successfully. Dependency audit initially reported high-severity transitive findings in `brace-expansion` and `js-yaml`, plus a low-severity development-server issue in `esbuild`.

| Area | Observed risk | Correction | Verification |
| --- | --- | --- | --- |
| Dependency supply chain | Transitive `brace-expansion`, `js-yaml`, and `esbuild` advisories | Compatible Bun overrides plus compatible direct dependency refresh | `bun audit` reports no vulnerabilities. |
| Server errors | Raw error messages and stack/cause chains could be written to the server log and may contain request-derived content | Replaced error expansion with a minimal structured operational logger | Unit smoke asserts a private email in an error message never reaches the log output. |
| AI telemetry errors | Supabase error messages were logged verbatim when rate counting or usage recording failed | Shared safe logger records only stable scope, error type, and optional numeric status | TypeScript and hardening smoke pass. |
| Template choice clarity | Cards exposed abbreviated labels without a consistent explanation of layout, direction, density, or photo support | Local template-signal model and visible icon language in public gallery and editor switcher | Browser smoke verifies global privacy disclosure; deterministic smoke checks signals from template properties. |

## Safe server logging

`src/lib/safe-server-log.ts` emits a JSON event with a bounded scope, error class, and optional numeric status. It deliberately excludes `error.message`, stacks, causes, request bodies, prompts, generated AI text, credentials, direct identifiers, and resume content. The SSR entry, Start error middleware, and AI usage paths now use this helper.

> Logs are an operational aid, not a content channel. A failure must remain diagnosable without copying the document or request that caused it into telemetry.

## Global smart-template model

The template experience derives signals only from existing static `TemplateDef` fields. It does not inspect, upload, store, or infer facts from the visitor's CV.

| Signal | Source property | Meaning shown to the visitor |
| --- | --- | --- |
| Structured reading | `atsFriendly` | A restrained layout intended for machine-readable and human review. It is not an ATS outcome guarantee. |
| Direction-ready | `supportsRTL` | The same template definition supports Arabic RTL and English LTR rendering. |
| Focused document | `design.layout === "single"` | A single-column structure for concise content. |
| Visual hierarchy | Sidebar layouts | A multi-region presentation for visual information grouping. |
| Optional photo | `design.supportsPhoto` | Space is available when a photo is appropriate for the application context. |
| Compact or generous spacing | `design.spacing` | The layout density is disclosed before selection. |

The public `/templates` page introduces three bilingual global principles with accessible icons: direction readiness, explainable fit, and local private choice. The editor's template switcher uses the same signals, keeping selection language consistent across discovery and editing.

## Privacy and accessibility boundaries

The recommendation engine remains browser-local and consumes broad design choices only. It does not request a name, CV content, job description, contact details, or custom text, and it creates no browser storage entry. Icons are decorative when paired with visible text, and icon-only affordances in the editor include screen-reader labels. Reduced motion, RTL/LTR behavior, mobile overflow, keyboard selection, no guest persistence, and no outbound personal-content request remain covered by existing browser smoke.

## Known limits and rollback

The feature deliberately does not add a provider-backed personalisation model, browser persistence, analytics events with resume data, ATS guarantee, or automated career decision. Browser-level functional coverage uses Chromium locally; Firefox, WebKit, and Lighthouse remain CI gates.

Rollback consists of reverting the hardening commit. No migration, data cleanup, or deployment setting rollback is required.
