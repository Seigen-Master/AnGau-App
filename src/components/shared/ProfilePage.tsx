//src/components/shared/ProfilePage.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, uploadProfilePicture } = useAuth();
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfilePic(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newProfilePic || !user) return;
    setLoading(true);
    try {
      await uploadProfilePicture(newProfilePic);
      alert('Profile picture updated successfully!');
      setNewProfilePic(null);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert('Failed to update profile picture.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profilePictureUrl || `https://placehold.co/100x100.png`} alt={user.displayName} />
              <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{user.displayName}</p>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="profile-picture">Change Profile Picture</Label>
              <div className="flex items-center gap-4 mt-2">
                <Label
                  htmlFor="profile-picture-upload"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-white hover:bg-green-600 h-10 px-4 py-2 cursor-pointer"
                >
                  Choose File
                </Label>
                <Input
                  id="profile-picture-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {newProfilePic && (
                  <span className="text-sm text-muted-foreground">{newProfilePic.name}</span>
                )}
              </div>
            </div>
            <Button type="submit" disabled={!newProfilePic || loading}>
              {loading ? 'Uploading...' : 'Upload New Picture'}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
