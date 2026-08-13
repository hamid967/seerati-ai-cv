# Supreme Execution Program — Wave 1 Change Manifest

**Task ID:** `SEP-W1-RUNTIME-FOUNDATION-001`  
**Owner:** Seerati Supreme Program Director  
**Reviewer:** CTO, Privacy Director, QA Director, Release Director  
**Priority:** P1 — runtime consistency and release evidence  
**Base commit:** `c1cb62f615e6cd7481615fc60ba4cbb880dfe940` (`origin/main`)  
**Branch:** `feat/supreme-wave1-runtime-foundation`

## Business objective

Make the Wave 1 development baseline reproducible and truthful: establish a supported Node/Bun contract, remove a local-versus-CI formatting failure caused by version drift, and refresh the Noura Foundation and adaptive-journey evidence without adding remote AI, persistent guest storage, database migrations, or automatic content edits.

## Evidence-led baseline

| Area                  | Observed state                                                                                                                                                                              | Evidence                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Current product state | Phase 20 requirements and the Wave 1 journey state machine are already merged to `main`.                                                                                                    | PR #54 merge `c1cb62f`; PR #55 merge `e873a7`.        |
| Node 18               | Production build fails because Vite/Rolldown imports `node:util.styleText`, which Node 18.20.8 does not export.                                                                             | Reproduced locally on synthetic CI environment.       |
| Node 22.23 / Node 24  | Production build succeeds with Bun 1.3.14.                                                                                                                                                  | Reproduced locally; GitHub Actions used Bun 1.3.14.   |
| Node 22.13            | The existing sandbox runtime reproduces `ERR_REQUIRE_CYCLE_MODULE` in `@lovable.dev/vite-tanstack-config`.                                                                                  | Reproduced locally; it is not a product-code failure. |
| CI formatting         | CI invokes `prettier@3.9.6`, while the project lock resolves an older local Prettier for ESLint integration; four MCP routes therefore fail local `bun run lint` despite CI format success. | Baseline lint reproduced on `c1cb62f`.                |
| Guest privacy         | Current Foundation and Release Hardening artifacts demonstrate memory-only guest boundaries; this Wave does not change guest persistence.                                                   | PR #55 hardening and existing privacy runtime.        |

## In-scope changes

1. Pin the development and CI runtime contract to **Node 24** and **Bun 1.3.14**, with a project-visible Node version file and explicit GitHub Actions configuration.
2. Align the project Prettier dependency with CI’s `3.9.6` formatter so lint and CI use one formatting contract.
3. Add concise execution, responsibility, runtime-decision, runtime-matrix, state-machine, and adaptive-journey documents that distinguish merged facts from planned work.
4. Refresh only the existing Noura Foundation verification metadata where it incorrectly describes merged PRs as unmerged.
5. Run the applicable static, runtime, privacy, Noura journey, browser, PDF/print, and Lighthouse verification gates using synthetic data.

## Explicit exclusions

| Exclusion                                                                                         | Reason                                                                                 |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Remote AI provider, payload transmission, model configuration, or API purchase                    | Wave 2 scope; consent and evidence contracts must be reviewed independently.           |
| Database migrations, RLS changes, or authenticated storage redesign                               | Not required for runtime consistency; requires separate privacy and database approval. |
| Guest `localStorage`, IndexedDB, Cache Storage, analytics content, or automatic account migration | Prohibited by the memory-only guest boundary.                                          |
| DNS, `cv.hrhbs.com`, deployment-domain changes, redirects, and paid services                      | The sole official scope remains `https://hrhbs.com`; owner approval is absent.         |
| New user-facing journey features                                                                  | Wave 1 focuses on durable contracts, reproducibility, and evidence.                    |

## File ownership

| Owner                         | Files / domains                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Platform Reliability Director | `.nvmrc`, `.github/workflows/ci.yml`, `.github/workflows/release-hardening.yml`, `package.json`, `bun.lock`, runtime documents |
| Noura Intelligence Director   | `docs/NOURA_STATE_MACHINE.md`, `docs/NOURA_ADAPTIVE_JOURNEY.md`, current-state evidence                                        |
| Privacy Director              | Guest-boundary verification and privacy-impact review                                                                          |
| QA Director                   | Baseline matrix, browser/privacy/PDF/Lighthouse evidence                                                                       |
| Program Director              | `docs/MASTER_EXECUTION_PLAN.md`, responsibility matrix, PR evidence, Go/No-Go                                                  |

## Acceptance criteria

| ID      | Criterion                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| RT-001  | Node 18 is explicitly unsupported with reproduced cause; Node 24 is the declared project runtime.                              |
| RT-002  | CI jobs use the same pinned Node and Bun versions documented for local use.                                                    |
| RT-003  | `bun run lint`, TypeScript, production build, and `bun run qa` use one Prettier contract and pass.                             |
| NF-001  | Noura still starts goal-first, asks one question, and shows no assumed country, city, nationality, or account migration claim. |
| NF-002  | Guest path remains memory-only; Network Privacy and deletion checks use synthetic markers only.                                |
| JRN-001 | Existing deterministic journey smoke passes; no remote AI or persistent guest state is introduced.                             |
| RL-001  | Chromium, Firefox, WebKit, Arabic/English PDF/print, keyboard, and Lighthouse gates are reported truthfully.                   |

## Test plan

Run frozen install, Prettier check, lint, TypeScript noEmit, build, QA, Noura Foundation, Phase 20 journey, Phase 19 intelligence/evaluation, guest privacy/deletion smoke, Release Hardening browser matrix, and Lighthouse. Any critical privacy, free-path, PDF Arabic, or build failure is release-blocking.

## Privacy, security, accessibility, and performance impact

The planned changes do not add data collection, persistence, network providers, telemetry payloads, or new personal-data surfaces. They tighten reproducibility and reduce misleading test variance. A dependency-formatting update is low-risk but will be validated with build and browser gates. Performance budgets remain measured, not weakened; no threshold is changed in this Wave.

## Rollback

Revert the single Wave 1 commit or PR merge. This restores the previous unpinned runtime/documentation state. No data migration, storage format, user content, remote configuration, or DNS state is changed.
