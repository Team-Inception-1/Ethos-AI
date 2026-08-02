import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AIBubble from '@/components/ui/AIBubble';
import AgencyDashboard from '@/components/pages/AgencyDashboard';
import styles from '@/app/dashboard/DashboardLayout.module.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agency Dashboard' };
export default function AgencyLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}><AgencyDashboard /></main>
      </div>
      <AIBubble />
    </div>
  );
}
