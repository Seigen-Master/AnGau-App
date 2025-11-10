// src/app/(app)/layout.tsx

'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import AppHeader from '@/components/layout/AppHeader';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { adminNavLinks } from '@/components/navigation/AdminNavLinks';
import { caregiverNavLinks } from '@/components/navigation/CaregiverNavLinks';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartHandshake, LogOut } from 'lucide-react';
import PinSetupDialog from '@/components/shared/PinSetupDialog';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getCurrentLocation } from '@/lib/geolocation';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, loading, logout, isPinSetupRequired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && role === 'caregiver') {
      const sendLocation = async () => {
        try {
          const location = await getCurrentLocation();
          const locationDocRef = doc(db, 'caregiverLocations', user.uid);
          await setDoc(locationDocRef, {
            lat: location.lat,
            lng: location.lng,
            timestamp: new Date(),
            caregiverId: user.uid,
          });
          console.log('Location updated for caregiver:', user.uid, location);
        } catch (error) {
          // Log the actual error message or string representation
          console.error('Error sending location:', (error as GeolocationPositionError).message || String(error));
        }
      };

      locationIntervalRef.current = setInterval(sendLocation, 15000);

      sendLocation();

      return () => {
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
        }
      };
    } else {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }
  }, [user, role]);
  
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center">
            <HeartHandshake className="h-10 w-10 text-primary animate-pulse" />
            <p className="ml-4 text-lg font-semibold text-muted-foreground">Loading AnGau Care...</p>
        </div>
      </div>
    );
  }

  const navLinks = role === 'admin' ? adminNavLinks : caregiverNavLinks;

  if (isPinSetupRequired) {
    return <PinSetupDialog open={true} />;
  }

  return (
    <SidebarProvider defaultOpen>
      <ChatProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon" className="border-r">
            <div className="flex flex-row items-center justify-start h-16 px-4 gap-2 border-b group-data-[collapsible=icon]:hidden">
              <HeartHandshake className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold font-headline text-primary">AnGau Care</span>
            </div>
            <SidebarContent className="p-0">
              <SidebarMenu>
                {navLinks.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton 
                      asChild={false}
                      isActive={pathname === link.href || (link.href !== (role === 'admin' ? '/admin/dashboard' : '/caregiver/dashboard') && pathname.startsWith(link.href))}
                      tooltip={link.label}
                      disabled={link.disabled}
                      className="w-full justify-start"
                      onClick={() => !link.disabled && router.push(link.href)}
                    >
                      <link.icon className="mr-2 h-5 w-5" />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
               <div className="p-2 group-data-[collapsible=icon]:p-0 border-t">
                  <SidebarMenuButton 
                      onClick={logout} 
                      className="w-full justify-start"
                      tooltip="Logout"
                  >
                      <LogOut className="mr-2 h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                  </SidebarMenuButton>
              </div>
            </SidebarFooter>
          </Sidebar>
          <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </ChatProvider>
    </SidebarProvider>
  );
}
