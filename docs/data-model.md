# AnGau App - Data Model & Supabase Schema

## Phase 0 Audit Summary

### Current Firebase Architecture

#### Collections Overview

1. **users** - Core user accounts (admin, caregiver)
2. **patients** - Patient profiles and medical information
3. **schedules** - Shift assignments and time tracking
4. **requests** - Cancellation and overtime requests
5. **conversations** - Messaging between users
6. **conversations/{id}/messages** - Individual messages (subcollection)
7. **notifications** - System notifications

#### Firebase Cloud Functions

1. **onUserCreate** - Sets custom claims based on role
2. **onUserUpdate** - Updates custom claims on role change
3. **getAdmin** - Retrieves admin user
4. **expireSchedules** - Scheduled job (every 5 min) to expire pending schedules
5. **autoClockOutOverdueActiveShifts** - Scheduled job (every 1 min) to auto clock-out
6. **createCaregiver** - Admin function to create caregiver accounts
7. **changePassword** - Admin function to reset passwords
8. **caregiverClockInOut** - Caregiver clock in/out
9. **adminClockInOut** - Admin-initiated clock in/out
10. **unassignPatientOnShiftCompletion** - Auto-unassign patients when shifts end
11. **onScheduleChangeUnassignPatient** - Daily cleanup of caregiver assignments
12. **handleApprovedRequest** - Updates schedules when requests approved
13. **onNewMessage** - Creates/updates notifications for messages
14. **onRequestChange** - Notifies admins/caregivers on request status changes
15. **getConversations** - Retrieves user conversations
16. **sendMessage** - Sends a message
17. **createConversation** - Creates new conversation
18. **getAllUsers** - Retrieves users based on role

#### Firebase Security Rules

- **Users**: Read/update own document or if admin/caregiver
- **Patients**: Full CRUD for admin/caregiver
- **Notifications**: Read/update own notifications
- **Conversations**: Read if participant
- **Messages**: Read/create if participant
- **Schedules**: CRUD for admin; caregivers can update specific fields
- **Requests**: Caregivers create own; admin can read/update

#### Firebase Storage

- **patients_profile_pictures/** - Patient profile images (admin write, auth read)
- **user_profile_pictures/** - User profile images (auth read/write)

---

## Supabase Schema Design

### Database Tables

#### 1. `users` (replaces Firebase users collection)

```sql
CREATE TYPE user_role AS ENUM ('admin', 'caregiver', 'patient');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE position_type AS ENUM ('Full-time', 'Part-time');
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'caregiver',
  phone TEXT,
  status user_status DEFAULT 'active',
  position position_type,
  status_effective_date TIMESTAMPTZ,
  position_effective_date TIMESTAMPTZ,
  rate_per_hour NUMERIC(10, 2),
  profile_picture_url TEXT,
  date_of_birth DATE,
  gender gender_type,
  pin TEXT, -- Encrypted PIN for lock screen
  fingerprint_enabled BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  cancellation_bonus NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Address fields (denormalized for simplicity)
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  address_full TEXT,
  address_lat NUMERIC(10, 7),
  address_lng NUMERIC(10, 7)
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
```

#### 2. `patients`

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM age(date_of_birth))) STORED,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  email TEXT,
  phone TEXT,
  profile_picture_url TEXT,
  
  -- Address
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  address_full TEXT,
  address_lat NUMERIC(10, 7),
  address_lng NUMERIC(10, 7),
  
  -- Medical Information
  diagnosis TEXT,
  discharge_plan TEXT,
  family_comment TEXT,
  evaluation TEXT,
  medications_list TEXT,
  interdisciplinary_team_notes TEXT,
  medical_appointments TEXT,
  emergency_disaster_plans TEXT,
  community_resources TEXT,
  client_comments TEXT,
  doctors_notes TEXT,
  special_notes TEXT,
  alloted_time TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patients_name ON patients(name);
```

#### 3. `emergency_contacts`

```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_emergency_contacts_patient ON emergency_contacts(patient_id);
```

#### 4. `patient_documents`

```sql
CREATE TABLE patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id);
```

#### 5. `schedules`

```sql
CREATE TYPE schedule_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'expired', 'missed', 'overtime');

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  caregiver_name TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  start_timestamp TIMESTAMPTZ NOT NULL,
  end_timestamp TIMESTAMPTZ NOT NULL,
  task TEXT NOT NULL,
  status schedule_status DEFAULT 'pending',
  notes TEXT,
  
  -- Clock in/out tracking
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC(5, 2),
  
  -- GPS tracking
  clock_in_lat NUMERIC(10, 7),
  clock_in_lng NUMERIC(10, 7),
  clock_out_lat NUMERIC(10, 7),
  clock_out_lng NUMERIC(10, 7),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_schedules_caregiver ON schedules(caregiver_id, start_timestamp);
CREATE INDEX idx_schedules_patient ON schedules(patient_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_start_time ON schedules(start_timestamp);
```

#### 6. `sub_tasks`

```sql
CREATE TABLE sub_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sub_tasks_schedule ON sub_tasks(schedule_id);
```

#### 7. `caregiver_patients` (junction table for assignments)

```sql
CREATE TABLE caregiver_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(caregiver_id, patient_id)
);

CREATE INDEX idx_caregiver_patients_caregiver ON caregiver_patients(caregiver_id);
CREATE INDEX idx_caregiver_patients_patient ON caregiver_patients(patient_id);
```

#### 8. `requests`

```sql
CREATE TYPE request_type AS ENUM ('cancellation', 'overtime');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied');

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  caregiver_name TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  type request_type NOT NULL,
  status request_status DEFAULT 'pending',
  request_date TIMESTAMPTZ DEFAULT now(),
  reason TEXT NOT NULL,
  
  -- Overtime specific fields
  overtime_hours INTEGER,
  overtime_minutes INTEGER,
  approved_overtime_hours INTEGER,
  approved_overtime_minutes INTEGER,
  
  -- Admin response
  admin_id UUID REFERENCES users(id),
  denial_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_requests_caregiver ON requests(caregiver_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_date ON requests(request_date DESC);
```

#### 9. `conversations`

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
```

#### 10. `conversation_participants`

```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
```

#### 11. `messages`

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

#### 12. `notifications`

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  type TEXT NOT NULL, -- 'message', 'cancellation_request', 'overtime_request', 'request_approved', 'request_denied'
  resource_id UUID, -- scheduleId, messageId, requestId, conversationId
  read BOOLEAN DEFAULT false,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX idx_notifications_resource ON notifications(resource_id);
```

#### 13. `caregiver_notes`

```sql
CREATE TABLE caregiver_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_caregiver_notes_caregiver ON caregiver_notes(caregiver_id);
CREATE INDEX idx_caregiver_notes_patient ON caregiver_notes(patient_id);
CREATE INDEX idx_caregiver_notes_schedule ON caregiver_notes(schedule_id);
```

---

### Row Level Security (RLS) Policies

#### Users Table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Admins and caregivers can read all users
CREATE POLICY "Admins and caregivers can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'caregiver')
    )
  );

-- Users can update their own record (limited fields)
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Admins can create and update all users
CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );
```

#### Patients Table

```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and caregivers can manage patients"
  ON patients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'caregiver')
    )
  );
```

#### Schedules Table

```sql
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage schedules"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Caregivers can read their own schedules
CREATE POLICY "Caregivers can read own schedules"
  ON schedules FOR SELECT
  USING (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Caregivers can update specific fields on their schedules
CREATE POLICY "Caregivers can update own schedule fields"
  ON schedules FOR UPDATE
  USING (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid() AND role = 'caregiver'
    )
  )
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid() AND role = 'caregiver'
    )
  );
```

#### Requests Table

```sql
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Caregivers can create their own requests
CREATE POLICY "Caregivers can create own requests"
  ON requests FOR INSERT
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid() AND role = 'caregiver'
    )
  );

-- Caregivers can read their own requests
CREATE POLICY "Caregivers can read own requests"
  ON requests FOR SELECT
  USING (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Admins can read and update all requests
CREATE POLICY "Admins can manage requests"
  ON requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );
```

#### Conversations & Messages

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read conversations they're part of
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Users can read messages in their conversations
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Users can create messages in their conversations
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    AND sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

#### Notifications

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (
    recipient_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    recipient_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );
```

---

### Supabase Edge Functions (Serverless)

Replace Firebase Cloud Functions with Supabase Edge Functions (Deno):

1. **on-user-create** - Trigger on auth.users insert
2. **expire-schedules** - Cron job (every 5 min)
3. **auto-clock-out** - Cron job (every 1 min)
4. **cleanup-assignments** - Cron job (daily)
5. **handle-request-approval** - Database trigger on requests update
6. **handle-new-message** - Database trigger on messages insert
7. **handle-shift-completion** - Database trigger on schedules update

### Supabase Storage Buckets

1. **patient-profile-pictures** - Public read, authenticated write
2. **user-profile-pictures** - Public read, authenticated write
3. **patient-documents** - Private, RLS-based access

---

## Migration Mapping

| Firebase Collection | Supabase Table(s) | Notes |
|---------------------|-------------------|-------|
| users | users | Add `auth_id` FK to `auth.users` |
| patients | patients, emergency_contacts, patient_documents | Normalize emergency contacts and documents |
| schedules | schedules, sub_tasks | Normalize sub-tasks into separate table |
| requests | requests | Direct mapping with typed enums |
| conversations | conversations, conversation_participants, messages | Normalize participants into junction table |
| notifications | notifications | Direct mapping |
| N/A | caregiver_patients | New junction table for assignments |
| N/A | caregiver_notes | New table for caregiver notes |

---

## Data Migration Strategy

### Step 1: Export Firebase Data

```bash
# Use Firebase Admin SDK to export collections
node scripts/export-firebase-data.js
```

### Step 2: Transform Data

- Convert Firestore Timestamps to ISO strings
- Generate UUIDs for all records
- Normalize nested arrays (emergency contacts, documents, sub-tasks)
- Map Firebase Auth UIDs to Supabase Auth IDs

### Step 3: Import to Supabase

```bash
# Use Supabase CLI or direct SQL imports
supabase db push
node scripts/import-to-supabase.js
```

### Step 4: Validation

- Compare record counts
- Validate relationships (FKs)
- Test RLS policies
- Verify data integrity

---

## Next Steps for Phase 1

1. Create Supabase project and gather credentials
2. Set up local Supabase development environment
3. Create migration files for all tables
4. Implement RLS policies
5. Write seed data scripts
6. Create Edge Functions for scheduled jobs
7. Set up storage buckets with policies
8. Write data export/import scripts

---

## Technical Decisions

### ORM Choice: Prisma vs Direct SQL

**Recommendation: Direct SQL with Supabase Client**

**Rationale:**
- Supabase provides excellent TypeScript client with auto-generated types
- Direct SQL migrations are simpler for Postgres-specific features (RLS, triggers)
- Prisma adds complexity and doesn't fully support Supabase RLS
- Supabase Studio provides great schema management UI

### Authentication Flow

- Use Supabase Auth instead of Firebase Auth
- Migrate users with email/password (require password reset on first login)
- Implement PIN-based lock screen using Supabase session management
- Store encrypted PINs in users table

### Realtime Features

- Use Supabase Realtime for live updates (schedules, messages, notifications)
- Subscribe to specific tables/rows based on RLS policies
- Replace Firestore listeners with Supabase subscriptions

---

## Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 0 | Audit & Planning | ✅ Complete |
| Phase 1 | Backend Foundation | 2-3 days |
| Phase 2 | Edge Functions | 1-2 days |
| Phase 3 | Frontend Refactor | 3-4 days |
| Phase 4 | Data Migration | 1-2 days |
| Phase 5 | MCP Integration | 1 day |
| Phase 6 | Cleanup | 1 day |
| **Total** | | **9-13 days** |

---

## Risk Mitigation

1. **Data Loss**: Export all Firebase data before migration; keep Firebase running in parallel
2. **Auth Issues**: Implement gradual rollout; test auth flows thoroughly
3. **Performance**: Load test Supabase with production data volumes
4. **Downtime**: Plan maintenance window; communicate with users
5. **Rollback Plan**: Document steps to revert to Firebase if critical issues arise

---

*Document created: Phase 0 — Preparation*
*Last updated: 2025-11-10*

