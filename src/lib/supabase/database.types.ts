/**
 * Database Types
 * 
 * Auto-generated types from Supabase schema.
 * Generate with: supabase gen types typescript --local > src/lib/supabase/database.types.ts
 * 
 * This is a placeholder - actual types will be generated after running migrations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string | null
          name: string
          email: string
          role: 'admin' | 'caregiver' | 'patient'
          phone: string | null
          status: 'active' | 'inactive' | null
          position: 'Full-time' | 'Part-time' | null
          status_effective_date: string | null
          position_effective_date: string | null
          rate_per_hour: number | null
          profile_picture_url: string | null
          date_of_birth: string | null
          gender: 'Male' | 'Female' | 'Other' | null
          pin: string | null
          fingerprint_enabled: boolean | null
          last_login: string | null
          cancellation_bonus: number | null
          address_street: string | null
          address_city: string | null
          address_state: string | null
          address_postal_code: string | null
          address_country: string | null
          address_full: string | null
          address_lat: number | null
          address_lng: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          auth_id?: string | null
          name: string
          email: string
          role?: 'admin' | 'caregiver' | 'patient'
          phone?: string | null
          status?: 'active' | 'inactive' | null
          position?: 'Full-time' | 'Part-time' | null
          status_effective_date?: string | null
          position_effective_date?: string | null
          rate_per_hour?: number | null
          profile_picture_url?: string | null
          date_of_birth?: string | null
          gender?: 'Male' | 'Female' | 'Other' | null
          pin?: string | null
          fingerprint_enabled?: boolean | null
          last_login?: string | null
          cancellation_bonus?: number | null
          address_street?: string | null
          address_city?: string | null
          address_state?: string | null
          address_postal_code?: string | null
          address_country?: string | null
          address_full?: string | null
          address_lat?: number | null
          address_lng?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          auth_id?: string | null
          name?: string
          email?: string
          role?: 'admin' | 'caregiver' | 'patient'
          phone?: string | null
          status?: 'active' | 'inactive' | null
          position?: 'Full-time' | 'Part-time' | null
          status_effective_date?: string | null
          position_effective_date?: string | null
          rate_per_hour?: number | null
          profile_picture_url?: string | null
          date_of_birth?: string | null
          gender?: 'Male' | 'Female' | 'Other' | null
          pin?: string | null
          fingerprint_enabled?: boolean | null
          last_login?: string | null
          cancellation_bonus?: number | null
          address_street?: string | null
          address_city?: string | null
          address_state?: string | null
          address_postal_code?: string | null
          address_country?: string | null
          address_full?: string | null
          address_lat?: number | null
          address_lng?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          date_of_birth: string
          age: number | null
          gender: string | null
          email: string | null
          phone: string | null
          profile_picture_url: string | null
          address_street: string | null
          address_city: string | null
          address_state: string | null
          address_postal_code: string | null
          address_country: string | null
          address_full: string | null
          address_lat: number | null
          address_lng: number | null
          diagnosis: string | null
          discharge_plan: string | null
          family_comment: string | null
          evaluation: string | null
          medications_list: string | null
          interdisciplinary_team_notes: string | null
          medical_appointments: string | null
          emergency_disaster_plans: string | null
          community_resources: string | null
          client_comments: string | null
          doctors_notes: string | null
          special_notes: string | null
          alloted_time: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          date_of_birth: string
          gender?: string | null
          email?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          address_street?: string | null
          address_city?: string | null
          address_state?: string | null
          address_postal_code?: string | null
          address_country?: string | null
          address_full?: string | null
          address_lat?: number | null
          address_lng?: number | null
          diagnosis?: string | null
          discharge_plan?: string | null
          family_comment?: string | null
          evaluation?: string | null
          medications_list?: string | null
          interdisciplinary_team_notes?: string | null
          medical_appointments?: string | null
          emergency_disaster_plans?: string | null
          community_resources?: string | null
          client_comments?: string | null
          doctors_notes?: string | null
          special_notes?: string | null
          alloted_time?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          date_of_birth?: string
          gender?: string | null
          email?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          address_street?: string | null
          address_city?: string | null
          address_state?: string | null
          address_postal_code?: string | null
          address_country?: string | null
          address_full?: string | null
          address_lat?: number | null
          address_lng?: number | null
          diagnosis?: string | null
          discharge_plan?: string | null
          family_comment?: string | null
          evaluation?: string | null
          medications_list?: string | null
          interdisciplinary_team_notes?: string | null
          medical_appointments?: string | null
          emergency_disaster_plans?: string | null
          community_resources?: string | null
          client_comments?: string | null
          doctors_notes?: string | null
          special_notes?: string | null
          alloted_time?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      schedules: {
        Row: {
          id: string
          caregiver_id: string
          caregiver_name: string
          patient_id: string
          patient_name: string
          start_timestamp: string
          end_timestamp: string
          task: string
          status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'missed' | 'overtime' | null
          notes: string | null
          clock_in: string | null
          clock_out: string | null
          total_hours: number | null
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          caregiver_id: string
          caregiver_name: string
          patient_id: string
          patient_name: string
          start_timestamp: string
          end_timestamp: string
          task: string
          status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'missed' | 'overtime' | null
          notes?: string | null
          clock_in?: string | null
          clock_out?: string | null
          total_hours?: number | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          caregiver_id?: string
          caregiver_name?: string
          patient_id?: string
          patient_name?: string
          start_timestamp?: string
          end_timestamp?: string
          task?: string
          status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'missed' | 'overtime' | null
          notes?: string | null
          clock_in?: string | null
          clock_out?: string | null
          total_hours?: number | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      // Add other tables as needed...
      [key: string]: any
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'caregiver' | 'patient'
      user_status: 'active' | 'inactive'
      position_type: 'Full-time' | 'Part-time'
      gender_type: 'Male' | 'Female' | 'Other'
      schedule_status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'missed' | 'overtime'
      request_type: 'cancellation' | 'overtime'
      request_status: 'pending' | 'approved' | 'denied'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

