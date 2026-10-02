import type { Metadata } from 'next';
import ScholarFinderPage from '@/components/pages/ScholarFinder/ScholarFinderPage';

export const metadata: Metadata = {
  title: 'Scholar Finder — Academic Faculty & Research Outreach | Ethos AI',
  description:
    'Find and connect with verified professors matching your research interests across top global universities.',
};

export default function PublicScholarFinderPage() {
  return <ScholarFinderPage />;
}
