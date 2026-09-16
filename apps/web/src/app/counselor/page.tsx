import type { Metadata } from 'next';
import CounselorPage from '@/components/pages/CounselorPage';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'AI Counselor — Study-Abroad University & Visa Evaluator | Ethos AI',
  description:
    'Unbiased study-abroad guidance for Bangladeshi students. Estimate admission odds, discover Dream/Target/Safe universities, and evaluate visa solvency.',
};

export default function Counselor() {
  return (
    <>
      <Navbar />
      <CounselorPage />
    </>
  );
}

