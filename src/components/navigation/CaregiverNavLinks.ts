
import type { LucideIcon } from 'lucide-react';
import { CalendarCheck2, UsersRound, MessageSquare, CalendarRange, ClipboardCheck } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const caregiverNavLinks: NavLink[] = [
  { href: '/caregiver/dashboard', label: "Today's Schedule", icon: CalendarCheck2 },
  { href: '/caregiver/monthly-schedule', label: 'Monthly Schedule', icon: CalendarRange },
  { href: '/caregiver/my-requests', label: 'My Requests', icon: ClipboardCheck },
];
