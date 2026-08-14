# Test Matrix

## Commands and observed evidence

| Area                 | Command                                                                                       | Baseline / final status                                  | Notes                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Locked install       | `bun install --frozen-lockfile`                                                               | Passed                                                   | Bun 1.3.14.                                                                                                            |
| Dependency audit     | `bun audit`                                                                                   | Passed                                                   | No advisory reported at audit time.                                                                                    |
| Formatting           | `bunx prettier@3.9.6 --check .`                                                               | Final gate pending PR CI                                 | Changed files were formatted locally; CI remains authoritative repository-wide check.                                  |
| Lint                 | `bun run lint`                                                                                | Baseline passed: 0 errors, 20 warnings                   | Warnings pre-existed and were not suppressed.                                                                          |
| TypeScript           | `bunx tsc --noEmit`                                                                           | Baseline and post-change passed                          | Strict compile check.                                                                                                  |
| Build                | Node 24 Vite build plus `check-client-env`                                                    | Baseline and post-change passed                          | Browser configuration guard passed.                                                                                    |
| Full QA              | `QA_BASE_URL=http://127.0.0.1:8080 bun run qa`                                                | Passed post-change                                       | Includes routes, AI contracts, guest, recovery, samples, RTL, and premium rendering checks.                            |
| AI context hardening | `bun run test:ai-request-validation`                                                          | Passed post-change                                       | Tests allowlist, property dropping, size, shape, and answer limits.                                                    |
| Release hardening    | `BASE_URL=http://127.0.0.1:8080 BROWSER_ONLY=<browser> node@24 scripts/release-hardening.mjs` | Chromium, Firefox, and WebKit passed                     | E2E, keyboard, Chromium network privacy/axe/PDF/print, and visual baselines. The deferred-hub wait is condition-based. |
| Lighthouse           | `BASE_URL=http://127.0.0.1:4173 node@24 scripts/lighthouse-ci.mjs`                            | Completed with warning-only performance/LCP/SEO findings | All 21 accessibility and best-practices gate checks passed.                                                            |

## Journey coverage

| Journey                  | Unit / contract                                   | Local browser evidence                          | CI target                            | Status                                                                       |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Guest create/edit/delete | Guest-first, guest-recovery, guest-transfer smoke | Chromium release hardening network inspection   | Chromium browser hardening           | Passed post-change; dynamic guest flows are CI-covered.                      |
| Guest consented recovery | Guest recovery smoke                              | Storage key inspection in release hardening     | Chromium-specific recovery smoke     | Passed post-change; no regression code changed.                              |
| Guest AI boundary        | Noura adaptive/evidence smoke                     | Anonymous assistant network inspection          | Chromium hardening                   | No unauthorized mutation or personal payload observed.                       |
| Authenticated AI         | AI contract and request-validation smoke          | Not called against a live provider              | Quality CI                           | Contract and input boundary passed; live provider is intentionally excluded. |
| Synthetic adaptation     | Synthetic adaptation contract smoke               | Browser smoke in release CI                     | Chromium synthetic browser smoke     | Baseline QA passed; no raw CV content accepted by endpoint.                  |
| Template selection       | Template, global-template-hardening smoke         | Chromium, Firefox, and WebKit release hardening | Chromium/Firefox/WebKit CI           | All three local desktop engines passed.                                      |
| RTL/LTR                  | `check:rtl`                                       | Arabic and English assistant axe/PDF checks     | Browser matrix                       | Static checks and Chromium checks passed.                                    |
| PDF and print            | Template smoke                                    | Arabic/English A4 PDF and print baseline checks | Browser hardening matrix             | Local Chromium passed; screenshot deltas remain review warnings.             |
| RLS / tenant isolation   | Migration and static policy review                | Not executed against remote production data     | Owner-controlled remote verification | Explicitly unverified in this audit.                                         |

## Browser and device matrix

| Target           | Result                    | Evidence                                                                               | Remaining condition                   |
| ---------------- | ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| Chromium desktop | Passed                    | Local Release Hardening, including network privacy, axe, Arabic/English PDF and print. | Re-run in PR CI.                      |
| Firefox desktop  | Passed                    | Local Release Hardening capability and keyboard checks.                                | Re-run in PR CI.                      |
| WebKit desktop   | Passed                    | Local Release Hardening capability and keyboard checks.                                | Re-run in PR CI.                      |
| iPhone viewport  | Not re-run in this branch | Existing browser scripts cover mobile journey.                                         | Run/observe PR matrix before release. |
| Android viewport | Not re-run in this branch | Existing browser scripts cover mobile journey.                                         | Run/observe PR matrix before release. |

## Known test limitations

The assistant capability hub is lazy-loaded. Release Hardening now waits for the rendered hub title rather than using a fixed startup delay, eliminating the observed cold development-server timing race. CI still uses a production preview rather than a Vite development server.

The remote Supabase ownership migration is intentionally not applied by this audit. Two-user RLS tests require an owner-approved test environment and synthetic accounts. Lighthouse measures a local production artifact; it is evidence for regression direction, not a production field-performance claim.
