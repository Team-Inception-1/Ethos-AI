import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import CommunityPage from '@/components/pages/CommunityPage';

export const metadata: Metadata = {
  title: 'Student Peer Network & Country Hubs | Ethos AI',
  description:
    'Connect with destination country student groups, discuss visas and housing with peers, ask verified seniors, and build your study-abroad network.',
};

export default function Community() {
  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', paddingTop: 'var(--header-height, 70px)' }}>
        <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Student Network...</div>}>
          <CommunityPage />
        </Suspense>
      </div>
    </>
  );
}
