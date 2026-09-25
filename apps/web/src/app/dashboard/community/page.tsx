import type { Metadata } from 'next';
import CommunityPage from '@/components/pages/CommunityPage';

export const metadata: Metadata = {
  title: 'Student Peer Network & Country Hubs | Ethos AI',
  description:
    'Join destination country student groups, discuss visas and housing with peers, ask verified seniors, and engage in authentic study-abroad networking.',
};

export default function DashboardCommunity() {
  return <CommunityPage />;
}
