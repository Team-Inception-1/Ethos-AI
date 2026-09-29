'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProfilePage from '@/components/pages/ProfilePage';

function DashboardProfileContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const roleLower = user?.role?.toLowerCase();
    if (roleLower === 'agency') {
      router.replace('/agency/profile');
    } else if (roleLower === 'admin') {
      router.replace('/admin/profile');
    }
  }, [user?.role, router]);

  return <ProfilePage />;
}

export default function DashboardProfilePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading profile…</div>}>
      <DashboardProfileContent />
    </Suspense>
  );
}
