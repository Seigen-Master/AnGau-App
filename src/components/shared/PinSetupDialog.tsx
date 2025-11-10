
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function PinSetupDialog({ open }: { open: boolean }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePin } = useAuth();
  const { toast } = useToast();

  const handleSavePin = async () => {
    if (pin.length !== 4 || !/^[0-9]+$/.test(pin)) {
      toast({ title: 'Invalid PIN', description: 'Please enter a 4-digit PIN.', variant: 'destructive' });
      return;
    }
    if (pin !== confirmPin) {
      toast({ title: 'PINs do not match', description: 'Please re-enter your PIN.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      await updatePin(pin);
      // The onOpenChange is no longer needed as the context controls the state
    } catch (error) {
      // The error is already handled in the updatePin function
    } finally {
      setLoading(false);
    }
  };

  return (
    // The `open` prop is now controlled by the AuthContext's `isPinSetupRequired` state
    // `onOpenChange` is removed to make it non-dismissable
    <Dialog open={open}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Set Up Your Security PIN</DialogTitle>
          <DialogDescription>
            To protect your account, you must create a 4-digit PIN. You will not be able to proceed until this is complete.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            type="password"
            maxLength={4}
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            maxLength={4}
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            disabled={loading}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSavePin} disabled={loading || pin.length !== 4 || pin !== confirmPin}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save PIN'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
