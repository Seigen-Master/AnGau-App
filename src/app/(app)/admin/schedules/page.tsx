// src/app/(app)/admin/schedules/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import ScheduleManager from '@/components/admin/ScheduleManager';

export default function AdminSchedulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Manage Schedules" description="View, create, and update caregiver schedules." />
      <ScheduleManager />
    </div>
  );
}
