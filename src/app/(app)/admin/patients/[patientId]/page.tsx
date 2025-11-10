
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import PatientDetailCard from '@/components/admin/PatientDetailCard'; // Changed import path
import type { Patient, EmergencyContact, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle as PatientCardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { ArrowLeft, Loader2, Edit2, XIcon, UserPlus } from 'lucide-react';
import { getPatientById, updatePatient, addPatientDocument, deletePatientDocument } from '@/lib/firestore';
import { uploadImage, uploadFile, deleteFileFromStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import AddressMap from '@/components/admin/AddressMap';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });


const initialAddressState: Address = { fullAddress: '', lat: 0, lng: 0 };
const initialEmergencyContactState: EmergencyContact = { name: '', relationship: '', phone: '' };

export default function AdminPatientInfoPage() {
  const params = useParams<{ patientId: string }>();
  const { toast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormValues, setEditFormValues] = useState<Partial<Patient>>({ address: initialAddressState });
  const [newEmergencyContact, setNewEmergencyContact] = useState<EmergencyContact>(initialEmergencyContactState);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    const patientId = params.patientId;
    if (!patientId) {
      setError("Patient ID is missing.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const fetchedPatient = await getPatientById(patientId);
      if (fetchedPatient) {
        setPatient(fetchedPatient);
        setEditFormValues({
          ...fetchedPatient,
          address: fetchedPatient.address || initialAddressState,
          emergencyContacts: fetchedPatient.emergencyContacts || [],
        });
        setImagePreviewUrl(fetchedPatient.profilePictureUrl || null);
      } else {
        setError("Patient not found.");
      }
    } catch (err) {
      console.error("Error fetching patient:", err);
      setError("Failed to load patient details. You may not have permission to view this page.");
    } finally {
      setLoading(false);
    }
  }, [params.patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const handleEditClick = () => {
    if (patient) {
      setIsEditDialogOpen(true);
    }
  };

  const handleInputChange = (id: keyof Patient, value: any) => {
    setEditFormValues(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setEditFormValues(prev => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(patient?.profilePictureUrl || null);
    }
  };

  const handleEditLocationChange = useCallback(({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
    setEditFormValues(prev => ({
      ...prev,
      address: {
        fullAddress: address,
        lat,
        lng,
      }
    }));
  }, []);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewEmergencyContact(prev => ({ ...prev, [id]: value }));
  };

  const handleAddContact = () => {
    if(!newEmergencyContact.name || !newEmergencyContact.phone || !newEmergencyContact.relationship){
        toast({ title: "Validation Error", description: "All fields for the emergency contact are required.", variant: "destructive" });
        return;
    }
    const updatedContacts = [...(editFormValues.emergencyContacts || []), newEmergencyContact];
    setEditFormValues(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    setNewEmergencyContact(initialEmergencyContactState);
  };

  const handleRemoveContact = (index: number) => {
    const updatedContacts = editFormValues.emergencyContacts?.filter((_, i) => i !== index);
    setEditFormValues(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const handleDocumentUpload = useCallback(async (file: File) => {
    if (!patient?.id) return;
    try {
      const filePath = `patient_documents/${patient.id}/${file.name}`;
      const downloadURL = await uploadFile(file, filePath);
      await addPatientDocument(patient.id, file.name, downloadURL);
      toast({ title: "Success", description: "Document uploaded successfully." });
      fetchPatient(); // Re-fetch patient data to update document list
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({ title: "Error", description: "Failed to upload document.", variant: "destructive" });
    }
  }, [patient?.id, toast, fetchPatient]);

  const handleDocumentDelete = useCallback(async (documentUrl: string) => {
    if (!patient?.id) return;
    try {
      await deleteFileFromStorage(documentUrl);
      await deletePatientDocument(patient.id, documentUrl);
      toast({ title: "Success", description: "Document deleted successfully." });
      fetchPatient(); // Re-fetch patient data to update document list
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    }
  }, [patient?.id, toast, fetchPatient]);

  const handleSaveEdit = async () => {
    if (!patient || !editFormValues.name || !editFormValues.address?.fullAddress) {
      toast({ title: "Validation Error", description: "Patient Name and Address are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    let profileImageUrl: string | undefined = editFormValues.profilePictureUrl;

    if (selectedImageFile) {
      try {
        const imagePath = `patients_profile_pictures/${patient.id}_${selectedImageFile.name}`;
        profileImageUrl = await uploadImage(selectedImageFile, imagePath);
        toast({ title: "Success", description: "Profile picture uploaded." });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        toast({ title: "Error", description: "Failed to upload profile picture.", variant: "destructive" });
        setIsSaving(false);
        return;
      }
    }

    try {
      await updatePatient(patient.id, { ...editFormValues, profilePictureUrl: profileImageUrl });
      toast({ title: "Success", description: "Patient details have been updated." });
      setIsEditDialogOpen(false);
      setSelectedImageFile(null);
      fetchPatient();
    } catch (error) {
      console.error("Failed to update patient:", error);
      toast({ title: "Error", description: "Could not update patient details.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatAddress = (address: Address | undefined) => {
    if (!address) return 'No address provided';
    return address.fullAddress || [address.street, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ');
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Loading patient details...</span>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient's Profile"
        description={patient ? `Comprehensive information for ${patient.name}.` : "The requested patient could not be found."}
      >
        <div className="flex items-center gap-2">
          <Link href="/admin/patients">
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Patients List</Button>
          </Link>
          {patient && (
            <Button onClick={handleEditClick}><Edit2 className="mr-2 h-4 w-4" />Edit Patient</Button>
          )}
        </div>
      </PageHeader>

      {error && <div className="p-4 text-center text-red-600 bg-red-100 rounded-md">{error}</div>}
      {patient && (
        <PatientDetailCard 
          patient={patient} 
          onEditClick={handleEditClick} 
          onDocumentUpload={handleDocumentUpload}
          onDocumentDelete={handleDocumentDelete}
          isAdminView={true}
        />
      )}

      {patient && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) {
            setSelectedImageFile(null);
            setImagePreviewUrl(patient.profilePictureUrl || null);
            setEditFormValues({
              ...patient,
              address: patient.address || initialAddressState,
              emergencyContacts: patient.emergencyContacts || [],
            });
          }
        }}>
          <DialogContent
            className="sm:max-w-3xl"
            title={`Edit Patient: ${patient.name}`}
            onPointerDownOutside={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest('.pac-container') || target.closest('.gm-style') || target.hasAttribute('data-radix-popper-content')) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            onInteractOutside={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest('.pac-container') || target.closest('.gm-style') || target.hasAttribute('data-radix-popper-content')) {
                event.preventDefault();
              }
            }}
          >
            <DialogHeader><DialogTitle>Edit Patient: {patient.name}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-4">
                <Card>
                  <CardHeader><PatientCardTitle>Personal Info</PatientCardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label htmlFor="name">Full Name</Label><Input id="name" value={editFormValues.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} /></div>
                      <div><Label htmlFor="age">Age</Label><Input id="age" type="number" value={editFormValues.age || ''} onChange={(e) => handleInputChange('age', e.target.value)} /></div>
                      <div><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={editFormValues.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
                      <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" value={editFormValues.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select onValueChange={(value) => handleSelectChange('gender', value)} value={editFormValues.gender || ''}>
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
                        <AddressMap onLocationChange={handleEditLocationChange} initialAddress={editFormValues.address?.fullAddress || formatAddress(patient.address)} />
                    </div>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader><PatientCardTitle>Care Details</PatientCardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label htmlFor="Diagnosis">Diagnosis</Label><RichTextEditor value={editFormValues.Diagnosis || ''} onChange={(value) => handleInputChange('Diagnosis', value)} /></div>
                    <div><Label htmlFor="medicationsList">Medications List</Label><RichTextEditor value={editFormValues.medicationsList || ''} onChange={(value) => handleInputChange('medicationsList', value)} /></div>
                    <div><Label htmlFor="medicalAppointments">Medical Appointments</Label><RichTextEditor value={editFormValues.medicalAppointments || ''} onChange={(value) => handleInputChange('medicalAppointments', value)} /></div>
                    <div><Label htmlFor="emergencyDisasterPlans">Emergency & Disaster Plans</Label><RichTextEditor value={editFormValues.emergencyDisasterPlans || ''} onChange={(value) => handleInputChange('emergencyDisasterPlans', value)} /></div>
                    <div><Label htmlFor="communityResources">Community Resources</Label><RichTextEditor value={editFormValues.communityResources || ''} onChange={(value) => handleInputChange('communityResources', value)} /></div>
                    <div><Label htmlFor="dischargePlan">Discharge Plan</Label><RichTextEditor value={editFormValues.dischargePlan || ''} onChange={(value) => handleInputChange('dischargePlan', value)} /></div>
                    <div><Label htmlFor="evaluation">Evaluation</Label><RichTextEditor value={editFormValues.evaluation || ''} onChange={(value) => handleInputChange('evaluation', value)} /></div>
                    <div><Label htmlFor="allotedTime">Alloted Time</Label><Input id="allotedTime" value={editFormValues.allotedTime || ''} onChange={(e) => handleInputChange('allotedTime', e.target.value)} /></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><PatientCardTitle>Comments and Notes</PatientCardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label htmlFor="interdisciplinaryTeamNotes">Interdisciplinary Team Notes</Label><RichTextEditor value={editFormValues.interdisciplinaryTeamNotes || ''} onChange={(value) => handleInputChange('interdisciplinaryTeamNotes', value)} /></div>
                    <div><Label htmlFor="familyComment">Family Comment</Label><RichTextEditor value={editFormValues.familyComment || ''} onChange={(value) => handleInputChange('familyComment', value)} /></div>
                    <div><Label htmlFor="clientComments">Client Comments</Label><RichTextEditor value={editFormValues.clientComments || ''} onChange={(value) => handleInputChange('clientComments', value)} /></div>
                    <div><Label htmlFor="doctorsNotes">Doctor’s Notes</Label><RichTextEditor value={editFormValues.doctorsNotes || ''} onChange={(value) => handleInputChange('doctorsNotes', value)} /></div>
                    <div><Label htmlFor="specialNotes">Special Notes</Label><RichTextEditor value={editFormValues.specialNotes || ''} onChange={(value) => handleInputChange('specialNotes', value)} /></div>
                  </CardContent>
                </Card>
                 <Card>
                    <CardHeader><PatientCardTitle>Emergency Contacts</PatientCardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {editFormValues.emergencyContacts?.map((contact, index) => (
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
