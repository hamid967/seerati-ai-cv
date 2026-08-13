# Seerati Design System 2.0

**Status:** Phase 15 design specification; implementation must remain incremental and gate-protected.

## Design intent

Seerati should feel like a professional intelligent workspace: clear layers, generous space, precise borders, quiet elevation, restrained gradients, and a resume preview as the primary visual object. The system supports Arabic RTL, English LTR, mixed content, print, and A4 resume output without using color or motion as the only communication channel.

## Token groups

| Token group | Required scope                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors      | Midnight Navy, Saudi Emerald, Warm Sand, Pearl White, Slate, Sky Blue, Amber, Red; semantic foreground/background/border/focus variants for light and dark modes |
| Typography  | Display, Hero, H1–H6, Body, Small, Label, Caption, Data, Resume, Print; Arabic and English fallback stacks with limited weights                                  |
| Spacing     | Logical inline/block spacing, safe-area aware page gutters, mobile and desktop scales                                                                            |
| Shape       | Radius, borders, focus rings, quiet elevation, print-safe borders                                                                                                |
| Motion      | Instant 100ms, Fast 160ms, Standard 240ms, Emphasis 360ms, intro sequence 6–8s; reduced-motion alternatives                                                      |
| Layout      | Breakpoints, z-index, safe areas, logical RTL/LTR properties, A4 dimensions                                                                                      |
| State       | Neutral, success, information, warning, error with text/icon/shape support in addition to color                                                                  |

## Component contract

Buttons, inputs, textareas, selects, search, cards, template cards, AI suggestion cards, ATS score, progress, dialogs, drawers, bottom sheets, navigation, mobile navigation, privacy indicator, empty/loading/error states, toasts, tooltips, command palette, and resume section editor must consume semantic tokens rather than page-specific colors or spacing.

Every interactive component must expose an accessible name, visible focus state, keyboard operation, disabled state, and an RTL/LTR test case. Components that render user CV content must not emit analytics payloads containing that content.

## Light mode hypothesis

Light mode uses Pearl White primary surfaces, Warm Sand quiet sections, Midnight Navy primary text, Slate secondary text, and limited Saudi Emerald/Sky Blue semantic accents. Red is reserved for errors and Amber for warnings. Contrast must be measured for Arabic and English labels, disabled states, focus rings, and small text.

## Dark mode hypothesis

Dark mode uses Midnight Navy as the primary background, a lighter navy surface, Pearl White primary text, a softened Slate secondary text, and carefully lightened semantic accents. Contrast must be measured independently; light-mode passing values cannot be assumed to pass in dark mode.

## Typography and font loading

Fonts must be open-licensed, locally hosted or non-blocking, support Arabic fully, and use `font-display: swap` or an equivalent non-blocking strategy. The initial route must preload only the font actually needed for the first viewport. Resume/PDF fonts may be separated from application fonts. Long Arabic and English company names, mixed scripts, Arabic and Latin numerals, 200% zoom, and print typography require explicit tests.

## Performance and accessibility gates

No design-system change is accepted if it causes a regression in `/assistant` LCP, CLS, long tasks, initial JavaScript, or memory-only guest behavior. All themes must pass automated contrast checks, keyboard navigation, axe checks, RTL/LTR rendering, print/PDF integrity, and reduced-motion behavior. Storybook or an internal component page is acceptable only if it is excluded from the production bundle.
