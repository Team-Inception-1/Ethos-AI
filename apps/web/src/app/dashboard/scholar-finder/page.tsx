import type { Metadata } from 'next';
import ScholarFinderPage from '@/components/pages/ScholarFinder/ScholarFinderPage';
import RoleRestricted from '@/components/auth/RoleRestricted';

export const metadata: Metadata = {
  title: 'Scholar Finder — Professors & Full-Fund RA/TA Scholarships | Ethos AI',
  description:
    'Find professors with active research grants, draft personalized academic cold emails, prepare for graduate interviews, and secure fully funded RA/TA positions.',
};

export default function DashboardScholarFinder() {
  return (
    <RoleRestricted
      allowedRoles={['student', 'parent']}
      featureName="Scholar Finder & Research Assistantships"
    >
      <ScholarFinderPage />
    </RoleRestricted>
  );
}
