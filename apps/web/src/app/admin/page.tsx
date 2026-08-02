import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AIBubble from '@/components/ui/AIBubble';
import AdminPanel from '@/components/pages/AdminPanel';
import styles from '../dashboard/DashboardLayout.module.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Admin Panel' };
export default function Admin() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}><AdminPanel /></main>
      </div>
      <AIBubble />
    </div>
  );
}
