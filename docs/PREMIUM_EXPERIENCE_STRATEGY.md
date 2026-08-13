# Seerati Premium Experience Strategy

**Direction:** Saudi Future Professional  
**Date:** 2026-08-13

## Product promise

Seerati should feel like a calm professional studio for creating a credible CV, not a template marketplace or an entertainment site. The first viewport must explain that a visitor can create a CV in Arabic or English, use optional AI assistance, receive transparent ATS guidance, print for free, and start without registration while keeping guest content memory-only by default.

## Experience principles

The visual hierarchy begins with one clear promise, a lightweight resume preview, and three actions: start, import, and browse templates. Secondary sections reveal the workflow in a deliberate sequence: information entry, AI suggestion, accept/reject, preview update, ATS explanation, and PDF export. Every interactive demonstration must use deterministic synthetic content and must not imply that AI invented facts.

Privacy is part of the product surface. A compact but visible indicator should state where guest data exists, what happens when AI is invoked, when the session expires, and how the visitor can delete it immediately. Registration remains optional and must never be a prerequisite for basic matching, drafting, creation, or printing.

## Visual system

The palette uses Midnight Navy as the grounding surface, Deep Saudi Emerald as a restrained action accent, Pearl White and Warm Sand as editorial surfaces, Stone Gray for supporting content, Sky Intelligence Blue for information states, Amber for review attention, and Functional Red only for errors or destructive actions. Light and Dark modes share semantic roles rather than hard-coded component colors.

The experience uses space, editorial typography, thin geometric separators, abstract city patterns, and resume pages as the primary visual language. It avoids government marks, landmark photography, desert clichés, heavy shadows, neon, excessive glass, game-like effects, and dense decoration.

## Motion and interaction

Motion is limited to short fade/slide/mask-reveal transitions, restrained SVG line drawing, small-scale feedback, and desktop-only parallax where it does not affect comprehension. There is no scroll hijacking, autoplay-heavy storytelling, background video, custom cursor, sound, or WebGL dependency in the critical path. Every carousel supports keyboard and touch controls, visible pagination, pause on hover/focus, an explicit pause control, RTL, and reduced motion.

## Performance contract

No design feature is accepted if it harms LCP, CLS, or input responsiveness. Intro JavaScript must remain at or below 35 KB, intro assets at or below 150 KB, initial JavaScript growth at or below 35 KB, LCP regression at or below 100 ms, and CLS at or below 0.1. Homepage Performance must reach 90, Templates 85 initially and then 90, Assistant 85, Accessibility 95, Best Practices 95, and public-page SEO 95 before those targets are made release-blocking.

## Rollout

The safe rollout is incremental: semantic tokens and shared components first, then one homepage slice, then one accessible slider, then template preview improvements, then optional intro. Each slice has its own PR, screenshots, mobile and RTL/LTR evidence, performance measurements, privacy checks, and rollback commit. The 24-template catalog is accepted only when each template has original authorship, bilingual RTL/LTR rendering, A4/Print/PDF safety, selectable text, and a license entry.
