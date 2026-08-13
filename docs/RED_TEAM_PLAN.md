# Phase 15 Security Red-Team Plan

All tests use local/staging environments and synthetic payloads. No destructive request is sent to Production.

## AI cases

Prompt injection inside CV/JD, system-prompt extraction, secret extraction, fabrication requests, fake metrics, discriminatory suggestions, and PII exfiltration.

## Upload cases

Corrupt PDF/DOCX, MIME spoofing, oversized files, archive bombs, embedded scripts, malicious links, XSS payloads, and documents containing model-directed instructions.

## Application cases

XSS, CSRF, IDOR, admin authorization, Supabase RLS, account deletion, session fixation, rate-limit bypass, CORS/CSP, security headers, client-bundle secrets, dependency/license risks, and log/artifact redaction.

Every finding records a synthetic case ID, endpoint or UI surface, expected behavior, observed status, severity, reproducibility command, and remediation owner. Request bodies and sensitive payloads are not stored in artifacts.
