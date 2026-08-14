# Noura Privacy Model

## Default guest boundary

Anonymous resume content exists in session memory by default. The default path does not write the CV to Supabase, localStorage, IndexedDB, Cache Storage, analytics, URL state, or logs. The session expires after the repository's anonymous inactivity timeout and can be deleted immediately from the existing guest store action.

## Optional recovery and account saving

If optional session recovery is offered, it must use the existing consent-gated recovery mechanism and clearly identify sessionStorage, retention, and deletion. Account saving is a separate user choice after review; the product must not imply silent migration at signup. PDF and print remain available without registration.

## AI boundary

The Noura route keeps distinct AI boundaries for its existing drafting surfaces and for the **Synthetic Specialty Resume Generator**. The sample generator defaults to local deterministic content and cannot send a request merely because a visitor opens the flow or selects a profession.

The optional sample-adaptation control appears only after template selection. Its checkbox is unchecked by default and its action control is disabled until consent. The disclosure states that a request can contain only specialty ID, experience level, and language; it excludes CV text, custom-specialty text, name, contact details, employer, education, job description, and location. A guest session is not permitted to invoke the authenticated endpoint, so it receives a local deterministic fallback and no adaptation network call is made.

For an authenticated consented request, the server validates an exact input schema, applies existing rate limits, uses a server-only provider key, and accepts only structured fictional output. The response must be tagged as sample content, remain unapproved for export, and never apply automatically to a real or verified resume. Provider errors, malformed output, or unsafe content keep the deterministic sample. Evidence-Locked adapters remain responsible for payload limits, provider errors, allowed evidence, and approval semantics on their separate drafting paths.

## Deletion

Deletion clears the anonymous in-memory session and any consented recovery state. The UI must confirm deletion without exposing CV content in the event name, log, or analytics payload.

## Known gates

The synthetic browser smoke now blocks a guest adaptation request, sample-content outbound leakage, cloud persistence mutations, and sample-related browser persistence. The server contract smoke validates safe adaptation structure without calling a live provider. Live authenticated provider verification, broader browser-matrix coverage, data deletion automation, and production provider monitoring remain release gates and are not claimed as complete by this document.
