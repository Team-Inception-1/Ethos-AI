'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import StudentDashboard from '@/components/pages/StudentDashboard';
import AgencyDashboard from '@/components/pages/AgencyDashboard';
import AdminPanel from '@/components/pages/AdminPanel';
import ParentDashboard from '@/components/pages/ParentDashboard';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Neutral loading state — no role-specific content until hydrated
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '12px',
        flexDirection: 'column',
        opacity: 0.5,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading dashboard…</span>
      </div>
    );
  }

  if (!user) return <p>Please sign in to open your dashboard.</p>;
  if (user.role === 'agency') {
    return <AgencyDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminPanel />;
  }

  if (user?.role === 'parent') {
    return <ParentDashboard />;
  }

  return <StudentDashboard />;
}
