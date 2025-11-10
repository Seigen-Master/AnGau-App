
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCaregivers, addPatient } from '@/lib/firestore';
import type { User, Patient, Address, Schedule } from '@/types';
import CaregiversTable from '@/components/admin/CaregiversTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, ArrowLeft, CalendarIcon, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import AddressMap from '@/components/admin/AddressMap';
import { Card, CardContent, CardHeader, CardTitle as FormCardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useHttpsCallable } from '@/hooks/use-https-callable';
import { uploadImage } from '@/lib/storage';

const initialAddressState: Address = { fullAddress: '', lat: 0, lng: 0 };

export default function AdminCaregiversPage() {
  const [caregivers, setCaregivers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
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
    password: '',
    confirmPassword: '',
  });

  const { toast } = useToast();
  const router = useRouter();
  const { callFunction: createCaregiver, isLoading: isCreating } = useHttpsCallable('createCaregiver');

  const fetchCaregivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const caregiversData = await getCaregivers();
      setCaregivers(caregiversData);
    } catch (error) {
      console.error("Error fetching caregivers:", error);
      toast({ title: 'Error', description: 'Failed to fetch caregivers.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCaregivers();
  }, [fetchCaregivers]);

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
        setImagePreviewUrl(null);
    }
  };

  const handleAddCaregiver = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: 'Error', description: 'Name, email, and password are required.', variant: 'destructive' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
        toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
        return;
    }

    setIsAdding(true);
    try {
      let profilePictureUrl = '';
      if (profilePictureFile) {
        profilePictureUrl = await uploadImage(profilePictureFile, `profile_pictures/${Date.now()}_${profilePictureFile.name}`);
      }

      const { confirmPassword, ...caregiverData } = formData;
      await createCaregiver({ 
        ...caregiverData,
        statusEffectiveDate: Timestamp.fromDate(formData.statusEffectiveDate),
        positionEffectiveDate: Timestamp.fromDate(formData.positionEffectiveDate),
        ratePerHour: Number(formData.ratePerHour) || 0,
        profilePictureUrl,
      });

      toast({ title: 'Success', description: 'Caregiver created successfully.' });
      setIsDialogOpen(false);
      setProfilePictureFile(null);
      setImagePreviewUrl(null);
      fetchCaregivers();
    } catch (error: any) {
      console.error("Error creating caregiver:", error);
      toast({ title: 'Error', description: error.message || 'Failed to create caregiver.', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Caregivers</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Add New Caregiver</Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <CaregiversTable caregivers={caregivers} onRefresh={fetchCaregivers} />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Add New Caregiver</DialogTitle>
                <DialogDescription>Enter the details for the new caregiver.</DialogDescription>
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
                                <AddressMap onLocationChange={handleLocationChange} />
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
                        <CardHeader><FormCardTitle>Account Password</FormCardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCaregiver} disabled={isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Caregiver
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
