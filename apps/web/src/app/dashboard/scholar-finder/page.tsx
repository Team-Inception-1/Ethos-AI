import type { Metadata } from 'next';
import ScholarFinderPage from '@/components/pages/ScholarFinder/ScholarFinderPage';

export const metadata: Metadata = {
  title: 'Scholar Finder — Professors & Full-Fund RA/TA Scholarships | Ethos AI',
  description:
    'Find professors with active research grants, draft personalized academic cold emails, prepare for graduate interviews, and secure fully funded RA/TA positions.',
};

export default function DashboardScholarFinder() {
  return <ScholarFinderPage />;
}
