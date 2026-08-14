# Performance Before / After

## Measurement protocol

The final audit ran three Lighthouse passes per route against the local production artifact on `http://127.0.0.1:4173`. It uses the locked `lighthouse@13.4.1` package, the Playwright-managed Chromium executable, desktop form factor, simulated throttling, and the categories `performance`, `accessibility`, `best-practices`, and `seo`. Reports are produced as CI artifacts only; they are not committed.

> These are controlled local laboratory measurements. They are not Real User Monitoring data and must not be interpreted as production field performance.

## Final measured baseline

| Route            | Performance runs | Median performance | Median LCP | Accessibility | Best practices |  SEO | Gate outcome                        |
| ---------------- | ---------------: | -----------------: | ---------: | ------------: | -------------: | ---: | ----------------------------------- |
| `/`              | 0.63, 0.61, 0.62 |               0.62 |   3,669 ms |          1.00 |           1.00 | 1.00 | Performance warning only.           |
| `/templates`     | 0.64, 0.63, 0.64 |               0.64 |   3,381 ms |          1.00 |           1.00 | 1.00 | Performance warning only.           |
| `/features`      | 0.63, 0.64, 0.64 |               0.64 |   3,372 ms |          1.00 |           1.00 | 1.00 | Performance warning only.           |
| `/privacy`       | 0.65, 0.65, 0.65 |               0.65 |   3,225 ms |          1.00 |           1.00 | 1.00 | Performance warning only.           |
| `/assistant`     | 0.63, 0.63, 0.63 |               0.63 |   3,531 ms |          1.00 |           1.00 | 1.00 | Performance warning only.           |
| `/jobs`          | 0.60, 0.60, 0.60 |               0.60 |   4,356 ms |          0.95 |           1.00 | 0.63 | Performance, LCP, and SEO warnings. |
| `/cover-letters` | 0.61, 0.61, 0.61 |               0.61 |   4,035 ms |          0.95 |           1.00 | 0.63 | Performance, LCP, and SEO warnings. |

All 21 runs passed the blocking accessibility (at least 0.90) and best-practices (at least 0.90) gates. CLS was at or below 0.014 in every measured run, below the 0.10 warning budget. The browser hardening suite separately found no critical or serious axe violations on the assistant and primary public pages.

## Before / after tooling state

| Area              | Before audit changes                                                                                | After audit changes                                                                                  | Effect                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Lighthouse runner | `@lhci/cli@0.15.1`, whose transitive dependency tree contained unresolved high-severity advisories. | Locked `lighthouse@13.4.1` plus `chrome-launcher@1.2.1`; `bun audit` reports no vulnerabilities.     | Keeps automated route measurement without retaining the vulnerable CLI tree.  |
| Browser runner    | `@playwright/test` and `playwright` 1.55.0.                                                         | Both pinned at 1.62.1.                                                                               | Uses a patched browser-testing toolchain.                                     |
| CI execution      | Historical configuration was tied to `lighthouserc.cjs`.                                            | `scripts/lighthouse-ci.mjs` runs 3 passes on the same seven public routes and writes JSON artifacts. | Reproducible, reviewed metrics and category gates from the lockfile.          |
| Product rendering | Existing route-level lazy loading and on-demand PDF/import libraries were already present.          | No speculative visual or rendering rewrite was applied.                                              | Avoids presenting a toolchain-induced score change as a product optimisation. |

The earlier phase used a different Lighthouse major version and runner. Its local score range (0.74–0.87) is therefore **not comparable** with the `lighthouse@13.4.1` values above. No before/after product-performance claim is made. The final table is the canonical baseline for this branch and should be rerun unchanged on a stable preview environment before a budget is tightened.

## Next measured experiment

The next safe performance experiment is responsive hero media: generate real source variants, implement `srcset` and `sizes`, then compare three-run local and preview measurements using the exact current runner. Do not add `sizes` alone while serving only one image asset: it will not reduce transfer size. The jobs and cover-letters SEO warnings require a separate product-policy review because these routes intentionally serve authenticated or utility flows and may use noindex behavior.
