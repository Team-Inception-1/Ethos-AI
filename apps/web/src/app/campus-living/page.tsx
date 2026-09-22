import type { Metadata } from 'next';
import CampusLivingPage from '@/components/pages/CampusLivingPage/CampusLivingPage';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Off-Campus Housing & Monthly Living Expenses | Ethos AI',
  description:
    'Search real-life off-campus apartment rental costs, food/groceries, transit passes, and monthly living expenses near applied universities for students and spouses.',
};

export default function CampusLiving() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <CampusLivingPage />
      </main>
    </>
  );
}
