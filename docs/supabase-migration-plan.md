## Supabase Migration Master Plan

### Goals
- Replace Firebase backend (Auth, Firestore, Storage, Cloud Functions) with Supabase services.
- Restructure backend code into a maintainable, Supabase-first architecture with clear separation of concerns.
- Align the Next.js frontend with the new backend structure (data access, auth flow, state management).
- Introduce Model Context Protocol (MCP) tooling so local workflows and Cursor agents can interact with Supabase securely.
- Deliver the transition incrementally with verifiable checkpoints, minimizing downtime.

### Current Snapshot
- **Frontend:** Next.js app in `src/app` with nested routes for admin and caregiver experiences; relies on context providers and Firebase SDK for auth/data.
- **Backend:** Firebase Cloud Functions in `functions/` handling admin workflows (clock-in/out, change password, etc.).
- **Data:** Firestore collections (patients, caregivers, schedules, requests) with Realtime updates.
- **Services:** Firebase Authentication, Storage, Functions; likely Realtime database usage via Firestore.
- **Tooling:** No explicit backend folder; Firebase config in `serviceAccountKey.json`; no MCP integration yet.

### Target Architecture Overview
- **Backend**
  - Supabase project using Postgres for structured tables, Row Level Security (RLS), and Supabase Auth.
  - Supabase Edge Functions (Deno) for light serverless hooks, plus optional standalone Node service for long-running tasks.
  - Centralized domain logic in `server/` directory with clear modules for auth, scheduling, messaging, analytics.
  - Automated schema management via Prisma or Supabase migrations (SQL).
- **Frontend**
  - Next.js app reorganized to consume Supabase client/server helpers.
  - Shared data-access layer (`src/lib/supabase/`) encapsulating queries and caching (React Query or Supabase hooks).
  - Updated contexts leveraging Supabase Session + RLS policies instead of Firebase contexts.
  - UI remains but rewired to new hooks/actions.
- **Tooling & DevOps**
  - `.env.local` populated with Supabase keys; secret management via `. env.example`.
  - MCP server configured to expose Supabase queries and migrations inside Cursor.
  - CI pipeline updated for Supabase migration + lint/test.

### Migration Phases & Checkpoints

#### Phase 0 — Preparation
- Audit Firebase collections, documents, indexes; export sample data.
- Inventory Cloud Functions responsibilities, map to future Supabase functions or server modules.
- Define Supabase schema draft: tables, relations, enums, RLS policies.
- Create Supabase project (if absent) and gather keys (anon, service role).
- Decide on ORM tooling (Prisma with Supabase adapter vs direct SQL migrations).
- Deliverable: `docs/data-model.md` summarizing schema & mapping from Firestore.

#### Phase 1 — Backend Foundation
- Initialize `server/` directory with Node/TypeScript project (e.g., `pnpm` workspace).
- Configure Supabase client (service role) and connection pooling (pg-bouncer or Supabase pooler).
- Implement core domain modules:
  - `auth` (user provisioning, role assignment).
  - `caregivers`, `patients`, `schedules`, `requests`, `reports`.
- Set up Supabase migrations (SQL or Prisma) with seed scripts.
- Mirror existing Firebase functions into Supabase function calls or server routes.
- Write integration tests hitting Supabase test schema.
- Deliverables: Running backend service, migrations applied, tests passing.

#### Phase 2 — Supabase Edge Functions (Optional)
- Recreate short-lifecycle workflows (clock-in/out) as Supabase Edge Functions.
- Configure API routes or server actions to call Edge Functions securely.
- Add monitoring via Supabase logs or external observability (Logflare, Sentry).

#### Phase 3 — Frontend Refactor
- Introduce `src/lib/supabase/client.ts` and server helpers.
- Replace Firebase Auth with Supabase Auth across contexts.
- Swap Firestore hooks with Supabase data fetching (React Query/SWR).
- Update messaging, scheduling, AI planner pages to consume new endpoints.
- Adjust environment variables and config to load Supabase keys.
- Ensure optimistic UI + caching where appropriate.
- Deliverables: Feature parity in staging environment using Supabase backend.

#### Phase 4 — Data Migration & Cutover
- Write migration scripts to move Firestore data into Supabase tables.
- Verify data integrity (counts, sample validations).
- Run parallel smoke tests on staging; validate auth flows and RLS policies.
- Plan downtime or dual-write window; execute final migration.
- Update production environment variables and re-deploy.
- Post-cutover monitoring and rollback plan documented.

#### Phase 5 — MCP Integration
- Stand up MCP server (Node or Deno) exposing CLI entrypoints:
  - Supabase SQL runner (e.g., `supabase migration status`, `db push`).
  - Domain-specific commands (seed data, run testers).
- Configure Cursor MCP client with server endpoint + auth.
- Document workflows in `docs/mcp-setup.md`.

#### Phase 6 — Cleanup & Enhancements
- Retire Firebase configs; remove unused packages/files.
- Update README and developer onboarding docs.
- Review security posture (Supabase RLS, secrets rotation).
- Plan incremental improvements (analytics, background jobs, AI integrations).

### Implementation Roadmap (High-Level)
1. **Week 1:** Phase 0 + Supabase project creation.
2. **Week 2:** Backend foundation (Phase 1) with core schema + domain services.
3. **Week 3:** Edge functions (if needed) and start frontend refactor.
4. **Week 4:** Complete frontend refactor, begin data migration scripts.
5. **Week 5:** Execute migration + production cutover.
6. **Week 6:** MCP integration, documentation, cleanup.

Timeline is adjustable based on team capacity; each phase has review checkpoints before moving forward.

### Dependencies & Risks
- **Data modeling complexity:** Firestore’s unstructured data may require normalization; allocate time for mapping.
- **Auth transition:** Supabase Auth may not support all custom Firebase flows; verify passwordless / custom tokens.
- **Realtime features:** Supabase Realtime channels differ from Firestore listeners; ensure UI matches expectations.
- **MCP security:** Avoid leaking service role keys; use environment-based configuration and limited capabilities.
- **Team onboarding:** Update developers on new workflows (Supabase CLI, migrations, MCP usage).

### Next Steps (for Implementation)
- Confirm Supabase account/project readiness.
- Approve schema approach (Prisma vs SQL migrations).
- Schedule Phase 0 working session to audit current data + functions.
- Begin creating supporting documentation for each phase.


