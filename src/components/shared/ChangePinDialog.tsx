
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

export default function ChangePinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, updatePin } = useAuth();
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    if (!user || !user.pin) {
      toast({ title: 'Error', description: 'Could not verify current user.', variant: 'destructive' });
      return;
    }
    if (currentPin !== user.pin) {
      toast({ title: 'Incorrect PIN', description: 'The current PIN you entered is incorrect.', variant: 'destructive' });
      return;
    }
    if (newPin.length !== 4 || !/^[0-9]+$/.test(newPin)) {
      toast({ title: 'Invalid New PIN', description: 'Your new PIN must be 4 digits.', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: 'PINs Do Not Match', description: 'Your new PIN and confirmation do not match.', variant: 'destructive' });
      return;
    }
    if (newPin === currentPin) {
      toast({ title: 'Same PIN', description: 'Your new PIN cannot be the same as your current PIN.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await updatePin(newPin);
      toast({ title: 'Success', description: 'Your PIN has been changed successfully.' });
      onOpenChange(false); // Close the dialog
      // Clear fields after submission
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      // Error toast is handled within the updatePin function
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Your PIN</DialogTitle>
          <DialogDescription>
            Enter your current PIN and a new 4-digit PIN.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            type="password"
            maxLength={4}
            placeholder="Current PIN"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            maxLength={4}
            placeholder="New 4-digit PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            maxLength={4}
            placeholder="Confirm New PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            disabled={loading}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSaveChanges} disabled={loading || newPin.length !== 4 || newPin !== confirmPin}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
