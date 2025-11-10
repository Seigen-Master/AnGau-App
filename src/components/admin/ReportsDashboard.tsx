
// src/components/admin/ReportsDashboard.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Schedule, User, Request as RequestType } from '@/types';
import { getCompletedSchedules, getAllUsers, getAllRequests } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { DateRange } from 'react-day-picker';
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Download, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { utils, writeFileXLSX } from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';

function MultiSelect({ options, selected, onChange, className, placeholder = "Select..." }: { options: {value: string, label: string}[], selected: string[], onChange: (selected: string[]) => void, className?: string, placeholder?: string }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = useMemo(() => {
    return options.filter(option => selected.includes(option.value)).map(option => option.label);
  }, [selected, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto", className)}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedLabels.length > 0 ? selectedLabels.map(label => <Badge variant="secondary" key={label}>{label}</Badge>) : placeholder}
          </div>
          <X
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className={cn("ml-2 h-4 w-4 shrink-0 opacity-50", selected.length === 0 && "hidden")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search names..." />
          <CommandEmpty>No name found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", selected.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                  <CheckIcon className={cn("h-4 w-4")} />
                </div>
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
}

const formatHoursAndMinutes = (decimalHours: number) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}.${paddedMinutes}`;
};

// Helper to normalize date values from Firestore
const normalizeDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
    if (typeof date === 'string') return new Date(date);
    if (date instanceof Date) return date;
    return null;
  };

export default function ReportsDashboard() {
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [allRequests, setAllRequests] = useState<RequestType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCaregivers, setSelectedCaregivers] = useState<string[]>([]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date()),
  });

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [completedSchedules, userList, requestList] = await Promise.all([
        getCompletedSchedules(),
        getAllUsers(),
        getAllRequests(),
      ]);
      setAllSchedules(completedSchedules);
      setUsers(userList);
      setAllRequests(requestList);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again later.");
      toast({ title: "Error", description: "Failed to load report data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const caregivers = useMemo(() => {
    return users.filter(user => user.role === 'caregiver');
  }, [users]);

  const caregiverOptions = useMemo(() => {
    return caregivers
      .map(user => ({ value: user.uid, label: user.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [caregivers]);

  const calculateTotalHours = useCallback((schedule: Schedule) => {
    if (schedule.status === 'cancelled') {
        const relevantRequest = allRequests.find(req => 
            req.scheduleId === schedule.id && 
            req.type === 'cancellation' && 
            req.status === 'approved'
        );

        if (relevantRequest) {
            const hours = relevantRequest.compensationHours || 0;
            const minutes = relevantRequest.compensationMinutes || 0;
            return hours + (minutes / 60);
        }
        return 0; // If no approved cancellation request is found, compensation is 0
    }
    
    const clockIn = normalizeDate(schedule.clockIn);
    const clockOut = normalizeDate(schedule.clockOut);

    if (clockIn && clockOut) {
        const diffMs = clockOut.getTime() - clockIn.getTime();
        if (diffMs < 0) return 0;
        return diffMs / 3600000;
    }
    return 0;
  }, [allRequests]);

  const filteredSchedules = useMemo(() => {
    if (selectedCaregivers.length === 0) return [];
    
    return allSchedules.filter(schedule => {
      const matchesCaregiver = selectedCaregivers.includes(schedule.caregiverId);
      if (!matchesCaregiver) return false;

      const scheduleDate = normalizeDate(schedule.startTimestamp);
      let isInDateRange = true; 

      if (dateRange?.from && dateRange?.to) {
        if (scheduleDate) {
          isInDateRange = scheduleDate >= startOfDay(dateRange.from) && scheduleDate <= endOfDay(dateRange.to);
        } else {
          isInDateRange = false;
        }
      }
      
      return isInDateRange; 
    });
  }, [allSchedules, dateRange, selectedCaregivers]);
  
  const totalHoursByCaregiver = useMemo(() => {
    if (selectedCaregivers.length === 0) return [];

    const hoursByCaregiver: { [key: string]: { name: string, hours: number, rate: number, salary: number } } = {};
    filteredSchedules.forEach(schedule => {
      const caregiver = caregivers.find(u => u.uid === schedule.caregiverId);
      if (caregiver) {
        if (!hoursByCaregiver[caregiver.uid]) {
          hoursByCaregiver[caregiver.uid] = { name: caregiver.name, hours: 0, rate: caregiver.ratePerHour || 0, salary: 0 };
        }
        const hours = calculateTotalHours(schedule);
        hoursByCaregiver[caregiver.uid].hours += hours;
        hoursByCaregiver[caregiver.uid].salary += hours * (caregiver.ratePerHour || 0);
      }
    });
    return Object.values(hoursByCaregiver);
  }, [filteredSchedules, caregivers, calculateTotalHours, selectedCaregivers]);

  const totalHours = useMemo(() => {
    if (selectedCaregivers.length === 0) return 0;
    return filteredSchedules.reduce((sum, schedule) => sum + calculateTotalHours(schedule), 0);
  }, [filteredSchedules, calculateTotalHours, selectedCaregivers]);

  const exportToExcel = useCallback(() => {
    if (selectedCaregivers.length === 0) {
      toast({ title: "No Caregiver Selected", description: "Please select a caregiver to export a report.", variant: "destructive" });
      return;
    }
    const data = totalHoursByCaregiver.map(caregiver => ({
      'Caregiver Name': caregiver.name,
      'Date Range': dateRange?.from && dateRange?.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : 'N/A',
      'Total Hours': formatHoursAndMinutes(caregiver.hours),
      'Hourly Rate (USD)': caregiver.rate.toFixed(2),
      'Total Salary (USD)': caregiver.salary.toFixed(2),
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Total Time Report");
    writeFileXLSX(wb, "Total_Time_Report.xlsx");
    toast({ title: "Report Exported", description: "Total time report downloaded successfully." });
  }, [totalHoursByCaregiver, dateRange, toast, selectedCaregivers]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading report data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-100 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filter Schedules</CardTitle>
          <Download className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={exportToExcel} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        ` ${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label htmlFor="name-filter" className="block text-sm font-medium text-gray-700 mb-1">Caregiver Name</label>
              <MultiSelect
                options={caregiverOptions}
                selected={selectedCaregivers}
                onChange={setSelectedCaregivers}
                placeholder="Filter by caregiver..."
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCaregivers.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Time Report</CardTitle>
            </CardHeader>
            <CardContent>
              {totalHoursByCaregiver.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Caregiver Name</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Hourly Rate</TableHead>
                        <TableHead>Total Salary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {totalHoursByCaregiver.map((caregiver) => (
                        <TableRow key={caregiver.name}>
                          <TableCell className="font-medium">{caregiver.name}</TableCell>
                          <TableCell>
                            {dateRange?.from && dateRange?.to
                              ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{formatHoursAndMinutes(caregiver.hours)}</TableCell>
                          <TableCell>${caregiver.rate.toFixed(2)}</TableCell>
                          <TableCell>${caregiver.salary.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available for the selected criteria.</p>
              )}
            </CardContent>
          </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Completed Schedules Report</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSchedules.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Caregiver</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In/Out Time</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => {
                      const caregiver = users.find(u => u.uid === schedule.caregiverId);
                      const clockInDate = normalizeDate(schedule.clockIn);
                      const clockOutDate = normalizeDate(schedule.clockOut);
                      const displayScheduleDate = normalizeDate(schedule.startTimestamp);
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{caregiver?.name || 'N/A'}</TableCell>
                          <TableCell>{schedule.patientName || 'N/A'}</TableCell>
                          <TableCell>{displayScheduleDate ? format(displayScheduleDate, 'PPP') : 'N/A'}</TableCell>
                          <TableCell>
                            {schedule.status === 'cancelled'
                                ? '-'
                                : `${clockInDate ? format(clockInDate, 'p') : 'N/A'} - ${clockOutDate ? format(clockOutDate, 'p') : 'N/A'}`
                            }
                          </TableCell>
                          <TableCell>{formatHoursAndMinutes(calculateTotalHours(schedule))}</TableCell>
                          <TableCell className="capitalize">{schedule.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">Total Hours:</TableCell>
                      <TableCell className="font-bold">{formatHoursAndMinutes(totalHours)}</TableCell>
                      <TableCell colSpan={1}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">No completed schedules found for the selected criteria.</p>
            )}
          </CardContent>
        </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please select at least one caregiver to view reports.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
