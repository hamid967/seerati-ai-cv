# Beta Privacy Measurement

Beta telemetry must use random correlation IDs, aggregate counters, short retention, sampling, and explicit redaction. Allowed fields are route, anonymous event type, timestamp bucket, locale, viewport class, latency bucket, success/failure class, and coarse feature state.

Forbidden fields are CV text, names, emails, phone numbers, companies, job descriptions, prompts, model responses, uploaded file contents, auth headers, access tokens, and direct identifiers. Request and response bodies must not be uploaded as artifacts.

Before collecting any beta metric, the team must test redaction with synthetic payloads and document the retention period, access owner, deletion process, and alert thresholds.
