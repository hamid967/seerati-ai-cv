# Motion Specification — Phase 17

## Allowed motion

Seerati uses short fade, slide, small scale, mask reveal, restrained SVG line drawing, limited text stagger, and optional desktop-only parallax. These effects communicate sequence or state; they are not required for task completion. Motion tokens come from the semantic theme and collapse under `prefers-reduced-motion: reduce`.

## Prohibited motion

No scroll hijacking, rapid autoplay, background video, automatic sound, cursor replacement, heavy WebGL, dizziness-inducing transforms, or motion that disables mobile interaction is accepted. Carousels must pause on hover/focus, provide a pause control, preserve focus, and expose accessible labels and pagination.

## Performance rules

No animation may become the LCP element, cause layout shift, create a long task, or delay the first interactive CTA. Prefer transform/opacity over layout properties. Use `content-visibility` only after measuring its effect on accessibility and print. Any visual improvement that misses LCP, CLS, or input budgets is rejected or simplified.

## Review matrix

| Context        | Required behavior                                                          |
| -------------- | -------------------------------------------------------------------------- |
| Desktop        | Optional restrained parallax only after critical content is ready          |
| Mobile         | No parallax; touch and keyboard remain primary                             |
| Reduced motion | Static or 600ms completion; no repeated animation                          |
| Print/PDF      | No animation; static A4 output                                             |
| RTL            | Direction-aware sequencing and no physical left/right assumptions          |
| Screen reader  | State changes are announced only when useful; decorative layers are hidden |
