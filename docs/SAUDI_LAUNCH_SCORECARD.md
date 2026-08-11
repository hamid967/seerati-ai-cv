# Seerati — Saudi Launch Quality Scorecard

This scorecard is a release gate, not a marketing claim. “Market leadership” is the product goal; it is not considered proven by internal scores alone.

## Product & Resume Quality

- [ ] Arabic and English resume creation paths complete without dead ends.
- [ ] Every resume template has deterministic rendering and print/PDF safeguards.
- [ ] ATS/readiness scores explain inputs and never imply hiring probability.
- [ ] Tailoring cannot invent skills, experience or metrics.
- [ ] Job-specific changes are reviewable and reversible.
- [ ] Career Passport fields are copy-ready and do not claim external/government submission.

## Saudi & Arabic Experience

- [ ] Saudi mobile normalization supports common `05…`, `5…`, and `+9665…` forms.
- [ ] Arabic typography and RTL work across navigation, forms and resume rendering.
- [ ] English technology/product names can remain protected from forced translation.
- [ ] Arabic Career Intelligence reviews consistency without forcing translation.
- [ ] Saudi-market guidance avoids unsupported government-platform claims.

## Privacy, Security & Trust

- [ ] Raw Career Facts, Evidence, Agent Activity and Resume Version snapshots are owner-readable only through RLS.
- [ ] Admin operational insight uses aggregate counts instead of raw career content.
- [ ] Analytics contract rejects identity, contact, resume, job-description and evidence text fields.
- [ ] Privacy Center export/delete flows are tested in a QA Supabase environment.
- [ ] No secrets are committed to the repository.
- [ ] Legal Privacy/Terms content receives Saudi-qualified legal review before commercial launch.

## Accessibility & Mobile

- [ ] Keyboard users have a visible-on-focus skip link.
- [ ] Focus indication is visible on interactive controls.
- [ ] Coarse-pointer controls meet a practical touch-target minimum.
- [ ] Reduced-motion behavior remains available.
- [ ] Screen-reader smoke tests cover auth, Career Twin, resume editing, Job Workspace and Privacy Center.
- [ ] A manual WCAG 2.2 audit is completed before claiming conformance.

## Performance & Reliability

- [ ] Production build passes.
- [ ] Route runtime smoke runs against configured QA Supabase secrets (not skipped).
- [ ] Large document/PDF code remains route-lazy where possible.
- [ ] Long dashboard cards can defer off-screen rendering without affecting resume measurement/export.
- [ ] Mobile network and low-powered-device profiling is completed before launch.

## SEO, Content & Commercial Readiness

- [ ] Public career guide hub is indexable and included in sitemap.
- [ ] Authenticated/private surfaces use `noindex` where appropriate.
- [ ] Landing-page claims are evidence-based and do not promise employment outcomes.
- [ ] Pricing/feature gates match actual backend enforcement.
- [ ] Support, incident response, account recovery and data-request procedures are documented.
- [ ] Funnel analytics remain coarse and privacy-safe.

## Release rule

A production launch requires all automated CI gates to pass plus the manual items above that cannot be proven by static analysis. A successful build alone is not release approval.
