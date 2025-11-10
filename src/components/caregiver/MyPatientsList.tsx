// src/components/caregiver/MyPatientsList.tsx
'use client';

import type { Patient, User } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Info, Mail, Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignedPatients, getCaregiverById } from '@/lib/firestore'; // Import getCaregiverById

export default function MyPatientsList() {
  const { user, loading: authLoading } = useAuth();
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch the latest caregiver data to get the most up-to-date patient assignments
      const latestCaregiverData = await getCaregiverById(user.uid);
      
      if (latestCaregiverData && latestCaregiverData.assignedPatientIds && latestCaregiverData.assignedPatientIds.length > 0) {
        const patients = await getAssignedPatients(latestCaregiverData.assignedPatientIds);
        setAssignedPatients(patients);
      } else {
        setAssignedPatients([]); // Ensure the list is empty if no patients are assigned
      }
    } catch (error) {
      console.error("Failed to fetch assigned patients:", error);
      setAssignedPatients([]); // Clear patients on error
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (!authLoading) {
      loadPatients();
    }
  }, [authLoading, loadPatients]);

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading patient data...</span>
      </div>
    );
  }

  if (assignedPatients.length === 0) {
    return <p>No patients are currently assigned to you.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assignedPatients.map((patient) => (
        <Card key={patient.id}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={patient.avatarUrl || '/avatars/patient-placeholder.png'} alt={patient.name} />
              <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{patient.name}</CardTitle>
              <CardDescription>Patient Profile</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.email && (
              <div className="flex items-center text-sm">
                <Mail className="mr-3 h-5 w-5 text-primary" />
                <a href={`mailto:${patient.email}`} className="text-muted-foreground hover:underline">{patient.email}</a>
              </div>
            )}
            {patient.phoneNumber && (
              <div className="flex items-center text-sm">
                <Phone className="mr-3 h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{patient.phoneNumber}</span>
              </div>
            )}
            <Link href={`/caregiver/patient-info/${patient.id}`} className="!mt-4 block">
              <Button className="w-full">
                <Info className="mr-2 h-4 w-4" /> View Full Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
