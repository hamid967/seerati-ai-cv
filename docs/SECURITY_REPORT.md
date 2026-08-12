# Security Report

The anonymous path does not persist resume content to localStorage or Supabase and includes explicit deletion and inactivity expiry. Remaining security gates include import MIME and size verification, prompt-injection handling, error redaction, no-store headers on sensitive responses, dependency review, CSP/security headers, and browser network evidence.
