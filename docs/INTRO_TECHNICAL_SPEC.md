# Seerati Opening Experience — Technical Specification

The intro is optional and must never block the homepage, SEO, SSR, or direct editor links. It appears at most on the first visit, can be skipped immediately, and respects `prefers-reduced-motion`. It uses a non-personal session preference only and never stores CV content.

## Performance budget

| Budget                           |                               Target |
| -------------------------------- | -----------------------------------: |
| Additional compressed JavaScript |                               ≤35 KB |
| All intro assets                 |                              ≤150 KB |
| Long tasks caused by intro       |                          0 over 50ms |
| LCP contribution                 | 0; intro must not be the LCP element |
| Reduced-motion transition        |                            <1 second |

The preferred implementation order is CSS transforms, opacity, lightweight SVG, and only then a pre-rendered asset. WebGL and heavy video are excluded unless a measured experiment proves no regression. The intro must be dynamically imported after the primary content is ready, pause when the tab is hidden, avoid focus trapping, expose an accessible Skip control, and close on Escape.

No intro implementation is included in the current performance commit; this specification intentionally prevents an unmeasured cinematic feature from harming the 2.5-second LCP target.

## Phase 15 implementation addendum

The current implementation keeps the intro as an optional `/intro` experience rather than a mandatory homepage gate. It uses a session-scoped preference flag, a visible Skip button, Escape/Enter keyboard behavior, first-focus on Skip, and decorative `aria-hidden` layers. The standard sequence is now 7.6 seconds and `prefers-reduced-motion` reduces the sequence to 600ms. The intro no longer imports the Lucide X icon; its close glyph is a text character, reducing route-specific dependency pressure.

The intro remains separate from the initial `/assistant` critical path. Any future homepage overlay must be dynamically imported after the primary hero and must be disabled for direct editor links, active resume sessions, reduced motion, and slow-device/network conditions.
