# Seerati Component Inventory — Phase 17

| Component family           | Existing surface                         | Phase 17 direction                                                                   | Required checks                   |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| Header/navigation          | `SiteHeader`, app topbar/sidebar         | Shared language/theme/privacy affordances with separate marketing and app semantics  | RTL/LTR, keyboard, mobile, axe    |
| Buttons and inputs         | shadcn primitives and route forms        | Semantic tokens, visible focus, clear destructive states                             | axe, keyboard, reduced motion     |
| Cards and surfaces         | Cards, editorial surfaces, panels        | Surface levels rather than decorative gradients; resume preview remains primary      | visual, LCP, mobile               |
| Template cards             | Template gallery and lightweight preview | Thumbnail-first, lazy full renderer, filters, compare, no PDF engine on initial load | route smoke, performance, RTL/LTR |
| AI suggestion cards        | Assistant and AI panels                  | Show source, suggestion, accept/reject, no invented facts, privacy boundary          | AI contracts, privacy, keyboard   |
| ATS status                 | ATS panels and recruiter surfaces        | Explainable guidance, no fabricated score guarantee                                  | AI/ATS fixtures, accessibility    |
| Progress and empty/error   | Skeletons, empty states, route errors    | Consistent semantic status and recovery action                                       | route QA, axe, screen reader      |
| Dialog/drawer/bottom sheet | Radix/shadcn primitives                  | Focus trap, Escape, mobile safe area, RTL                                            | keyboard, mobile, axe             |
| Carousel/slider            | Template and planned city sliders        | Touch, arrows, pagination, pause, reduced motion, RTL                                | browser, visual, keyboard         |
| Resume editor/preview      | Resume routes and preview renderer       | Preserve document direction, A4, selectable text, print flattening                   | PDF, print, RTL/LTR               |
| Privacy indicator          | Guest notice and privacy surfaces        | State location, AI boundary, expiry, deletion, optional account                      | Network Privacy, deletion         |
| Footer                     | Site footer                              | Product/resources/trust/company groups with language/theme/service status            | links, mobile, SEO                |
| Admin tables               | Admin routes                             | Visual consistency only; do not weaken RLS or client/server authorization            | security and route guards         |

## Ownership

The design-system squad owns semantic tokens and primitives. Frontend owns route composition. Privacy/security owns disclosures and network checks. PDF/Print owns resume rendering. QA owns cross-browser and visual evidence. The single agent may coordinate changes but cannot approve a visual baseline, security gate, or merge.
