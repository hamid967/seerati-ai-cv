# Noura Adaptive Journey — Current Experience and Boundaries

**Route:** `/assistant?agent=noura`  
**Mode:** Goal-first, local-first, privacy-first.  
**Status:** Current Wave 1 behavior re-verified; future capabilities are explicitly marked as proposed.

## User-facing flow

The route introduces Noura by name and professional role, explains that no AI transmission occurs without consent, then asks **one question only**: what the user wants to accomplish. The user selects a single goal. The deterministic journey contract advances immediately to the first relevant question family and displays an Arabic or English reason for the next question.

The goal selector is not a legacy multi-step wizard. It is a routing decision that adapts the next prompt to the user’s stated purpose. Contextual capability tools remain behind the explicit tools action, rather than competing with the first decision.

## Current journey paths

| User goal                  | Immediate adaptive next step           | Local-first expectation                            |
| -------------------------- | -------------------------------------- | -------------------------------------------------- |
| Create a resume            | Ask current level and target role      | Build a draft from user-entered facts              |
| Improve an existing resume | Ask for resume source                  | Review source before suggested changes             |
| Tailor to a job            | Ask for job description                | Perform deterministic local match first            |
| Import a file              | Explain file review                    | Do not accept extracted claims without user review |
| Check ATS                  | Ask for resume and target-role context | Show advisory and explainable output only          |
| Write a cover letter       | Confirm usable evidence                | Draft stays reviewable and user-controlled         |
| Review a resume            | Show priority-action framing           | Focus on the three most useful actions             |

## Privacy boundary

Guest journey state and answers remain memory-only by default. The experience must not create `localStorage`, IndexedDB, Cache Storage, sensitive URL state, Supabase writes, analytics content, or logs containing CV text, prompts, or AI responses. The disclosure near the journey must remain truthful about data location, AI consent, optional account behavior, expiry, and immediate deletion.

Selection of a goal is not consent to transmit the user’s facts. The state machine can surface `consent_required`; a future evidence-AI transport must show the selected data, excluded data, reason, provider, and explicit accept/reject action before it can send anything.

## Current evidence

The merged Phase 20 journey smoke covers deterministic goal routing, consent gating, offline/retry, expiry, deletion snapshot behavior, and two-language question copy. Release Hardening evidence on the merged Wave 1 PR covers Chromium, Firefox, WebKit, keyboard, PDF/print, Network Privacy, and Lighthouse using synthetic data.

## Exclusions and next waves

The current route does not yet claim a complete achievement interview, a persistent CareerProfileGraph, payload preview, remote provider adapter, structured-output validator, content diff/partial accept/undo UI, optional recovery, or a full template/ATS/export journey graph. These remain separately reviewable work, sequenced after facts and question contracts are defined.

No automatic AI edit is permitted in any later implementation. Any future suggestion must preserve user facts, display a reviewable diff, allow accept/reject/edit/partial accept where supported, and provide an undo path before content application.
