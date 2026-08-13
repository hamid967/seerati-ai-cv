# Theme Accessibility Report — Phase 17

## Current evidence

The semantic theme keeps existing focus-visible behavior and reduced-motion rules, adds no new interactive dependency, and the city story uses semantic list/link elements with labels and visible focus. The homepage uses existing Button and Link primitives rather than bespoke controls.

## Required review matrix

| Area           | Requirement                                                                                   | Current status                                                     |
| -------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Keyboard       | Every CTA, city card, Skip control, dialog, carousel, and filter reachable with visible focus | Homepage/city slice implemented; full-site audit pending           |
| RTL/LTR        | Arabic layout and English layout preserve logical flow and readable direction                 | Homepage/city slice implemented; full-site visual evidence pending |
| Contrast       | Text and controls meet WCAG AA contrast                                                       | Automated and human verification pending on final visual state     |
| Reduced motion | Intro and all transitions collapse safely                                                     | Existing global rule and intro path present                        |
| Zoom           | 200% zoom retains task completion                                                             | Full visual run pending                                            |
| Screen reader  | Landmark, heading, link, status, and dialog semantics remain meaningful                       | Targeted review pending                                            |
| Print/PDF      | A4 output remains static and selectable                                                       | Existing release gate must be rerun after visual changes           |

No accessibility claim is considered final until the full Playwright/axe/browser matrix runs against the final branch.
