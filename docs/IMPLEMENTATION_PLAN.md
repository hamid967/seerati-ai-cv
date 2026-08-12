# Implementation Plan

## Completed foundation

The anonymous resume path now uses in-memory state by default, does not autosave to localStorage, does not migrate to Supabase automatically, exposes a privacy status, exposes “Delete my data,” and clears after 20 minutes of inactivity.

## Next delivery slices

1. Add consent UI for optional session recovery and automated tests for consent boundaries.
2. Add network assertions for anonymous editing, AI request minimization, and log redaction.
3. Complete deterministic A4 print fixtures and browser matrix checks.
4. Refine the one-page desktop/mobile builder shell without removing existing routes.
5. Add the remaining documentation, screenshots, and draft PR evidence after build and QA pass.
