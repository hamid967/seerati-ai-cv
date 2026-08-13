# Resume Health

Resume Health is a deterministic local report, not an employment prediction. It scores completeness, clarity, achievement evidence, duplication, chronology, language readiness, ATS basics, privacy minimization, and PDF readiness.

Each dimension returns a score, state, findings, and `localOnly: true`. The report exposes no CV content to telemetry and never modifies the resume. It returns at most three top issues, a next action, and an estimated repair time. The score is advisory and must be reviewed alongside the actual preview and PDF output.

The first live integration is the `/ats` route, where the health summary is displayed beside the existing Explainable ATS report. This is additive and reversible; the existing ATS behavior remains intact.

## Next Best Action

The existing deterministic Next Best Action engine remains the source of ranked actions. Phase 19 wraps those actions with confidence, consent requirement, local/remote classification, fallback, and UI surface metadata. Actions are recommendations only: they do not create facts, change templates, submit applications, or save guest data.
