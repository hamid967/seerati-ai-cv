# Current Architecture

The application uses TanStack Start routes with shared React components and library modules. `src/lib/store.tsx` separates authenticated Supabase data from anonymous in-memory state. `src/lib/guest-store.ts` contains the anonymous session policy, consent-gated session recovery helpers, and inactivity timeout constants. AI requests remain behind server-side abstractions, while resume rendering and ATS rules run in the application layer.
