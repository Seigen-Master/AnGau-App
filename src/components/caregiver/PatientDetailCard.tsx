
'use client';

import { useState, useRef } from 'react';
import type { Patient, EmergencyContact, Address } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Phone, Mail, Home, Stethoscope, Briefcase, Users, Building, MessageSquare, Book, AlertTriangle, Info, Calendar, Edit2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PatientDetailCardProps {
    patient: Patient;
    onEditClick?: () => void;
    // onDocumentUpload?: (file: File) => Promise<void>; // Removed document upload prop
    // onDocumentDelete?: (documentUrl: string) => Promise<void>; // Removed document delete prop
    isAdminView?: boolean; // New prop to determine if it's an admin view for upload/delete
}

const DetailItem = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
    <div className="flex items-start text-sm">
        <div className="mr-2 pt-1 text-primary">{icon}</div>
        <div>
            <span className="font-semibold">{label}:</span>
            <div className="text-muted-foreground whitespace-pre-wrap">{children}</div>
        </div>
    </div>
);

const RichTextContent = ({ html }: { html: string | undefined | null }) => {
    if (!html) return <p className="text-muted-foreground">Not provided</p>;
    const sanitizedHtml = html.replace(/<script.*?>.*?<\/script>/gi, '');
    return <div className="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}

const EmergencyContactCard = ({ contact }: { contact: EmergencyContact }) => (
    <div className="flex items-center p-3 rounded-md border bg-muted/50">
        <User className="h-6 w-6 mr-4 text-primary" />
        <div>
            <p className="font-semibold">{contact.name} <span className="text-sm text-muted-foreground">({contact.relationship})</span></p>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
        </div>
    </div>
);


export default function PatientDetailCard({ patient, onEditClick, isAdminView = false }: PatientDetailCardProps) {
    // Removed document upload/delete state and refs as the card is removed
    // const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // const [isUploading, setIsUploading] = useState(false);
    // const fileInputRef = useRef<HTMLInputElement>(null);

    const formatAddress = (address: Address | undefined) => {
        if (!address) return 'No address provided';
        return address.fullAddress || [address.street, address.city, address.state, address.postalCode].filter(Boolean).join(', ');
    };

    // Removed document related handlers
    // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (event.target.files && event.target.files.length > 0) {
    //         setSelectedFile(event.target.files[0]);
    //     } else {
    //         setSelectedFile(null);
    //     }
    // };

    // const handleUploadClick = async () => {
    //     if (selectedFile && onDocumentUpload) {
    //         setIsUploading(true);
    //         try {
    //             await onDocumentUpload(selectedFile);
    //             setSelectedFile(null); // Clear the selected file after upload
    //             if (fileInputRef.current) {
    //                 fileInputRef.current.value = ''; // Clear the file input
    //             }
    //         } finally {
    //             setIsUploading(false);
    //         }
    //     }
    // };
    
    // const handleDeleteClick = async (documentUrl: string) => {
    //     if (onDocumentDelete) {
    //         await onDocumentDelete(documentUrl);
    //     }
    // };

    return (
        <div className="space-y-6">
            <Card className="relative">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border">
                            <AvatarImage src={patient.profilePictureUrl} alt={patient.name} />
                            <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{patient.name}</CardTitle>
                            <CardDescription>
                                {patient.age ? `${patient.age} years old` : ''}
                                {patient.gender ? ` • ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : ''}
                            </CardDescription>
                        </div>
                    </div>
                     {onEditClick && (
                      <Edit2
                        className="absolute top-4 right-4 h-6 w-6 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={onEditClick}
                      />
                    )}
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                    <h3 className="font-semibold mb-2 border-b pb-1">Contact & Address</h3>
                     <DetailItem icon={<Mail size={16} />} label="Email">{patient.email || 'Not provided'}</DetailItem>
                     <DetailItem icon={<Phone size={16} />} label="Phone">{patient.phone || 'Not provided'}</DetailItem>
                     <DetailItem icon={<Home size={16} />} label="Address">{formatAddress(patient.address)}</DetailItem>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Care Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                     <DetailItem icon={<Stethoscope size={16} />} label="Diagnosis"><RichTextContent html={patient.Diagnosis} /></DetailItem>
                     <DetailItem icon={<Book size={16} />} label="Medications List"><RichTextContent html={patient.medicationsList} /></DetailItem>
                     <DetailItem icon={<Calendar size={16} />} label="Medical Appointments"><RichTextContent html={patient.medicalAppointments} /></DetailItem>
                     <DetailItem icon={<AlertTriangle size={16} />} label="Emergency & Disaster Plans"><RichTextContent html={patient.emergencyDisasterPlans} /></DetailItem>
                     <DetailItem icon={<Building size={16} />} label="Community Resources"><RichTextContent html={patient.communityResources} /></DetailItem>
                     <DetailItem icon={<Briefcase size={16} />} label="Discharge Plan"><RichTextContent html={patient.dischargePlan} /></DetailItem>
                     <DetailItem icon={<Info size={16} />} label="Evaluation"><RichTextContent html={patient.evaluation} /></DetailItem>
                     <DetailItem icon={<Clock size={16} />} label="Alloted Time">{patient.allotedTime || 'Not provided'}</DetailItem>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader><CardTitle>Comments and Notes</CardTitle></CardHeader>
                 <CardContent className="space-y-3">
                    <DetailItem icon={<Users size={16} />} label="Interdisciplinary Team Notes"><RichTextContent html={patient.interdisciplinaryTeamNotes} /></DetailItem>
                    <DetailItem icon={<MessageSquare size={16} />} label="Family Comment"><RichTextContent html={patient.familyComment} /></DetailItem>
                    <DetailItem icon={<MessageSquare size={16} />} label="Client Comments"><RichTextContent html={patient.clientComments} /></DetailItem>
                    <DetailItem icon={<Info size={16} />} label="Doctor’s Notes"><RichTextContent html={patient.doctorsNotes} /></DetailItem>
                    <DetailItem icon={<Info size={16} />} label="Special Notes"><RichTextContent html={patient.specialNotes} /></DetailItem>
                </CardContent>
            </Card>

            {patient.emergencyContacts && patient.emergencyContacts.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Emergency Contacts</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patient.emergencyContacts.map((contact, index) => (
                            <EmergencyContactCard key={index} contact={contact} />
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
