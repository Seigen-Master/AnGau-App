
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPatients, addPatient } from '@/lib/firestore';
import type { Patient, Address, EmergencyContact } from '@/types';
import PatientsTable from '@/components/admin/PatientsTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle as PatientCardTitle } from '@/components/ui/card';
import AddressMap from '@/components/admin/AddressMap';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { uploadImage } from '@/lib/storage';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

const initialAddressState: Address = { fullAddress: '', lat: 0, lng: 0 };
const initialEmergencyContactState: EmergencyContact = { name: '', relationship: '', phone: '' };

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({ 
      address: initialAddressState, 
      emergencyContacts: [],
      name: '',
      email: '',
      phone: '',
      age: undefined,
      gender: undefined,
      profilePictureUrl: '',
      Diagnosis: '',
      dischargePlan: '',
      familyComment: '',
      evaluation: '',
      medicationsList: '',
      interdisciplinaryTeamNotes: '',
      medicalAppointments: '',
      emergencyDisasterPlans: '',
      communityResources: '',
      clientComments: '',
      doctorsNotes: '',
      specialNotes: '',
      allotedTime: '',
  });
  const [newEmergencyContact, setNewEmergencyContact] = useState<EmergencyContact>(initialEmergencyContactState);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const patientsData = await getAllPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({ title: 'Error', description: 'Failed to fetch patients.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleInputChange = (id: keyof Patient, value: any) => {
    setNewPatient(prevState => ({ ...prevState, [id]: value }));
  };

  const handleLocationChange = useCallback(({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
    setNewPatient(prev => ({
      ...prev,
      address: {
        fullAddress: address,
        lat,
        lng,
      }
    }));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewEmergencyContact(prev => ({ ...prev, [id]: value }));
  };

  const handleAddContact = () => {
    if(!newEmergencyContact.name || !newEmergencyContact.phone || !newEmergencyContact.relationship){
        toast({ title: "Validation Error", description: "All fields for the emergency contact are required.", variant: "destructive" });
        return;
    }
    const updatedContacts = [...(newPatient.emergencyContacts || []), newEmergencyContact];
    setNewPatient(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    setNewEmergencyContact(initialEmergencyContactState);
  };

  const handleRemoveContact = (index: number) => {
    const updatedContacts = newPatient.emergencyContacts?.filter((_, i) => i !== index);
    setNewPatient(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.address?.fullAddress) {
      toast({ title: 'Error', description: 'Patient name and address are required.', variant: 'destructive' });
      return;
    }
    setIsAdding(true);
    let profileImageUrl = '';

    if (selectedImageFile) {
        try {
            const imagePath = `patients_profile_pictures/${Date.now()}_${selectedImageFile.name}`;
            profileImageUrl = await uploadImage(selectedImageFile, imagePath);
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            toast({ title: "Error", description: "Failed to upload profile picture.", variant: "destructive" });
            setIsAdding(false);
            return;
        }
    }

    try {
      const patientData = { ...newPatient, profilePictureUrl: profileImageUrl };
      const patientId = await addPatient(patientData as Omit<Patient, 'id'>);
      toast({ title: 'Success', description: 'Patient added successfully.' });
      setIsDialogOpen(false);
      setNewPatient({ address: initialAddressState, emergencyContacts: [] }); // Reset form
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      fetchPatients();
      router.push(`/admin/patients/${patientId}`);
    } catch (error) {
      console.error("Error adding patient:", error);
      toast({ title: 'Error', description: 'Failed to add patient.', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Patients</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Add New Patient</Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <PatientsTable patients={patients} onDataChange={fetchPatients} />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Enter the details for the new patient.</DialogDescription>
          </DialogHeader>
           <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-4">
                <Card>
                  <CardHeader><PatientCardTitle>Personal Info</PatientCardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label htmlFor="name">Full Name</Label><Input id="name" onChange={(e) => handleInputChange('name', e.target.value)} /></div>
                      <div><Label htmlFor="age">Age</Label><Input id="age" type="number" onChange={(e) => handleInputChange('age', e.target.value)} /></div>
                      <div><Label htmlFor="email">Email Address</Label><Input id="email" type="email" onChange={(e) => handleInputChange('email', e.target.value)} /></div>
                      <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                     <div>
                        <Label htmlFor="profilePicture">Profile Picture</Label>
                        <Input id="profilePicture" type="file" accept="image/*" onChange={handleImageChange} />
                        {imagePreviewUrl && <Image src={imagePreviewUrl} alt="Profile Preview" width={96} height={96} className="mt-2 rounded-full object-cover" />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Address</h4>
                        <AddressMap onLocationChange={handleLocationChange} />
                    </div>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader><PatientCardTitle>Care Details</PatientCardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label htmlFor="Diagnosis">Diagnosis</Label><RichTextEditor value={newPatient.Diagnosis || ''} onChange={(value) => handleInputChange('Diagnosis', value)} /></div>
                    <div><Label htmlFor="medicationsList">Medications List</Label><RichTextEditor value={newPatient.medicationsList || ''} onChange={(value) => handleInputChange('medicationsList', value)} /></div>
                    <div><Label htmlFor="medicalAppointments">Medical Appointments</Label><RichTextEditor value={newPatient.medicalAppointments || ''} onChange={(value) => handleInputChange('medicalAppointments', value)} /></div>
                    <div><Label htmlFor="emergencyDisasterPlans">Emergency & Disaster Plans</Label><RichTextEditor value={newPatient.emergencyDisasterPlans || ''} onChange={(value) => handleInputChange('emergencyDisasterPlans', value)} /></div>
                    <div><Label htmlFor="communityResources">Community Resources</Label><RichTextEditor value={newPatient.communityResources || ''} onChange={(value) => handleInputChange('communityResources', value)} /></div>
                    <div><Label htmlFor="dischargePlan">Discharge Plan</Label><RichTextEditor value={newPatient.dischargePlan || ''} onChange={(value) => handleInputChange('dischargePlan', value)} /></div>
                    <div><Label htmlFor="evaluation">Evaluation</Label><RichTextEditor value={newPatient.evaluation || ''} onChange={(value) => handleInputChange('evaluation', value)} /></div>
                    <div><Label htmlFor="allotedTime">Alloted Time</Label><Input id="allotedTime" value={newPatient.allotedTime || ''} onChange={(e) => handleInputChange('allotedTime', e.target.value)} /></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><PatientCardTitle>Comments and Notes</PatientCardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label htmlFor="interdisciplinaryTeamNotes">Interdisciplinary Team Notes</Label><RichTextEditor value={newPatient.interdisciplinaryTeamNotes || ''} onChange={(value) => handleInputChange('interdisciplinaryTeamNotes', value)} /></div>
                    <div><Label htmlFor="familyComment">Family Comment</Label><RichTextEditor value={newPatient.familyComment || ''} onChange={(value) => handleInputChange('familyComment', value)} /></div>
                    <div><Label htmlFor="clientComments">Client Comments</Label><RichTextEditor value={newPatient.clientComments || ''} onChange={(value) => handleInputChange('clientComments', value)} /></div>
                    <div><Label htmlFor="doctorsNotes">Doctor’s Notes</Label><RichTextEditor value={newPatient.doctorsNotes || ''} onChange={(value) => handleInputChange('doctorsNotes', value)} /></div>
                    <div><Label htmlFor="specialNotes">Special Notes</Label><RichTextEditor value={newPatient.specialNotes || ''} onChange={(value) => handleInputChange('specialNotes', value)} /></div>
                  </CardContent>
                </Card>
                 <Card>
                    <CardHeader><PatientCardTitle>Emergency Contacts</PatientCardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {newPatient.emergencyContacts?.map((contact, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div>
                                    <p className="font-semibold">{contact.name} <span className="text-xs text-muted-foreground">({contact.relationship})</span></p>
                                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveContact(index)}><XIcon className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <div className="grid grid-cols-3 gap-2 items-end">
                             <div><Label htmlFor="name">Name</Label><Input id="name" value={newEmergencyContact.name} onChange={handleContactChange} /></div>
                             <div><Label htmlFor="relationship">Relationship</Label><Input id="relationship" value={newEmergencyContact.relationship} onChange={handleContactChange} /></div>
                             <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" value={newEmergencyContact.phone} onChange={handleContactChange} /></div>
                        </div>
                         <Button onClick={handleAddContact} variant="outline" size="sm" className="w-full"><UserPlus className="mr-2 h-4 w-4"/>Add Contact</Button>
                    </CardContent>
                 </Card>
              </div>
            </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPatient} disabled={isAdding}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
