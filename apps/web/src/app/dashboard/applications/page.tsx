import type { Metadata } from 'next';
import ApplicationsPage from '@/components/pages/ApplicationsPage';
import RoleRestricted from '@/components/auth/RoleRestricted';

export const metadata: Metadata = { title: 'My Applications | Ethos AI' };

export default async function Applications({ searchParams }: { searchParams: Promise<{ apply?: string | string[] }> }) {
  const query = await searchParams;
  const initialAgencyId = typeof query.apply === 'string' ? query.apply : '';
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="Application Tracker"
    >
      <ApplicationsPage initialAgencyId={initialAgencyId} />
    </RoleRestricted>
  );
}
