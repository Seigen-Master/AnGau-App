
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle, Settings, Menu, HeartHandshake, MessageSquare, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';
import NotificationBell from '@/components/shared/NotificationBell';

export default function AppHeader() {
  const { user, lock, logout } = useAuth(); // Use lock and logout from context
  const { toggleSidebar, setOpenMobile, isMobile } = useSidebar();
  const messagingHref = user?.role === 'admin' ? '/admin/messaging' : '/caregiver/messaging';

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const handleLock = () => {
    handleLinkClick();
    lock();
  };

  const handleLogout = () => {
    handleLinkClick();
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
        <Link href={user?.role === 'admin' ? "/admin/dashboard" : "/caregiver/dashboard"} className="flex items-center gap-2 text-xl font-bold font-headline text-primary" onClick={handleLinkClick}>
          <HeartHandshake className="h-7 w-7" /> 
          AnGau Care
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href={messagingHref}>
          <Button variant="ghost" size="icon" aria-label="Messages">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </Link>
        <NotificationBell />
        <DropdownMenu onOpenChange={(isOpen) => {
          if (!isOpen && isMobile) {
            setOpenMobile(false);
          }
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profilePictureUrl || `https://placehold.co/40x40.png`} alt={user?.displayName || 'User'} />
                <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile" passHref>
              <DropdownMenuItem onClick={handleLinkClick}>
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings" passHref>
              <DropdownMenuItem onClick={handleLinkClick}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLock}>
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
