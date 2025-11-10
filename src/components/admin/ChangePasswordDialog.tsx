"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { app } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface ChangePasswordDialogProps {
  userId: string;
  userName: string;
}

export function ChangePasswordDialog({ userId, userName }: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!firebaseUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);
    try {
      await firebaseUser.getIdToken(true);

      const currentFunctions = getFunctions(app, 'us-central1');
      const manageUser = httpsCallable(currentFunctions, 'manageUser');

      await manageUser({ 
          action: 'changePassword', 
          data: { uid: userId, newPassword } 
      });

      toast({
        title: "Success",
        description: `Password for ${userName} has been updated.`,
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Change Password</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password for {userName}</DialogTitle>
          <DialogDescription>
            Enter a new password for the user. They will be required to use this
            new password at their next login.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              New Password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="col-span-3"
              disabled={isChanging}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm-password" className="text-right">
              Confirm
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="col-span-3"
              disabled={isChanging}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handlePasswordChange}
            disabled={isChanging}
          >
            {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
