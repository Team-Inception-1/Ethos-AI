'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import StudentDashboard from '@/components/pages/StudentDashboard';
import AgencyDashboard from '@/components/pages/AgencyDashboard';
import AdminPanel from '@/components/pages/AdminPanel';

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <StudentDashboard />;
  }

  if (user?.role === 'agency') {
    return <AgencyDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminPanel />;
  }

  if (user?.role === 'parent') {
    return <StudentDashboard />;
  }

  return <StudentDashboard />;
}
