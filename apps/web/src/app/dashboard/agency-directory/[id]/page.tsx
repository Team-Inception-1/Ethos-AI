import type { Metadata } from 'next';
import AgencyDetailPage from '@/components/pages/AgencyDetailPage/AgencyDetailPage';
import RoleRestricted from '@/components/auth/RoleRestricted';

export const metadata: Metadata = {
  title: 'Agency Profile | Ethos AI',
  description: 'Verified agency profile, license credentials, and transparent milestone fee schedules.',
};

export default async function DashboardAgencyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="Verified Agency Profile"
    >
      <AgencyDetailPage agencyId={id} inDashboard={true} />
    </RoleRestricted>
  );
}
