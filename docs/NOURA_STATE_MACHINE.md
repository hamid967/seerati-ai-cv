# Noura State Machine — Current Wave 1 Contract

**Implementation:** `src/modules/noura/journey.ts`  
**Status:** Merged contract documented and re-verified in Wave 1.  
**Boundary:** This describes the current deterministic journey state, not a complete remote-AI or persistent-career graph implementation.

## Snapshot schema

Each anonymous journey snapshot contains `state`, optional `goal`, bounded `step` (0–4), optional `questionFamily`, `hasConsent`, and `lastEvent`. It is parsed by Zod and starts at `{ state: "idle", step: 0, hasConsent: false }`.

The snapshot is UI-state metadata, not a guest resume persistence mechanism. It must remain in memory by default and cannot be used to transfer a guest draft to an account automatically.

## Goal mapping

| Goal             | Next question family    | Arabic prompt intent                 |
| ---------------- | ----------------------- | ------------------------------------ |
| `create_resume`  | `persona_and_role`      | المستوى الحالي والوظيفة المستهدفة    |
| `improve_resume` | `resume_source`         | مصدر السيرة المراد تحسينها           |
| `target_job`     | `job_description`       | وصف الوظيفة وحدود التحليل            |
| `import_resume`  | `file_review`           | مراجعة الملف قبل الإضافة إلى المسودة |
| `check_ats`      | `ats_context`           | السيرة والوظيفة قبل الفحص الإرشادي   |
| `cover_letter`   | `evidence_confirmation` | الأدلة المستخدمة في خطاب التقديم     |
| `review_resume`  | `priority_actions`      | أهم ثلاث خطوات مفيدة الآن            |

## Deterministic transitions

| Event                | Guard / input            | State update                                                     | External side effect                                        |
| -------------------- | ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `choose_goal`        | Valid Noura goal         | `asking`, goal set, step `1`, question family set                | None in state machine                                       |
| `next`               | Any non-deleted snapshot | Increment step, `completed` only at upper bound                  | None                                                        |
| `back`               | Any non-deleted snapshot | Decrement step; `idle` at the first step                         | None                                                        |
| `local_review`       | Any non-deleted snapshot | `local_analysis`                                                 | Local UI only                                               |
| `request_ai`         | Consent required         | `consent_required` without consent; `ai_processing` with consent | No provider call in state machine                           |
| `consent_granted`    | Explicit event           | `ai_processing`, `hasConsent: true`                              | Provider invocation is a separate, future boundary          |
| `suggestion_ready`   | Valid event              | `awaiting_approval`                                              | None                                                        |
| `approve_suggestion` | Explicit event           | `completed`                                                      | Applying a content diff remains outside this contract       |
| `reject_suggestion`  | Explicit event           | `local_analysis`                                                 | None                                                        |
| `offline`            | Any non-deleted snapshot | `offline`                                                        | No automatic retry/send                                     |
| `retry`              | Any non-deleted snapshot | `asking` if goal exists; otherwise `idle`                        | None                                                        |
| `session_expiring`   | Any non-deleted snapshot | `session_expiring`                                               | UI disclosure only                                          |
| `delete_data`        | Always allowed           | `data_deleted`, clears goal/question/consent, resets step        | Route-level privacy runtime deletion is separately verified |
| `reset`              | Always allowed           | Initial snapshot                                                 | None                                                        |

## Safety invariants

1. `data_deleted` is terminal for all events except `reset` because subsequent transitions return the same snapshot.
2. A remote-AI intent cannot reach `ai_processing` from `request_ai` without `hasConsent`.
3. `choose_goal` directly moves to step 1; a test must assert the next question, not expect an enabled step-0 Next button.
4. The state machine has no network, storage, user-content, logging, or provider side effects.
5. The current `approve_suggestion` transition records a user-approved journey state; Wave 3 must provide the actual evidence-locked diff application and undo implementation before treating this as a content-edit guarantee.

## Verification

`bun run test:phase20-journey` verifies initial state, goal routing, Arabic/English prompts, consent gating, approval sequencing, offline/retry, session expiry, deletion, and terminal deletion behavior. Browser hardening separately verifies the user-facing goal-first route and synthetic guest privacy boundary.

## Planned delta

The Supreme Execution Program’s required wider state list—profile classification, achievement evidence, section review, template recommendation, ATS review, export ready, structured error, accessibility announcements, undoability, and route-level deletion side effects—remains Wave 2+ work. It must not be represented as already implemented by this document.
