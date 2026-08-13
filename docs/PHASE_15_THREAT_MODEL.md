# Phase 15 Threat Model

## Assets

Guest resume content, optional authenticated resumes, uploaded documents, AI inputs/outputs, job descriptions, ATS findings, account/session tokens, and generated PDF buffers.

## Trust boundaries

The browser memory-only guest boundary, the optional authenticated Supabase boundary, the server-side AI provider boundary, upload parsing, PDF generation, analytics/telemetry, and CI artifacts are separate boundaries. Guest content must not cross into persistent storage or telemetry by default.

## High-risk threats

| Threat                    | Required control                                      | Phase 15 evidence                                          |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Guest content persistence | memory-only state and network inspection              | Existing Phase 14 smoke passes; deletion expansion pending |
| Prompt injection          | treat CV/JD as data, structured output, refusal tests | Red-team plan defined; model-output run pending            |
| PII/secret leakage        | redaction and synthetic artifacts                     | Existing Network Privacy pass; expanded red-team pending   |
| Cross-user access         | Supabase RLS and IDOR tests                           | RLS is server-enforced; dedicated adversarial test pending |
| Malicious upload          | MIME/size/content validation and safe parsing         | Test plan defined; execution pending                       |
| XSS/CSRF/CSP              | output encoding, headers, origin checks               | Browser hardening passes; dedicated security scan pending  |
| AI outage/timeout         | bounded timeout and non-AI fallback                   | Framework target defined; runtime evidence pending         |

No critical security pass is claimed until the pending adversarial tests are executed and independently reviewed.
