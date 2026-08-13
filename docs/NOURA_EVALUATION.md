# Noura Evaluation

## Current evidence

The existing Phase 19 intent harness passes 500/500 synthetic cases with 100% intent accuracy, zero network calls, and no personal data in fixtures. This result covers deterministic intent routing only.

## Noura corpus target

The next evaluation corpus should contain 300 synthetic cases across students, graduates, employees, job seekers, leaders, Saudi sectors, Arabic, English, mixed language, missing facts, conflicting facts, invention requests, sensitive data, and prompt injection.

## Metrics and proposed gates

| Metric                                                | Proposed target |
| ----------------------------------------------------- | --------------: |
| Intent accuracy                                       |          >= 95% |
| Question relevance                                    |          >= 90% |
| Fact preservation                                     |          >= 98% |
| Structured output                                     |        >= 99.5% |
| Invented companies, qualifications, dates, or metrics |               0 |
| Critical privacy failures                             |               0 |
| Consent bypass                                        |               0 |
| Data loss                                             |               0 |
| Human review                                          |          >= 4/5 |

These are proposed acceptance thresholds. They are not yet measured by the current 500-case harness.
