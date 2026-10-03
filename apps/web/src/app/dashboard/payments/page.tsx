import type { Metadata } from 'next';
import { Suspense } from 'react';
import PaymentsPage from '@/components/pages/PaymentsPage';
import RoleRestricted from '@/components/auth/RoleRestricted';
import { PaymentsEscrowSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Payments & Escrow | Ethos AI' };

export default function Payments() {
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="Milestone Payments & Escrow Protection"
    >
      <Suspense fallback={<PaymentsEscrowSkeleton />}>
        <PaymentsPage />
      </Suspense>
    </RoleRestricted>
  );
}
