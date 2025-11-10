'use client';

import type { UserRole, AuthUser as AppAuthUser } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import useIdle from '@/hooks/use-idle';

type AuthUser = AppAuthUser;

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if screen is locked
        if (localStorage.getItem('lockedScreenUser')) {
          setUser(null);
          setLoading(false);
          if (pathname !== '/lock') router.push('/lock');
          return;
        }

        await loadUserData(session.user);
      } else {
        setUser(null);
        setPinSetupRequired(false);
        const isPublicPage = pathname === '/login' || pathname === '/lock';
        if (!isPublicPage) {
          router.replace('/login');
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch user data from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', supabaseUser.id)
        .single();

      if (error || !userData) {
        console.error('Error fetching user data:', error);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const authUser: AuthUser = {
        uid: userData.id,
        email: userData.email || '',
        displayName: userData.name || '',
        role: userData.role as UserRole,
        phoneNumber: userData.phone,
        profilePictureUrl: userData.profile_picture_url,
        fingerprintEnabled: userData.fingerprint_enabled || false,
        pin: userData.pin,
      };

      setUser(authUser);
      const isPublicPage = pathname === '/login' || pathname === '/lock';
      setPinSetupRequired(!userData.pin && !isPublicPage);

      if (isPublicPage) {
        router.replace(authUser.role === 'admin' ? '/admin/dashboard' : '/caregiver/dashboard');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      await supabase.auth.signOut();
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({ 
          title: "Login Failed", 
          description: error.message || "Invalid email or password.", 
          variant: "destructive" 
        });
        setLoading(false);
        throw error;
      }

      // User data will be loaded by the onAuthStateChange listener
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('lockedScreenUser');
    await supabase.auth.signOut();
  };

  const updatePin = async (newPin: string) => {
    if (!user) throw new Error("No user logged in");
    
    const { error } = await supabase
      .from('users')
      .update({ pin: newPin })
      .eq('id', user.uid);

    if (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update PIN.", 
        variant: "destructive" 
      });
      throw error;
    }

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
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}-${Date.now()}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.uid);

      if (updateError) {
        throw updateError;
      }

      setUser(prevUser => prevUser ? { ...prevUser, profilePictureUrl: publicUrl } : null);
      toast({ 
        title: "Profile Picture Updated", 
        description: "Your profile picture has been updated successfully." 
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update profile picture.", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  const updatePhoneNumber = async (phoneNumber: string) => {
    if (!user) throw new Error("No user logged in to update phone number.");
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ phone: phoneNumber })
        .eq('id', user.uid);

      if (error) throw error;

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
      const { error } = await supabase
        .from('users')
        .update({ fingerprint_enabled: enabled })
        .eq('id', user.uid);

      if (error) throw error;

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
    supabaseUser,
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
