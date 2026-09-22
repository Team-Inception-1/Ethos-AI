import type { Metadata } from 'next';
import ScholarFinderPage from '@/components/pages/ScholarFinder/ScholarFinderPage';
import Navbar from '@/components/layout/Navbar/Navbar';

export const metadata: Metadata = {
  title: 'ScholarFinder — Professors & Full-Fund RA/TA Scholarships | Ethos AI',
  description:
    'Find professors with active research grants (NSF/NIH/ERC), draft personalized academic cold emails, prepare for graduate interviews, and secure fully funded RA/TA positions.',
};

export default function ScholarFinderRoute() {
  return (
    <>
      <Navbar />
      <ScholarFinderPage />
    </>
  );
}
