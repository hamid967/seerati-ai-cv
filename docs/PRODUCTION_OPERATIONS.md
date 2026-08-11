# Seerati — Production Operations Runbook

This runbook defines the minimum operating process for a commercial release. It does not authorize deployment, database migration execution, or production configuration changes by itself.

## Release ownership

Every production release must have one named release owner and one rollback owner. Before a release begins, record the target commit SHA, database migration set, release window, rollback decision point, and the person responsible for customer communication.

## Required release gates

A release is blocked unless all of the following are true:

- GitHub CI passes Format, Lint, TypeScript, production Build and Static QA on the exact release commit.
- QA Supabase credentials are configured and route-smoke executes Install, Start app and Route smoke tests; a skipped runtime job is not approval.
- Pending production migrations have been reviewed, backed up where appropriate, and assigned an execution owner.
- Privacy and Terms have completed Saudi-qualified legal review before commercial launch.
- Manual keyboard, screen-reader and critical mobile-flow checks are complete.
- Login, signup, reset password, onboarding, Career Twin, resume editing, PDF/text export, Job Workspace and Privacy Center have been exercised in QA.
- Support, incident-response and data-request contacts are active and monitored.

## Production migration procedure

1. Record the current production schema/migration state and release commit.
2. Confirm the migration is additive or document every destructive/locking operation and rollback path.
3. Take the backup/snapshot required by the database operating policy.
4. Apply migrations in chronological order. Do not manually cherry-pick statements out of a migration unless an incident owner explicitly authorizes a documented recovery procedure.
5. Verify RLS and ownership behavior with an ordinary user, a second tenant and an administrator account.
6. Verify the Stage 6F privacy contract: raw Career Facts, Evidence, Agent Activity and Resume Version snapshots remain owner-readable only, while admin insight is aggregate-only.
7. Record migration completion time and operator. If verification fails, stop the release and execute the documented rollback/recovery plan before deploying application code.

## Application release procedure

1. Deploy only the exact commit that passed release CI.
2. Verify the public landing page, templates, features, ATS information, career guides, privacy and terms pages.
3. Verify authenticated login/onboarding and one complete resume flow with a QA account.
4. Verify text PDF/plain-text export and visual image-PDF export are labelled correctly.
5. Verify private routes remain `noindex`/robots-blocked where applicable.
6. Run a post-deploy smoke check and capture the result with the release record.

## Rollback triggers

Rollback or stop rollout when any of these occur:

- cross-tenant data exposure or an RLS regression;
- authentication failures affecting a meaningful share of users;
- resume save/data-loss failures;
- PDF/export corruption on the primary Arabic or English path;
- sustained server errors or a critical route becoming unavailable;
- incorrect migration state that cannot be safely corrected forward during the release window.

For a privacy/security incident, prioritize containment over service continuity.

## Incident severity

- **SEV-1:** confirmed or suspected cross-tenant/private-data exposure, credential compromise, destructive data loss, or widespread authentication outage. Stop release activity, contain access, preserve evidence and escalate immediately.
- **SEV-2:** major feature unavailable for many users without a privacy breach, such as resume saving/export or Job Workspace failure. Assign an incident owner and mitigation immediately.
- **SEV-3:** localized degradation or cosmetic/secondary workflow issue with a safe workaround. Track, communicate where needed and schedule a fix.

Every incident record should contain start time, detection source, affected surfaces, customer impact, decisions, mitigations, recovery time and follow-up actions. Do not place raw resume content or unnecessary personal data in incident tickets.

## User data requests

Account deletion, export/access and correction requests must be handled through an authenticated or otherwise verified identity process. Record only the minimum metadata required to operate the request. Never send raw career content to an administrator merely to prove that a request exists.

Before marking a deletion request complete, verify the intended account-scoped records and storage objects have been handled according to the approved retention/legal policy. The current product text is not a substitute for that approved policy.

## Support and recovery

Support staff must not request passwords, private keys, service-role credentials or full resume dumps. For account recovery, use supported authentication recovery mechanisms. Escalate cases that appear to require privileged database intervention to the designated operations owner rather than bypassing RLS from the UI.

## Release record template

- Release commit:
- Release owner:
- Rollback owner:
- QA CI run:
- Route-smoke runtime executed (not skipped):
- Migration set reviewed:
- Production migration operator/time:
- Legal review status:
- Accessibility/manual QA status:
- Deploy start/end:
- Post-deploy smoke result:
- Rollback required:
- Incident/reference links:

A completed record is evidence of process execution; it is not a claim of regulatory certification, WCAG conformance or guaranteed uptime.
