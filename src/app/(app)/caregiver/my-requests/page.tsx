// src/app/(app)/caregiver/my-requests/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Request as RequestType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsForCaregiver } from '@/lib/firestore';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileClock, TimerOff, AlertTriangle } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const RequestListItem = ({ request }: { request: RequestType }) => {
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'denied': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <li className="rounded-lg border p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-lg">{request.patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                        {request.type === 'overtime' ? 'Overtime Request' : 'Cancellation Request'}
                    </p>
                </div>
                <Badge className={cn("capitalize", getStatusClass(request.status))}>{request.status}</Badge>
            </div>
            <div>
                <p className="text-sm font-medium">Your Reason:</p>
                <p className="text-sm text-muted-foreground pl-2 border-l-2 ml-2">{request.reasonForRequest}</p>
            </div>
            {request.status === 'denied' && request.denialReason && (
                <div>
                    <p className="text-sm font-medium text-destructive">Admin's Reason for Denial:</p>
                    <p className="text-sm text-red-800 pl-2 border-l-2 border-destructive ml-2">{request.denialReason}</p>
                </div>
            )}
            <p className="text-xs text-muted-foreground pt-2 border-t">
                Requested on: {format(request.requestDate.toDate(), 'PPP p')}
            </p>
        </li>
    );
};

export default function MyRequestsPage() {
    const { user } = useAuth();
    const [allRequests, setAllRequests] = useState<RequestType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const fetchRequests = useCallback(async () => {
        if (!user?.uid) return;
        setIsLoading(true);
        try {
            const requests = await getRequestsForCaregiver(user.uid);
            setAllRequests(requests);
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError("Failed to load your requests.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const filteredRequests = useMemo(() => {
        if (!selectedDate) return [];
        return allRequests.filter(req => 
            startOfDay(req.requestDate.toDate()).getTime() === startOfDay(selectedDate).getTime()
        );
    }, [allRequests, selectedDate]);

    // Create a set of dates that have requests for the calendar indicator
    const datesWithRequests = useMemo(() => {
        const dates = new Set<number>();
        allRequests.forEach(req => {
            dates.add(startOfDay(req.requestDate.toDate()).getTime());
        });
        return Array.from(dates).map(timestamp => new Date(timestamp));
    }, [allRequests]);

    return (
        <div className="space-y-6">
            <PageHeader title="My Requests" description="View the status of your overtime and cancellation requests." />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="p-2">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md"
                                modifiers={{ hasRequest: datesWithRequests }}
                                modifiersClassNames={{ hasRequest: 'has-request-indicator' }}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Requests for {selectedDate ? format(selectedDate, 'PPP') : 'N/A'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div>
                            ) : error ? (
                                <div className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-4 w-4" /> {error}</div>
                            ) : filteredRequests.length > 0 ? (
                                <ul className="space-y-4">
                                    {filteredRequests.map(request => <RequestListItem key={request.id} request={request} />)}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">No requests found for this date.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
