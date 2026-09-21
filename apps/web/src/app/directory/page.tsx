import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agency Directory' };
import DirectoryPage from '@/components/pages/DirectoryPage';
import Navbar from '@/components/layout/Navbar';
import AIBubble from '@/components/ui/AIBubble';
export default function Directory() {
  return <><Navbar /><DirectoryPage /><AIBubble /></>;
}
