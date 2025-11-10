
import type { User, Patient, Address, Schedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Phone, Mail, Calendar, Briefcase, DollarSign, Activity, Home, Clock, ListTodo } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';

interface CaregiverDetailCardProps {
  caregiver: User;
  assignedPatients: Patient[];
  weeklySchedules: Schedule[];
}

export default function CaregiverDetailCard({ caregiver, assignedPatients, weeklySchedules }: CaregiverDetailCardProps) {
  const calculateAge = (dob: string) => {
    try {
      return differenceInYears(new Date(), new Date(dob));
    } catch {
      return null;
    }
  };
  const age = caregiver.dateOfBirth ? calculateAge(caregiver.dateOfBirth) : null;
  const formatAddress = (address: Address | undefined) => {
    if (!address?.fullAddress) return 'Not set';
    return address.fullAddress;
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarImage src={caregiver.profilePictureUrl} alt={caregiver.name} />
                        <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{caregiver.name}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold mb-2 border-b pb-1">Personal & Contact Information</h3>
                <div className="space-y-2 pt-2">
                    <p className="flex items-center text-sm text-muted-foreground"><Mail className="mr-2 h-4 w-4" /> {caregiver.email}</p>
                    <p className="flex items-center text-sm text-muted-foreground mt-1"><Phone className="mr-2 h-4 w-4" /> {caregiver.phone || 'Not available'}</p>
                    <p className="flex items-center text-sm text-muted-foreground mt-1"><Home className="mr-2 h-4 w-4" /> {formatAddress(caregiver.address)}</p>
                    <p className="flex items-center text-sm text-muted-foreground mt-1"><Calendar className="mr-2 h-4 w-4" /> Age: {age ?? 'Not set'}</p>
                    <p className="flex items-center text-sm text-muted-foreground mt-1"><UserIcon className="mr-2 h-4 w-4" /> Gender: {caregiver.gender || 'Not set'}</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Activity className="mr-2 h-4 w-4" /> Status: 
                    <Badge className={`ml-2 ${caregiver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {caregiver.status || 'Not set'}
                    </Badge>
                </div>
                <p className="flex items-center text-sm text-muted-foreground pl-6">
                    Effective: {caregiver.statusEffectiveDate ? format(caregiver.statusEffectiveDate.toDate(), 'PPP') : 'Not set'}
                </p>
                <p className="flex items-center text-sm text-muted-foreground pt-2"><Briefcase className="mr-2 h-4 w-4" /> Position: {caregiver.position || 'Not set'}</p>
                <p className="flex items-center text-sm text-muted-foreground pl-6">
                    Effective: {caregiver.positionEffectiveDate ? format(caregiver.positionEffectiveDate.toDate(), 'PPP') : 'Not set'}
                </p>
                <p className="flex items-center text-sm text-muted-foreground mt-1 pt-2">
                    <DollarSign className="mr-2 h-4 w-4" /> 
                    Rate: ${caregiver.ratePerHour?.toFixed(2) || '0.00'} / hour
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Caregiver Activities</CardTitle>
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold mb-2">Assigned Patients</h3>
                {assignedPatients.length > 0 ? (
                    <ul className="space-y-1">
                    {assignedPatients.map(patient => (
                        <li key={patient.id} className="text-sm text-muted-foreground">{patient.name}</li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No patients assigned.</p>
                )}

                <h3 className="font-semibold mt-4 mb-2 border-t pt-4">This Week's Schedules</h3>
                 {weeklySchedules.length > 0 ? (
                    <ul className="space-y-2">
                    {weeklySchedules.map(schedule => (
                        <li key={schedule.id} className="text-sm text-muted-foreground p-2 rounded-md bg-muted/50">
                           <p className="font-semibold">{schedule.patientName}</p>
                           <p className="flex items-center"><Clock className="mr-2 h-4 w-4" /> {format(schedule.startTimestamp.toDate(), 'PPP HH:mm')} - {format(schedule.endTimestamp.toDate(), 'HH:mm')}</p>
                           <p className="flex items-center mt-1">
                                <Badge className={`text-xs ${schedule.status === 'completed' ? 'bg-green-500' : schedule.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                    {schedule.status ? schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1) : 'N/A'}
                                </Badge>
                           </p>
                           {schedule.subTasks && schedule.subTasks.length > 0 && (
                                <div className="mt-2 pl-6">
                                    <p className="font-semibold flex items-center text-xs text-muted-foreground"><ListTodo className="mr-1 h-3 w-3" /> Sub-tasks:</p>
                                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                                        {schedule.subTasks.map((task, idx) => (
                                            <li key={idx} className={task.completed ? 'line-through' : ''}>{task.description}</li>
                                        ))}
                                    </ul>
                                </div>
                           )}
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No schedules for this week.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
