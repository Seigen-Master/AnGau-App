
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllRequests, getCaregivers, updateRequest, updateSchedule, getScheduleById } from '@/lib/firestore';
import type { Request as RequestType, User, Schedule } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CalendarIcon, User as UserIcon, Clock, MessageSquare } from 'lucide-react';
import { format, startOfDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Helper to normalize date values from Firestore
const normalizeDate = (date: any): Date => {
  if (!date) return new Date();
  if (typeof date.toDate === 'function') return date.toDate();
  if (typeof date === 'string') return new Date(date);
  return date;
};

// Helper function to safely parse and format a date
const safeFormatDate = (date: Date | any | undefined | null, formatStr: string): string => {
  if (!date) return 'N/A';
  
  let d: Date;
  if (typeof date.toDate === 'function') { // Firestore Timestamp
    d = date.toDate();
  } else if (typeof date === 'string') { // Date string
    d = parseISO(date);
  } else if (date instanceof Date) { // Already a Date object
    d = date;
  } else { // Handle other unexpected types, treat as invalid
    console.error('safeFormatDate received unexpected date type:', date);
    return 'Invalid Date Type';
  }

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  return format(d, formatStr);
};

interface ApprovalDialogProps {
  request: RequestType | null;
  onClose: () => void;
  onApprove: (request: RequestType, newDate?: Date, newTime?: string, compensationHours?: number, compensationMinutes?: number) => void;
  onDeny: (request: RequestType, denialReason: string) => void;
}

function ApprovalDialog({ request, onClose, onApprove, onDeny }: ApprovalDialogProps) {
    const [denialReason, setDenialReason] = useState('');
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
    const [newEndDate, setNewEndDate] = useState<Date | undefined>();
    const [newEndTime, setNewEndTime] = useState('');
    const [compensationHours, setCompensationHours] = useState<number>(0);
    const [compensationMinutes, setCompensationMinutes] = useState<number>(0);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (request?.scheduleId) {
                setIsLoadingSchedule(true);
                try {
                    const scheduleData = await getScheduleById(request.scheduleId);
                    setSchedule(scheduleData);
                    if (scheduleData) {
                        if (scheduleData.endTimestamp) {
                            const endDate = normalizeDate(scheduleData.endTimestamp);
                            setNewEndDate(endDate);
                            setNewEndTime(format(endDate, 'HH:mm'));
                        } else if (scheduleData.date) { // Fallback for older data
                            setNewEndDate(parseISO(scheduleData.date));
                            setNewEndTime(scheduleData.endTime);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch schedule for request:", error);
                    setSchedule(null);
                } finally {
                    setIsLoadingSchedule(false);
                }
            }
        };

        if (request) {
            fetchSchedule();
            setDenialReason('');
            setCompensationHours(0); // Reset compensation hours
            setCompensationMinutes(0); // Reset compensation minutes
        }
    }, [request]);

    if (!request) return null;

    const isOvertime = request.type === 'overtime';
    const isCancellation = request.type === 'cancellation';

    const handleApprove = () => {
        if (isOvertime) {
            if (!newEndDate || !newEndTime) {
                alert('Please select a new end date and time.');
                return;
            }
            onApprove(request, newEndDate, newEndTime);
        } else if (isCancellation) {
            onApprove(request, undefined, undefined, compensationHours, compensationMinutes);
        } else {
            onApprove(request);
        }
    };
    
    const handleDeny = () => {
        if (!denialReason.trim()) {
            alert('Please provide a reason for denial.');
            return;
        }
        onDeny(request, denialReason);
    };

    const hoursOptions = Array.from({ length: 24 }, (_, i) => i + 1); // 1 to 24
    const minutesOptions = Array.from({ length: 60 }, (_, i) => i); // 0 to 59

    return (
        <Dialog open={!!request} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{`Review ${request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request`}</DialogTitle>
                    <DialogDescription>
                        Caregiver: {request.caregiverName} <br />
                        Patient: {request.patientName} <br />
                        Requested on: {safeFormatDate(request.requestDate, 'PPP p')}
                    </DialogDescription>
                </DialogHeader>

                {isLoadingSchedule ? (
                    <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                    <div className="py-4 space-y-4">
                        <div>
                            <h4 className="font-semibold">Reason Provided:</h4>
                            <p className="text-sm text-muted-foreground">{request.reason || 'No reason provided.'}</p>
                        </div>

                        {isOvertime && schedule && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold">Requested Overtime:</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {request.overtimeHours || 0} hours, {request.overtimeMinutes || 0} minutes
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Approve New End Time:</h4>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Current End Time: {
                                            schedule.endTimestamp 
                                            ? safeFormatDate(schedule.endTimestamp, 'PPP p') 
                                            : `${safeFormatDate(schedule.date, 'PPP')} at ${schedule.endTime}`
                                        }
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="new-date" className="text-sm font-medium">New End Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newEndDate ? safeFormatDate(newEndDate, 'PPP') : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar mode="single" selected={newEndDate} onSelect={setNewEndDate} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div>
                                            <label htmlFor="new-time" className="text-sm font-medium">New End Time</label>
                                            <Input id="new-time" type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isCancellation && (
                            <div className="space-y-2">
                                <h4 className="font-semibold">Approve Compensation:</h4>
                                <p className="text-sm text-muted-foreground">If approving cancellation, you can optionally grant compensation hours and minutes to the caregiver.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="compensation-hours" className="text-sm font-medium">Hours</label>
                                        <Select value={String(compensationHours)} onValueChange={(value) => setCompensationHours(parseInt(value))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Hours" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {hoursOptions.map(hour => (
                                                    <SelectItem key={hour} value={String(hour)}>{hour}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label htmlFor="compensation-minutes" className="text-sm font-medium">Minutes</label>
                                        <Select value={String(compensationMinutes)} onValueChange={(value) => setCompensationMinutes(parseInt(value))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Minutes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {minutesOptions.map(minute => (
                                                    <SelectItem key={minute} value={String(minute)}>{minute}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="denialReason" className="text-sm font-medium">Reason for Denial (if denying)</label>
                            <Textarea id="denialReason" value={denialReason} onChange={(e) => setDenialReason(e.target.value)} placeholder="Enter reason for denial..." />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeny} disabled={!denialReason.trim()}>Deny</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>Approve</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminRequestsPage() {
    const [allRequests, setAllRequests] = useState<RequestType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(null);
    const { toast } = useToast();

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const requestsData = await getAllRequests();
            setAllRequests(requestsData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load request data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const filteredRequests = useMemo(() => {
        if (!selectedDate) return [];
        return allRequests.filter(req => 
            startOfDay(normalizeDate(req.requestDate)).getTime() === startOfDay(selectedDate).getTime()
        );
    }, [allRequests, selectedDate]);

    const datesWithRequests = useMemo(() => {
        const dates = new Set<number>();
        allRequests.forEach(req => {
            dates.add(startOfDay(normalizeDate(req.requestDate)).getTime());
        });
        return Array.from(dates).map(timestamp => new Date(timestamp));
    }, [allRequests]);

    const handleUpdateRequest = async (
        request: RequestType, 
        status: 'approved' | 'denied', 
        details: { denialReason?: string; newEndDate?: Date; newEndTime?: string; compensationHours?: number; compensationMinutes?: number } = {}
    ) => {
        try {
            const updateData: Partial<RequestType> = { status, adminId: 'admin_placeholder_id' }; // Replace with actual admin ID

            if (status === 'denied' && details.denialReason) {
                updateData.denialReason = details.denialReason;
            }
    
            // If approved overtime, update the endTimestamp
            if (status === 'approved' && request.type === 'overtime' && details.newEndDate && details.newEndTime) {
                const [hours, minutes] = details.newEndTime.split(':').map(Number);
                const newEndTimestamp = new Date(details.newEndDate);
                newEndTimestamp.setHours(hours, minutes, 0, 0); // Set hours and minutes, reset seconds and ms

                await updateSchedule(request.scheduleId, { 
                    endTimestamp: newEndTimestamp 
                });
            }

            // If approved cancellation with compensation hours and minutes
            if (status === 'approved' && request.type === 'cancellation' && (typeof details.compensationHours === 'number' || typeof details.compensationMinutes === 'number')) {
                updateData.compensationHours = details.compensationHours || 0;
                updateData.compensationMinutes = details.compensationMinutes || 0;

                const totalCompensationMinutes = (updateData.compensationHours * 60) + updateData.compensationMinutes;
                if (totalCompensationMinutes > 0) {
                    console.log(`Caregiver ${request.caregiverName} awarded ${updateData.compensationHours}h ${updateData.compensationMinutes}m compensation for cancellation request ${request.id}`);
                }
            }
            
            await updateRequest(request.id, updateData);
            
            toast({
                title: `Request ${status}`,
                description: `The request has been successfully ${status}.`,
            });
            
            fetchAllData(); // Refresh data
        } catch (err) {
            console.error(`Error updating request to ${status}:`, err);
            toast({
                title: 'Update Failed',
                description: 'There was an error updating the request.',
                variant: 'destructive',
            });
        } finally {
            setSelectedRequest(null);
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /><span>Loading requests...</span></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-8">'{error}'</div>;
    }

    return (
        <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-1/3">
                <Card>
                    <CardHeader><CardTitle>Filter by Date</CardTitle></CardHeader>
                    <CardContent>
                       <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border"
                            modifiers={{ datesWithRequests }}
                            modifiersClassNames={{ datesWithRequests: "bg-primary/20" }}
                        />
                        <p className="text-sm text-muted-foreground mt-2">Dates with a blue background have requests.</p>
                    </CardContent>
                </Card>
            </aside>
            <main className="w-full lg:w-2/3">
                <h1 className="text-2xl font-bold mb-4">
                    Requests for {selectedDate ? format(selectedDate, 'PPP') : '...'}
                </h1>
                {filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequests.map(req => (
                            <Card key={req.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>{req.caregiverName} - {req.type === 'overtime' ? 'Overtime' : 'Cancellation'}</span>
                                        <span className={cn(
                                            "text-sm font-semibold capitalize px-2 py-1 rounded-full",
                                            req.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                                            req.status === 'approved' && 'bg-green-100 text-green-800',
                                            req.status === 'denied' && 'bg-red-100 text-red-800'
                                        )}>
                                            {req.status}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm"><UserIcon className="inline-block mr-2 h-4 w-4"/>Patient: {req.patientName}</p>
                                    <p className="text-sm"><MessageSquare className="inline-block mr-2 h-4 w-4"/>Reason: {req.reason}</p>
                                    {req.type === 'overtime' && <p className="text-sm"><Clock className="inline-block mr-2 h-4 w-4"/>Requested: {req.overtimeHours}h {req.overtimeMinutes}m</p>}
                                    {req.type === 'cancellation' && (req.compensationHours || req.compensationMinutes) && req.status === 'approved' && <p className="text-sm"><Clock className="inline-block mr-2 h-4 w-4"/>Compensation: {req.compensationHours || 0}h {req.compensationMinutes || 0}m</p>}
                                </CardContent>
                                {req.status === 'pending' && (
                                    <CardFooter>
                                        <Button onClick={() => setSelectedRequest(req)}>Review Request</Button>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center pt-8">No requests found for this date.</p>
                )}
            </main>
            <ApprovalDialog 
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
                onApprove={(req, newEndDate, newEndTime, compensationHours, compensationMinutes) => handleUpdateRequest(req, 'approved', { newEndDate, newEndTime, compensationHours, compensationMinutes })}
                onDeny={(req, denialReason) => handleUpdateRequest(req, 'denied', { denialReason })}
            />
        </div>
    );
}
