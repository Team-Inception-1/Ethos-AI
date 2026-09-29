import type { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import styles from './DashboardLayout.module.css';

export const metadata: Metadata = { title: 'Dashboard | Ethos AI' };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout} suppressHydrationWarning>
      <Sidebar />
      <div className={styles.main} suppressHydrationWarning>
        <TopBar />
        <main className={styles.content} id="main-content" suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  );
}
