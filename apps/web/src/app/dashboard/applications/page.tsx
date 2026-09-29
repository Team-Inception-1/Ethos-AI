import type { Metadata } from 'next';
import ApplicationsPage from '@/components/pages/ApplicationsPage';
import RoleRestricted from '@/components/auth/RoleRestricted';

export const metadata: Metadata = { title: 'My Applications | Ethos AI' };

export default function Applications() {
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="Application Tracker"
    >
      <ApplicationsPage />
    </RoleRestricted>
  );
}
