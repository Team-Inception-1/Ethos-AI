import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import AIBubble from '@/components/ui/AIBubble';
import ComparePage from '@/components/pages/ComparePage';
export const metadata: Metadata = { title: 'Compare Agencies' };
export default function Compare() {
  return <><Navbar /><ComparePage /><AIBubble /></>;
}
