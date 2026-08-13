# Saudi Cities Collection

## Implemented slice

Phase 17 adds `SaudiCityStory`, a lightweight horizontal story section on the homepage. It uses six abstract CSS gradient cards for Riyadh, Jeddah, Dammam, Abha, AlUla, and Tabuk. The cards are not photographs, maps, official marks, or claims about local labor markets. Each card links to the existing templates journey.

## Direction

The city names are creative starting points for a career story. The content focuses on experience, ambition, and the next step rather than geography, government affiliation, or tourism. The collection can later expand to Makkah, Madinah, Khobar, Dhahran, Jazan, Hail, and AlAhsa after cultural review.

## Accessibility and interaction

The section is semantic HTML with a labelled list, horizontal touch scrolling, snap points, keyboard focus, visible focus treatment, and no autoplay. It works in RTL and LTR because direction is inherited from the page and all new layout choices avoid hard-coded left/right positioning.

## Performance and privacy

No image, font, map, WebGL, analytics payload, location request, or Supabase mutation is introduced. The section must remain below the critical hero path and must not become an LCP element. The design may be removed or simplified if it increases LCP, CLS, long tasks, or mobile scroll jank.
