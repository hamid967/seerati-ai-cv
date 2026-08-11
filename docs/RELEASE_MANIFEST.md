# Seerati — Release Manifest

## Current release candidate

Set these fields only when an exact production candidate is selected:

- Candidate commit: `TBD`
- Release owner: `TBD`
- Rollback owner: `TBD`
- QA CI run: `TBD`
- Runtime route smoke: `REQUIRED — must execute, not skip`
- Production migration execution: `NOT AUTHORIZED BY THIS DOCUMENT`
- Deploy/publish: `NOT AUTHORIZED BY THIS DOCUMENT`

## Ordered launch sequence

1. **Code freeze** — select the exact candidate commit and stop unrelated changes.
2. **Automated quality** — require Format, Lint, TypeScript, production Build and all Static QA guards on the selected commit.
3. **QA runtime** — configure QA Supabase secrets and require the app to start and the runtime route suite to execute successfully.
4. **Manual critical-path QA** — Arabic and English auth/onboarding, Career Twin, resume create/edit, Studio/composer, ATS guidance, Job Workspace, Privacy Center, text export and visual export.
5. **Legal gate** — Saudi-qualified review of Privacy and Terms; replace placeholder legal/contact content only from approved business/legal copy.
6. **Database gate** — review pending migrations, backup/recovery plan and execution owner. Apply only with explicit production authorization.
7. **Production deploy** — deploy only the exact tested commit, with explicit production authorization.
8. **Post-deploy verification** — public routes, authentication, one complete resume journey, export, privacy controls and logs/health signals.
9. **Release closeout** — record timestamps, results, incidents, migration state and final release SHA.

## Hard stop conditions

Do not declare **GO** when any of these remain true:

- route-smoke runtime steps are skipped;
- a required production migration exists only as a repository file and has not been applied/verified;
- Privacy/Terms still identify themselves as non-final legal drafting for a commercial launch;
- critical Arabic/English/manual accessibility checks are incomplete;
- operational support, account recovery, incident response or data-request ownership is undefined;
- the production release commit differs from the commit that passed the release gates.

## Export trust contract

- Plain text and the browser text/print PDF are the application-oriented options.
- The high-resolution PDF generated from a rendered image is a visual sharing/archive option and must not be represented as reliably machine-parseable by ATS systems.
- ATS/readiness output is guidance based on Seerati rules, never a guarantee of employer screening or hiring outcomes.

## Privacy trust contract

- Raw career content should remain user-owned through RLS.
- Administrator operational visibility should prefer aggregate metadata and counts over raw Career Facts, Evidence, Agent Activity and Resume Version snapshots.
- Analytics must not contain resume text, job-description text, evidence content, identity/contact fields or credentials.

This manifest controls release sequencing; it does not itself perform or authorize a production release.
