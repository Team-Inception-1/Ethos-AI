import type { Metadata } from 'next';
import PaymentsPage from '@/components/pages/PaymentsPage';
import RoleRestricted from '@/components/auth/RoleRestricted';

export const metadata: Metadata = { title: 'Payments & Escrow | Ethos AI' };

export default function Payments() {
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="Milestone Payments & Escrow Protection"
    >
      <PaymentsPage />
    </RoleRestricted>
  );
}
