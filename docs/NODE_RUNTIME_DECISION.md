# Node and Bun Runtime Decision

**Task ID:** `SEP-W1-RUNTIME-FOUNDATION-001`  
**Decision:** Support **Node 24** and **Bun 1.3.14** for local development, CI, and the project build contract. Node 18 is unsupported.

## Evidence

| Environment tested                  | Result                                  | Interpretation                                                                                           |
| ----------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Node 18.20.8 + Bun 1.3.14           | Failed                                  | Vite 8’s Rolldown dependency imports `styleText` from `node:util`; Node 18 does not provide that export. |
| Node 22.13.0 + Bun 1.3.14           | Failed in the pre-existing sandbox PATH | `@lovable.dev/vite-tanstack-config` triggers `ERR_REQUIRE_CYCLE_MODULE` while loading Vite.              |
| Node 22.23.2 + Bun 1.3.14           | Passed                                  | Client, SSR, Nitro, and client-environment build complete.                                               |
| Node 24.19.0 + Bun 1.3.14           | Passed                                  | Client, SSR, Nitro, and client-environment build complete.                                               |
| GitHub Actions prior to this change | Passed                                  | `oven-sh/setup-bun@v2` installed Bun 1.3.14; the GitHub runner is already on Node 24 for actions.        |

The Node 18 failure is a runtime incompatibility with the Vite/Rolldown dependency graph, not a Seerati application-code defect. The Node 22.13 failure is an older Node patch-level and CommonJS/ESM loader interaction; it disappears at Node 22.23 and Node 24. The selected runtime is Node 24 because it is already the hosted CI runner baseline, passes the build, and removes ambiguity between local and CI tooling.

## Implementation decision

The project will declare `engines.node` as `>=24 <25`, create `.nvmrc` with `24`, and make GitHub Actions install Node 24 explicitly before setting up Bun 1.3.14. The workflows will stop using an unbounded `bun-version: latest`. The project lockfile remains authoritative for JavaScript dependencies.

## Production scope

This decision standardizes the **build and CI toolchain**. It does not change the official application domain (`https://hrhbs.com`), DNS, Supabase, database schema, deployment provider, or user-data storage. Production deploy runtime must be confirmed by the hosting provider before a production runtime change; no production configuration is altered in this Wave.

## Rollback

Revert the Wave 1 commit. This restores the previous runtime metadata and CI setup. If a future verified platform restriction prevents Node 24, use Node 22.23 or newer only after repeating the complete build, browser, privacy, PDF/print, and Lighthouse matrix; Node 18 is not an acceptable rollback target.
