# AnonymousResumeSession Specification

`AnonymousResumeSession` is an in-memory-by-default session. It owns the anonymous resume list, deletion, consent-gated session recovery, and inactivity expiry. It must not write personal CV data to localStorage, URLs, analytics, logs, or Supabase. Session recovery is disabled until explicit consent, and deletion removes both memory state and any consented temporary recovery state.
