// src/app/(app)/caregiver/patient-info/[patientId]/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import PatientDetailCard from '@/components/caregiver/PatientDetailCard';
import type { Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getPatientById } from '@/lib/firestore';
import { useEffect, useState, useCallback } from 'react';

interface PatientInfoPageProps {
  params: { patientId: string };
}

export default function PatientInfoPage({ params }: PatientInfoPageProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchPatient = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const foundPatient = await getPatientById(params.patientId);
        if (foundPatient) {
          setPatient(foundPatient);
        } else {
          setError("Patient not found.");
        }
      } catch (error) {
        console.error("Error fetching patient:", error);
        setError("Failed to load patient details. You may not have permission to view this page.");
      } finally {
        setIsLoading(false);
      }
    }, [params.patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading patient details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={patient ? `${patient.name}'s Profile` : "Patient Not Found"}
        description={patient ? `Medical history and details for ${patient.name}.` : "The requested patient could not be found."}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>
      
      {error && <div className="p-4 text-center text-red-600 bg-red-100 rounded-md">{error}</div>}
      
      {patient ? <PatientDetailCard patient={patient} /> : !error && <p>No patient data available.</p>}
    </div>
  );
}
