import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agency Directory | Ethos AI' };
import DirectoryPage from '@/components/pages/DirectoryPage';
import Navbar from '@/components/layout/Navbar';

export default function Directory() {
  return (
    <>
      <Navbar />
      <DirectoryPage />
    </>
  );
}

