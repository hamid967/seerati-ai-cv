# Seerati Intelligence Architecture

## Principle

Seerati intelligence is a set of small, reviewable engines rather than a chatbot or a single orchestration object. Local rules decide what can be decided safely. Session context describes the current journey without creating a permanent profile. Saudi career intelligence provides optional vocabulary and sector context. Generative AI is consent-gated and evidence-locked. Evaluation measures safety and usefulness without collecting user documents.

```text
UI surfaces
  -> typed intelligence contracts
     -> local rules / session context / taxonomy
        -> optional Evidence-Locked AI provider
           -> approval + diff + undo
```

## Layer boundaries

| Layer                     | Allowed data                                            | Network                 | Guest behavior         |
| ------------------------- | ------------------------------------------------------- | ----------------------- | ---------------------- |
| Local Rules               | current in-memory resume and user-entered job text      | none                    | always available       |
| Session Context           | route, current intent, progress, temporary preferences  | none                    | memory-only            |
| Saudi Career Intelligence | static versioned taxonomy and user-selected sector/city | none                    | static data only       |
| Generative AI             | explicit allowlisted facts after consent                | optional provider       | disabled until consent |
| Learning/Evaluation       | synthetic fixtures and redacted metrics                 | CI/local only initially | no user content        |

## First-wave modules

`src/modules/intelligence/contracts.ts` owns Zod contracts. `intent-router.ts`, `next-best-action.ts`, `adaptive-onboarding.ts`, `resume-health.ts`, and `privacy-preview.ts` are deterministic consumers. The engines return explanations and fallbacks, not side effects. UI components decide whether to render or navigate. Persistence remains outside these modules.

## Failure behavior

If AI is unavailable, local Resume Health, ATS, Job Match, template rules, editing, and export remain usable. If network access fails, guest editing remains in memory. If PDF generation fails, the existing print fallback remains available. No failure path logs CV text, prompts, responses, identifiers, or authorization headers.

## Non-goals

The architecture does not infer nationality, city, protected characteristics, employability, or hiring outcomes. It does not silently change templates or resume content. It does not create long-term guest memory, fingerprint users, or train on their documents.
