import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AgencyDashboard from '@/components/pages/AgencyDashboard';
import styles from '@/app/dashboard/DashboardLayout.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Agency Dashboard | Ethos AI' };

export default function AgencyLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}><AgencyDashboard /></main>
      </div>
    </div>
  );
}

