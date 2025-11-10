
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import ChangePinDialog from '@/components/shared/ChangePinDialog'; // Import the new dialog

export default function SettingsPage() {
  const { user, updatePhoneNumber, updateFingerprintPreference, loading: authLoading } = useAuth();
  const [newPhoneNumber, setNewPhoneNumber] = useState(user?.phoneNumber || '');
  const [fingerprintEnabled, setFingerprintEnabled] = useState(user?.fingerprintEnabled || false);
  const [isChangePinOpen, setChangePinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFingerprintEnabled(user?.fingerprintEnabled || false);
    setNewPhoneNumber(user?.phoneNumber || '');
  }, [user]);

  const handlePhoneNumberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPhoneNumber || !user || newPhoneNumber === user.phoneNumber) return;
    
    setLoading(true);
    try {
      await updatePhoneNumber(newPhoneNumber);
      toast({
        title: "Success",
        description: "Phone number updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone number.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintToggle = async (checked: boolean) => {
    if (!user) return;
    setLoading(true);

    try {
        if (checked) {
            const stringToArrayBuffer = (str: string) => new TextEncoder().encode(str);
            const publicKeyCredentialCreationOptions: CredentialCreationOptions = {
              publicKey: {
                challenge: new Uint8Array(32),
                rp: { name: "AnGau Care App", id: window.location.hostname },
                user: { id: stringToArrayBuffer(user.uid), name: user.email, displayName: user.displayName },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "required" },
                timeout: 60000,
              }
            };
            const credential = await navigator.credentials.create(publicKeyCredentialCreationOptions);
            if (credential && 'rawId' in credential) {
              const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                bytes.forEach((byte) => binary += String.fromCharCode(byte));
                return window.btoa(binary);
              };
              localStorage.setItem(`passkeyCredentialId_${user.uid}`, arrayBufferToBase64(credential.rawId));
              await updateFingerprintPreference(true);
              // Update lockedScreenUser in localStorage
              const lockedUserJSON = localStorage.getItem('lockedScreenUser');
              if (lockedUserJSON) {
                const lockedUser = JSON.parse(lockedUserJSON);
                localStorage.setItem('lockedScreenUser', JSON.stringify({ ...lockedUser, fingerprintEnabled: true }));
              }
              setFingerprintEnabled(true); // Explicitly set local state to true
              toast({ title: "Success", description: "Fingerprint login has been enabled." });
            }
        } else {
            await updateFingerprintPreference(false);
            localStorage.removeItem(`passkeyCredentialId_${user.uid}`);
            // Update lockedScreenUser in localStorage
            const lockedUserJSON = localStorage.getItem('lockedScreenUser');
            if (lockedUserJSON) {
              const lockedUser = JSON.parse(lockedUserJSON);
              localStorage.setItem('lockedScreenUser', JSON.stringify({ ...lockedUser, fingerprintEnabled: false }));
            }
            setFingerprintEnabled(false); // Explicitly set local state to false
            toast({ title: "Settings Updated", description: "Fingerprint login has been disabled." });
        }
    } catch (error: any) {
        toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
        setFingerprintEnabled(false); // Ensure it's off if operation failed
    } finally {
        setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div>Loading settings...</div>;
  }

  return (
    <>
      <ChangePinDialog open={isChangePinOpen} onOpenChange={setChangePinOpen} />
      <div className="container mx-auto p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your account and security settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Security Section */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Security</h3>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="fingerprint-login" className="flex flex-col space-y-1">
                        <span>Enable Fingerprint Login</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            Use your device's biometrics to log in faster.
                        </span>
                    </Label>
                    <Switch
                    id="fingerprint-login"
                    checked={fingerprintEnabled}
                    onCheckedChange={handleFingerprintToggle}
                    disabled={loading}
                    />
                </div>
                {user.pin && (
                  <div className="flex items-center justify-between space-x-2 pt-2">
                      <Label htmlFor="change-pin" className="flex flex-col space-y-1">
                          <span>Change PIN</span>
                          <span className="text-xs font-normal text-muted-foreground">
                              Update your 4-digit security PIN.
                          </span>
                      </Label>
                      <Button id="change-pin" variant="outline" onClick={() => setChangePinOpen(true)}>
                          Change
                      </Button>
                  </div>
                )}
            </div>

            {/* Profile Section */}
            <form onSubmit={handlePhoneNumberSubmit} className="space-y-4 pt-8 border-t">
                <h3 className="text-lg font-medium">Profile Information</h3>
                <div>
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input 
                    id="phone-number" 
                    type="tel" 
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    className="mt-1"
                />
                </div>
                <Button type="submit" disabled={loading || newPhoneNumber === user.phoneNumber}>
                {loading ? 'Saving...' : 'Save Phone Number'}
                </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
