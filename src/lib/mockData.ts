// src/lib/mockData.ts
import type { Schedule, Patient, User, CaregiverAssignment, Address } from '@/types';
import { format } from 'date-fns';

// --- Raw Mock Data --- //

export const rawMockPatients: Patient[] = [
  { 
    id: 'pt1', 
    name: 'John Doe', 
    email: 'john.doe@example.com', 
    phone: '555-0201', 
    address: { fullAddress: '123 Main St, Anytown, USA', lat: 34.0522, lng: -118.2437 },
    Diagnosis: 'Stable, recovering from flu. Prefers quiet afternoons and enjoys reading newspapers. Allergic to penicillin.', 
    profilePictureUrl: 'https://placehold.co/96x96.png' 
  },
  { 
    id: 'pt2', 
    name: 'Jane Smith', 
    email: 'jane.smith@example.com', 
    phone: '555-0202', 
    address: { fullAddress: '456 Oak Ave, Anytown, USA', lat: 40.7128, lng: -74.0060 },
    Diagnosis: 'Chronic heart condition, requires monitoring. Needs assistance with mobility. Enjoys listening to classical music.', 
    profilePictureUrl: 'https://placehold.co/96x96.png' 
  },
  { 
    id: 'pt3', 
    name: 'Peter Pan', 
    email: 'peter.pan@example.com', 
    phone: '555-0203', 
    address: { fullAddress: '789 Pine Ln, Anytown, USA', lat: 41.8781, lng: -87.6298 },
    Diagnosis: 'Post-surgery recovery for a knee replacement. Requires regular physiotherapy exercises. Favorite snack: apple slices.', 
    profilePictureUrl: 'https://placehold.co/96x96.png' 
  },
  { 
    id: 'pt4', 
    name: 'Mary Poppins', 
    email: 'mary.poppins@example.com', 
    phone: '555-0204', 
    address: { fullAddress: '101 Cherry Tree Ln, Anytown, USA', lat: 37.7749, lng: -122.4194 },
    Diagnosis: 'Diabetes management' 
  },
];

export const rawMockCaregivers: User[] = [
  { uid: 'cg1', role: 'caregiver', name: 'Alice Wonderland', email: 'alice@example.com', phone: '555-0101', profilePictureUrl: 'https://placehold.co/96x96.png' },
  { uid: 'cg2', role: 'caregiver', name: 'Bob The Builder', email: 'bob@example.com', phone: '555-0102', profilePictureUrl: 'https://placehold.co/96x96.png' },
  { uid: 'cg3', role: 'caregiver', name: 'Charlie Chaplin', email: 'charlie@example.com', phone: '555-0103', profilePictureUrl: 'https://placehold.co/96x96.png' },
  { uid: 'cg4', role: 'caregiver', name: 'Diana Prince', email: 'diana@example.com', phone: '555-0104' },
];

export const rawMockCaregiverAssignments: CaregiverAssignment[] = [
  { uid: 'cg1', assignedPatients: ['pt1', 'pt2'] },
  { uid: 'cg2', assignedPatients: ['pt3'] },
];

export const rawMockSchedules: Schedule[] = [
  { 
    id: 'cs1', 
    caregiverId: 'cg1', // Use cg1 for Alice
    patientId: 'pt1', 
    patientName: 'John Doe', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    startTime: '09:50', 
    endTime: '11:50', 
    task: 'Morning medication and breakfast assistance.', 
    status: 'active', 
    gpsLocation: { latitude: 34.0522, longitude: -118.2437 },
    subTasks: [
      { description: 'Administer medication', completed: false },
      { description: 'Prepare breakfast', completed: false },
      { description: 'Assist with eating', completed: false },
      { description: 'Clean up after breakfast', completed: false },
    ],
    notes: '',
  },
  { 
    id: 'cs2', 
    caregiverId: 'cg1', // Use cg1 for Alice
    patientId: 'pt2', 
    patientName: 'Jane Smith', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    startTime: '13:00', 
    endTime: '15:00', 
    task: 'Physical therapy exercises and mobility support.', 
    status: 'pending', 
    gpsLocation: { latitude: 34.0522, longitude: -118.2437 },
    subTasks: [
      { description: 'Warm-up exercises', completed: false },
      { description: 'Assisted walking (15 mins)', completed: false },
      { description: 'Stretching', completed: false },
    ],
    notes: '',
  },
  { 
    id: 'cs3', 
    caregiverId: 'cg2', // Use cg2 for Bob
    patientId: 'pt3', 
    patientName: 'Peter Pan', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    startTime: '16:00', 
    endTime: '17:00', 
    task: 'Companionship and light housekeeping.', 
    status: 'pending', 
    gpsLocation: { latitude: 34.0522, longitude: -118.2437 },
    subTasks: [
      { description: 'Engage in conversation', completed: false },
      { description: 'Dusting and tidying common areas', completed: false },
      { description: 'Meal prep for dinner', completed: false },
    ],
    notes: '',
  },
  { id: 'cs4', caregiverId: 'cg3', patientId: 'pt4', patientName: 'Mary Poppins', date: format(new Date(), 'yyyy-MM-dd'), startTime: '10:00', endTime: '12:00', task: 'Vital signs check.', status: 'pending' },
];

// --- Utility Functions --- //

const getDataFromLocalStorage = <T>(key: string, rawData: T): T => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      try {
        return JSON.parse(storedData) as T;
      } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        // Fallback to raw if parsing fails and re-initialize localStorage
        localStorage.setItem(key, JSON.stringify(rawData));
        return rawData;
      }
    }
    // Initialize localStorage if it's empty
    localStorage.setItem(key, JSON.stringify(rawData));
    return rawData;
  }
  return rawData; // Fallback for server-side
};

const saveDataToLocalStorage = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage`, e);
    }
  }
};

// --- Schedule Functions --- //

export const getMockSchedules = (): Schedule[] => {
  const schedules = getDataFromLocalStorage<Schedule[]>('mockSchedules', rawMockSchedules);
   // Ensure all schedules from storage have subTasks and notes for type safety
  return schedules.map(s => ({
    ...s,
    subTasks: s.subTasks || [], // Default to empty array if missing
    notes: s.notes || '', // Default to empty string if missing
  }));
};

export const updateMockSchedule = (updatedSchedule: Schedule): void => {
  const currentSchedules = getMockSchedules();
  const schedulesWithoutUpdated = currentSchedules.filter(s => s.id !== updatedSchedule.id);
  const updatedSchedules = [...schedulesWithoutUpdated, updatedSchedule];
  saveDataToLocalStorage('mockSchedules', updatedSchedules);
};

// Removed deprecated updateMockScheduleStatus

// --- Patient Functions --- //

export const getMockPatients = (): Patient[] => {
  return getDataFromLocalStorage<Patient[]>('mockPatients', rawMockPatients);
};

export const updateMockPatient = (updatedPatient: Patient): void => {
   const currentPatients = getMockPatients();
   const patientsWithoutUpdated = currentPatients.filter(p => p.id !== updatedPatient.id);
   const updatedPatients = [...patientsWithoutUpdated, updatedPatient];
   saveDataToLocalStorage('mockPatients', updatedPatients);
};

export const addMockPatient = (newPatient: Patient): void => {
    const currentPatients = getMockPatients();
    const updatedPatients = [...currentPatients, newPatient];
    saveDataToLocalStorage('mockPatients', updatedPatients);
};

// --- Caregiver Functions --- //

export const getMockCaregivers = (): User[] => {
  return getDataFromLocalStorage<User[]>('mockCaregivers', rawMockCaregivers);
};

export const updateMockCaregiver = (updatedCaregiver: User): void => {
    const currentCaregivers = getMockCaregivers();
    const caregiversWithoutUpdated = currentCaregivers.filter(cg => cg.uid !== updatedCaregiver.uid);
    const updatedCaregivers = [...caregiversWithoutUpdated, updatedCaregiver];
    saveDataToLocalStorage('mockCaregivers', updatedCaregivers);
};

export const addMockCaregiver = (newCaregiver: User): void => {
    const currentCaregivers = getMockCaregivers();
    const updatedCaregivers = [...currentCaregivers, newCaregiver];
    saveDataToLocalStorage('mockCaregivers', updatedCaregivers);
};

// --- Caregiver Assignment Functions --- //

export const getMockCaregiverAssignments = (): CaregiverAssignment[] => {
    return getDataFromLocalStorage<CaregiverAssignment[]>('mockCaregiverAssignments', rawMockCaregiverAssignments);
};

export const updateMockCaregiverAssignments = (updatedAssignments: CaregiverAssignment[]): void => {
    saveDataToLocalStorage('mockCaregiverAssignments', updatedAssignments);
};
