
'use client';

import PageHeader from '@/components/shared/PageHeader';
import DailySchedule from '@/components/caregiver/DailySchedule';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

export default function CaregiverDashboardPage() {
  const [today, setToday] = useState('');

  useEffect(() => {
    // Calculate date on the client side after hydration
    setToday(format(new Date(), 'EEEE, MMMM do'));
  }, []);

  // Optionally, render a loading state or placeholder for the description
  // while `today` is being calculated to prevent a flash of content if SSR was different.
  const descriptionText = today ? `Tasks and appointments for ${today}.` : "Loading date...";

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Today's Schedule" 
        description={descriptionText}
      />
      <DailySchedule />
    </div>
  );
}
