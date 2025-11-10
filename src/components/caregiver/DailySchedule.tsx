
'use client';

import type { Schedule, Patient, Address, Request } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, HomeIcon, ListChecks, Info, Eye, Loader2, CheckCircle2, XCircle, Briefcase, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getSchedulesForCaregiverOnDate, getAssignedPatients, getRequestsForCaregiver } from '@/lib/firestore';
import { format, parse, differenceInMinutes } from 'date-fns';
import { useHttpsCallable } from '@/hooks/use-https-callable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PatientMapDialog from './PatientMapDialog';
import { getCurrentLocation } from '@/lib/geolocation';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

const PROXIMITY_THRESHOLD_METERS = 70;

interface LatLng {
  lat: number;
  lng: number;
}

interface ScheduleCardProps {
  schedule: Schedule;
  patient?: Patient;
  onRefresh: () => void;
  onViewMap: (scheduleId: string, patientAddress: Address, patientName: string) => void;
  currentDistance: number | null;
}

const ScheduleCard = ({ schedule, patient, onRefresh, onViewMap, currentDistance }: ScheduleCardProps) => {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const { callFunction, isLoading } = useHttpsCallable('caregiverClockInOut');

  // Safely get start and end times, falling back to current date if timestamp is invalid
  const startTime = schedule.startTimestamp instanceof Timestamp ? schedule.startTimestamp.toDate() : new Date();
  const endTime = schedule.endTimestamp instanceof Timestamp ? schedule.endTimestamp.toDate() : new Date();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleClockInOut = async (scheduleId: string, type: 'clockIn' | 'clockOut') => {
    try {
      const clockInReadyTime = new Date(startTime.getTime() - 5 * 60 * 1000);
      const clockOutReadyTime = new Date(endTime.getTime() + 5 * 60 * 1000);

      const isClockInAllowedByTime = now >= clockInReadyTime;
      const isClockOutAllowedByTime = now >= clockOutReadyTime;

      if (type === 'clockIn' && !isClockInAllowedByTime) {
        toast({ title: "Clock In Not Yet Allowed", description: `You can clock in after ${format(clockInReadyTime, 'p')}.`, variant: "destructive" });
        return;
      }
      if (type === 'clockOut' && !isClockOutAllowedByTime) {
          toast({ title: "Clock Out Not Yet Allowed", description: `You can clock out after ${format(clockOutReadyTime, 'p')}.`, variant: "destructive" });
          return;
      }
      if (currentDistance === null || currentDistance > PROXIMITY_THRESHOLD_METERS) {
          toast({ title: `${type === 'clockIn' ? 'Clock In' : 'Clock Out'} Failed`, description: `You must be within ${PROXIMITY_THRESHOLD_METERS} meters of the patient's address.`, variant: "destructive" });
          return;
      }

      await callFunction({ scheduleId, action: type });
      toast({ title: "Success", description: `Successfully clocked ${type === 'clockIn' ? 'in' : 'out'}.` });
      if (type === 'clockIn') router.push(`/caregiver/task/${scheduleId}`);
      else onRefresh();

    } catch (err: any) {
      console.error(`Error clocking ${type}:`, err);
      toast({ title: `Error Clocking ${type === 'clockIn' ? 'In' : 'Out'}`, description: err.message || 'An unexpected error occurred.', variant: "destructive" });
    }
  };

  const formatAddress = (address: Address | undefined) => {
    if (!address) return 'Address not available';
    if (address.fullAddress) return address.fullAddress;
    return [address.street, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ');
  };
  
  const isUpcoming = schedule.status === 'pending';
  const isActive = schedule.status === 'active';
  const isCompleted = schedule.status === 'completed';
  const isCancelled = schedule.status === 'cancelled';
  const isOvertime = schedule.status === 'overtime';
  const displayAddress = formatAddress(patient?.address);

  return (
    <Card className={cn(isActive && "border-primary shadow-lg", isCompleted && "opacity-70", isCancelled && "bg-red-50 border-red-200")}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{schedule.patientName}</CardTitle>
          <div className="flex items-center space-x-2">
            <Link href={`/caregiver/patient-info/${schedule.patientId}`}><Button variant="secondary" size="sm"><Info className="mr-2 h-4 w-4" />Details</Button></Link>
            {patient?.address && <Button variant="outline" size="sm" onClick={() => onViewMap(schedule.id, patient.address!, schedule.patientName)}><MapPin className="mr-2 h-4 w-4 text-red-500" /> Map</Button>}
          </div>
        </div>
        <CardDescription className="flex flex-col gap-y-1 text-sm">
           {patient?.phone && <span className="flex items-center"><Phone className="mr-2 h-4 w-4 text-primary" />{patient.phone}</span>}
          <div className="flex items-center"><HomeIcon className="mr-2 h-4 w-4 text-primary" /><span>{displayAddress}</span></div>
          <div className="flex items-start"><ListChecks className="mr-2 h-4 w-4 text-primary mt-[3px] shrink-0" />{schedule.subTasks?.length > 0 ? <div className="text-muted-foreground"><span className="font-medium text-foreground">Tasks:</span><ul className="list-disc list-inside ml-1">{schedule.subTasks.map((st, idx) => <li key={idx}>{st.description}</li>)}</ul></div> : <span className="text-muted-foreground">No specific tasks listed.</span>}</div>
          <span className="flex items-center"><Clock className="mr-2 h-4 w-4 text-primary" />{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')} {isOvertime && <span className="ml-2 px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Overtime</span>}</span>
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between items-center">
        <div><span className={cn("text-sm font-semibold capitalize", isActive && "text-green-600", isUpcoming && "text-yellow-600", isCompleted && "text-gray-500", isCancelled && "text-red-500", isOvertime && "text-blue-600")}>Status: {schedule.status}</span></div>
        <div className="flex items-center space-x-2">
          {isUpcoming && (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={() => handleClockInOut(schedule.id, 'clockIn')} disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Clock In
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Click to Clock In</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          )}
          {(isActive || isOvertime) && !isCancelled && (
            <div className="flex items-center space-x-2">
              <Button onClick={() => router.push(`/caregiver/task/${schedule.id}`)} variant="outline"><Eye className="mr-2 h-4 w-4" /> View Task</Button>
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                           <Button onClick={() => handleClockInOut(schedule.id, 'clockOut')} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white">
                               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Clock Out
                           </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Click to Clock Out</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {isCompleted && <span className="text-sm text-green-600 flex items-center"><CheckCircle2 className="mr-1 h-4 w-4" /> Shift Completed</span>}
          {isCancelled && <span className="text-sm text-red-600 flex items-center"><XCircle className="mr-1 h-4 w-4" /> Shift Cancelled</span>}
        </div>
      </CardFooter>
    </Card>
  );
};

export default function DailySchedule() {
  const { user } = useAuth();
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapAddress, setMapAddress] = useState('');
  const [mapPatientName, setMapPatientName] = useState('');
  const [mapPatientLocation, setMapPatientLocation] = useState<LatLng | null>(null);
  const [currentMapScheduleId, setCurrentMapScheduleId] = useState<string | null>(null);
  const [caregiverLocation, setCaregiverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [scheduleDistances, setScheduleDistances] = useState<{ [scheduleId: string]: number | null }>({});
  const { toast } = useToast();

  const statusOrder: { [key: string]: number } = { 'active': 1, 'overtime': 1, 'pending': 2, 'completed': 3, 'missed': 4, 'cancelled': 5 };

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const schedules = await getSchedulesForCaregiverOnDate(user.uid, new Date());
      setTodaySchedules(schedules);
      
      if (schedules.length > 0) {
        const patientIds = [...new Set(schedules.map(s => s.patientId))];
        const patients = await getAssignedPatients(patientIds);
        setAssignedPatients(patients);

        const caregiverRequests = await getRequestsForCaregiver(user.uid);
        const scheduleIds = schedules.map(s => s.id);
        const todayRequests = caregiverRequests.filter(r => scheduleIds.includes(r.scheduleId));
        setRequests(todayRequests);
      } else {
        setAssignedPatients([]);
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const processedSchedules = useMemo(() => {
    const requestsMap = new Map<string, Request>();
    requests.forEach(req => {
        if (req.status === 'approved') {
            requestsMap.set(req.scheduleId, req);
        }
    });

    return todaySchedules.map(schedule => {
        const request = requestsMap.get(schedule.id);
        if (request) {
            if (request.type === 'cancellation') {
                return { ...schedule, status: 'cancelled' };
            } else if (request.type === 'overtime') {
                return { ...schedule, status: schedule.status === 'active' ? 'overtime' : schedule.status };
            }
        }
        return schedule;
    });
}, [todaySchedules, requests]);

  const sortedSchedules = useMemo(() => {
    return [...processedSchedules].sort((a, b) => {
      // Safely get start timestamps for comparison
      const aStartMillis = a.startTimestamp instanceof Timestamp ? a.startTimestamp.toMillis() : 0;
      const bStartMillis = b.startTimestamp instanceof Timestamp ? b.startTimestamp.toMillis() : 0;

      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return aStartMillis - bStartMillis;
    });
  }, [processedSchedules]);

  const handleViewMap = async (scheduleId: string, patientAddress: Address, patientName: string) => {
    if (!patientAddress?.lat || !patientAddress?.lng) {
      toast({ title: "Map Error", description: "Patient address coordinates are not available.", variant: "destructive" });
      setScheduleDistances(prev => ({ ...prev, [scheduleId]: Infinity }));
      return;
    }

    setMapAddress(patientAddress.fullAddress || [patientAddress.street, patientAddress.city, patientAddress.state, patientAddress.postalCode].filter(Boolean).join(', '));
    setMapPatientName(patientName);
    setMapPatientLocation({ lat: patientAddress.lat, lng: patientAddress.lng });
    setCurrentMapScheduleId(scheduleId);
    setIsMapDialogOpen(true);

    try {
      const location = await getCurrentLocation();
      setCaregiverLocation(location);
    } catch (error) {
      console.error("Error getting caregiver location:", error);
      setScheduleDistances(prev => ({ ...prev, [scheduleId]: Infinity }));
    }
  };
  
  const handleDistanceUpdate = useCallback((scheduleId: string, distanceInMeters: number | null) => {
    setScheduleDistances(prev => ({ ...prev, [scheduleId]: distanceInMeters }));
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading Today's Schedule...</span></div>;
  }

  if (todaySchedules.length === 0) {
    return <Card><CardContent className="pt-6 text-center text-muted-foreground">No shifts scheduled for today.</CardContent></Card>;
  };

  return (
    <div className="space-y-4">
      {sortedSchedules.map((schedule) => (
        <ScheduleCard 
          key={schedule.id} 
          schedule={schedule} 
          patient={assignedPatients.find(p => p.id === schedule.patientId)} 
          onRefresh={loadData}
          onViewMap={handleViewMap}
          currentDistance={scheduleDistances[schedule.id] ?? null} 
        />
      ))}

      <PatientMapDialog
        isOpen={isMapDialogOpen}
        onClose={() => setIsMapDialogOpen(false)}
        scheduleId={currentMapScheduleId || ''}
        patientAddress={mapAddress}
        patientName={mapPatientName}
        patientLocation={mapPatientLocation}
        caregiverLocation={caregiverLocation}
        onDistanceUpdate={handleDistanceUpdate}
      />
    </div>
  );
}
