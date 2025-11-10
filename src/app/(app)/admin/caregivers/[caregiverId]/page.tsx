
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCaregiverById, getAssignedPatients, updateUser, getSchedulesForCaregiverForWeek } from '@/lib/firestore'; // Import getSchedulesForCaregiverForWeek
import { uploadImage } from '@/lib/storage';
import { useHttpsCallable } from '@/hooks/use-https-callable';
import type { User, Patient, Address, Schedule } from '@/types';
import CaregiverDetailCard from '@/components/admin/CaregiverDetailCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, ArrowLeft, CalendarIcon, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek } from 'date-fns'; // Import startOfWeek
import { Timestamp } from 'firebase/firestore';
import AddressMap from '@/components/admin/AddressMap';
import { Card, CardContent, CardHeader, CardTitle as FormCardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
// import PatientDetailCard from '@/components/admin/PatientDetailCard'; // This import is no longer needed if we remove the usage

const initialAddressState: Address = { fullAddress: '', lat: 0, lng: 0 };

export default function CaregiverDetailPage({ params }: { params: { caregiverId: string } }) {
  const { caregiverId } = params;
  const router = useRouter();
  const { toast } = useToast();
  const { callFunction: changePassword } = useHttpsCallable('changePassword');


  const [caregiver, setCaregiver] = useState<User | null>(null);
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [weeklySchedules, setWeeklySchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    position: 'Full-time' as 'Full-time' | 'Part-time',
    statusEffectiveDate: new Date(),
    positionEffectiveDate: new Date(),
    ratePerHour: 0,
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female',
    address: initialAddressState,
    profilePictureUrl: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fetchCaregiverData = useCallback(async () => {
    if (typeof caregiverId !== 'string') return;
    setIsLoading(true);
    try {
      const caregiverData = await getCaregiverById(caregiverId);
      setCaregiver(caregiverData);
      if (caregiverData) {
        setFormData(prev => ({
            ...prev,
            name: caregiverData.name || '',
            email: caregiverData.email || '',
            phone: caregiverData.phone || '',
            status: caregiverData.status || 'active',
            position: caregiverData.position || 'Full-time',
            statusEffectiveDate: caregiverData.statusEffectiveDate ? caregiverData.statusEffectiveDate.toDate() : new Date(),
            positionEffectiveDate: caregiverData.positionEffectiveDate ? caregiverData.positionEffectiveDate.toDate() : new Date(),
            ratePerHour: caregiverData.ratePerHour || 0,
            dateOfBirth: caregiverData.dateOfBirth || '',
            gender: caregiverData.gender || 'Male',
            address: caregiverData.address || initialAddressState,
            profilePictureUrl: caregiverData.profilePictureUrl || '',
        }));
        setImagePreviewUrl(caregiverData.profilePictureUrl || null);
        if (caregiverData.assignedPatientIds && caregiverData.assignedPatientIds.length > 0) {
          const patientsData = await getAssignedPatients(caregiverData.assignedPatientIds);
          setAssignedPatients(patientsData);
        } else {
            setAssignedPatients([]);
        }

        // Fetch weekly schedules
        const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday as start of the week
        const schedules = await getSchedulesForCaregiverForWeek(caregiverId, startOfThisWeek);
        setWeeklySchedules(schedules);

      }
    } catch (error) {
      console.error("Error fetching caregiver data:", error);
      toast({ title: 'Error', description: 'Failed to fetch caregiver details.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [caregiverId, toast]);

  useEffect(() => {
    fetchCaregiverData();
  }, [fetchCaregiverData]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prevState => ({ ...prevState, [field]: value }));
  };

  const handleLocationChange = useCallback(({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      address: {
        fullAddress: address,
        lat,
        lng,
      }
    }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
        setProfilePictureFile(null);
        setImagePreviewUrl(caregiver?.profilePictureUrl || null);
    }
  };

  const handleUpdate = async () => {
    if (typeof caregiverId !== 'string') return;
    setIsUpdating(true);
    try {
      // Password change logic
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
          setIsUpdating(false);
          return;
        }
        await changePassword({ uid: caregiverId, newPassword: formData.newPassword });
        toast({ title: 'Success', description: 'Password changed successfully.' });
      }

      let profilePictureUrl = formData.profilePictureUrl;
      if (profilePictureFile) {
        profilePictureUrl = await uploadImage(profilePictureFile, `profile_pictures/${caregiverId}_${profilePictureFile.name}`);
      }
      
      const { newPassword, confirmPassword, ...updateData } = formData;

      await updateUser(caregiverId, { 
        ...updateData,
        statusEffectiveDate: Timestamp.fromDate(formData.statusEffectiveDate),
        positionEffectiveDate: Timestamp.fromDate(formData.positionEffectiveDate),
        ratePerHour: Number(formData.ratePerHour) || 0,
        profilePictureUrl,
      });
      toast({ title: 'Success', description: 'Caregiver details updated successfully.' });
      setIsEditDialogOpen(false);
      setProfilePictureFile(null);
      fetchCaregiverData(); // Refresh data
    } catch (error: any) {
      console.error("Error updating caregiver:", error);
      toast({ title: 'Error', description: error.message || 'Failed to update caregiver details.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (!caregiver) {
    return <div className="text-center">Caregiver not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Caregiver Profile</h1>
          <p className="text-muted-foreground">Comprehensive information for {caregiver.name}</p>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Caregivers
        </Button>
        <Button onClick={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
      </div>

      <div className="grid gap-6">
        <CaregiverDetailCard caregiver={caregiver} assignedPatients={assignedPatients} weeklySchedules={weeklySchedules} />
      </div>

      {/* This section for Assigned Patients has been removed as per the user's request */}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Edit Caregiver Information</DialogTitle>
                <DialogDescription>Update the details for {caregiver.name}.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6 p-4">
                    <Card>
                        <CardHeader><FormCardTitle>Personal & Contact Information</FormCardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Profile Picture</Label>
                                <Input type="file" onChange={handleFileChange} />
                                {imagePreviewUrl && <Image src={imagePreviewUrl} alt="Profile Preview" width={96} height={96} className="mt-2 rounded-full object-cover" />}
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div><Label>Name</Label><Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} /></div>
                                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
                                <div>
                                    <Label>Gender</Label>
                                    <Select onValueChange={(value) => handleInputChange('gender', value)} value={formData.gender}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Date of Birth</Label><Input type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} /></div>
                                <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
                            </div>
                            <div>
                                <Label>Address</Label>
                                <AddressMap onLocationChange={handleLocationChange} initialAddress={formData.address.fullAddress} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><FormCardTitle>Employment Details</FormCardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Status</Label>
                                    <Select onValueChange={(value) => handleInputChange('status', value)} value={formData.status}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Status Effective Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{format(formData.statusEffectiveDate, 'PPP')}</Button></PopoverTrigger>
                                        <PopoverContent><Calendar mode="single" selected={formData.statusEffectiveDate} onSelect={(date) => handleInputChange('statusEffectiveDate', date || new Date())} /></PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label>Position</Label>
                                    <Select onValueChange={(value) => handleInputChange('position', value)} value={formData.position}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Part-time">Part-time</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Position Effective Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{format(formData.positionEffectiveDate, 'PPP')}</Button></PopoverTrigger>
                                        <PopoverContent><Calendar mode="single" selected={formData.positionEffectiveDate} onSelect={(date) => handleInputChange('positionEffectiveDate', date || new Date())} /></PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div><Label>Rate/Hour (USD)</Label><Input type="number" value={formData.ratePerHour} onChange={(e) => handleInputChange('ratePerHour', e.target.value)} /></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><FormCardTitle>Change Password</FormCardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" value={formData.newPassword} onChange={(e) => handleInputChange('newPassword', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
