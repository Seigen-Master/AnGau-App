-- AnGau App - Initial Schema Migration
-- Created: 2025-11-10
-- Description: Creates all tables, enums, indexes, and RLS policies

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'caregiver', 'patient');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE position_type AS ENUM ('Full-time', 'Part-time');
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE schedule_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'expired', 'missed', 'overtime');
CREATE TYPE request_type AS ENUM ('cancellation', 'overtime');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied');

-- ============================================
-- TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
  
  -- Address fields (denormalized for simplicity)
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  address_full TEXT,
  address_lat NUMERIC(10, 7),
  address_lng NUMERIC(10, 7),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER, -- Calculated in application code
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

-- Emergency Contacts Table
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Documents Table
CREATE TABLE patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Schedules Table
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  caregiver_name TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
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

-- Sub Tasks Table
CREATE TABLE sub_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Caregiver Patients Junction Table
CREATE TABLE caregiver_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(caregiver_id, patient_id)
);

-- Requests Table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  caregiver_name TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
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

-- Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation Participants Table
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(conversation_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  type TEXT NOT NULL, -- 'message', 'cancellation_request', 'overtime_request', 'request_approved', 'request_denied'
  resource_id UUID, -- scheduleId, messageId, requestId, conversationId
  read BOOLEAN DEFAULT false,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Caregiver Notes Table
CREATE TABLE caregiver_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Patients indexes
CREATE INDEX idx_patients_name ON patients(name);

-- Emergency Contacts indexes
CREATE INDEX idx_emergency_contacts_patient ON emergency_contacts(patient_id);

-- Patient Documents indexes
CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id);

-- Schedules indexes
CREATE INDEX idx_schedules_caregiver ON schedules(caregiver_id, start_timestamp);
CREATE INDEX idx_schedules_patient ON schedules(patient_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_start_time ON schedules(start_timestamp);

-- Sub Tasks indexes
CREATE INDEX idx_sub_tasks_schedule ON sub_tasks(schedule_id);

-- Caregiver Patients indexes
CREATE INDEX idx_caregiver_patients_caregiver ON caregiver_patients(caregiver_id);
CREATE INDEX idx_caregiver_patients_patient ON caregiver_patients(patient_id);

-- Requests indexes
CREATE INDEX idx_requests_caregiver ON requests(caregiver_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_date ON requests(request_date DESC);

-- Conversations indexes
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- Conversation Participants indexes
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);

-- Messages indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Notifications indexes
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX idx_notifications_resource ON notifications(resource_id);

-- Caregiver Notes indexes
CREATE INDEX idx_caregiver_notes_caregiver ON caregiver_notes(caregiver_id);
CREATE INDEX idx_caregiver_notes_patient ON caregiver_notes(patient_id);
CREATE INDEX idx_caregiver_notes_schedule ON caregiver_notes(schedule_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_notes ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins and caregivers can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'caregiver')
    )
  );

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Patients RLS Policies
CREATE POLICY "Admins and caregivers can manage patients"
  ON patients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'caregiver')
    )
  );

-- Emergency Contacts RLS Policies
CREATE POLICY "Admins and caregivers can manage emergency contacts"
  ON emergency_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'caregiver')
    )
  );

-- Patient Documents RLS Policies
CREATE POLICY "Admins and caregivers can manage patient documents"
  ON patient_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'caregiver')
    )
  );

-- Schedules RLS Policies
CREATE POLICY "Admins can manage schedules"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

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
      SELECT id FROM users WHERE auth_id = auth.uid() AND role = 'caregiver'
    )
  )
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid() AND role = 'caregiver'
    )
  );

-- Sub Tasks RLS Policies
CREATE POLICY "Admins can manage sub tasks"
  ON sub_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Caregivers can manage sub tasks for own schedules"
  ON sub_tasks FOR ALL
  USING (
    schedule_id IN (
      SELECT id FROM schedules
      WHERE caregiver_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- Caregiver Patients RLS Policies
CREATE POLICY "Admins can manage caregiver patient assignments"
  ON caregiver_patients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Caregivers can read own assignments"
  ON caregiver_patients FOR SELECT
  USING (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Requests RLS Policies
CREATE POLICY "Caregivers can create own requests"
  ON requests FOR INSERT
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid() AND role = 'caregiver'
    )
  );

CREATE POLICY "Caregivers can read own requests"
  ON requests FOR SELECT
  USING (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage requests"
  ON requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Conversations RLS Policies
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Conversation Participants RLS Policies
CREATE POLICY "Users can read own conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can add participants to own conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Messages RLS Policies
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    AND sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Notifications RLS Policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (
    recipient_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    recipient_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Caregiver Notes RLS Policies
CREATE POLICY "Admins can manage caregiver notes"
  ON caregiver_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Caregivers can manage own notes"
  ON caregiver_notes FOR ALL
  USING (
    caregiver_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Core user accounts with auth integration';
COMMENT ON TABLE patients IS 'Patient profiles and medical information';
COMMENT ON TABLE emergency_contacts IS 'Patient emergency contacts (normalized)';
COMMENT ON TABLE patient_documents IS 'Patient documents (normalized)';
COMMENT ON TABLE schedules IS 'Shift assignments and time tracking';
COMMENT ON TABLE sub_tasks IS 'Schedule sub-tasks (normalized)';
COMMENT ON TABLE caregiver_patients IS 'Junction table for caregiver-patient assignments';
COMMENT ON TABLE requests IS 'Cancellation and overtime requests';
COMMENT ON TABLE conversations IS 'Chat conversations';
COMMENT ON TABLE conversation_participants IS 'Conversation participants (normalized)';
COMMENT ON TABLE messages IS 'Chat messages';
COMMENT ON TABLE notifications IS 'System notifications';
COMMENT ON TABLE caregiver_notes IS 'Caregiver notes about patients';

