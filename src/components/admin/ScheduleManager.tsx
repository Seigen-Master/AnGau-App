
'use client';

import type { Schedule, User, Patient, SubTask, Address } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format, parse, startOfDay } from 'date-fns';
import { CalendarIcon, Clock, UserIcon, PlusCircle, Edit2, Trash2, ListChecks, XIcon, Loader2, HomeIcon, Briefcase, Search, LogIn, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, getCaregivers, getAllPatients } from '@/lib/firestore';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

// Helper function to safely format a date or timestamp
const safeFormat = (date: Date | Timestamp | null | undefined, formatString: string) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return format(dateObj, formatString);
  };

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [caregivers, setCaregivers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formState, setFormState] = useState({
    caregiverId: '',
    patientId: '',
    startDate: new Date(),
    startTime: '',
    endDate: new Date(),
    endTime: '',
    taskInstructions: '',
    subTaskItems: [] as string[],
    newSubTask: '',
  });

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schedulesData, caregiversData, patientsData] = await Promise.all([
        getSchedules(),
        getCaregivers(),
        getAllPatients(),
      ]);
      setSchedules(schedulesData);
      setCaregivers(caregiversData);
      setPatients(patientsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if(editingSchedule) {
      // Ensure editingSchedule.startTimestamp and .endTimestamp are Timestamps before calling toDate()
      const start = editingSchedule.startTimestamp instanceof Timestamp ? editingSchedule.startTimestamp.toDate() : new Date(); // Fallback to current date
      const end = editingSchedule.endTimestamp instanceof Timestamp ? editingSchedule.endTimestamp.toDate() : new Date(); // Fallback to current date
      setFormState({
        caregiverId: editingSchedule.caregiverId,
        patientId: editingSchedule.patientId,
        startDate: start,
        startTime: format(start, 'HH:mm'),
        endDate: end,
        endTime: format(end, 'HH:mm'),
        taskInstructions: editingSchedule.task,
        subTaskItems: editingSchedule.subTasks ? editingSchedule.subTasks.map(st => st.description) : [],
        newSubTask: ''
      });
      setIsFormOpen(true);
    } else {
      resetForm();
    }
  }, [editingSchedule]);

  const scheduledDays = useMemo(() => {
    const daysWithSchedules = new Set<number>();
    schedules.forEach(schedule => {
      let scheduleDate: Date | null = null;
      if (schedule.startTimestamp instanceof Timestamp) {
        scheduleDate = schedule.startTimestamp.toDate();
      } else if ((schedule as any).date && (schedule as any).startTime) {
        // Fallback for old schedule data format
        try {
          scheduleDate = parse(`${(schedule as any).date} ${(schedule as any).startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        } catch (e) {
          console.error("Error parsing old schedule date/time:", schedule, e);
        }
      }

      if (scheduleDate && !isNaN(scheduleDate.getTime())) {
        daysWithSchedules.add(startOfDay(scheduleDate).getTime());
      }
    });
    return daysWithSchedules;
  }, [schedules]);

  const resetForm = () => {
    const defaultDate = selectedDate || new Date();
    setFormState({
        caregiverId: '',
        patientId: '',
        startDate: defaultDate,
        startTime: '',
        endDate: defaultDate,
        endTime: '',
        taskInstructions: '',
        subTaskItems: [],
        newSubTask: ''
    });
  };

  const handleInputChange = (field: keyof typeof formState, value: any) => {
      setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubTask = () => {
    if (formState.newSubTask.trim()) {
      handleInputChange('subTaskItems', [...formState.subTaskItems, formState.newSubTask.trim()]);
      handleInputChange('newSubTask', '');
    }
  };

  const handleRemoveSubTask = (indexToRemove: number) => {
    handleInputChange('subTaskItems', formState.subTaskItems.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { caregiverId, patientId, startDate, startTime, endDate, endTime, taskInstructions } = formState;

    if (!caregiverId || !patientId || !startDate || !startTime || !endDate || !endTime || !taskInstructions) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const startDateTime = parse(`${format(startDate, 'yyyy-MM-dd')} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDateTime = parse(`${format(endDate, 'yyyy-MM-dd')} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({ title: "Error", description: "Invalid start or end time format.", variant: "destructive" });
        return;
    }

    if (endDateTime <= startDateTime) {
      toast({ title: "Error", description: "End time must be after start time.", variant: "destructive" });
      return;
    }
    
    const selectedCaregiver = caregivers.find(cg => cg.uid === caregiverId);
    const selectedPatient = patients.find(p => p.id === patientId);
    const finalSubTasks: SubTask[] = formState.subTaskItems.map(desc => ({ description: desc, completed: false }));

    const scheduleData = {
      caregiverId,
      caregiverName: selectedCaregiver?.name || 'N/A',
      patientId,
      patientName: selectedPatient?.name || 'N/A',
      startTimestamp: Timestamp.fromDate(startDateTime),
      endTimestamp: Timestamp.fromDate(endDateTime),
      task: taskInstructions,
      subTasks: finalSubTasks,
      status: 'pending',
    };

    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduleData);
        toast({ title: "Success", description: "Schedule updated successfully." });
      } else {
        await addSchedule(scheduleData);
        toast({ title: "Success", description: "Schedule created successfully." });
      }
      fetchData();
      setIsFormOpen(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({ title: "Error", description: "Failed to save schedule.", variant: "destructive" });
    }
  };

  const handleEdit = (schedule: Schedule) => setEditingSchedule(schedule);

  const confirmDelete = (scheduleId: string) => {
      setDeletingScheduleId(scheduleId);
      setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingScheduleId) return;
    try {
      await deleteSchedule(deletingScheduleId);
      toast({ title: "Success", description: "Schedule deleted successfully." });
      fetchData();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({ title: "Error", description: "Failed to delete schedule.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingScheduleId(null);
    }
  };

  const handleClockIn = async (scheduleId: string) => {
    try {
      await updateSchedule(scheduleId, {
        clockIn: Timestamp.now(),
        status: 'active',
      });
      toast({ title: "Success", description: "Clock in recorded successfully." });
      fetchData();
    } catch (error) {
      console.error("Error clocking in:", error);
      toast({ title: "Error", description: "Failed to record clock in.", variant: "destructive" });
    }
  };

  const handleClockOut = async (scheduleId: string) => {
    try {
      await updateSchedule(scheduleId, {
        clockOut: Timestamp.now(),
        status: 'completed',
      });
      toast({ title: "Success", description: "Clock out recorded successfully." });
      fetchData();
    } catch (error) {
      console.error("Error clocking out:", error);
      toast({ title: "Error", description: "Failed to record clock out.", variant: "destructive" });
    }
  };

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;

    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.caregiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.patientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (selectedDate) {
      const selectedDayStart = startOfDay(selectedDate);
      filtered = filtered.filter(schedule => {
        let scheduleStartTime: Date | null = null;
        if (schedule.startTimestamp instanceof Timestamp) {
            scheduleStartTime = schedule.startTimestamp.toDate();
        } else if ((schedule as any).date && (schedule as any).startTime) {
            try {
                scheduleStartTime = parse(`${(schedule as any).date} ${(schedule as any).startTime}`, 'yyyy-MM-dd HH:mm', new Date());
            } catch (e) {
                console.error("Error parsing old schedule date/time in filter:", schedule, e);
                return false; // Skip this schedule if its date/time cannot be parsed
            }
        }

        return scheduleStartTime && startOfDay(scheduleStartTime).getTime() === selectedDayStart.getTime();
      });
    }

    return filtered;
  }, [schedules, searchTerm, selectedDate]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card><CardContent className="p-2"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md" modifiers={{ hasSchedule: (date) => scheduledDays.has(startOfDay(date).getTime()) }} modifiersClassNames={{ hasSchedule: 'has-schedule' }} /></CardContent></Card>
          <Button onClick={() => { setEditingSchedule(null); resetForm(); setIsFormOpen(true); }} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Create New Schedule</Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search schedules..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          {isFormOpen ? (
            <Card className="mb-6"><CardHeader><CardTitle>{editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><RenderFormFields formState={formState} onInputChange={handleInputChange} onAddSubTask={handleAddSubTask} onRemoveSubTask={handleRemoveSubTask} caregivers={caregivers} patients={patients} /><div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingSchedule(null); }}>Cancel</Button><Button type="submit">{editingSchedule ? 'Update' : 'Create'}</Button></div></form></CardContent></Card>
          ) : (
            <Card><CardHeader><CardTitle>Schedules</CardTitle></CardHeader><CardContent>{isLoading ? <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div> : filteredSchedules.length > 0 ? <ul className="space-y-4">{filteredSchedules.map((schedule) => (<ScheduleListItem key={schedule.id} schedule={schedule} patients={patients} onEdit={handleEdit} onDelete={confirmDelete} onClockIn={handleClockIn} onClockOut={handleClockOut} />))}</ul> : <p className="text-muted-foreground">No schedules found.</p>}</CardContent></Card>
          )}
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the schedule.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeletingScheduleId(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={executeDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}

const SearchableSelect = ({ value, onValueChange, placeholder, items, searchPlaceholder }: { value: string, onValueChange: (value: string) => void, placeholder: string, items: { value: string, label: string }[], searchPlaceholder: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder}
          <Briefcase className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item.value}
                value={item.label}
                onSelect={() => {
                  onValueChange(item.value === value ? "" : item.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const RenderFormFields = ({ formState, onInputChange, onAddSubTask, onRemoveSubTask, caregivers, patients }: any) => {
  const caregiverItems = caregivers.map((cg: User) => ({ value: cg.uid, label: cg.name }));
  const patientItems = patients.map((p: Patient) => ({ value: p.id, label: p.name }));

  return (
    <>
      <div>
        <Label htmlFor="caregiver">Caregiver</Label>
        <SearchableSelect
          value={formState.caregiverId}
          onValueChange={(value) => onInputChange('caregiverId', value)}
          placeholder="Select caregiver"
          items={caregiverItems}
          searchPlaceholder="Search caregivers..."
        />
      </div>
      <div>
        <Label htmlFor="patient">Patient</Label>
        <SearchableSelect
          value={formState.patientId}
          onValueChange={(value) => onInputChange('patientId', value)}
          placeholder="Select patient"
          items={patientItems}
          searchPlaceholder="Search patients..."
        />
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{formState.startDate ? format(formState.startDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.startDate} onSelect={(date) => onInputChange('startDate', date)} initialFocus /></PopoverContent>
            </Popover>
        </div>
        <div><Label htmlFor="startTime">Start Time</Label><Input id="startTime" type="time" value={formState.startTime} onChange={(e) => onInputChange('startTime', e.target.value)} /></div>
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="endDate">End Date</Label>
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{formState.endDate ? format(formState.endDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.endDate} onSelect={(date) => onInputChange('endDate', date)} initialFocus /></PopoverContent>
            </Popover>
        </div>
        <div><Label htmlFor="endTime">End Time</Label><Input id="endTime" type="time" value={formState.endTime} onChange={(e) => onInputChange('endTime', e.target.value)} /></div>
      </div>
      <div className="space-y-3"><Label htmlFor="newSubTask" className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Tasks Checklist</Label><div className="flex items-center gap-2"><Input id="newSubTask" placeholder="Enter sub-task" value={formState.newSubTask} onChange={(e) => onInputChange('newSubTask', e.target.value)} onKeyPress={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); onAddSubTask();}}} /><Button type="button" onClick={onAddSubTask} variant="outline">Add</Button></div>
        {formState.subTaskItems.length > 0 && (<div className="mt-2 space-y-2 rounded-md border p-3"><h4 className="text-sm font-medium">Added Sub-tasks:</h4><ul className="list-none space-y-1">{formState.subTaskItems.map((item: string, index: number) => (<li key={index} className="flex items-center justify-between text-sm p-1"><span className="truncate">{item}</span><Button type="button" variant="ghost" size="icon" onClick={() => onRemoveSubTask(index)} className="h-6 w-6 text-destructive shrink-0"><XIcon className="h-4 w-4" /></Button></li>))}</ul></div>)}
      </div>
      <div><Label htmlFor="taskInstructions">Task Instructions</Label><Textarea id="taskInstructions" placeholder="Describe instructions..." value={formState.taskInstructions} onChange={(e) => onInputChange('taskInstructions', e.target.value)} rows={3} /></div>
    </>
  );
};

const ScheduleListItem = ({ schedule, patients, onEdit, onDelete, onClockIn, onClockOut }: { schedule: Schedule, patients: Patient[], onEdit: (sch: Schedule) => void, onDelete: (id: string) => void, onClockIn: (id: string) => void, onClockOut: (id: string) => void }) => {
    const patient = patients.find(p => p.id === schedule.patientId);
    const subtaskCount = schedule.subTasks?.length || 0;

    const formatAddress = (address: Address | undefined) => {
        if (!address || typeof address !== 'object') return null;
        const { street, city, state, postalCode, country } = address;
        return [street, city, state, postalCode, country].filter(Boolean).join(', ');
    };
    const displayAddress = formatAddress(patient?.address);

    return (
        <li className="rounded-lg border p-4 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-lg">{patient?.name || schedule.patientName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center mt-2"><Briefcase className="mr-2 h-4 w-4 text-primary" /> {schedule.task}</p>
                    {displayAddress && <p className="text-sm text-muted-foreground flex items-center mt-1"><HomeIcon className="mr-2 h-4 w-4 text-primary" /> {displayAddress}</p>}
                    <p className="text-sm text-muted-foreground flex items-center mt-1"><ListChecks className="mr-2 h-4 w-4 text-primary" /> {subtaskCount} Task(s)</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1"><UserIcon className="mr-2 h-4 w-4 text-primary" /> {schedule.caregiverName}</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <Clock className="mr-2 h-4 w-4 text-primary" /> 
                        {safeFormat(schedule.startTimestamp, 'MMM dd, yyyy HH:mm')} - {safeFormat(schedule.endTimestamp, 'MMM dd, yyyy HH:mm')}
                    </p>
                    {schedule.clockIn && <p className="text-xs mt-1">Clocked In: {safeFormat(schedule.clockIn, 'p')}</p>}
                    {schedule.clockOut && <p className="text-xs mt-1">Clocked Out: {safeFormat(schedule.clockOut, 'p')}</p>}
                    <p className="text-xs mt-2 capitalize">Status: <span className={cn(schedule.status === 'pending' && 'text-yellow-600', schedule.status === 'active' && 'text-green-600', schedule.status === 'completed' && 'text-blue-600', schedule.status === 'overtime' && 'text-orange-600')}>{schedule.status}</span></p>
                </div>
                <div className="flex flex-col gap-1">
                    {schedule.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => onClockIn(schedule.id)}><LogIn className="mr-2 h-4 w-4" /> Clock In</Button>
                    )}
                    {(schedule.status === 'active' || schedule.status === 'overtime') && (
                        <Button variant="outline" size="sm" onClick={() => onClockOut(schedule.id)}><LogOut className="mr-2 h-4 w-4" /> Clock Out</Button>
                    )}
                    {schedule.status !== 'completed' && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => onEdit(schedule)}><Edit2 className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(schedule.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
};