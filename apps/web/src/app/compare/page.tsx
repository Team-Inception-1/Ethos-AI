import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import ComparePage from '@/components/pages/ComparePage';

export const metadata: Metadata = { title: 'Compare Agencies | Ethos AI' };

export default function Compare() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ minHeight: '100vh', paddingTop: '100px', textAlign: 'center' }}>Loading comparison...</div>}>
        <ComparePage />
      </Suspense>
    </>
  );
}
