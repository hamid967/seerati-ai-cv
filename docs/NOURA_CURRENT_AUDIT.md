# Noura Current Audit

## Scope

This audit covers the current `/assistant?agent=noura` route at the Phase 19 baseline. It is a code audit, not a claim that browser, PDF, or Lighthouse gates have passed.

## Findings

| Area                | Current state                                                                                                                     | Risk                                                                   | Planned response                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Agent routing       | `?agent=` is validated through `agentById`; unknown IDs fall back to the first assistant agent. Noura is already registered.      | The route still presents generic Seerati Assistant copy.               | Surface Noura's name, role, policy, and state explicitly.                                             |
| Opening journey     | The first step asks for professional stage, sector, and creation mode together.                                                   | High cognitive load before the user's goal is known.                   | Start with one goal question and reveal context progressively.                                        |
| Privacy copy        | The store path is memory-only by default, but route copy says the resume stays in the browser and moves to the account at signup. | Contradictory disclosure and implied migration.                        | Replace with a precise session-only disclosure and optional-account wording.                          |
| Preview             | `buildAssistantData` supplies a default Saudi country and the preview omits most empty sections.                                  | The initial preview can look sparse and imply user facts not provided. | Remove default country; add a clearly labelled illustrative preview state in the Noura surface.       |
| Capability hub      | The capability hub is present near the beginning of the journey.                                                                  | It competes with the first task.                                       | Keep capabilities available through contextual tools, but defer the large hub surface.                |
| AI boundary         | Existing assistant drafting uses `aiService`; Phase 19 adds privacy and evidence contracts elsewhere.                             | The route needs visible local/AI state and approval language.          | Make the local-first boundary visible and retain existing drafting as an explicit action.             |
| Direct manipulation | Existing assistant route supports editing text fields and template selection, while the full editor supports richer manipulation. | Noura should not become a chat-only surface.                           | Preserve the current form and preview paths; add contextual guidance without removing direct editing. |

## Privacy truth

Guest resume content is memory-only by default. The anonymous runtime has a 20-minute inactivity expiry and separately models optional consented recovery. No route copy may claim that a guest resume is automatically moved into an account. Account persistence requires the existing authenticated store flow and explicit user action.

## Baseline limitations

The following remain separate gates: Network Privacy browser inspection, browser matrix, Arabic/English PDF regression, accessibility automation, Lighthouse calibration, and the full 300-case Noura quality corpus. This audit records the starting point for the implementation branch.
