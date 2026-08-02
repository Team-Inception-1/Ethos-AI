import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import ProfilePage from '@/components/pages/ProfilePage';

export const metadata: Metadata = {
  title: 'Profile & Guardian Settings',
  description: 'Manage your Ethos AI profile, role preferences, and parent-student guardian links.',
};

export default function Profile() {
  return (
    <>
      <Navbar />
      <ProfilePage />
    </>
  );
}
