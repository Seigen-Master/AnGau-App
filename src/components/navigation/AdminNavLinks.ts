import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, UserPlus, CalendarDays, MessageSquare, Brain, BarChart3, ClipboardCheck } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const adminNavLinks: NavLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/caregivers', label: 'Caregivers', icon: Users },
  { href: '/admin/patients', label: 'Patients', icon: UserPlus },
  { href: '/admin/schedules', label: 'Schedules', icon: CalendarDays },
  { href: '/admin/requests', label: 'Requests', icon: ClipboardCheck },
  { href: '/admin/ai-planner', label: 'AI Care Planner', icon: Brain, disabled: true },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, disabled: false },
];
