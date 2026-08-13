# Intelligence Privacy and Safety

Phase 19 intelligence is local-first. Guest resume content stays in memory by default. The Privacy Preview shows data location, fields proposed for transmission, excluded fields, reason, provider, expiry, save state, delete availability, cancel availability, and whether content would be sent. In the first wave, consent is false and the preview reports no transmission.

The privacy boundary is separate from the decision engine. A command can be routed locally without giving any provider access to the document. Generative AI requires explicit consent, an allowlisted evidence projection, a provider boundary, a reviewable diff, approval, and undo. The system does not infer nationality, city, or protected characteristics.

Authenticity Guard flags broad claims, unsupported wording, and repeated statements. It asks the user for scope, result, tool, or evidence instead of generating a stronger unsupported claim. Smart Rewrite returns a preview and always marks it `requiresApproval: true` and `applied: false` until the user accepts it.

Failure Recovery preserves data, stops loading indicators, provides one bounded retry, offers manual editing, and selects local fallback. AI, PDF, and network failures do not write CV text, prompts, responses, identifiers, or authorization headers to logs.
