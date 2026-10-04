import type { Metadata } from 'next';
import DirectoryPage from '@/components/pages/DirectoryPage';
import RoleRestricted from '@/components/auth/RoleRestricted';

export const metadata: Metadata = {
  title: 'Agency Directory | Ethos AI',
  description: 'Search, filter, and compare verified Bangladeshi study-abroad consultancies with live escrow milestone support.',
};

export default function DashboardAgencyDirectory() {
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="Verified Agency Directory"
    >
      <DirectoryPage inDashboard />
    </RoleRestricted>
  );
}
