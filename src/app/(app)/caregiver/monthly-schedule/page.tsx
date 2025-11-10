// src/app/(app)/caregiver/monthly-schedule/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import CaregiverScheduleManager from '@/components/caregiver/CaregiverScheduleManager';

export default function MonthlySchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Monthly Schedule"
        description="Select a date from the calendar to view your assignments."
      />
      <CaregiverScheduleManager />
    </div>
  );
}
