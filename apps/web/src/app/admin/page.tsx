import { Suspense } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AdminPanel from '@/components/pages/AdminPanel';
import styles from '@/app/dashboard/DashboardLayout.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Governance Panel | Ethos AI' };

export default function Admin() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Suspense fallback={
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading admin governance dashboard...
            </div>
          }>
            <AdminPanel />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
