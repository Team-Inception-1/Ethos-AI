import type { Metadata } from 'next';
import CounselorPage from '@/components/pages/CounselorPage';
import RoleRestricted from '@/components/auth/RoleRestricted';

export const metadata: Metadata = {
  title: 'AI Counselor — Study-Abroad University & Visa Evaluator | Ethos AI',
  description:
    'Unbiased study-abroad guidance. Estimate admission odds, discover Dream/Target/Safe universities, and evaluate visa solvency — right from your student dashboard.',
};

export default function DashboardCounselor() {
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="AI University & Visa Counselor"
    >
      <CounselorPage />
    </RoleRestricted>
  );
}
