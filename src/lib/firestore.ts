
// src/lib/firestore.ts
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, documentId, orderBy, limit, arrayUnion } from "firebase/firestore";
import { db } from './firebase';
import type { User, Patient, Schedule, Message, Report, SubTask, CaregiverNote, Request } from '@/types';
import { startOfDay, endOfDay, addDays } from 'date-fns';


// Users
export const getAllUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getAdminsAndCaregivers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('role', '!=', 'patient'));
    const userSnapshot = await getDocs(q);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const updateUser = async (id: string, updates: Partial<User>) => {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, updates);
};

export const getCaregivers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('role', '==', 'caregiver'));
    const userSnapshot = await getDocs(q);
    return userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
};

export const getCaregiverById = async (uid: string): Promise<User | null> => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } as User : null;
};

// Patients
export const getAllPatients = async (): Promise<Patient[]> => {
    const patientsCol = collection(db, 'patients');
    const patientSnapshot = await getDocs(patientsCol);
    return patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
};

export const addPatient = async (patient: Omit<Patient, 'id'>) => {
    const patientsCol = collection(db, 'patients');
    const docRef = await addDoc(patientsCol, patient);
    return docRef.id;
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
    const patientRef = doc(db, 'patients', id);
    await updateDoc(patientRef, updates);
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
    const docRef = doc(db, 'patients', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Patient : null;
};

export const getAssignedPatients = async (patientIds: string[]): Promise<Patient[]> => {
    if (!patientIds || patientIds.length === 0) {
        return [];
    }
    const patientsCol = collection(db, 'patients');
    const q = query(patientsCol, where(documentId(), 'in', patientIds));
    const patientSnapshot = await getDocs(q);
    return patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
};

export const addPatientDocument = async (patientId: string, documentName: string, documentUrl: string) => {
  const patientRef = doc(db, 'patients', patientId);
  await updateDoc(patientRef, {
    documents: arrayUnion({ name: documentName, url: documentUrl })
  });
};

export const deletePatientDocument = async (patientId: string, documentUrl: string) => {
  const patientRef = doc(db, 'patients', patientId);
  const patientSnap = await getDoc(patientRef);

  if (!patientSnap.exists()) {
    return;
  }

  const patientData = patientSnap.data();
  const documents = Array.isArray(patientData.documents) ? patientData.documents : [];
  const updatedDocuments = documents.filter((document: { url?: string }) => document?.url !== documentUrl);

  await updateDoc(patientRef, {
    documents: updatedDocuments
  });
};

// Schedules
export const getSchedules = async (): Promise<Schedule[]> => {
    const schedulesCol = collection(db, 'schedules');
    const scheduleSnapshot = await getDocs(schedulesCol);
    return scheduleSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
        } as Schedule;
    });
};

export const getRecentSchedules = async (count: number = 5): Promise<Schedule[]> => {
    const schedulesCol = collection(db, 'schedules');
    const q = query(schedulesCol, orderBy('startTimestamp', 'desc'), limit(count));
    const scheduleSnapshot = await getDocs(q);
    return scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
};

export const getSchedulesForCaregiver = async (caregiverId: string): Promise<Schedule[]> => {
    const schedulesCol = collection(db, 'schedules');
    const q = query(schedulesCol, where('caregiverId', '==', caregiverId));
    const scheduleSnapshot = await getDocs(q);
    return scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
};

export const getSchedulesForCaregiverForWeek = async (caregiverId: string, startDate: Date): Promise<Schedule[]> => {
    const schedulesCol = collection(db, 'schedules');
    const endDate = addDays(startDate, 7);

    const q = query(schedulesCol,
        where('caregiverId', '==', caregiverId),
        where('startTimestamp', '>=', startOfDay(startDate)),
        where('startTimestamp', '<=', endOfDay(endDate)),
        orderBy('startTimestamp', 'asc')
    );
    const scheduleSnapshot = await getDocs(q);
    return scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
};


export const addSchedule = async (schedule: Omit<Schedule, 'id'>) => {
    const batch = writeBatch(db);

    const scheduleRef = doc(collection(db, 'schedules'));
    batch.set(scheduleRef, schedule);

    const caregiverRef = doc(db, 'users', schedule.caregiverId);
    batch.update(caregiverRef, {
        assignedPatientIds: arrayUnion(schedule.patientId)
    });

    await batch.commit();

    return scheduleRef.id;
};

export const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    const scheduleRef = doc(db, 'schedules', id);
    await updateDoc(scheduleRef, updates);
};

export const deleteSchedule = async (id: string) => {
    const scheduleRef = doc(db, 'schedules', id);
    await deleteDoc(scheduleRef);
};

export const getSchedulesForCaregiverOnDate = async (caregiverId: string, date: Date): Promise<Schedule[]> => {
    const schedulesCol = collection(db, 'schedules');
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const q = query(schedulesCol, 
        where('caregiverId', '==', caregiverId), 
        where('startTimestamp', '>=', dayStart),
        where('startTimestamp', '<=', dayEnd)
    );
    const scheduleSnapshot = await getDocs(q);
    return scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
};


export const getSchedulesForPatient = async (patientId: string): Promise<Schedule[]> => {
    const schedulesCol = collection(db, 'schedules');
    const q = query(schedulesCol, where('patientId', '==', patientId));
    const scheduleSnapshot = await getDocs(q);
    return scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
};

export const getScheduleById = async (id: string): Promise<Schedule | null> => {
    const docRef = doc(db, 'schedules', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return { id: docSnap.id, ...data } as Schedule;
};

export const getCompletedSchedules = async (): Promise<Schedule[]> => {
    const schedulesCol = collection(db, 'schedules');
    const q = query(schedulesCol, where('status', 'in', ['completed', 'cancelled']));
    const scheduleSnapshot = await getDocs(q);
    return scheduleSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
        } as Schedule;
    });
};

// Requests
export const addRequest = async (requestData: Omit<Request, 'id'>) => {
    const requestsCol = collection(db, 'requests');
    const docRef = await addDoc(requestsCol, requestData);
    return docRef.id;
};

export const getRequestsForCaregiver = async (caregiverId: string): Promise<Request[]> => {
    const requestsCol = collection(db, 'requests');
    const q = query(requestsCol, where('caregiverId', '==', caregiverId), orderBy('requestDate', 'desc'));
    const requestSnapshot = await getDocs(q);
    return requestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
};

export const getAllRequests = async (): Promise<Request[]> => {
    const requestsCol = collection(db, 'requests');
    const q = query(requestsCol, orderBy('requestDate', 'desc'));
    const requestSnapshot = await getDocs(q);
    return requestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
};

export const updateRequest = async (id: string, updates: Partial<Request>) => {
    const requestRef = doc(db, 'requests', id);
    await updateDoc(requestRef, updates);
};
