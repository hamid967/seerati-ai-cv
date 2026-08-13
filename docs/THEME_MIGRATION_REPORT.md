# Theme Migration Report — Design System 3.0

## Current state

Phase 17 extends the existing `styles.css`, `marketing-theme.css`, and `premium-theme.css` architecture through the already-loaded `seerati-global-theme.css` semantic layer. The change is CSS-only: no new dependency, provider, persistence path, analytics payload, or AI/ATS logic is introduced.

## Applied migration

Semantic aliases now cover the Saudi Future Professional palette, motion, focus, content gutter, safe-area bottom padding, spacing, radius, responsive text, surface levels, A4 dimensions, and content width. Dark mode receives explicit Sky Blue and Amber values. Reduced motion and print token behavior remain active.

## Deferred migration

The full site-wide component migration is intentionally staged. Header, footer, template cards, carousels, resume editor, admin tables, and internal product panels must be updated in separate focused slices with screenshots and regression evidence. The current change does not claim that every route has been visually redesigned.

## Compatibility constraints

The existing print flattening rules, resume direction logic, CSS-only guest privacy boundaries, app-shell routing, and Supabase authorization behavior remain authoritative. Any component that uses physical left/right layout for document rendering requires a documented exception; new marketing and application styling should use logical properties.

## Rollback and acceptance

Rollback is the Phase 17 branch base. Acceptance requires format, lint, TypeScript, build, QA routes, browser matrix, visual checks, PDF/Print, Network Privacy, and measured performance. A failed gate requires removing or simplifying the visual slice rather than lowering the threshold.
