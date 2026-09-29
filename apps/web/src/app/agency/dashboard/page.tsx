import { Suspense } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AgencyDashboard from '@/components/pages/AgencyDashboard';
import styles from '@/app/dashboard/DashboardLayout.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Agency Dashboard | Ethos AI' };

export default function AgencyDashboardPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          {/* Suspense is required because AgencyDashboard uses useSearchParams() */}
          <Suspense fallback={
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading dashboard...
            </div>
          }>
            <AgencyDashboard />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
