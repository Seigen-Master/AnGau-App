
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface OvertimeRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (hours: number, minutes: number, reason: string) => void;
}

export default function OvertimeRequestDialog({
  isOpen,
  onClose,
  onSubmit,
}: OvertimeRequestDialogProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if ((hours === 0 && minutes === 0) || !reason.trim()) {
      // You might want to add a toast notification here
      return;
    }
    setIsSubmitting(true);
    await onSubmit(hours, minutes, reason);
    setIsSubmitting(false);
    // Reset state for next time
    setHours(0);
    setMinutes(0);
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Overtime</DialogTitle>
          <DialogDescription>
            Select the amount of overtime you need and provide a reason. This will be sent to an administrator for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="hours">Hours</Label>
              <Select onValueChange={(value) => setHours(Number(value))} value={String(hours)}>
                <SelectTrigger id="hours">
                  <SelectValue placeholder="Select hours" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(9).keys()].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="minutes">Minutes</Label>
              <Select onValueChange={(value) => setMinutes(Number(value))} value={String(minutes)}>
                <SelectTrigger id="minutes">
                  <SelectValue placeholder="Select minutes" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 15, 30, 45].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="reason">Reason for Overtime</Label>
            <Textarea
              id="reason"
              placeholder="Type your reason here..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(hours === 0 && minutes === 0) || !reason.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
