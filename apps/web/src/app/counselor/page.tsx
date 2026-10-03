import type { Metadata } from 'next';
import CounselorPage from '@/components/pages/CounselorPage';

export const metadata: Metadata = {
  title: 'AI Counselor — Study-Abroad University & Visa Evaluator | Ethos AI',
  description:
    'Unbiased study-abroad guidance. Estimate admission odds, discover Dream/Target/Safe universities, and evaluate visa solvency.',
};

export default function PublicCounselorPage() {
  return <CounselorPage />;
}
