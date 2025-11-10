// src/components/caregiver/CaregiverScheduleManager.tsx
'use client';

import type { Schedule, Patient, Address } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfDay } from 'date-fns';
import { Clock, UserIcon, MapPin, Loader2, AlertTriangle, Briefcase, HomeIcon, ListChecks } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getSchedulesForCaregiver, getAssignedPatients } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Timestamp } from 'firebase/firestore';

export default function CaregiverScheduleManager() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [patientsMap, setPatientsMap] = useState<Map<string, Patient>>(new Map());
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const fetchSchedulesAndPatients = useCallback(async () => {
    if (!user?.uid) {
      setIsLoadingSchedules(false);
      return;
    }
    setIsLoadingSchedules(true);
    setError(null);

    try {
      const caregiverSchedules = await getSchedulesForCaregiver(user.uid);
      setSchedules(caregiverSchedules);
      setIsLoadingSchedules(false); // Schedules loaded

      if (caregiverSchedules.length > 0) {
        setIsLoadingPatients(true);
        const patientIds = [...new Set(caregiverSchedules.map(s => s.patientId))];
        if (patientIds.length > 0) {
          try {
            const patientDetails = await getAssignedPatients(patientIds);
            const newPatientMap = new Map(patientDetails.map(p => [p.id, p]));
            setPatientsMap(newPatientMap);
          } catch (patientError) {
            console.error("Error fetching patient details:", patientError);
            setError("Failed to load patient data.");
            toast({
              title: "Error Loading Patient Data",
              description: "Could not retrieve details for associated patients. Some information may be missing.",
              variant: "destructive",
            });
          }
        }
        setIsLoadingPatients(false);
      } else {
        setPatientsMap(new Map()); // No schedules, so no patients to fetch
      }
    } catch (scheduleError) {
      console.error("Error fetching schedules:", scheduleError);
      setError("Failed to load schedule data.");
      toast({
        title: "Error Loading Schedules",
        description: "Could not retrieve your schedule information. Please try again later.",
        variant: "destructive",
      });
      setIsLoadingSchedules(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSchedulesAndPatients();
  }, [fetchSchedulesAndPatients]);

  const scheduledDays = useMemo(() => {
    return new Set(
      schedules
        .map(schedule => (schedule.startTimestamp ? startOfDay(schedule.startTimestamp.toDate()).getTime() : null))
        .filter(Boolean)
    );
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDayStart = startOfDay(selectedDate).getTime();
    return schedules.filter(schedule => {
      const scheduleDate = schedule.startTimestamp?.toDate();
      return scheduleDate && startOfDay(scheduleDate).getTime() === selectedDayStart;
    });
  }, [schedules, selectedDate]);

  const isLoading = isLoadingSchedules || isLoadingPatients;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              modifiers={{ hasSchedule: (date) => scheduledDays.has(startOfDay(date).getTime()) }}
              modifiersClassNames={{ hasSchedule: 'has-schedule' }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
              <CardTitle>Schedules for {selectedDate ? format(selectedDate, 'PPP') : 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSchedules ? (
                <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading schedules...</div>
              ) : error && !schedules.length ? ( // Show general error if schedules didn't load at all
                 <div className="flex items-center text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" /> {error}
                </div>
              ) : filteredSchedules.length > 0 ? (
                <ul className="space-y-4">
                  {filteredSchedules.map((schedule) => {
                    const patient = patientsMap.get(schedule.patientId);
                    return <ScheduleListItem 
                                key={schedule.id} 
                                schedule={schedule} 
                                patient={patient} 
                                isLoadingPatient={isLoadingPatients && !patient}
                            />;
                  })}
                  {isLoadingPatients && <li className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading patient details...</li>}
                  {error && schedules.length > 0 && !isLoadingPatients && ( // Show specific patient load error if schedules loaded but patients didn't
                     <li className="flex items-center text-destructive mt-4">
                        <AlertTriangle className="mr-2 h-4 w-4" /> {error}
                     </li>
                  )}
                </ul>
              ) : (
                <p className="text-muted-foreground">No schedules for this date.</p>
              )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ScheduleListItemProps {
    schedule: Schedule;
    patient?: Patient;
    isLoadingPatient?: boolean;
}

const ScheduleListItem = ({
    schedule,
    patient,
    isLoadingPatient,
}: ScheduleListItemProps) => {

    const formatAddress = (address: Address | undefined) => {
        if (!address) return 'Address not available';
        if (address.fullAddress) {
          return address.fullAddress;
        }
        const { street, city, state, postalCode, country } = address;
        const parts = [street, city, state, postalCode, country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Address not available';
    };
    const displayAddress = formatAddress(patient?.address);

    const formatTimestamp = (ts: Timestamp | undefined, formatStr: string) => {
        if (!ts) return 'N/A';
        return format(ts.toDate(), formatStr);
    };

    return (
        <li className="rounded-lg border p-4 shadow-sm">
            <h3 className="font-semibold text-lg">
                {patient?.name || schedule.patientName || "Loading patient..."}
            </h3>
            <Dialog>
                <DialogTrigger asChild>
                    <p className="text-sm text-blue-600 font-semibold flex items-center mt-2 cursor-pointer hover:underline hover:text-blue-800">
                        <Briefcase className="mr-2 h-4 w-4 text-primary" /> Task Details
                    </p>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Task Details</DialogTitle>
                        <DialogDescription>
                            Information about the scheduled task.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-primary" />
                            <span>Patient: {patient && patient.id ? (
                                <Link href={`/caregiver/patient-info/${patient.id}`} className="hover:underline text-blue-600 font-semibold">
                                    {patient.name || schedule.patientName}
                                </Link>
                                ) : (
                                <span>{patient?.name || schedule.patientName}</span>
                            )}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>Time: {formatTimestamp(schedule.startTimestamp, 'p')} - {formatTimestamp(schedule.endTimestamp, 'p')}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Briefcase className="h-4 w-4 text-primary mt-1" />
                            <div className="flex-1">
                                <p className="font-semibold">Task Description:</p>
                                <p>{schedule.task}</p>
                            </div>
                        </div>
                        {schedule.subTasks && schedule.subTasks.length > 0 && (
                            <div className="flex items-start space-x-2">
                                <ListChecks className="h-4 w-4 text-primary mt-1" />
                                <div className="flex-1">
                                    <p className="font-semibold">Sub-Tasks:</p>
                                    <ul className="list-disc pl-5">
                                        {schedule.subTasks.map((subTask, index) => (
                                            <li key={index} className={cn(subTask.completed && "line-through text-muted-foreground")}>
                                                {subTask.description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {schedule.notes && (
                            <div className="flex items-start space-x-2">
                                <MapPin className="h-4 w-4 text-primary mt-1" />
                                <div className="flex-1">
                                    <p className="font-semibold">Notes:</p>
                                    <p>{schedule.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {isLoadingPatient ? (
                 <p className="text-sm text-muted-foreground flex items-center mt-1"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading address...</p>
            ) : (
                 <p className="text-sm text-muted-foreground flex items-center mt-1"><HomeIcon className="mr-2 h-4 w-4 text-primary" /> {displayAddress}</p>
            )}
            <p className="text-sm text-muted-foreground flex items-center mt-1"><Clock className="mr-2 h-4 w-4 text-primary" /> {formatTimestamp(schedule.startTimestamp, 'p')} - {formatTimestamp(schedule.endTimestamp, 'p')}</p>
            <p className="text-xs mt-2 capitalize">Status: <span className={cn(schedule.status === 'pending' && 'text-yellow-600', schedule.status === 'active' && 'text-green-600', schedule.status === 'completed' && 'text-blue-600')}>{schedule.status}</span></p>
        </li>
    );
}
