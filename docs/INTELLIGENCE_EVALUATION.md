# Intelligence Evaluation

## Current harness

Phase 19 includes a deterministic evaluation harness with **500 synthetic intent cases** distributed across Arabic and English commands. Fixtures cover create, import, improve, target-job, ATS, translation, cover letter, interview, template, and shortening intents. No real CV, prompt, response, identifier, or personal data is used.

| Metric | Current result | Interpretation |
|---|---:|---|
| Cases | 500 | Synthetic, deterministic fixtures |
| Intent accuracy | 100% | 500/500 routed correctly |
| Clarification cases in fixture set | 0 | The set contains only explicit supported intents |
| Network calls | 0 | Local router only |
| Personal data | 0 | No user content in fixtures |

The harness is a starting point, not proof of the final Phase 19 acceptance suite. Later evaluation must add mixed-language spelling noise, incomplete and conflicting context, prompt injection, sensitive-field requests, next-action usefulness, evidence preservation, Arabic/English quality, privacy decisions, failure fallback, template acceptance, and browser/PDF behavior.

The final thresholds in the brief remain prospective until those additional fixtures and human-reviewed evaluation sets exist. No score is used to alter user data or make a hiring decision.
