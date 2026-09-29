import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ChatPage from '@/components/pages/ChatPage';
import styles from '@/app/dashboard/DashboardLayout.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dispute & Communication Transcripts | Admin Panel' };

export default function AdminChatPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <ChatPage />
        </main>
      </div>
    </div>
  );
}
