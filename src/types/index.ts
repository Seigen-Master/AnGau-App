
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'caregiver' | 'patient';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  profilePictureUrl?: string;
  fingerprintEnabled?: boolean;
  pin?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedPatientIds?: string[];
  pin?: string;
  lastLogin?: Timestamp;
  status?: 'active' | 'inactive';
  position?: 'Full-time' | 'Part-time';
  statusEffectiveDate?: Timestamp;
  positionEffectiveDate?: Timestamp;
  ratePerHour?: number;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  address?: Address;
  [key: string]: any;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  address: Address;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'male' | 'female';
  profilePictureUrl?: string;
  Diagnosis?: string;
  dischargePlan?: string;
  familyComment?: string;
  evaluation?: string;
  medicationsList?: string;
  emergencyContacts?: EmergencyContact[];
  interdisciplinaryTeamNotes?: string;
  medicalAppointments?: string;
  emergencyDisasterPlans?: string;
  communityResources?: string;
  clientComments?: string;
  doctorsNotes?: string;
  specialNotes?: string;
  allotedTime?: string;
  documents?: { name: string; url: string; }[]; 
  [key: string]: any; 
}

export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  fullAddress?: string;
  lat?: number;
  lng?: number;
}

export interface Schedule {
  id: string;
  caregiverId: string;
  caregiverName: string;
  patientId: string;
  patientName: string;
  startTimestamp: Timestamp;
  endTimestamp: Timestamp;
  task: string;
  subTasks?: SubTask[];
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'missed' | 'overtime';
  notes?: string;
  clockIn?: Timestamp;
  clockOut?: Timestamp;
  totalHours?: number;
  gpsLocation?: {
    clockIn: { lat: number; lng: number };
    clockOut?: { lat: number; lng: number };
  };
  [key: string]: any;
}

export interface SubTask {
  id?: string;
  description: string;
  completed: boolean;
}

export interface Request {
    id: string;
    caregiverId: string;
    caregiverName: string;
    patientId: string;
    patientName: string;
    scheduleId: string;
    type: 'cancellation' | 'overtime';
    status: 'pending' | 'approved' | 'denied';
    requestDate: Timestamp;
    reason: string;
    overtimeHours?: number;
    overtimeMinutes?: number;
    approvedOvertime?: {
        hours: number;
        minutes: number;
    };
    adminId?: string;
    denialReason?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Report {
  id: string;
  generatedBy: string;
  generatedDate: Timestamp;
  type: 'caregiver_performance' | 'patient_summary' | 'billing';
  data: any;
}

export interface CaregiverNote {
    id: string;
    caregiverId: string;
    patientId: string;
    scheduleId?: string;
    timestamp: Timestamp;
    note: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: string;
  resourceId: string; // e.g., scheduleId, messageId, requestId
  read: boolean;
  timestamp: Timestamp;
  content?: string;
}
