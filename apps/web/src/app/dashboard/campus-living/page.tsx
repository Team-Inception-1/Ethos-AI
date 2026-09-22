import type { Metadata } from 'next';
import CampusLivingPage from '@/components/pages/CampusLivingPage/CampusLivingPage';

export const metadata: Metadata = {
  title: 'Off-Campus Housing & Living Costs | Ethos AI',
  description:
    'Explore real-life off-campus apartment rental costs, food, transit, and monthly living expenses near your applied universities.',
};

export default function DashboardCampusLiving() {
  return <CampusLivingPage />;
}
