
'use client';

import { useState } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Search, Eye, Briefcase, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface CaregiversTableProps {
  caregivers: User[];
  onRefresh: () => void;
}

export default function CaregiversTable({ caregivers, onRefresh }: CaregiversTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCaregivers = caregivers.filter(caregiver =>
    caregiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caregiver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            className="w-full rounded-lg bg-background pl-8"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCaregivers.map((caregiver) => (
          <Card key={caregiver.uid}>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={caregiver.profilePictureUrl} alt={caregiver.name} />
                        <AvatarFallback><UserIcon className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {caregiver.name}
                            <Badge className={caregiver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {caregiver.status}
                            </Badge>
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" /> {caregiver.email}
              </p>
              <p className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" /> {caregiver.phone || 'Not available'}
              </p>
              <p className="flex items-center text-sm text-muted-foreground">
                <Briefcase className="mr-2 h-4 w-4" /> {caregiver.position || 'Not set'}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Link href={`/admin/caregivers/${caregiver.uid}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="mr-1.5 h-4 w-4" /> View
                  </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
