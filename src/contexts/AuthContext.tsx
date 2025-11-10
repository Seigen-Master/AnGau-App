
'use client';

import type { UserRole, AuthUser as AppAuthUser } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import useIdle from '@/hooks/use-idle';
import { uploadImage } from '@/lib/storage'; // Import uploadImage
import { updateUser } from '@/lib/firestore'; // Import updateUser

const auth = getAuth(app);
const db = getFirestore(app);

type AuthUser = AppAuthUser;

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  loading: boolean;
  isPinSetupRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  lock: () => void;
  logout: () => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  loginWithBiometric: () => void;
  uploadProfilePicture: (file: File) => Promise<void>;
  updatePhoneNumber: (phoneNumber: string) => Promise<void>;
  updateFingerprintPreference: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinSetupRequired, setPinSetupRequired] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const lock = useCallback(() => {
    if (user) {
      localStorage.setItem('lockedScreenUser', JSON.stringify(user));
      setUser(null);
      router.push('/lock');
    }
  }, [user, router]);

  useIdle(300000, lock, !!user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        if (localStorage.getItem('lockedScreenUser')) {
            setUser(null);
            setLoading(false);
            if (pathname !== '/lock') router.push('/lock');
            return;
        }

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const authUser: AuthUser = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: userData.name || '',
              role: userData.role as UserRole,
              phoneNumber: userData.phone,
              profilePictureUrl: userData.profilePictureUrl,
              fingerprintEnabled: userData.fingerprintEnabled || false,
              pin: userData.pin,
            };
            setUser(authUser);
            const isPublicPage = pathname === '/login' || pathname === '/lock';
            setPinSetupRequired(!userData.pin && !isPublicPage);

            if (isPublicPage) {
              router.replace(authUser.role === 'admin' ? '/admin/dashboard' : '/caregiver/dashboard');
            }
          } else {
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await signOut(auth);
        }
      } else {
        setUser(null);
        setPinSetupRequired(false);
        const isPublicPage = pathname === '/login' || pathname === '/lock';
        if (!isPublicPage) {
            router.replace('/login');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('lockedScreenUser');
    await signOut(auth);
  };

  const updatePin = async (newPin: string) => {
    if (!user) throw new Error("No user logged in");
    await updateDoc(doc(db, 'users', user.uid), { pin: newPin });
    setUser({ ...user, pin: newPin });
    setPinSetupRequired(false);
    toast({ title: "PIN Updated", description: "Your PIN has been set." });
  };

  const verifyPin = async (enteredPin: string): Promise<boolean> => {
    const lockedUserJSON = localStorage.getItem('lockedScreenUser');
    if (!lockedUserJSON) {
        router.push('/login');
        return false;
    }
    const lockedUser: AuthUser = JSON.parse(lockedUserJSON);
    if (lockedUser.pin === enteredPin) {
        localStorage.removeItem('lockedScreenUser');
        setUser(lockedUser);
        router.replace(lockedUser.role === 'admin' ? '/admin/dashboard' : '/caregiver/dashboard');
        return true;
    }
    return false;
  };
  
  const loginWithBiometric = () => {
    const lockedUserJSON = localStorage.getItem('lockedScreenUser');
    if (!lockedUserJSON) {
        router.push('/login');
        return;
    }
    const lockedUser: AuthUser = JSON.parse(lockedUserJSON);
    localStorage.removeItem('lockedScreenUser');
    setUser(lockedUser);
    router.replace(lockedUser.role === 'admin' ? '/admin/dashboard' : '/caregiver/dashboard');
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) throw new Error("No user logged in");
    if (!file) throw new Error("No file provided");

    try {
      const imagePath = `user_profile_pictures/${user.uid}/${Date.now()}_${file.name}`;
      const downloadURL = await uploadImage(file, imagePath);
      
      await updateUser(user.uid, { profilePictureUrl: downloadURL });
      setUser(prevUser => prevUser ? { ...prevUser, profilePictureUrl: downloadURL } : null);
      toast({ title: "Profile Picture Updated", description: "Your profile picture has been updated successfully." });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({ title: "Error", description: "Failed to update profile picture.", variant: "destructive" });
      throw error; // Re-throw to be caught by the component
    }
  };

  const updatePhoneNumber = async (phoneNumber: string) => {
    if (!user) throw new Error("No user logged in to update phone number.");
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { phone: phoneNumber });
      setUser(prevUser => prevUser ? { ...prevUser, phoneNumber: phoneNumber } : null);
    } catch (error) {
      console.error("Error updating phone number:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateFingerprintPreference = async (enabled: boolean) => {
    if (!user) throw new Error("No user logged in to update fingerprint preference.");
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { fingerprintEnabled: enabled });
      setUser(prevUser => prevUser ? { ...prevUser, fingerprintEnabled: enabled } : null);
    } catch (error) {
      console.error("Error updating fingerprint preference:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    firebaseUser,
    role: user?.role ?? null,
    loading,
    isPinSetupRequired,
    login,
    lock,
    logout,
    updatePin,
    verifyPin,
    loginWithBiometric,
    uploadProfilePicture,
    updatePhoneNumber,
    updateFingerprintPreference
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
