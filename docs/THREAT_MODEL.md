# Threat Model

| Threat                            | Control                                                                 | Status          |
| --------------------------------- | ----------------------------------------------------------------------- | --------------- |
| Accidental guest retention        | Memory-only store; no localStorage autosave                             | Implemented     |
| Unintended cloud migration        | Guest-to-account migration removed from hydration, sign-in, and sign-up | Implemented     |
| Stale session data                | Explicit delete control and 20-minute inactivity timeout                | Implemented     |
| Malformed imports                 | File type and size validation must remain enforced in import handlers   | Verify in QA    |
| Prompt injection in imported text | Treat imported text as untrusted data; never execute instructions       | Required review |
| Sensitive error telemetry         | Redact personal fields before reporting                                 | Required review |
| AI overclaiming                   | Advisory language and no employment/ATS guarantee                       | Required review |
