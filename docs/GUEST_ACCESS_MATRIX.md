# Guest Access Matrix

This matrix describes the implemented access boundary for the Guest-First routing and local-session slice. It does not claim cloud persistence, account migration, or administrative access for anonymous visitors.

| Capability                     | Guest                                   | Signed-in account                   | Administrator                     | Guest data boundary                                          |
| ------------------------------ | --------------------------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| Start from homepage            | Direct to `/assistant?agent=noura`      | Direct to Noura                     | Direct to Noura                   | No resume content in URL                                     |
| Noura journey                  | Available                               | Available                           | Available                         | Memory-only resume until explicit account action             |
| Create a resume                | Available                               | Available                           | Available                         | `guest-*` resume in memory; no `resumes` row                 |
| Edit / preview / templates     | Available for current guest resume      | Available                           | Available                         | Store mutation stays local for guest IDs                     |
| Basic Evidence AI              | Available after explicit consent        | Available after consent             | Available after consent           | Evidence-Locked projection; explicit preview/approval        |
| Import review                  | Available                               | Available                           | Available                         | File extraction and review remain local                      |
| Import selected data           | Creates or updates current guest resume | Saves to Career Twin                | Saves under governed account data | No Career Twin write for guest                               |
| ATS                            | Uses current guest resume when present  | Uses current resume/demo surface    | Available                         | Local advisory analysis; no ATS row for guest                |
| Jobs index / match             | Available                               | Available                           | Available                         | Existing guest matcher is local                              |
| Cover letter index             | Available                               | Available                           | Available                         | Existing guest letter is local                               |
| PDF / print                    | Available from guest editor             | Available                           | Available                         | Browser/client export; no default server PDF storage         |
| Account / sync / saved resumes | Not available by default                | Available                           | Available                         | Requires authenticated Supabase session and RLS              |
| Admin routes                   | Not available                           | Not available unless role grants it | Available                         | Authenticated RBAC and RLS remain required                   |
| Delete session                 | Available                               | Not applicable to cloud data        | Not applicable                    | Clears in-memory guest resume/session and consented recovery |

## Route-guard policy

| Route class        | Intended use                                                     | Example                                                 |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------- |
| PublicGuestRoute   | Public marketing or standalone tools                             | `/`, `/templates`, `/ats`                               |
| GuestSessionRoute  | Requires a current local resume, not an account                  | Guest editor, preview, ATS using a current guest resume |
| OptionalAuthRoute  | Works for everyone; unlocks cloud persistence when authenticated | `/assistant`, `/import`, `/jobs`, `/cover-letters`      |
| AuthenticatedRoute | Cloud data, sync, account and dashboard actions                  | `/dashboard`, `/account`, saved Career Twin workspaces  |
| AdminRoute         | Role-governed administrative actions                             | `/admin/*`                                              |

## Explicit exclusions in this slice

Guest-to-account migration, persisted job workspaces, cloud Career Twin data, account preferences, admin tooling, and multi-device sync remain authenticated-only. They are deliberately not implicitly enabled by creating a guest resume.
