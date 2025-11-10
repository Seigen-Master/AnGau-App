
'use client';

import type { Patient } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Mail, Phone, Users } from 'lucide-react';
import Link from 'next/link';

interface PatientsTableProps {
  patients: Patient[];
  onDataChange: () => void;
}

// Utility function to strip HTML tags
const stripHtml = (html: string | undefined | null): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ');
};

export default function PatientsTable({ patients, onDataChange }: PatientsTableProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <div key={patient.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={patient.profilePictureUrl || undefined} alt={patient.name} />
                <AvatarFallback className="text-lg">{patient.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold leading-none tracking-tight">{patient.name}</h3>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>
            </div>
          </div>
          <div className="p-6 pt-0 space-y-3">
            {patient.email && <div className="flex items-center text-sm"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /><span>{patient.email}</span></div>}
            {patient.phone && <div className="flex items-center text-sm"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /><span>{patient.phone}</span></div>}
            {patient.emergencyContacts && patient.emergencyContacts.length > 0 && (
              <div className="flex items-start text-sm">
                <Users className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{patient.emergencyContacts[0].name} <span className="text-xs text-muted-foreground">({patient.emergencyContacts[0].relationship})</span></p>
                  <p className="text-sm text-muted-foreground">{patient.emergencyContacts[0].phone}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center p-6 pt-0 justify-end">
            <Link href={`/admin/patients/${patient.id}`} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="mr-1.5 h-4 w-4" /> View
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
