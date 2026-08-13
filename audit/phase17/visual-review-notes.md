# Phase 17 visual review notes

## Arabic route
- URL: `http://127.0.0.1:4173/?lang=ar`
- Screenshot: `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_08-46-11_5626.webp`
- The viewport shows the Saudi Future Professional hero, Arabic headline, primary CTAs, Arabic resume image, three-step section, and the first layer of city story links.
- Visual result: dark navy/teal hero, high contrast white type, green focus outlines from the browser inspection overlay, and no visible horizontal overflow in the viewport.
- Content evidence: six city entries are present: Riyadh, Jeddah, Dammam, Abha, AlUla, and Tabuk.

## English route attempt
- URL: `http://127.0.0.1:4173/?lang=en`
- Screenshot: `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_08-46-25_7610.webp`
- The server-rendered content remained Arabic, indicating the route query alone does not switch the persisted locale; the visual frame remained stable and did not regress, but an explicit locale-toggle interaction is still required for a valid English visual capture.

## Follow-up
- Capture a true English screenshot by activating the visible EN language control or setting the application locale through the supported UI, then verify LTR alignment and English copy.

## English route after explicit toggle
The visible language control was activated from the `?lang=en` page. The page then rendered true English copy and LTR composition.

- Screenshot: `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_08-46-43_2411.webp`
- English evidence includes `Seerati | Saudi Future Professional`, `Start a resume`, `Import your CV`, `Browse templates`, and English city labels for Riyadh, Jeddah, Dammam, Abha, AlUla, and Tabuk.
- The hero image and CTA hierarchy remain stable while the content block moves to the left and the image to the right, confirming the intended LTR counterpart.
- No viewport-level horizontal overflow was observed in the captured frame. The browser inspection overlay outlines interactive elements but is not part of the product UI.

## Review conclusion
The homepage slice is visually coherent in both locales. The one initial query-only attempt correctly exposed that locale is persisted/toggled through application state; the explicit language interaction produced the expected English capture. This is a review note, not a release blocker.

## Template gallery and Mega Menu
- Templates screenshot: `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_08-56-50_6022.webp`.
- The gallery exposes `All 24`, `ATS 17`, `Executive 4`, `Modern 8`, `Minimal 3`, and `Creative 2`, plus a bilingual search field and Arabic/English preview toggles.
- The first four light previews are visible without loading the remaining 20, preserving the performance-oriented lazy preview strategy.
- Mega Menu screenshot: `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_08-56-58_3616.webp`.
- The menu exposes six accessible `menuitem` links grouped into Build, Improve, and Trust. Its content explicitly preserves the free, registration-optional, memory-only guest promise and the original 24-template/watermark-free claim.
- The browser inspection overlay is not part of the product UI; the underlying menu and gallery composition are aligned and readable.
