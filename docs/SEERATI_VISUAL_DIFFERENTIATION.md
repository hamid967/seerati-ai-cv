# Seerati Visual Differentiation

## Position

**Seerati Saudi Professional Intelligence** is a calm, Arabic-first career workspace that helps people create, improve, review, and print a CV while preserving control over their facts and privacy. The visual language should feel professional, human, intelligent, and global without looking governmental, tourist-oriented, or like a consumer game.

This document defines a design direction, not a claim that Seerati is better than any competitor. Any conversion or preference claim requires controlled measurement.

## Distinctive principles

| Principle                      | Seerati expression                                                                     | Boundary                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Arabic-first, globally legible | RTL-first composition with equally considered English and mixed-content states         | No forced Arabic-only workflow; language remains user-controlled                     |
| Professional intelligence      | AI appears as a quiet assistant with explainable suggestions and accept/reject control | No cartoon assistant, fake certainty, or fabricated achievements                     |
| Privacy made visible           | A compact privacy indicator appears before creation and at recovery/export decisions   | No analytics payload containing CV text, prompts, files, or direct identifiers       |
| ATS transparency               | Advisory checks show what was checked and why                                          | No “guaranteed ATS pass” or hiring outcome claims                                    |
| Saudi context without clichés  | Abstract architectural geometry, restrained warm sand, and precise emerald accents     | No government marks, Vision 2030 imitation, flag overload, or generic desert imagery |
| Calm progress                  | Clear steps, generous space, fine borders, and restrained motion                       | No neon, excessive glassmorphism, parallax, or heavy WebGL                           |

## Proposed visual system

The proposed palette uses Midnight Navy for primary structure, Pearl White for primary surfaces, Warm Sand for quiet background areas, Slate for secondary text, Saudi Emerald for selected success/intelligence states, Sky Blue for AI/information states, Amber for warnings, and Red only for errors. Color must never be the sole carrier of meaning; icons, labels, and state text remain required.

Light and dark modes must be tested against WCAG 2.2 AA contrast requirements. The proposed palette is a design hypothesis until automated contrast checks and manual Arabic/English review pass.

## Hero direction

The first public viewport should show a compact header, one benefit-led statement, a lightweight live CV preview, a privacy indicator, an advisory ATS cue, and one clear creation CTA. Import and template exploration are secondary actions. The hero must not import the editor, PDF engine, video, or heavy WebGL.

Suggested Arabic copy is intentionally short and factual: “أنشئ سيرتك بالعربية أو الإنجليزية، وحسّنها بذكاء، وراجع توافقها مع ATS — مجانًا، ودون تسجيل.” The wording must be reviewed against actual product behavior before release. English copy should make the same claims without implying a hiring guarantee.

## Product storytelling

The public page should move from value to evidence to action: show a small CV preview, explain one grounded AI suggestion, explain one transparent ATS check, show templates, state the privacy boundary, and then offer the next creation action. The sequence should remain useful with JavaScript delayed and should not depend on an intro animation.

## What is intentionally not copied

No competitor's layout, text, logo, imagery, template, animation, or brand system is used as a Seerati asset. The benchmark informs questions and constraints only. The implementation must be validated by accessibility, LCP, CLS, visual regression, and guest privacy gates.
