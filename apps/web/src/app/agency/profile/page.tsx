import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ProfilePage from '@/components/pages/ProfilePage';
import styles from '@/app/dashboard/DashboardLayout.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Agency Profile & Verification | Ethos AI' };

export default function AgencyProfilePage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <ProfilePage />
        </main>
      </div>
    </div>
  );
}
