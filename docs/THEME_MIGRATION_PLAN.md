# Theme Migration Plan

## Scope

Phase 15 extends the existing Seerati theme rather than replacing it. The first implementation adds semantic aliases and motion/accessibility tokens in `src/seerati-global-theme.css`, imported by `src/router.tsx`. Existing `styles.css`, `premium-theme.css`, and `marketing-theme.css` remain the source of current visual behavior until each component is migrated and tested.

## Migration sequence

| Stage | Scope                                                                                                                                       | Acceptance gate                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1     | Add semantic aliases for Midnight Navy, Saudi Emerald, Warm Sand, Pearl White, Slate, Sky Blue, Amber, error, focus, motion, and safe areas | Type/build, no visual regression, no bundle dependency increase |
| 2     | Migrate shared buttons, inputs, privacy indicator, loading/error states, and navigation to semantic tokens                                  | axe, keyboard, RTL/LTR, light/dark contrast                     |
| 3     | Migrate marketing hero, template cards, ATS advisory, and assistant entry surfaces                                                          | LCP/CLS, mobile viewport, guest privacy                         |
| 4     | Migrate resume editor and preview surfaces                                                                                                  | PDF, Print, A4, long Arabic/English content                     |
| 5     | Add internal component documentation only if excluded from production bundle                                                                | Build manifest confirms no Storybook/test payload in production |

## Non-goals

This phase does not replace the complete theme in one commit, introduce a new UI framework, add a heavy animation library, or copy a competitor identity. It does not change the memory-only guest boundary or introduce CV content telemetry.

## Rollback

The migration is reversible by removing the new import and leaving existing theme files unchanged. Every later component migration must be isolated in a small commit with its own visual, accessibility, performance, and PDF/Print evidence.

## Required checks

Before a theme migration is considered release-ready, run light/dark contrast checks, Arabic/English/mixed-script rendering, 200% zoom, keyboard and axe checks, Chromium/Firefox/WebKit, `/assistant` LCP and CLS, guest Network Privacy, PDF integrity, and Print visual regression. Any regression blocks promotion.
