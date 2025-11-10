/**
 * Supabase Database Queries
 * 
 * Centralized database queries using Supabase client.
 * These functions replace the Firebase Firestore queries.
 */

import { supabase } from './client';
import type { Database } from './database.types';

type User = Database['public']['Tables']['users']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Schedule = Database['public']['Tables']['schedules']['Row'];

// ============================================
// USERS
// ============================================

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCaregivers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'caregiver')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function getAdmins() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'admin')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// PATIENTS
// ============================================

export async function getAllPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      emergency_contacts (*),
      patient_documents (*)
    `)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function getPatientById(id: string) {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      emergency_contacts (*),
      patient_documents (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAssignedPatients(caregiverId: string) {
  const { data, error } = await supabase
    .from('caregiver_patients')
    .select(`
      patient:patients (*)
    `)
    .eq('caregiver_id', caregiverId);
  
  if (error) throw error;
  return data.map(item => item.patient);
}

export async function addPatient(patient: Database['public']['Tables']['patients']['Insert']) {
  const { data, error } = await supabase
    .from('patients')
    .insert(patient)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePatient(id: string, updates: Partial<Patient>) {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePatient(id: string) {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// EMERGENCY CONTACTS
// ============================================

export async function addEmergencyContact(patientId: string, contact: {
  name: string;
  relationship?: string;
  phone: string;
}) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      patient_id: patientId,
      ...contact
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteEmergencyContact(id: string) {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// PATIENT DOCUMENTS
// ============================================

export async function addPatientDocument(patientId: string, document: {
  name: string;
  url: string;
}) {
  const { data, error } = await supabase
    .from('patient_documents')
    .insert({
      patient_id: patientId,
      ...document
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePatientDocument(id: string) {
  const { error } = await supabase
    .from('patient_documents')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// SCHEDULES
// ============================================

export async function getSchedules() {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      sub_tasks (*)
    `)
    .order('start_timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getScheduleById(id: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      sub_tasks (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getSchedulesForCaregiver(caregiverId: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      sub_tasks (*)
    `)
    .eq('caregiver_id', caregiverId)
    .order('start_timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getSchedulesForCaregiverOnDate(caregiverId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      sub_tasks (*)
    `)
    .eq('caregiver_id', caregiverId)
    .gte('start_timestamp', dayStart.toISOString())
    .lte('start_timestamp', dayEnd.toISOString())
    .order('start_timestamp');
  
  if (error) throw error;
  return data;
}

export async function getSchedulesForPatient(patientId: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      sub_tasks (*)
    `)
    .eq('patient_id', patientId)
    .order('start_timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function addSchedule(schedule: Database['public']['Tables']['schedules']['Insert']) {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single();
  
  if (error) throw error;
  
  // Add caregiver-patient assignment if not exists
  await supabase
    .from('caregiver_patients')
    .upsert({
      caregiver_id: schedule.caregiver_id,
      patient_id: schedule.patient_id
    }, {
      onConflict: 'caregiver_id,patient_id'
    });
  
  return data;
}

export async function updateSchedule(id: string, updates: Partial<Schedule>) {
  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSchedule(id: string) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function getCompletedSchedules() {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .in('status', ['completed', 'cancelled'])
    .order('start_timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
}

// ============================================
// SUB-TASKS
// ============================================

export async function addSubTask(scheduleId: string, description: string, orderIndex: number = 0) {
  const { data, error } = await supabase
    .from('sub_tasks')
    .insert({
      schedule_id: scheduleId,
      description,
      order_index: orderIndex
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSubTask(id: string, updates: { description?: string; completed?: boolean }) {
  const { data, error } = await supabase
    .from('sub_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSubTask(id: string) {
  const { error } = await supabase
    .from('sub_tasks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// REQUESTS
// ============================================

export async function getAllRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('request_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getRequestsForCaregiver(caregiverId: string) {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .order('request_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function addRequest(request: Database['public']['Tables']['requests']['Insert']) {
  const { data, error } = await supabase
    .from('requests')
    .insert(request)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateRequest(id: string, updates: any) {
  const { data, error } = await supabase
    .from('requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// CONVERSATIONS & MESSAGES
// ============================================

export async function getConversationsForUser(userId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation:conversations (
        *,
        participants:conversation_participants (
          user:users (*)
        )
      )
    `)
    .eq('user_id', userId);
  
  if (error) throw error;
  return data.map(item => item.conversation);
}

export async function getMessagesForConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users (name, profile_picture_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function sendMessage(conversationId: string, senderId: string, text: string, imageUrl?: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      image_url: imageUrl
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update conversation last_message
  await supabase
    .from('conversations')
    .update({
      last_message: text || '[Image]'
    })
    .eq('id', conversationId);
  
  return data;
}

export async function createConversation(createdBy: string, participantIds: string[]) {
  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      created_by: createdBy,
      last_message: ''
    })
    .select()
    .single();
  
  if (convError) throw convError;
  
  // Add participants
  const participants = participantIds.map(userId => ({
    conversation_id: conversation.id,
    user_id: userId
  }));
  
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert(participants);
  
  if (partError) throw partError;
  
  return conversation;
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotificationsForUser(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  
  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', userId)
    .eq('read', false);
  
  if (error) throw error;
}

// ============================================
// CAREGIVER NOTES
// ============================================

export async function addCaregiverNote(note: Database['public']['Tables']['caregiver_notes']['Insert']) {
  const { data, error } = await supabase
    .from('caregiver_notes')
    .insert(note)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getNotesForPatient(patientId: string) {
  const { data, error } = await supabase
    .from('caregiver_notes')
    .select(`
      *,
      caregiver:users (name)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

