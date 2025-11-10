-- AnGau App - Seed Data
-- Created: 2025-11-10
-- Description: Seed data for development and testing

-- ============================================
-- SEED USERS
-- ============================================
-- Note: These users will need to be created in Supabase Auth first
-- This seed assumes auth users exist with these IDs

-- Admin User
INSERT INTO users (
  id,
  name,
  email,
  role,
  phone,
  status,
  position,
  rate_per_hour,
  address_city,
  address_state,
  address_country
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@angau.com',
  'admin',
  '+1234567890',
  'active',
  'Full-time',
  50.00,
  'Los Angeles',
  'CA',
  'USA'
) ON CONFLICT (id) DO NOTHING;

-- Caregiver 1
INSERT INTO users (
  id,
  name,
  email,
  role,
  phone,
  status,
  position,
  rate_per_hour,
  address_city,
  address_state,
  address_country
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'John Caregiver',
  'john.caregiver@angau.com',
  'caregiver',
  '+1234567891',
  'active',
  'Full-time',
  25.00,
  'Los Angeles',
  'CA',
  'USA'
) ON CONFLICT (id) DO NOTHING;

-- Caregiver 2
INSERT INTO users (
  id,
  name,
  email,
  role,
  phone,
  status,
  position,
  rate_per_hour,
  address_city,
  address_state,
  address_country
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Jane Caregiver',
  'jane.caregiver@angau.com',
  'caregiver',
  '+1234567892',
  'active',
  'Part-time',
  25.00,
  'Los Angeles',
  'CA',
  'USA'
) ON CONFLICT (id) DO NOTHING;

-- Caregiver 3
INSERT INTO users (
  id,
  name,
  email,
  role,
  phone,
  status,
  position,
  rate_per_hour,
  address_city,
  address_state,
  address_country
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Mike Caregiver',
  'mike.caregiver@angau.com',
  'caregiver',
  '+1234567893',
  'active',
  'Full-time',
  25.00,
  'Los Angeles',
  'CA',
  'USA'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED PATIENTS
-- ============================================

INSERT INTO patients (
  id,
  name,
  date_of_birth,
  gender,
  email,
  phone,
  address_street,
  address_city,
  address_state,
  address_postal_code,
  address_country,
  address_lat,
  address_lng,
  diagnosis,
  special_notes,
  alloted_time
) VALUES 
(
  '10000000-0000-0000-0000-000000000001',
  'Mary Johnson',
  '1945-03-15',
  'female',
  'mary.johnson@email.com',
  '+1234567801',
  '123 Main St',
  'Los Angeles',
  'CA',
  '90001',
  'USA',
  34.0522,
  -118.2437,
  'Dementia, Hypertension',
  'Requires assistance with daily activities',
  '2 hours'
),
(
  '10000000-0000-0000-0000-000000000002',
  'Robert Smith',
  '1950-07-22',
  'male',
  'robert.smith@email.com',
  '+1234567802',
  '456 Oak Ave',
  'Los Angeles',
  'CA',
  '90002',
  'USA',
  34.0622,
  -118.2537,
  'Diabetes, Arthritis',
  'Needs medication reminders',
  '1.5 hours'
),
(
  '10000000-0000-0000-0000-000000000003',
  'Patricia Williams',
  '1948-11-30',
  'female',
  'patricia.williams@email.com',
  '+1234567803',
  '789 Pine Rd',
  'Los Angeles',
  'CA',
  '90003',
  'USA',
  34.0722,
  -118.2637,
  'Heart Disease, COPD',
  'Oxygen therapy required',
  '2.5 hours'
),
(
  '10000000-0000-0000-0000-000000000004',
  'James Brown',
  '1952-05-10',
  'male',
  'james.brown@email.com',
  '+1234567804',
  '321 Elm St',
  'Los Angeles',
  'CA',
  '90004',
  'USA',
  34.0822,
  -118.2737,
  'Parkinsons Disease',
  'Requires mobility assistance',
  '2 hours'
),
(
  '10000000-0000-0000-0000-000000000005',
  'Linda Davis',
  '1947-09-18',
  'female',
  'linda.davis@email.com',
  '+1234567805',
  '654 Maple Dr',
  'Los Angeles',
  'CA',
  '90005',
  'USA',
  34.0922,
  -118.2837,
  'Alzheimers Disease',
  'Memory care needed',
  '3 hours'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED EMERGENCY CONTACTS
-- ============================================

INSERT INTO emergency_contacts (patient_id, name, relationship, phone) VALUES
('10000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'Daughter', '+1234567811'),
('10000000-0000-0000-0000-000000000001', 'Tom Johnson', 'Son', '+1234567812'),
('10000000-0000-0000-0000-000000000002', 'Emily Smith', 'Wife', '+1234567813'),
('10000000-0000-0000-0000-000000000003', 'Michael Williams', 'Son', '+1234567814'),
('10000000-0000-0000-0000-000000000004', 'Susan Brown', 'Daughter', '+1234567815'),
('10000000-0000-0000-0000-000000000005', 'David Davis', 'Husband', '+1234567816');

-- ============================================
-- SEED CAREGIVER-PATIENT ASSIGNMENTS
-- ============================================

INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004'),
('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005');

-- ============================================
-- SEED SCHEDULES
-- ============================================

-- Today's schedules
INSERT INTO schedules (
  caregiver_id,
  caregiver_name,
  patient_id,
  patient_name,
  start_timestamp,
  end_timestamp,
  task,
  status
) VALUES
(
  '00000000-0000-0000-0000-000000000002',
  'John Caregiver',
  '10000000-0000-0000-0000-000000000001',
  'Mary Johnson',
  now() + interval '1 hour',
  now() + interval '3 hours',
  'Morning care routine',
  'pending'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Jane Caregiver',
  '10000000-0000-0000-0000-000000000003',
  'Patricia Williams',
  now() + interval '2 hours',
  now() + interval '4.5 hours',
  'Medication and oxygen therapy',
  'pending'
),
(
  '00000000-0000-0000-0000-000000000004',
  'Mike Caregiver',
  '10000000-0000-0000-0000-000000000005',
  'Linda Davis',
  now() + interval '3 hours',
  now() + interval '6 hours',
  'Memory care activities',
  'pending'
);

-- Tomorrow's schedules
INSERT INTO schedules (
  caregiver_id,
  caregiver_name,
  patient_id,
  patient_name,
  start_timestamp,
  end_timestamp,
  task,
  status
) VALUES
(
  '00000000-0000-0000-0000-000000000002',
  'John Caregiver',
  '10000000-0000-0000-0000-000000000002',
  'Robert Smith',
  now() + interval '1 day' + interval '2 hours',
  now() + interval '1 day' + interval '3.5 hours',
  'Medication management',
  'pending'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Jane Caregiver',
  '10000000-0000-0000-0000-000000000004',
  'James Brown',
  now() + interval '1 day' + interval '3 hours',
  now() + interval '1 day' + interval '5 hours',
  'Mobility assistance and exercises',
  'pending'
);

-- ============================================
-- SEED SUB-TASKS
-- ============================================

-- Get the first schedule ID for sub-tasks
DO $$
DECLARE
  schedule_id UUID;
BEGIN
  SELECT id INTO schedule_id FROM schedules LIMIT 1;
  
  IF schedule_id IS NOT NULL THEN
    INSERT INTO sub_tasks (schedule_id, description, completed, order_index) VALUES
    (schedule_id, 'Check vital signs', false, 1),
    (schedule_id, 'Administer morning medications', false, 2),
    (schedule_id, 'Assist with breakfast', false, 3),
    (schedule_id, 'Help with personal hygiene', false, 4),
    (schedule_id, 'Document care provided', false, 5);
  END IF;
END $$;

-- ============================================
-- SEED CONVERSATIONS
-- ============================================

-- Conversation between Admin and John Caregiver
INSERT INTO conversations (id, last_message, created_by) VALUES
('20000000-0000-0000-0000-000000000001', 'Thanks for the update!', '00000000-0000-0000-0000-000000000001');

INSERT INTO conversation_participants (conversation_id, user_id) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

INSERT INTO messages (conversation_id, sender_id, text) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hi, I have a question about tomorrow''s schedule.'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sure, what do you need to know?'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Can I swap my afternoon shift?'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Let me check and get back to you.'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Thanks for the update!');

-- Conversation between Jane and Mike
INSERT INTO conversations (id, last_message, created_by) VALUES
('20000000-0000-0000-0000-000000000002', 'See you tomorrow!', '00000000-0000-0000-0000-000000000003');

INSERT INTO conversation_participants (conversation_id, user_id) VALUES
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004');

INSERT INTO messages (conversation_id, sender_id, text) VALUES
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Hey Mike, how was your shift today?'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'It went well! Mrs. Davis was in good spirits.'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'That''s great to hear!'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'See you tomorrow!');

-- ============================================
-- SEED NOTIFICATIONS
-- ============================================

INSERT INTO notifications (recipient_id, sender_id, sender_name, type, read, content) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Admin User', 'message', false, 'You have a new schedule for tomorrow'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Admin User', 'message', false, 'Please review your upcoming shifts'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Jane Caregiver', 'message', true, 'Hey Mike, how was your shift today?');

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - Users: 4 (1 admin, 3 caregivers)';
  RAISE NOTICE '  - Patients: 5';
  RAISE NOTICE '  - Emergency Contacts: 6';
  RAISE NOTICE '  - Schedules: 5';
  RAISE NOTICE '  - Conversations: 2';
  RAISE NOTICE '  - Messages: 9';
  RAISE NOTICE '  - Notifications: 3';
END $$;

