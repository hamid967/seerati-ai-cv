# Intro Storyboard — Phase 17

## Status

The repository already contains an optional `LandingIntro` with a first-visit session marker, Skip control, Escape/Enter completion, focus on Skip, and reduced-motion timing. Phase 17 treats it as an optional narrative layer, never as a required registration or creation step.

## Full sequence

| Time  | Scene                                | Message                                        | Implementation rule                                |
| ----- | ------------------------------------ | ---------------------------------------------- | -------------------------------------------------- |
| 0–2s  | Navy field and abstract line network | Saudi Future Professional                      | CSS/SVG only; no official outline or logo          |
| 2–4s  | City points and word rhythm          | Ambition, experience, achievement, opportunity | Text remains readable and skippable                |
| 4–6s  | Network becomes an A4 page           | Summary, experience, education, skills         | No real personal data; synthetic illustration only |
| 6–8s  | AI suggestion and ATS guidance       | Your CV data is not saved by default           | Must not imply AI facts or ATS guarantee           |
| 8–10s | A4 resolves into the real hero       | Start your CV for free                         | Real CTA; Skip remains visible                     |

## Lightweight mode

On mobile, slow networks, and reduced-motion contexts, the sequence collapses to 3–4 seconds, removes large images, uses CSS/SVG only, and exposes the real hero immediately underneath. Reduced motion uses the existing 600ms completion path.

## Acceptance

The intro must preserve focus, Escape, Enter, touch, RTL/LTR, screen-reader labelling, 200% zoom, and a visible Skip button. It must not hijack scroll after completion, write CV content to telemetry, or delay the homepage HTML/LCP. Any performance regression removes the heavy scene rather than lowering the performance budget.
