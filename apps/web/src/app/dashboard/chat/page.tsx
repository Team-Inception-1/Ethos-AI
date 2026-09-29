'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatPage from '@/components/pages/ChatPage';

function DashboardChatContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roleLower = user?.role?.toLowerCase();
    if (roleLower === 'agency') {
      const q = searchParams.toString();
      router.replace(`/agency/chat${q ? `?${q}` : ''}`);
    } else if (roleLower === 'admin') {
      const q = searchParams.toString();
      router.replace(`/admin/chat${q ? `?${q}` : ''}`);
    }
  }, [user?.role, router, searchParams]);

  return <ChatPage />;
}

export default function Chat() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading chat…</div>}>
      <DashboardChatContent />
    </Suspense>
  );
}
