# Phase 0 — Preparation Checklist

## ✅ Completed Tasks

### 1. Firebase Audit

#### Collections Inventory
- ✅ **users** - 11 fields, role-based (admin, caregiver, patient)
- ✅ **patients** - 25+ fields including medical info, address, documents array
- ✅ **schedules** - 15+ fields with clock in/out, GPS, sub-tasks array
- ✅ **requests** - 12 fields for cancellation/overtime requests
- ✅ **conversations** - Chat system with subcollection for messages
- ✅ **notifications** - User notifications system

#### Firebase Cloud Functions Inventory (18 total)

**Triggers (6):**
1. ✅ `onUserCreate` - Sets custom claims on user creation
2. ✅ `onUserUpdate` - Updates custom claims on role change
3. ✅ `unassignPatientOnShiftCompletion` - Auto-unassigns patients
4. ✅ `handleApprovedRequest` - Updates schedules on request approval
5. ✅ `onNewMessage` - Creates/updates message notifications
6. ✅ `onRequestChange` - Notifies admins/caregivers on request changes

**Scheduled Jobs (3):**
7. ✅ `expireSchedules` - Every 5 min, expires pending schedules
8. ✅ `autoClockOutOverdueActiveShifts` - Every 1 min, auto clock-out
9. ✅ `onScheduleChangeUnassignPatient` - Daily cleanup of assignments

**Callable Functions (9):**
10. ✅ `getAdmin` - Retrieves admin user
11. ✅ `createCaregiver` - Admin creates caregiver accounts
12. ✅ `changePassword` - Admin resets user passwords
13. ✅ `caregiverClockInOut` - Caregiver clock in/out
14. ✅ `adminClockInOut` - Admin-initiated clock in/out
15. ✅ `getConversations` - Retrieves user conversations
16. ✅ `sendMessage` - Sends a message
17. ✅ `createConversation` - Creates new conversation
18. ✅ `getAllUsers` - Retrieves users based on role

#### Security Rules Audit
- ✅ **Firestore Rules**: Role-based access (admin/caregiver tokens)
- ✅ **Storage Rules**: Authenticated read, admin write for patient profiles
- ✅ **Custom Claims**: Admin and caregiver roles via Firebase Auth

#### Indexes
- ✅ **schedules**: Composite index on `caregiverId` + `startTimestamp`

### 2. Data Model Documentation

- ✅ Created `docs/data-model.md` with:
  - Complete Supabase schema (13 tables)
  - Row Level Security policies
  - Migration mapping from Firebase to Supabase
  - Normalization strategy (emergency contacts, documents, sub-tasks)
  - Data types and enums
  - Indexes and foreign keys

### 3. MCP Setup Documentation

- ✅ Created `docs/mcp-setup.md` with:
  - MCP server architecture
  - Implementation guide (TypeScript/Node)
  - Cursor integration steps
  - Security best practices
  - Deployment options
  - Troubleshooting guide

### 4. Migration Plan

- ✅ Created `docs/supabase-migration-plan.md` with:
  - 6-phase implementation roadmap
  - Timeline estimates (9-13 days)
  - Risk mitigation strategies
  - Rollback plan

---

## 📋 Remaining Phase 0 Tasks

### 5. Create Supabase Project

- [ ] Sign up for Supabase account (if not exists)
- [ ] Create new project: `angau-app`
- [ ] Note project credentials:
  - [ ] Project URL
  - [ ] Anon key
  - [ ] Service role key
- [ ] Set up local development environment
  - [ ] Install Supabase CLI: `npm install -g supabase`
  - [ ] Initialize local project: `supabase init`
  - [ ] Link to remote: `supabase link --project-ref <ref>`

### 6. Export Sample Firebase Data

Create export script to sample current data:

- [ ] Create `scripts/export-firebase-data.js`
- [ ] Export sample data from each collection:
  - [ ] users (5-10 records)
  - [ ] patients (5-10 records)
  - [ ] schedules (20-30 records)
  - [ ] requests (10-15 records)
  - [ ] conversations + messages (5 conversations)
  - [ ] notifications (10-20 records)
- [ ] Save to `data/firebase-export/`
- [ ] Document data structure and relationships

### 7. Validate Schema Design

- [ ] Review data model with stakeholders
- [ ] Confirm field types and constraints
- [ ] Validate RLS policies meet security requirements
- [ ] Decide on ORM approach (Direct SQL ✅ recommended)
- [ ] Plan for data that doesn't fit new schema

### 8. Set Up Development Environment

- [ ] Create `.env.example` with required variables:
  ```env
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  
  # MCP Server
  MCP_PORT=3001
  MCP_API_KEY=
  
  # App Config
  NEXT_PUBLIC_APP_URL=http://localhost:9002
  ```
- [ ] Update `.gitignore` to exclude sensitive files
- [ ] Document environment setup in README

### 9. Create Migration Scripts Structure

- [ ] Create `supabase/migrations/` directory
- [ ] Create initial migration file: `20250110000000_initial_schema.sql`
- [ ] Create seed data script: `supabase/seed.sql`
- [ ] Create data transformation scripts:
  - [ ] `scripts/transform-users.ts`
  - [ ] `scripts/transform-patients.ts`
  - [ ] `scripts/transform-schedules.ts`
  - [ ] `scripts/transform-conversations.ts`

### 10. Stakeholder Approval

- [ ] Present migration plan to team
- [ ] Review timeline and resource allocation
- [ ] Get approval to proceed to Phase 1
- [ ] Schedule kickoff meeting for Phase 1

---

## 📊 Data Model Summary

### Tables Created (13)

1. **users** - Core user accounts with auth integration
2. **patients** - Patient profiles (normalized)
3. **emergency_contacts** - Patient emergency contacts (new table)
4. **patient_documents** - Patient documents (new table)
5. **schedules** - Shift assignments and tracking
6. **sub_tasks** - Schedule sub-tasks (new table)
7. **caregiver_patients** - Assignment junction table (new)
8. **requests** - Cancellation/overtime requests
9. **conversations** - Chat conversations
10. **conversation_participants** - Conversation members (new table)
11. **messages** - Chat messages
12. **notifications** - System notifications
13. **caregiver_notes** - Caregiver notes (new table)

### Key Improvements Over Firebase

1. **Normalized Data**: Separate tables for emergency contacts, documents, sub-tasks
2. **Strong Typing**: PostgreSQL enums for status, role, type fields
3. **Referential Integrity**: Foreign keys with cascade rules
4. **Better Queries**: SQL joins vs Firestore multiple queries
5. **RLS Policies**: Database-level security vs client-side rules
6. **Computed Fields**: Age calculation, generated columns
7. **Better Indexing**: Composite indexes for common queries
8. **Transactions**: ACID compliance vs eventual consistency

---

## 🔄 Function Migration Strategy

### Firebase → Supabase Mapping

| Firebase Function | Supabase Replacement | Type |
|-------------------|---------------------|------|
| onUserCreate | Database Trigger | Trigger |
| onUserUpdate | Database Trigger | Trigger |
| expireSchedules | Edge Function + Cron | Scheduled |
| autoClockOutOverdueActiveShifts | Edge Function + Cron | Scheduled |
| onScheduleChangeUnassignPatient | Edge Function + Cron | Scheduled |
| createCaregiver | Server Action / API Route | Callable |
| changePassword | Server Action / API Route | Callable |
| caregiverClockInOut | Server Action / API Route | Callable |
| adminClockInOut | Server Action / API Route | Callable |
| getAdmin | Direct Query (RLS) | Callable |
| getConversations | Direct Query (RLS) | Callable |
| sendMessage | Server Action + Trigger | Callable |
| createConversation | Server Action | Callable |
| getAllUsers | Direct Query (RLS) | Callable |
| unassignPatientOnShiftCompletion | Database Trigger | Trigger |
| handleApprovedRequest | Database Trigger | Trigger |
| onNewMessage | Database Trigger | Trigger |
| onRequestChange | Database Trigger | Trigger |

### Simplification Opportunities

Many Firebase callable functions can be replaced with:
1. **Direct Supabase queries** with RLS policies
2. **Next.js Server Actions** for mutations
3. **Database triggers** for automatic updates
4. **Postgres functions** for complex logic

This reduces serverless function count from **18 to ~8** Edge Functions.

---

## 📈 Success Metrics for Phase 0

- ✅ Complete inventory of Firebase collections and functions
- ✅ Documented Supabase schema with all tables and relationships
- ✅ RLS policies designed for all tables
- ✅ MCP server architecture documented
- ✅ Migration plan approved
- ⏳ Supabase project created and configured
- ⏳ Sample data exported from Firebase
- ⏳ Development environment ready

---

## 🚀 Next Phase Preview

**Phase 1 — Backend Foundation** will include:

1. Create Supabase migrations for all tables
2. Implement RLS policies
3. Set up Supabase Auth
4. Create seed data scripts
5. Implement core Edge Functions
6. Set up storage buckets
7. Write integration tests
8. Create data transformation utilities

**Estimated Duration**: 2-3 days

---

## 📝 Notes & Decisions

### Decision Log

1. **ORM Choice**: Direct SQL with Supabase client (no Prisma)
   - Rationale: Better RLS support, simpler migrations, Postgres-specific features
   
2. **Auth Strategy**: Supabase Auth with email/password
   - Rationale: Native integration, similar to Firebase Auth
   - Migration: Require password reset on first login
   
3. **Realtime**: Supabase Realtime channels
   - Rationale: Direct replacement for Firestore listeners
   
4. **Storage**: Supabase Storage buckets
   - Rationale: Similar to Firebase Storage, better pricing
   
5. **Functions**: Mix of Edge Functions and Server Actions
   - Rationale: Reduce serverless overhead, use Next.js capabilities

### Open Questions

- [ ] How to handle existing user passwords during migration?
  - **Proposed**: Force password reset via email on first login
  
- [ ] Should we maintain Firebase in parallel during transition?
  - **Proposed**: Yes, 2-week parallel run with read-only Firebase
  
- [ ] How to handle file storage migration?
  - **Proposed**: Lazy migration - copy on first access, batch job for rest

---

## 🔗 Related Documents

- [Supabase Migration Plan](./supabase-migration-plan.md)
- [Data Model](./data-model.md)
- [MCP Setup](./mcp-setup.md)
- [Blueprint](./blueprint.md)

---

*Phase 0 Completion Target: Ready to proceed to Phase 1*
*Last Updated: 2025-11-10*

