import PageHeader from '@/components/shared/PageHeader';
import AiPlannerForm from '@/components/admin/AiPlannerForm';

export default function AiPlannerPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Assisted Care Planning" 
        description="Leverage AI to suggest next steps for patient care based on their condition and existing tasks." 
      />
      <AiPlannerForm />
    </div>
  );
}
