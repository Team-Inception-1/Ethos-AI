import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard' };

import StudentDashboard from '@/components/pages/StudentDashboard';
export default function DashboardPage() { return <StudentDashboard />; }
