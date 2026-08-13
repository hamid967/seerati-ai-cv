# Seerati Design System 3.0

## Intent

Design System 3.0 extends the existing Seerati tokens rather than replacing them. It provides semantic roles for Saudi Future Professional surfaces, typography, spacing, motion, focus, safe areas, RTL/LTR, Light/Dark, A4, PDF, and Print.

## Semantic roles

The system keeps existing `--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--border`, `--ring`, `--sand`, and `--ink` variables as the source of truth. The `--seerati-*` aliases add product-level meaning: Midnight Navy, Saudi Emerald, Warm Sand, Pearl White, Slate, Sky Blue, Amber, error, focus ring, content gutter, safe bottom, surface levels, and print dimensions.

## Scale

Spacing uses 0.25rem increments from `--seerati-space-1` through `--seerati-space-16`. Radius roles are `sm`, `md`, `lg`, and `pill`. Text roles range from `xs` to `display` using `clamp()` for responsive scale. The content max-width is 72rem, while mobile and tablet reference breakpoints remain documentation tokens rather than runtime JavaScript conditions.

## Direction and layout

New component CSS must use logical properties such as `margin-inline`, `padding-inline`, `inset-inline-start`, `border-inline`, and `text-align: start`. Physical left/right properties are reserved for the resume renderer where the document direction is explicitly controlled. Every public and product surface must be reviewed in Arabic RTL and English LTR.

## Motion and focus

Motion uses instant, fast, standard, and emphasis tokens. The existing reduced-motion media rule collapses transitions and animations. Focus-visible uses a semantic ring with an offset. No animation is allowed to block HTML, change the LCP element, hijack scroll, or remove keyboard focus.

## A4 and Print

The system exposes A4 width and height tokens for resume surfaces, while `styles.css` remains the source of print flattening and `@page` configuration. Any template change must preserve selectable text, links, A4 margins, RTL/LTR, and PDF integrity.

## Performance gate

The token layer is CSS-only and adds no runtime dependency. A design-system PR must prove that initial JavaScript does not grow beyond the Phase 17 budget, that LCP regression stays within 100ms, CLS remains at or below 0.1, and no long tasks are introduced by motion.
