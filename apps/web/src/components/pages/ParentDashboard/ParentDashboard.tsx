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
      {user?.pendingStudentRequests && user.pendingStudentRequests.length > 0 ? (
        <>
          <h2 className={styles.cardTitle}>⏳ Guardian Link Request Pending</h2>
          <p>
            You sent a link request to <strong>{user.pendingStudentRequests[0].student.name}</strong> ({user.pendingStudentRequests[0].student.email}).
            The student must log in and approve the request in their Profile Settings before applications and records appear here.
          </p>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Link href="/dashboard/profile"><Button size="sm" variant="outline">View pending request in Profile</Button></Link>
          </div>
        </>
      ) : (
        <>
          <h2 className={styles.cardTitle}>No approved student relationship</h2>
          <p>To view your child&apos;s applications, escrow milestones, and documents, enter their Ethos Link Code in Profile Settings.</p>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Link href="/dashboard/profile"><Button size="sm">Link Student Account</Button></Link>
          </div>
        </>
      )}
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
