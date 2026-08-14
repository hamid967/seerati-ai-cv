# Security and Privacy Review

## Review conclusion

The audit found no confirmed P0 security flaw in the inspected code paths. The guest-first model is materially enforced in the store layer and covered by deterministic smoke checks. The main risk found in the AI boundary was not authentication bypass but **overly permissive context acceptance and raw provider error handling**. Both have been corrected in this branch.

## Threat and control matrix

| Threat                               | Control observed                                                                                                  | Audit result                                                 | Residual condition                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Guest CV persistence by default      | Memory store; consented recovery only in `sessionStorage`; explicit clearing logic.                               | Passed static review and guest QA.                           | Browser reload and cross-browser behavior remain CI gates.                        |
| Guest cloud write                    | Guest methods return before Supabase account reads; anonymous network inspection rejects mutation endpoints.      | Passed local Chromium inspection.                            | Re-run against PR production preview.                                             |
| Automatic guest-to-account migration | `migrateGuestResumes` requires `confirmed` and authenticated state.                                               | Passed static review.                                        | Account migration UI needs a synthetic user journey in owner-approved QA.         |
| Cross-user account read/write        | Migrations establish `auth.uid()` owner policies; client code filters dashboard rows by current user.             | Static policy evidence present.                              | Remote RLS needs synthetic two-user test after the deferred migration is applied. |
| Service-role exposure                | Server client is isolated to `client.server.ts` and warns callers to dynamically import only server-side.         | No client import found in reviewed routes.                   | Build guard continues to be required.                                             |
| AI prompt overcollection             | Noura evidence filters identity, contact, and sensitive facts; generic AI context is now bounded and allowlisted. | Fixed by `AiContext` normalization.                          | General AI remains opt-in/authenticated by product policy.                        |
| Provider diagnostics leaking PII     | General AI endpoint previously logged/returned raw error messages.                                                | Fixed with `logServerFailure` and stable error codes.        | Error-monitoring integrations must preserve this redaction rule.                  |
| Synthetic sample misuse              | AI adaptation accepts selections only; response is `sample`, requires review, and is blocked from final export.   | Covered by deterministic adaptation and export safety tests. | No live provider call made in audit.                                              |
| Wrong production target              | A live browser smoke used the old Lovable host.                                                                   | Fixed to `https://hrhbs.com`.                                | Run workflow after PR creation.                                                   |

## Privacy invariants retained

| Invariant                                                                                    | Enforcement point                                                                     |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Guest content is memory-only by default.                                                     | `guest-store.ts` and `StoreProvider`.                                                 |
| Recovery cannot activate silently.                                                           | Consent key is checked before recovery read/write.                                    |
| Delete/revoke clears all guest domains.                                                      | `clearGuestResumes`, `clearGuestResumeSession`, recovery clear, and refs/state reset. |
| AI transmission is visible and reviewed.                                                     | Noura transmission preview and consent flow.                                          |
| No sample output becomes a verified employment claim automatically.                          | Sample metadata and preview/export gate.                                              |
| Operational logs omit raw errors, prompt text, generated text, credentials, and identifiers. | `safe-server-log.ts` plus hardened `runAiTask`.                                       |

## Required owner-operated actions

The migration `20260810090000_validate_stage4_owned_relationships.sql` is present in the repository but has not been applied to the remote Supabase project. Applying a migration changes remote data infrastructure and is intentionally outside this audit. Before a release decision, an owner should apply it in an approved environment and execute synthetic two-user RLS checks.

The updated production-browser workflow is configured for `https://hrhbs.com` but this audit did not publish or alter DNS. The workflow result after PR creation is the evidence required to confirm live availability and hydrated client configuration.

## Rollback

Reverting the audit commits restores the prior request contract, test installation behavior, and workflow targets. This code change does not require database rollback. If a provider compatibility issue is discovered, revert the AI context validation commit first and keep the raw-error redaction fix in place.
