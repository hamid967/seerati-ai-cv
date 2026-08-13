# Guest Access Audit

## Baseline observed on `origin/main`

The project already supported local guest resumes, guest Noura, guest cover letters, guest job matching, guest editor/preview, and local PDF/print. The audit found three direct blockers in the core visitor journey: the public start CTA did not enter Noura, `/resumes/new` redirected a successfully created guest resume to signup, and `/import` required an account to approve extracted data because it persisted only to Career Twin.

## Changes in this branch

| Barrier                | Before                                                            | After                                                                               |
| ---------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Primary guest start    | Homepage/header pointed to `/resumes/new` or signup-oriented CTAs | Primary visitor CTA points to `/assistant?agent=noura`                              |
| Manual resume creation | Guest creation redirected to `/auth?mode=signup`                  | Guest creation opens `/resumes/$id/edit` directly                                   |
| Guest session identity | Resume list was local but session metadata was implicit           | `GuestResumeSession` tracks local session metadata in memory                        |
| Import approval        | `useAuthGuard()` and Career Twin persistence required `user.id`   | Guest may approve selected fields into current in-memory resume and open the editor |
| ATS input              | Always analyzed demo data                                         | Uses current guest resume when it exists; demo remains a transparent fallback       |

## Privacy assertions

- Guest session metadata and resumes are memory-only by default.
- No anonymous Supabase user, profile row, resume row, or Career Twin write is created by the new guest paths.
- Import extraction remains browser-local; raw source is not uploaded by this branch.
- Evidence AI remains separately consent-gated through the existing Evidence-Locked gateway.
- Account sign-up remains optional and does not migrate guest resume content automatically.

## Known gaps outside this slice

The following authenticated or future-work paths were not reclassified as guest-complete: `/jobs/$id` account workspace, Career Twin pages, session-to-account migration UI, optional session recovery UI, extended guest export matrix, and mobile bottom navigation. They remain explicit follow-up slices rather than implied functionality.

## Verification commands

```sh
bun run test:guest-first
bun run test:noura-foundation
bun run test:phase20-evidence
bunx tsc --noEmit
bun run lint
bun run build
```
