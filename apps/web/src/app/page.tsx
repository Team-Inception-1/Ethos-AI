import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import AIBubble from '@/components/ui/AIBubble';
import LandingPage from '@/components/pages/LandingPage';

export const metadata: Metadata = {
  title: 'Ethos AI — Study Abroad, Without the Fear',
  description: 'Protect yourself from fraudulent study-abroad consultancies. Verified agencies, escrow payments, and AI-powered fraud detection — all in one platform.',
};

export default function Home() {
  return (
    <>
      <Navbar />
      <LandingPage />
      <AIBubble />
    </>
  );
}
