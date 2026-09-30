'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import styles from './ParentDashboard.module.css';

export default function ParentDashboard() {
  const { user, linkedStudents } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Parent';
  return <main className={styles.page}>
    <header className={styles.greeting}>
      <div><h1 className={styles.greetingText}>Welcome, {firstName}</h1>
      <p className={styles.greetingSubtitle}>View only student accounts linked through an approved relationship.</p></div>
      <Link href="/dashboard/profile"><Button variant="outline" size="sm">Relationship settings</Button></Link>
    </header>
    {linkedStudents.length === 0 ? <section className={styles.activityCard}>
      <h2 className={styles.cardTitle}>No approved student relationship</h2>
      <p>For privacy, entering an email or link code does not grant access. A server-approved parent relationship is required before applications, documents, or payments appear here.</p>
    </section> : <section className={styles.grid}>
      {linkedStudents.map(student => <article className={styles.appCard} key={student.id}>
        <div className={styles.appInfo}><h2 className={styles.appTarget}>{student.name}</h2>
        <p>{student.email}</p></div>
        <div className={styles.appActions}><Link href="/dashboard/applications"><Button size="sm">View authorized applications</Button></Link></div>
      </article>)}
    </section>}
    <nav className={styles.quickLinks} aria-label="Parent actions">
      <Link className={styles.quickCard} href="/dashboard/payments"><span className={styles.quickLabel}>Escrow records</span></Link>
      <Link className={styles.quickCard} href="/dashboard/documents"><span className={styles.quickLabel}>Authorized documents</span></Link>
    </nav>
  </main>;
}
