# Phase 15 Evaluation Data Policy

The Phase 15 dataset is synthetic-only. It must remain under `tests/fixtures/phase15/` and must not be imported by application route code, client bundles, analytics events, logs, or production seed jobs.

Sensitive markers in the fixtures are deliberately fake and exist only to verify redaction behavior. They must never be copied into CI artifacts that contain request bodies, prompts, model responses, or user documents. Evaluation outputs may include aggregate counts, hashes, schema failures, latency summaries, and score distributions only.

No real CV, job description, name, email, phone number, national identifier, address, employer, or account data may be added to this dataset. Any future human evaluation must use explicit consent, de-identification, retention limits, and a separate approved storage boundary.

A dataset hash, model identifier, prompt version, configuration, and date may be recorded. Raw CV text and raw prompts must not be recorded by default.
