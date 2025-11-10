# Phase 2: Edge Functions & Frontend Integration

**Status**: In Progress  
**Started**: November 10, 2025  
**Estimated Duration**: 2-3 days

---

## 📋 Overview

Phase 2 migrates the application from Firebase to Supabase by:
1. Converting Firebase Cloud Functions to Supabase Edge Functions
2. Updating frontend to use Supabase Auth
3. Replacing Firestore queries with Supabase queries
4. Migrating Firebase Storage to Supabase Storage

---

## 🎯 Goals

- ✅ Maintain all existing functionality
- ✅ Improve performance with Supabase's PostgreSQL
- ✅ Leverage Row Level Security (RLS)
- ✅ Use Supabase's built-in real-time features
- ✅ Simplify authentication flow

---

## 📊 Firebase Functions Analysis

### **Current Functions** (15 total):

#### **1. User Management** (2 functions)
- `onUserCreate` - Sets custom claims when user created
- `onUserUpdate` - Updates custom claims when role changes

**Migration Strategy**: Use Supabase Database Triggers + RLS policies

#### **2. Scheduled Jobs** (3 functions)
- `expireSchedules` - Expires pending schedules after 20 mins
- `autoClockOutOverdueActiveShifts` - Auto clock-out after 10 mins
- `onScheduleChangeUnassignPatient` - Daily cleanup of assignments

**Migration Strategy**: Use Supabase Edge Functions with pg_cron

#### **3. Admin Functions** (3 functions)
- `getAdmin` - Fetches admin user
- `createCaregiver` - Creates new caregiver account
- `changePassword` - Admin changes user password

**Migration Strategy**: Use Supabase Edge Functions + Admin API

#### **4. Caregiver Functions** (2 functions)
- `caregiverClockInOut` - Clock in/out for caregivers
- `adminClockInOut` - Admin force clock in/out

**Migration Strategy**: Use Supabase Edge Functions + RLS

#### **5. Request Handling** (2 functions)
- `handleApprovedRequest` - Processes approved requests
- `onRequestChange` - Sends notifications on request changes

**Migration Strategy**: Use Database Triggers + Edge Functions

#### **6. Messaging** (4 functions)
- `onNewMessage` - Creates/updates notifications
- `getConversations` - Fetches user conversations
- `sendMessage` - Sends a message
- `createConversation` - Creates new conversation
- `getAllUsers` - Gets users for messaging

**Migration Strategy**: Use Supabase Realtime + Edge Functions

#### **7. Schedule Triggers** (1 function)
- `unassignPatientOnShiftCompletion` - Unassigns patient when shift ends

**Migration Strategy**: Use Database Triggers

---

## 🏗️ Implementation Plan

### **Step 1: Set Up Supabase Edge Functions** ✅

```bash
# Create Edge Functions directory structure
supabase/functions/
├── create-caregiver/
├── change-password/
├── clock-in-out/
├── admin-clock-in-out/
├── get-conversations/
├── send-message/
├── create-conversation/
└── _shared/
    └── cors.ts
```

### **Step 2: Set Up Database Triggers** ✅

Create PostgreSQL functions and triggers for:
- Auto-updating timestamps
- Handling request approvals
- Unassigning patients
- Creating notifications

### **Step 3: Set Up Scheduled Jobs** ✅

Use pg_cron for:
- Expire schedules (every 5 minutes)
- Auto clock-out (every 1 minute)
- Cleanup assignments (daily)

### **Step 4: Set Up Supabase Storage** ✅

Create buckets:
- `profile-pictures` - User profile pictures
- `patient-pictures` - Patient profile pictures
- `message-images` - Chat images

### **Step 5: Update AuthContext** ✅

Replace Firebase Auth with Supabase Auth:
- Login/logout
- Session management
- User state
- Profile updates

### **Step 6: Update Components** ✅

Replace Firestore queries in all components with Supabase queries from `src/lib/supabase/queries.ts`

### **Step 7: Test Everything** ✅

- Authentication flow
- CRUD operations
- Real-time updates
- File uploads
- Scheduled jobs

---

## 📝 Detailed Migration

### **A. Database Triggers**

#### **1. Updated At Trigger** (Already in schema)
```sql
-- Already implemented in initial schema
-- Automatically updates updated_at on row changes
```

#### **2. Handle Approved Requests**
```sql
CREATE OR REPLACE FUNCTION handle_approved_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    IF NEW.type = 'cancellation' THEN
      -- Update schedule status
      UPDATE schedules 
      SET status = 'cancelled' 
      WHERE id = NEW.schedule_id;
      
      -- Add cancellation bonus
      UPDATE users 
      SET cancellation_bonus = COALESCE(cancellation_bonus, 0) + 1.5 
      WHERE id = NEW.caregiver_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_request_approved
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_approved_request();
```

#### **3. Unassign Patient on Shift Completion**
```sql
CREATE OR REPLACE FUNCTION unassign_patient_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled', 'expired') 
     AND OLD.status NOT IN ('completed', 'cancelled', 'expired') THEN
    
    -- Check if caregiver has any future schedules with this patient
    IF NOT EXISTS (
      SELECT 1 FROM schedules
      WHERE caregiver_id = NEW.caregiver_id
        AND patient_id = NEW.patient_id
        AND status IN ('pending', 'active')
        AND start_timestamp >= NOW()
    ) THEN
      -- Unassign patient (implementation depends on your data model)
      -- This might need adjustment based on how you track assignments
      NULL; -- Placeholder
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_schedule_completion
  AFTER UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION unassign_patient_on_completion();
```

#### **4. Create Notifications on New Message**
```sql
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_data RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO conversation_data
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Find recipient (the other participant)
  SELECT unnest(conversation_data.participants) INTO recipient_id
  WHERE unnest(conversation_data.participants) != NEW.sender_id
  LIMIT 1;
  
  -- Get sender name
  SELECT name INTO sender_name
  FROM users
  WHERE id = NEW.sender_id;
  
  -- Upsert notification
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    sender_name,
    type,
    resource_id,
    content,
    read,
    created_at
  ) VALUES (
    recipient_id,
    NEW.sender_id,
    sender_name,
    'message',
    NEW.conversation_id,
    NEW.content,
    false,
    NOW()
  )
  ON CONFLICT (recipient_id, resource_id, type)
  DO UPDATE SET
    content = EXCLUDED.content,
    sender_name = EXCLUDED.sender_name,
    read = false,
    created_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();
```

#### **5. Create Notifications on Request Change**
```sql
CREATE OR REPLACE FUNCTION notify_on_request_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- New request - notify all admins
  IF TG_OP = 'INSERT' THEN
    FOR admin_record IN 
      SELECT id FROM users WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (
        recipient_id,
        sender_id,
        sender_name,
        type,
        resource_id,
        read,
        created_at
      ) VALUES (
        admin_record.id,
        NEW.caregiver_id,
        NEW.caregiver_name,
        NEW.type || '_request',
        NEW.id,
        false,
        NOW()
      );
    END LOOP;
  END IF;
  
  -- Request status changed - notify caregiver
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' 
     AND NEW.status IN ('approved', 'denied') THEN
    INSERT INTO notifications (
      recipient_id,
      sender_id,
      sender_name,
      type,
      resource_id,
      content,
      read,
      created_at
    ) VALUES (
      NEW.caregiver_id,
      NULL, -- System notification
      'Admin',
      'request_' || NEW.status,
      NEW.id,
      'Your ' || NEW.type || ' request for patient ' || NEW.patient_name || ' has been ' || NEW.status,
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_request_change
  AFTER INSERT OR UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_request_change();
```

---

### **B. Scheduled Jobs (pg_cron)**

#### **1. Expire Schedules** (every 5 minutes)
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: Expire pending schedules after 20 minutes
SELECT cron.schedule(
  'expire-schedules',
  '*/5 * * * *', -- Every 5 minutes
  $$
  UPDATE schedules
  SET status = 'expired'
  WHERE status = 'pending'
    AND start_timestamp + INTERVAL '20 minutes' < NOW();
  $$
);
```

#### **2. Auto Clock-Out** (every 1 minute)
```sql
SELECT cron.schedule(
  'auto-clock-out',
  '* * * * *', -- Every minute
  $$
  UPDATE schedules
  SET 
    status = 'completed',
    clock_out = end_timestamp,
    notes = COALESCE(notes, '') || ' [System Auto-Clock-Out: Shift ended and not clocked out within 10 minutes. Overdue time not counted.]'
  WHERE status = 'active'
    AND end_timestamp + INTERVAL '10 minutes' < NOW()
    AND clock_out IS NULL;
  $$
);
```

#### **3. Cleanup Assignments** (daily)
```sql
SELECT cron.schedule(
  'cleanup-assignments',
  '0 0 * * *', -- Daily at midnight
  $$
  -- This depends on your assignment tracking implementation
  -- Placeholder for now
  SELECT 1;
  $$
);
```

---

### **C. Edge Functions**

#### **1. Create Caregiver**
```typescript
// supabase/functions/create-caregiver/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Check if user is admin
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Check admin role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Permission denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get request body
  const { email, password, name, phone } = await req.json()

  if (!email || !password || !name) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Create auth user
  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  })

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Create user record
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      auth_id: newUser.user.id,
      name,
      email,
      phone,
      role: 'caregiver',
      status: 'active'
    })

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(
    JSON.stringify({ result: `Successfully created caregiver ${name}` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

#### **2. Change Password**
```typescript
// supabase/functions/change-password/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Check if user is admin
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Permission denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { userId, newPassword } = await req.json()

  if (!userId || !newPassword || newPassword.length < 6) {
    return new Response(JSON.stringify({ error: 'Invalid arguments' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(
    JSON.stringify({ result: `Successfully changed password for user ${userId}` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

### **D. Frontend Updates**

#### **1. Update AuthContext**

Replace Firebase Auth methods with Supabase Auth:
- `signInWithEmailAndPassword` → `supabase.auth.signInWithPassword`
- `signOut` → `supabase.auth.signOut`
- `onAuthStateChanged` → `supabase.auth.onAuthStateChange`
- `updateProfile` → Update users table directly

#### **2. Update Components**

Replace all Firestore imports and calls with Supabase queries:
- Import from `src/lib/supabase/queries.ts`
- Use the 50+ query functions already created
- Remove Firebase imports

#### **3. Update Storage**

Replace Firebase Storage with Supabase Storage:
- `uploadBytes` → `supabase.storage.from().upload()`
- `getDownloadURL` → `supabase.storage.from().getPublicUrl()`

---

## ✅ Success Criteria

- [ ] All Edge Functions deployed and working
- [ ] All database triggers created and tested
- [ ] Scheduled jobs running via pg_cron
- [ ] Storage buckets created with proper policies
- [ ] AuthContext fully migrated to Supabase
- [ ] All components using Supabase queries
- [ ] Authentication flow working end-to-end
- [ ] CRUD operations working
- [ ] Real-time updates working
- [ ] File uploads working
- [ ] No Firebase dependencies in frontend code

---

## 📊 Progress Tracking

```
Step 1: Edge Functions Setup       [ ]
Step 2: Database Triggers          [ ]
Step 3: Scheduled Jobs             [ ]
Step 4: Storage Setup              [ ]
Step 5: AuthContext Update         [ ]
Step 6: Component Updates          [ ]
Step 7: Testing                    [ ]
```

---

## 🔗 Next Phase

After Phase 2 completion:
- **Phase 3**: Data Migration (migrate existing Firebase data to Supabase)
- **Phase 4**: MCP Integration
- **Phase 5**: Testing & Cleanup

---

**Let's get started!** 🚀

