
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { getScheduleById, addRequest } from '@/lib/firestore';
import { Schedule, SubTask, Request } from '@/types';
import { Loader2, ArrowLeft, Settings, FileClock, TimerOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import OvertimeRequestDialog from '@/components/caregiver/OvertimeRequestDialog';
import CancellationRequestDialog from '@/components/caregiver/CancellationRequestDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from 'date-fns';


type SchedulePageParams = {
  params: {
    scheduleId: string;
  };
};

export default function ScheduleTaskPage({ params }: SchedulePageParams) {
  const { scheduleId } = params;
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isOvertimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const { canRequestOvertime, canRequestCancel, overtimeMessage, cancelMessage } = useMemo(() => {
    if (!schedule) {
      return { 
        canRequestOvertime: false, 
        canRequestCancel: false, 
        overtimeMessage: 'Loading schedule...', 
        cancelMessage: 'Loading schedule...' 
      };
    }
  
    const shiftStartTime = schedule.startTimestamp.toDate();
    const shiftEndTime = schedule.endTimestamp.toDate();
  
    // Overtime can be requested starting 20 minutes before the shift ends, until the shift ends.
    const overtimeRequestStartTime = new Date(shiftEndTime.getTime() - 20 * 60 * 1000);
    const canRequestOvertime = now >= overtimeRequestStartTime && now <= shiftEndTime;
    
    // Cancellation is available within the first 20 minutes of the shift.
    const cancelEndTime = new Date(shiftStartTime.getTime() + 20 * 60 * 1000);
    const canRequestCancel = now >= shiftStartTime && now <= cancelEndTime;

    return {
      canRequestOvertime,
      canRequestCancel,
      overtimeMessage: canRequestOvertime ? 'Request Overtime' : `Available 20 minutes before the shift ends.`,
      cancelMessage: canRequestCancel ? 'Request Cancellation' : `Available within the first 20 minutes of the shift.`,
    };
  }, [now, schedule]);

  const fetchSchedule = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoading(true);
    try {
      const foundSchedule = await getScheduleById(scheduleId);
      setSchedule(foundSchedule || null);
      if (foundSchedule) {
        setSubTasks(foundSchedule.subTasks || []); 
        setNotes(foundSchedule.notes || ''); 
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setSchedule(null);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleSubTaskChange = (taskId: string, completed: boolean) => {
    setSubTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId ? { ...task, completed } : task
      )
    );
  };

  const handleSave = async () => {
    if (!scheduleId) return;
    setIsSaving(true);
    try {
      const scheduleRef = doc(db, 'schedules', scheduleId);
      await updateDoc(scheduleRef, {
        subTasks: subTasks,
        notes: notes,
      });
      toast({ title: "Success", description: "Your changes have been saved." });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOvertimeRequest = async (hours: number, minutes: number, reason: string) => {
    if (!user || !schedule) return;
  
    const requestData = {
      caregiverId: user.uid,
      caregiverName: user.name || user.displayName || 'Unnamed Caregiver',
      patientId: schedule.patientId,
      patientName: schedule.patientName,
      scheduleId: schedule.id,
      type: 'overtime' as Request['type'],
      status: 'pending' as Request['status'],
      requestDate: Timestamp.now(),
      reason,
      overtimeHours: hours,
      overtimeMinutes: minutes,
    };
  
    try {
      await addRequest(requestData);
      toast({
        title: 'Overtime Request Submitted',
        description: 'Your request has been sent to the admin for approval.',
      });
      setOvertimeDialogOpen(false);
    } catch (error) {
      console.error('Error submitting overtime request:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancellationRequest = async (reason: string) => {
    if (!user || !schedule) return;
  
    const requestData = {
      caregiverId: user.uid,
      caregiverName: user.name || user.displayName || 'Unnamed Caregiver',
      patientId: schedule.patientId,
      patientName: schedule.patientName,
      scheduleId: schedule.id,
      type: 'cancellation' as Request['type'],
      status: 'pending' as Request['status'],
      requestDate: Timestamp.now(),
      reason,
    };
  
    try {
      await addRequest(requestData);
      toast({
        title: 'Cancellation Request Submitted',
        description: 'Your request has been sent to the admin for approval.',
      });
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Error submitting cancellation request:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your request. Please try again.',
        variant: 'destructive',
      });
    }
  };
  

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (!schedule) {
    return <div className="text-center">Schedule not found.</div>;
  }

  const startTime = schedule.startTimestamp.toDate();
  const endTime = schedule.endTimestamp.toDate();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Request Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <div>
                              <DropdownMenuItem onSelect={() => setOvertimeDialogOpen(true)} disabled={!canRequestOvertime}>
                                  <FileClock className="mr-2 h-4 w-4" />
                                  <span>Overtime Request</span>
                              </DropdownMenuItem>
                          </div>
                      </TooltipTrigger>
                      <TooltipContent><p>{overtimeMessage}</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <div>
                              <DropdownMenuItem onSelect={() => setCancelDialogOpen(true)} disabled={!canRequestCancel} className="text-destructive">
                                  <TimerOff className="mr-2 h-4 w-4" />
                                  <span>Cancellation Request</span>
                              </DropdownMenuItem>
                          </div>
                      </TooltipTrigger>
                      <TooltipContent><p>{cancelMessage}</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Tasks for {schedule.patientName}</CardTitle>
          <p className="text-muted-foreground">{format(startTime, 'PPP')} from {format(startTime, 'HH:mm')} to {format(endTime, 'HH:mm')}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Sub-Tasks</h3>
              {subTasks.length > 0 ? (
                subTasks.map(task => (
                  <div key={task.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={task.id}
                      checked={task.completed}
                      onCheckedChange={(checked) => handleSubTaskChange(task.id, !!checked)}
                    />
                    <label htmlFor={task.id} className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.description}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No sub-tasks assigned for this shift.</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any notes for this shift..."
                rows={4}
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <OvertimeRequestDialog
        isOpen={isOvertimeDialogOpen}
        onClose={() => setOvertimeDialogOpen(false)}
        onSubmit={handleOvertimeRequest}
      />
      <CancellationRequestDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onSubmit={handleCancellationRequest}
      />
    </div>
  );
}
