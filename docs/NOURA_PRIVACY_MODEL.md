# Noura Privacy Model

## Default guest boundary

Anonymous resume content exists in session memory by default. The default path does not write the CV to Supabase, localStorage, IndexedDB, Cache Storage, analytics, URL state, or logs. The session expires after the repository's anonymous inactivity timeout and can be deleted immediately from the existing guest store action.

## Optional recovery and account saving

If optional session recovery is offered, it must use the existing consent-gated recovery mechanism and clearly identify sessionStorage, retention, and deletion. Account saving is a separate user choice after review; the product must not imply silent migration at signup. PDF and print remain available without registration.

## AI boundary

The Noura route shows an explicit consent control before the existing drafting action. The disclosure states that only the minimum necessary data is sent for a reviewable draft, and that no change is applied automatically. Evidence-Locked adapters remain responsible for payload limits, provider errors, allowed evidence, and approval semantics.

## Deletion

Deletion clears the anonymous in-memory session and any consented recovery state. The UI must confirm deletion without exposing CV content in the event name, log, or analytics payload.

## Known gates

Network inspection, browser-level payload redaction, data deletion automation, and production provider verification remain release gates and are not claimed as complete by this document.
