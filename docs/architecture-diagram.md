# AnGau App - Architecture Diagrams

## Current Architecture (Firebase)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Admin Pages  │  │Caregiver Pages│  │ Auth Pages   │      │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘      │
│         │                  │                   │              │
│         └──────────────────┼───────────────────┘              │
│                            │                                  │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │           React Contexts (Auth, Chat)                  │  │
│  └─────────────────────────┬──────────────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │         Firebase SDK (client-side)                     │  │
│  └─────────────────────────┬──────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                     Firebase Services                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Firebase Auth│  │  Firestore   │  │   Storage    │       │
│  │              │  │              │  │              │       │
│  │ - Email/Pass │  │ - users      │  │ - Profile    │       │
│  │ - Custom     │  │ - patients   │  │   pictures   │       │
│  │   Claims     │  │ - schedules  │  │ - Documents  │       │
│  │              │  │ - requests   │  │              │       │
│  │              │  │ - messages   │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │         Cloud Functions (18 functions)                │   │
│  │                                                       │   │
│  │  Triggers (6):                                       │   │
│  │  • onUserCreate                                      │   │
│  │  • onUserUpdate                                      │   │
│  │  • unassignPatientOnShiftCompletion                  │   │
│  │  • handleApprovedRequest                             │   │
│  │  • onNewMessage                                      │   │
│  │  • onRequestChange                                   │   │
│  │                                                       │   │
│  │  Scheduled (3):                                      │   │
│  │  • expireSchedules (every 5 min)                     │   │
│  │  • autoClockOutOverdueActiveShifts (every 1 min)     │   │
│  │  • onScheduleChangeUnassignPatient (daily)           │   │
│  │                                                       │   │
│  │  Callable (9):                                       │   │
│  │  • getAdmin, createCaregiver, changePassword         │   │
│  │  • caregiverClockInOut, adminClockInOut              │   │
│  │  • getConversations, sendMessage, createConversation │   │
│  │  • getAllUsers                                       │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## Target Architecture (Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Admin Pages  │  │Caregiver Pages│  │ Auth Pages   │      │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘      │
│         │                  │                   │              │
│         └──────────────────┼───────────────────┘              │
│                            │                                  │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │      React Contexts (Auth, Chat) - UPDATED            │  │
│  └─────────────────────────┬──────────────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │       Supabase Client (client-side)                    │  │
│  │  • Auto-generated types                                │  │
│  │  • RLS enforcement                                     │  │
│  │  • Realtime subscriptions                              │  │
│  └─────────────────────────┬──────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ HTTPS / WebSocket
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    Supabase Platform                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │Supabase Auth │  │  PostgreSQL  │  │   Storage    │       │
│  │              │  │              │  │              │       │
│  │ - Email/Pass │  │ - users      │  │ - Buckets:   │       │
│  │ - Session    │  │ - patients   │  │   • patient- │       │
│  │   Management │  │ - schedules  │  │     profiles │       │
│  │ - JWT tokens │  │ - requests   │  │   • user-    │       │
│  │              │  │ - messages   │  │     profiles │       │
│  │              │  │ + 8 more     │  │   • documents│       │
│  └──────────────┘  └──────┬───────┘  └──────────────┘       │
│                           │                                   │
│                           │ Row Level Security (RLS)          │
│                           │                                   │
│  ┌────────────────────────▼──────────────────────────────┐   │
│  │         Edge Functions (8 functions)                  │   │
│  │                                                       │   │
│  │  Scheduled (3):                                      │   │
│  │  • expire-schedules (cron: */5 * * * *)              │   │
│  │  • auto-clock-out (cron: * * * * *)                  │   │
│  │  • cleanup-assignments (cron: 0 0 * * *)             │   │
│  │                                                       │   │
│  │  Triggers (3):                                       │   │
│  │  • handle-request-approval (on requests update)      │   │
│  │  • handle-new-message (on messages insert)           │   │
│  │  • handle-shift-completion (on schedules update)     │   │
│  │                                                       │   │
│  │  Callable (2):                                       │   │
│  │  • create-caregiver (admin only)                     │   │
│  │  • change-password (admin only)                      │   │
│  │                                                       │   │
│  │  ⚠️ 10 functions replaced by direct queries + RLS    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Realtime Server                          │   │
│  │  • WebSocket connections                              │   │
│  │  • Broadcast changes                                  │   │
│  │  • Presence tracking                                  │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                             │
                             │ MCP Protocol (JSON-RPC)
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                      MCP Server (NEW)                         │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Node.js/TypeScript Server                │   │
│  │                                                       │   │
│  │  Endpoints:                                          │   │
│  │  • POST /query - Execute SQL                         │   │
│  │  • GET /schema/:table - Inspect schema               │   │
│  │  • GET /tables - List tables                         │   │
│  │  • GET /migrations - Migration status                │   │
│  │  • POST /seed - Seed data                            │   │
│  │  • GET /users - Get users                            │   │
│  │  • GET /schedules - Get schedules                    │   │
│  │  • GET /analytics/summary - Analytics                │   │
│  │                                                       │   │
│  │  Features:                                           │   │
│  │  • API key authentication                            │   │
│  │  • Rate limiting                                     │   │
│  │  • Input validation (Zod)                            │   │
│  │  • Real-time subscriptions (Socket.io)               │   │
│  └───────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             │ HTTP
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                      Cursor Editor                            │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                  MCP Client                           │   │
│  │                                                       │   │
│  │  Commands:                                           │   │
│  │  • @mcp query users where role = 'caregiver'         │   │
│  │  • @mcp schema schedules                             │   │
│  │  • @mcp migrations                                   │   │
│  │  • @mcp seed patients with test data                 │   │
│  │                                                       │   │
│  │  Benefits:                                           │   │
│  │  • Query database from editor                        │   │
│  │  • Inspect schema live                               │   │
│  │  • Debug data issues                                 │   │
│  │  • Rapid prototyping                                 │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## Data Flow Comparison

### Before (Firebase): Fetching Schedules with Caregiver Info

```
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 1. getSchedules()
     ▼
┌─────────────┐
│  Firestore  │
└────┬────────┘
     │ 2. Return schedules array
     ▼
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 3. Loop: getCaregiver(id) for each schedule
     ▼
┌─────────────┐
│  Firestore  │
└────┬────────┘
     │ 4. Return caregiver (repeated N times)
     ▼
┌──────────┐
│ Frontend │
└──────────┘
   5. Merge data client-side

Total Queries: N + 1 (N = number of schedules)
Latency: ~150ms × (N + 1)
```

### After (Supabase): Fetching Schedules with Caregiver Info

```
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 1. supabase.from('schedules')
     │    .select('*, caregiver:users(name, email)')
     ▼
┌─────────────┐
│ PostgreSQL  │
│   (with     │
│   JOIN)     │
└────┬────────┘
     │ 2. Return schedules with caregiver data
     ▼
┌──────────┐
│ Frontend │
└──────────┘
   3. Data ready to use

Total Queries: 1
Latency: ~50ms
Improvement: 3x faster + (N × 150ms) saved
```

---

## Authentication Flow Comparison

### Before (Firebase Auth)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Enter email/password
     ▼
┌──────────────┐
│ LoginForm    │
└────┬─────────┘
     │ 2. signInWithEmailAndPassword()
     ▼
┌──────────────┐
│ Firebase Auth│
└────┬─────────┘
     │ 3. Return user + ID token
     ▼
┌──────────────┐
│ AuthContext  │
└────┬─────────┘
     │ 4. Fetch user doc from Firestore
     ▼
┌──────────────┐
│  Firestore   │
└────┬─────────┘
     │ 5. Return user data
     ▼
┌──────────────┐
│ AuthContext  │
└────┬─────────┘
     │ 6. Check custom claims (admin/caregiver)
     ▼
┌──────────────┐
│   Redirect   │
└──────────────┘
```

### After (Supabase Auth)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Enter email/password
     ▼
┌──────────────┐
│ LoginForm    │
└────┬─────────┘
     │ 2. supabase.auth.signInWithPassword()
     ▼
┌──────────────┐
│Supabase Auth │
└────┬─────────┘
     │ 3. Return session + JWT
     ▼
┌──────────────┐
│ AuthContext  │
└────┬─────────┘
     │ 4. Query users table (auto-joined via RLS)
     ▼
┌──────────────┐
│ PostgreSQL   │
│  (with RLS)  │
└────┬─────────┘
     │ 5. Return user data (role included)
     ▼
┌──────────────┐
│ AuthContext  │
└────┬─────────┘
     │ 6. Role already in user object
     ▼
┌──────────────┐
│   Redirect   │
└──────────────┘

Improvement: Fewer steps, no custom claims needed
```

---

## Realtime Updates Comparison

### Before (Firebase): Listening to Schedule Changes

```
┌──────────┐
│Component │
└────┬─────┘
     │ 1. onSnapshot(collection('schedules'))
     ▼
┌──────────────┐
│  Firestore   │
│  (Realtime)  │
└────┬─────────┘
     │ 2. WebSocket connection
     │ 3. Stream changes
     ▼
┌──────────┐
│Component │
└────┬─────┘
     │ 4. Update state
     ▼
┌──────────┐
│   UI     │
└──────────┘

Latency: ~500ms
Security: Client-side rules
```

### After (Supabase): Listening to Schedule Changes

```
┌──────────┐
│Component │
└────┬─────┘
     │ 1. supabase.channel('schedules')
     │    .on('postgres_changes', ...)
     ▼
┌──────────────┐
│  Supabase    │
│  Realtime    │
└────┬─────────┘
     │ 2. WebSocket connection
     │ 3. Stream changes (filtered by RLS)
     ▼
┌──────────┐
│Component │
└────┬─────┘
     │ 4. Update state
     ▼
┌──────────┐
│   UI     │
└──────────┘

Latency: ~100ms
Security: Server-side RLS
Improvement: 5x faster, more secure
```

---

## Database Schema Visualization

### Supabase Tables & Relationships

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄─────┐
│ auth_id (FK)    │      │
│ name            │      │
│ email           │      │
│ role            │      │
│ ...             │      │
└─────────────────┘      │
         △               │
         │               │
         │               │
    ┌────┴────┐     ┌────┴──────────┐
    │         │     │                │
┌───┴─────────▼───┐ │  ┌─────────────▼────┐
│   schedules     │ │  │  caregiver_      │
│─────────────────│ │  │  patients        │
│ id (PK)         │ │  │──────────────────│
│ caregiver_id(FK)├─┘  │ id (PK)          │
│ patient_id (FK) ├─┐  │ caregiver_id(FK) ├─┐
│ start_timestamp │ │  │ patient_id (FK)  ├─┼─┐
│ end_timestamp   │ │  └──────────────────┘ │ │
│ status          │ │                       │ │
│ ...             │ │  ┌────────────────────┘ │
└────┬────────────┘ │  │                      │
     │              │  │  ┌───────────────────┘
     │              │  │  │
┌────▼────────────┐ │  │  │
│   sub_tasks     │ │  │  │
│─────────────────│ │  │  │
│ id (PK)         │ │  │  │
│ schedule_id(FK) ├─┘  │  │
│ description     │    │  │
│ completed       │    │  │
└─────────────────┘    │  │
                       │  │
     ┌─────────────────┘  │
     │                    │
┌────▼────────────┐  ┌────▼────────────────┐
│   patients      │  │  requests           │
│─────────────────│  │─────────────────────│
│ id (PK)         │  │ id (PK)             │
│ name            │  │ caregiver_id (FK)   ├─┐
│ date_of_birth   │  │ patient_id (FK)     ├─┤
│ diagnosis       │  │ schedule_id (FK)    ├─┤
│ ...             │  │ type                │ │
└────┬────────────┘  │ status              │ │
     │               └─────────────────────┘ │
     │                                       │
┌────▼──────────────────┐  ┌────────────────┘
│ emergency_contacts    │  │
│───────────────────────│  │
│ id (PK)               │  │
│ patient_id (FK)       ├──┘
│ name                  │
│ phone                 │
└───────────────────────┘

┌────▼──────────────────┐
│ patient_documents     │
│───────────────────────│
│ id (PK)               │
│ patient_id (FK)       ├──┘
│ name                  │
│ url                   │
└───────────────────────┘

┌─────────────────────┐
│  conversations      │
│─────────────────────│
│ id (PK)             │◄─────┐
│ last_message        │      │
│ updated_at          │      │
└─────────────────────┘      │
         △                   │
         │                   │
    ┌────┴────┐         ┌────┴────────────────┐
    │         │         │                     │
┌───┴─────────▼───┐  ┌──▼──────────────────┐ │
│   messages      │  │ conversation_       │ │
│─────────────────│  │ participants        │ │
│ id (PK)         │  │─────────────────────│ │
│conversation_id  ├──┤ id (PK)             │ │
│ sender_id (FK)  ├─┐│ conversation_id(FK) ├─┘
│ text            │ ││ user_id (FK)        ├─┐
│ image_url       │ │└─────────────────────┘ │
└─────────────────┘ │                        │
                    └────────────────────────┘
                                             │
┌─────────────────────┐                      │
│  notifications      │                      │
│─────────────────────│                      │
│ id (PK)             │                      │
│ recipient_id (FK)   ├──────────────────────┘
│ sender_id (FK)      ├──────────────────────┐
│ type                │                      │
│ resource_id         │                      │
│ read                │                      │
└─────────────────────┘                      │
                                             │
                    ┌────────────────────────┘
                    │
┌───────────────────▼─┐
│  caregiver_notes    │
│─────────────────────│
│ id (PK)             │
│ caregiver_id (FK)   ├──┐
│ patient_id (FK)     ├──┤
│ schedule_id (FK)    ├──┤
│ note                │  │
└─────────────────────┘  │
                         │
         ┌───────────────┴───────────────┐
         │                               │
         └───────────────────────────────┘
                     (back to users)
```

---

## Migration Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 0: Preparation                      │
│  • Audit Firebase                                           │
│  • Design Supabase schema                                   │
│  • Create documentation                                     │
│  • Export sample data                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Phase 1: Backend Foundation                   │
│  • Create Supabase project                                  │
│  • Run migrations (create tables)                           │
│  • Apply RLS policies                                       │
│  • Set up Supabase Auth                                     │
│  • Create seed data                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Phase 2: Edge Functions                       │
│  • Create scheduled jobs (3)                                │
│  • Create database triggers (3)                             │
│  • Create callable functions (2)                            │
│  • Set up monitoring                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Phase 3: Frontend Refactor                    │
│  • Install Supabase client                                  │
│  • Update AuthContext                                       │
│  • Refactor data access layer                               │
│  • Update all components                                    │
│  • Test all features                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Phase 4: Data Migration                       │
│  • Export production Firebase data                          │
│  • Transform data format                                    │
│  • Import to Supabase                                       │
│  • Validate data integrity                                  │
│  • Execute cutover                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Phase 5: MCP Integration                      │
│  • Create MCP server                                        │
│  • Configure Cursor client                                  │
│  • Test integration                                         │
│  • Document workflows                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Phase 6: Cleanup                              │
│  • Remove Firebase dependencies                             │
│  • Delete Firebase configs                                  │
│  • Update documentation                                     │
│  • Final testing                                            │
│  • Production monitoring                                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │  COMPLETE ✅  │
                 └───────────────┘
```

---

## Security Model Comparison

### Firebase Security Rules (Client-Side)

```javascript
// Firestore Rules
match /schedules/{scheduleId} {
  allow read: if request.auth.token.admin == true 
              || request.auth.token.caregiver == true;
  
  allow update: if request.auth.token.caregiver == true
                && request.auth.uid == resource.data.caregiverId
                && request.resource.data.diff(resource.data)
                   .affectedKeys().hasOnly(['status', 'notes']);
}

// Limitations:
// ❌ Complex logic is hard to express
// ❌ No joins or aggregations
// ❌ Rules evaluated on every request
// ❌ Hard to test
```

### Supabase RLS Policies (Server-Side)

```sql
-- Row Level Security
CREATE POLICY "Caregivers can read own schedules"
ON schedules FOR SELECT
USING (
  caregiver_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Caregivers can update own schedule fields"
ON schedules FOR UPDATE
USING (
  caregiver_id IN (
    SELECT id FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'caregiver'
  )
);

-- Advantages:
-- ✅ Full SQL power (joins, subqueries)
-- ✅ Easier to test (direct SQL)
-- ✅ Better performance (compiled)
-- ✅ More expressive
```

---

*Last Updated: November 10, 2025*

