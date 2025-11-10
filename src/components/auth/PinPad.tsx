
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PinPad() {
  const [pin, setPin] = useState('');
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const { verifyPin, loginWithBiometric, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const lockedUserJSON = localStorage.getItem('lockedScreenUser');
    console.log("lockedScreenUser JSON:", lockedUserJSON); // DEBUG LOG

    if (lockedUserJSON) {
        const lockedUser = JSON.parse(lockedUserJSON);
        console.log("Parsed lockedUser:", lockedUser); // DEBUG LOG

        const credentialId = localStorage.getItem(`passkeyCredentialId_${lockedUser.uid}`);
        console.log(`passkeyCredentialId_${lockedUser.uid}:`, credentialId); // DEBUG LOG

        if(lockedUser.fingerprintEnabled && credentialId) {
            setIsBiometricAvailable(true);
            console.log("Fingerprint available and enabled."); // DEBUG LOG
        } else {
            console.log("Fingerprint not available or not enabled based on conditions."); // DEBUG LOG
        }
    }
  }, []);

  const handleButtonClick = (num: number) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleUnlock = async () => {
    if (pin.length !== 4) return;
    const success = await verifyPin(pin);
    if (!success) {
      toast({
        title: 'Invalid PIN',
        description: 'The PIN you entered is incorrect.',
        variant: 'destructive',
      });
      setPin('');
    }
  };
  
  const handleBiometricLogin = useCallback(async () => {
    // The button's disabled state already prevents this from running if !isBiometricAvailable
    // if (!isBiometricAvailable) return; 

    setIsAuthenticatingBiometric(true);
    try {
        const lockedUserJSON = localStorage.getItem('lockedScreenUser');
        if (!lockedUserJSON) throw new Error("No locked user found");
        const lockedUser = JSON.parse(lockedUserJSON);
        
        const credentialIdBase64 = localStorage.getItem(`passkeyCredentialId_${lockedUser.uid}`);
        if (!credentialIdBase64) throw new Error("Passkey not found for user.");

        const base64ToArrayBuffer = (base64: string) => {
            const binaryString = window.atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        };

        const credential = await navigator.credentials.get({
            publicKey: {
                challenge: new Uint8Array(32),
                allowCredentials: [{
                    type: 'public-key',
                    id: base64ToArrayBuffer(credentialIdBase64),
                }],
                timeout: 60000,
            }
        });

      if (credential) {
        toast({
          title: "Biometric Login Successful",
          description: "Unlocking...",
        });
        loginWithBiometric();
      } else {
         throw new Error("Biometric authentication failed.");
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      toast({
          title: "Biometric Login Failed",
          description: "Could not verify your identity. Please try again.",
          variant: "destructive",
      });
    } finally {
      setIsAuthenticatingBiometric(false);
    }
  }, [isBiometricAvailable, loginWithBiometric, toast]);

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Lock className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-headline">AnGau Care</CardTitle>
        <CardDescription>Enter your PIN or use biometrics to unlock.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-8">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    pin.length > i ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="w-20 h-20 rounded-full text-2xl"
                onClick={() => handleButtonClick(num)}
                disabled={loading || isAuthenticatingBiometric}
              >
                {num}
              </Button>
            ))}
            <div/>
            <Button
              variant="outline"
              className="w-20 h-20 rounded-full text-2xl"
              onClick={() => handleButtonClick(0)}
              disabled={loading || isAuthenticatingBiometric}
            >
              0
            </Button>
            <Button variant="ghost" className="w-20 h-20" onClick={handleDelete} disabled={loading || pin.length === 0 || isAuthenticatingBiometric}>
              Delete
            </Button>
          </div>
          <div className="flex space-x-2 mt-8 w-full">
            <Button className="flex-1" onClick={handleUnlock} disabled={pin.length !== 4 || loading || isAuthenticatingBiometric}>
              {loading && !isAuthenticatingBiometric ? <Loader2 className="animate-spin" /> : 'Unlock'}
            </Button>
            <Button 
                variant="outline" 
                className="flex-1 bg-green-500 hover:bg-green-600 text-white" 
                onClick={handleBiometricLogin} 
                disabled={!isBiometricAvailable || loading || isAuthenticatingBiometric}
            >
                {isAuthenticatingBiometric ? <Loader2 className="animate-spin" /> : <Fingerprint />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
