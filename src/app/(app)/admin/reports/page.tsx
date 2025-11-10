// src/app/(app)/admin/reports/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import ReportsDashboard from '@/components/admin/ReportsDashboard';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manage Reports" 
        description="Analyze caregiver work durations and completed shifts within specific date ranges." 
      />
      <ReportsDashboard />
    </div>
  );
}
