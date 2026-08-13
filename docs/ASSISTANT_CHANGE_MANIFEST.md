# Seerati Assistant Change Manifest

## Objective

Unify the existing Seerati Assistant, ATS, import, tailoring, bilingual, and cover-letter capabilities behind one discoverable assistant hub without duplicating the underlying workflows.

## Delivered in this slice

| Area | Change | Acceptance evidence |
|---|---|---|
| Discoverability | Add a capability hub to `/assistant` | Six visible links/actions with Arabic and English copy |
| AI drafting | Keep existing question flow, specialist selection, drafting, and template creation | Existing assistant route and AI contract tests remain green |
| Import | Link to `/import` | Route exists and is reachable from the hub |
| ATS | Link to `/ats` | Route exists and is reachable from the hub |
| Tailoring | Link to `/jobs` | Jobs/tailoring surface exists and is reachable |
| Cover letters | Link to `/cover-letters` | Cover-letter surface exists and is reachable |
| Arabic/English | Link to `/arabic-intelligence` | Bilingual intelligence route exists and is reachable |
| Privacy | Keep guest disclosure above the hub | Existing guest privacy behavior remains unchanged |

## Scope exclusions

This slice does not rewrite existing AI prompts, ATS scoring rules, import parsers, cover-letter persistence, or job-tailoring logic. It improves the entry point first, then validates existing capabilities through the repository’s QA suite.

## Safety and privacy

The hub sends no resume content to telemetry and does not create persistence. Links route to existing product surfaces. AI suggestions remain reviewable before application, and the product must not claim guaranteed ATS scores or employment outcomes.

## Next slices

Add a shared assistant command model for contextual actions inside the editor, connect explicit job-description input to tailoring and ATS comparison, add import provenance and cleanup evidence, and add browser tests for each hub link and keyboard flow.

## Rollback

Revert the commit that adds `assistant-capability-hub.tsx` and the import/render changes in `src/routes/assistant.tsx`. Existing assistant capabilities remain available through their original routes.
