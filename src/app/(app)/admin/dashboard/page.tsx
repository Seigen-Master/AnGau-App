// src/app/(app)/admin/dashboard/page.tsx

"use client";

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { BarChart, Users, CalendarClock, Activity, ListChecks, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { format as formatInTimeZone, toDate } from 'date-fns-tz';
import { format, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { getRecentSchedules, getAssignedPatients } from '@/lib/firestore';
import type { Schedule, Patient } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import PinSetupDialog from '@/components/shared/PinSetupDialog';
import LiveCaregiverMap from '@/components/admin/LiveCaregiverMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Helper function to safely parse and format a date string or timestamp
const safeFormatDate = (dateInput: string | Date | Timestamp | undefined, formatStr: string): string => {
  if (!dateInput) return 'N/A';
  try {
    const date = (dateInput instanceof Timestamp) ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, formatStr);
  } catch (error) {
    console.error('Error parsing or formatting date:', dateInput, error);
    return 'Error Date';
  }
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { title: 'Total Patients', value: '0', icon: Users, color: 'text-primary', href: '/admin/patients' },
    { title: 'Active Caregivers', value: '0', icon: Users, color: 'text-accent', href: '/admin/caregivers' },
    { title: 'Schedules Today', value: '0', icon: CalendarClock, color: 'text-yellow-500', href: '/admin/schedules' },
    { title: 'AWOL Reports (Month)', value: '0', icon: BarChart, color: 'text-destructive', href: '#' },
  ]);
  const [recentActivities, setRecentActivities] = useState<Schedule[]>([]);
  const [activeSchedules, setActiveSchedules] = useState<Schedule[]>([]);
  const [patientsMap, setPatientsMap] = useState<Map<string, Patient>>(new Map());
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingActiveSchedules, setIsLoadingActiveSchedules] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedCaregiverSchedule, setSelectedCaregiverSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (!user.pin) {
        setPinDialogOpen(true);
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingActivities(true);
      try {
        const patientsCollection = collection(db, 'patients');
        const usersCollection = collection(db, 'users');
        const schedulesCollection = collection(db, 'schedules');

        const patientsQuery = query(patientsCollection);
        const activeCaregiversQuery = query(
          usersCollection,
          where('role', '==', 'caregiver'),
          where('status', '==', 'active')
        );

        const timeZone = 'America/Los_Angeles';
        const now = toDate(new Date(), { timeZone });
        const startOfToday = startOfDay(now);
        const endOfToday = endOfDay(now);

        const schedulesTodayQuery = query(schedulesCollection, 
            where('startTimestamp', '>=', Timestamp.fromDate(startOfToday)),
            where('startTimestamp', '<=', Timestamp.fromDate(endOfToday))
        );

        const [
          patientsCountSnapshot,
          activeCaregiversCountSnapshot,
          schedulesTodayCountSnapshot,
          fetchedRecentSchedules,
        ] = await Promise.all([
          getCountFromServer(patientsQuery),
          getCountFromServer(activeCaregiversQuery),
          getCountFromServer(schedulesTodayQuery),
          getRecentSchedules(3),
        ]);

        const patientsCount = patientsCountSnapshot.data().count;
        const activeCaregiversCount = activeCaregiversCountSnapshot.data().count;
        const schedulesTodayCount = schedulesTodayCountSnapshot.data().count;

        setStats([
          { title: 'Total Patients', value: patientsCount.toString(), icon: Users, color: 'text-primary', href: '/admin/patients' },
          { title: 'Active Caregivers', value: activeCaregiversCount.toString(), icon: Users, color: 'text-accent', href: '/admin/caregivers' },
          { title: 'Schedules Today', value: schedulesTodayCount.toString(), icon: CalendarClock, color: 'text-yellow-500', href: '/admin/schedules' },
          { title: 'AWOL Reports (Month)', value: '0', icon: BarChart, color: 'text-destructive', href: '#' },
        ]);
        setRecentActivities(fetchedRecentSchedules);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoadingActivities(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Effect to fetch all schedules for today and their patient details
  useEffect(() => {
    setIsLoadingActiveSchedules(true);
    const timeZone = 'America/Los_Angeles';
    const now = toDate(new Date(), { timeZone });
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    const q = query(collection(db, 'schedules'), 
        where('startTimestamp', '>=', Timestamp.fromDate(startOfToday)),
        where('startTimestamp', '<=', Timestamp.fromDate(endOfToday))
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allSchedulesData: Schedule[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];
      setActiveSchedules(allSchedulesData);

      // Fetch patient details for all schedules
      if (allSchedulesData.length > 0) {
        const patientIds = [...new Set(allSchedulesData.map(s => s.patientId))];
        try {
          const patientDetails = await getAssignedPatients(patientIds);
          const newPatientMap = new Map(patientDetails.map(p => [p.id, p]));
          setPatientsMap(newPatientMap);
        } catch (error) {
          console.error("Error fetching patient details for all schedules:", error);
        }
      }
      setIsLoadingActiveSchedules(false);
    }, (error) => {
      console.error("Error listening to all schedules:", error);
      setIsLoadingActiveSchedules(false);
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  const handleViewMap = (schedule: Schedule) => {
    setSelectedCaregiverSchedule(schedule);
    setMapOpen(true);
  };

  const selectedPatient = useMemo(() => {
    if (selectedCaregiverSchedule) {
      return patientsMap.get(selectedCaregiverSchedule.patientId);
    }
    return undefined;
  }, [selectedCaregiverSchedule, patientsMap]);

  return (
    <div className="space-y-6">
      <PinSetupDialog open={isPinDialogOpen} onOpenChange={setPinDialogOpen} />
      <PageHeader title="Admin Dashboard" description="Overview of AnGau Light operations." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">View Details</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            Recent Activity
          </h3>
          <Card>
            <CardContent className="pt-6">
              {isLoadingActivities ? (
                <p className="text-muted-foreground">Loading activities...</p>
              ) : recentActivities.length > 0 ? (
                <ul className="space-y-3">
                  {recentActivities.map((activity) => (
                    <li key={activity.id} className="text-sm border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-start">
                        <ListChecks className="h-4 w-4 text-accent mr-2 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">New schedule created</span> for <span className="font-semibold text-primary">{activity.patientName}</span>
                          {activity.caregiverName && <> with <span className="font-semibold text-accent">{activity.caregiverName}</span></>}.
                          <p className="text-xs text-muted-foreground">
                            Scheduled for: {safeFormatDate(activity.startTimestamp, 'PPp')}
                          </p>
                          {activity.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              Created {formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No recent schedule activities.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-primary" />
            All Caregiver Schedules (Today)
          </h3>
          <Card>
            <CardContent className="pt-6">
              {isLoadingActiveSchedules ? (
                <p className="text-muted-foreground">Loading schedules...</p>
              ) : activeSchedules.length > 0 ? (
                <ul className="space-y-3">
                  {activeSchedules.map((schedule) => {
                    const patient = patientsMap.get(schedule.patientId);
                    return (
                      <li key={schedule.id} className="text-sm border-b pb-2 last:border-b-0 last:pb-0 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{schedule.caregiverName || 'Unknown Caregiver'} serving {patient?.name || schedule.patientName || 'Unknown Patient'}</p>
                          <p className="text-xs text-muted-foreground">
                            {safeFormatDate(schedule.startTimestamp, 'p')} - {safeFormatDate(schedule.endTimestamp, 'p')} (Status: {schedule.status})
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleViewMap(schedule)}
                          disabled={!schedule.caregiverId || !patient?.address?.lat}
                          title={(!schedule.caregiverId || !patient?.address?.lat) ? "Caregiver or patient address not available" : "View Live Map"}
                        >
                          <MapPin className="h-4 w-4 mr-1" /> Map
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">No schedules for today.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Live Caregiver Tracking</DialogTitle>
          </DialogHeader>
          {selectedCaregiverSchedule && selectedCaregiverSchedule.caregiverId && selectedPatient?.address ? (
            <LiveCaregiverMap 
              caregiverId={selectedCaregiverSchedule.caregiverId}
              patientAddress={selectedPatient.address}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Map data not available.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
