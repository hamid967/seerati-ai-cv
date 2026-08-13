# Local, CI, and Production Runtime Matrix

**Status:** Wave 1 runtime contract proposal.  
**Authoritative project runtime:** Node 24 with Bun 1.3.14.

| Surface                     |                           Node |                 Bun | Install command                 | Build command   | Status / rationale                                                                      |
| --------------------------- | -----------------------------: | ------------------: | ------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| Supported local development |                           24.x |              1.3.14 | `bun install --frozen-lockfile` | `bun run build` | Required baseline for reproducibility.                                                  |
| GitHub CI quality           |                           24.x |              1.3.14 | `bun install --frozen-lockfile` | `bun run build` | Explicitly pinned in this Wave.                                                         |
| Release Hardening           |                           24.x |              1.3.14 | `bun install --frozen-lockfile` | `bun run build` | Browser, privacy, PDF/print and Lighthouse workflows use the same contract.             |
| Node 22.23 contingency      |                         22.23+ |              1.3.14 | Same                            | Same            | Passed the local matrix but is not the primary supported version.                       |
| Node 22.13 sandbox baseline |                        22.13.0 |              1.3.14 | Same                            | Fails           | Known `ERR_REQUIRE_CYCLE_MODULE`; do not use as a release validation runtime.           |
| Node 18                     |                           18.x |   Any supported Bun | Same                            | Fails           | Unsupported by the Vite/Rolldown dependency graph due to missing `node:util.styleText`. |
| Production hosting runtime  | Verify with host before change | Build artifact only | Hosting-owned                   | Hosting-owned   | Not changed by this Wave; no deployment action is authorized here.                      |

## Required commands

```bash
nvm use
bun --version
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit
bun run build
bun run qa
bun run test:noura-foundation
bun run test:phase20-journey
```

Route QA requires a running server as described in `AGENTS.md`. Browser and PDF/print checks use the existing Release Hardening workflow and synthetic fixtures only.

## Failure triage

| Symptom                                                             | Likely class                                       | First action                                                |
| ------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| `styleText` missing from `node:util`                                | Node 18 incompatibility                            | Switch to Node 24; do not patch dependency imports.         |
| `ERR_REQUIRE_CYCLE_MODULE` from `@lovable.dev/vite-tanstack-config` | Node 22.13 loader behavior                         | Confirm Node version; use Node 24.                          |
| Prettier passes CI but lint fails locally                           | Formatter-version drift                            | Confirm local project Prettier matches CI’s pinned version. |
| Browser succeeds but route QA fails                                 | Missing dev-server base URL or server availability | Start the documented dev server and set `QA_BASE_URL`.      |

## Security and rollback

The matrix contains no credentials. CI continues to use synthetic Supabase environment values. Reverting the Wave 1 commit reverts the declared versions; it does not alter deployment infrastructure or user data.
