# Noura Experience Architecture

## Product boundary

Noura is a professional agent surface, not a standalone chatbot. The route coordinates existing Seerati engines and lets the user move between guided questions, direct editing, live preview, templates, ATS, import, and export.

## Layers

```text
URL ?agent=noura
        |
        v
Agent Registry -------------------- validated identity, role, policy, fallback
        |
        v
Noura Route Surface --------------- goal-first shell, progress, preview, tools
        |
        +--> Local Intent / Next Action / Resume Health / Section Coach
        |
        +--> Session State ------------ memory-only, expiring, deletable
        |
        +--> CareerProfileGraph -------- evidence and provenance boundary
        |
        +--> AI Service ---------------- explicit consent + reviewable output
        |
        +--> Existing Store ------------ guest memory or authenticated persistence
```

## Noura states

The initial surface exposes a small set of user-visible states: ready, asking, locally reviewing, consent required, suggestion ready, awaiting approval, offline, error, session expiring, and data deleted. The route must say “أراجع القسم محلياً” for deterministic checks and must not imply that local analysis is an AI call.

## Adaptive journey

The journey starts with one goal. The selected goal determines the next question family. A create-resume goal asks for persona and target role; improve-resume offers import, paste, or current-session content; job-targeting requests a job description and previews the analysis boundary; ATS and cover-letter goals deep-link to the existing tools when that is the most direct action.

## Privacy and approvals

The route shows a compact privacy status. Opening it explains data location, expiry, deletion, optional recovery, and the AI boundary. A remote suggestion must show the proposed payload, excluded fields, provider, reason, and explicit consent. Every generated change is shown as a diff and requires user approval; Noura never applies a suggestion silently.

## Preview contract

The preview is derived from the current draft. Empty data must not be represented as a real user's country, city, nationality, or employment history. When no meaningful content exists, the surface may show a labelled synthetic illustration or skeleton, clearly marked as an example and never written to the guest draft.

## Performance and accessibility

The initial route keeps import, PDF, ATS-heavy modules, and full capability catalog deferred. Noura identity must not become the LCP element. Interactive controls require visible focus, labels, `aria-live` only for meaningful state changes, keyboard operation, RTL/LTR correctness, and reduced-motion behavior.
