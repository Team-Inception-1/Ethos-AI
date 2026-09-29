'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './ParentDashboard.module.css';

const stages = ['Submitted', 'Under Review', 'Offer Received', 'Payment Pending', 'Visa Processing', 'Approved'];
const currentStage = 2;

const activity = [
  { time: '2h ago',  text: 'Offer letter from University of Toronto received',    type: 'doc'     },
  { time: '1d ago',  text: 'Application stage advanced to Offer Received',        type: 'stage'   },
  { time: '2d ago',  text: 'Milestone ৳15,000 held safely in escrow',             type: 'payment' },
  { time: '3d ago',  text: 'AI fraud scan completed — Low Risk ✅',               type: 'ai'      },
  { time: '5d ago',  text: 'Application submitted via Global Edu BD',             type: 'submit'  },
];

const typeColors: Record<string, string> = {
  doc: 'var(--blue-primary)',
  stage: 'var(--emerald)',
  payment: 'var(--amber)',
  ai: 'var(--purple-accent)',
  submit: 'var(--cyan)',
};

export default function ParentDashboard() {
  const { user, linkedStudents } = useAuth();
  const [docCount, setDocCount] = useState<number | null>(null);

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Parent';

  // Linked student data
  const linkedStudent = linkedStudents?.[0] || null;
  const studentName = linkedStudent?.name || user?.linkedStudentIds?.[0] || 'Your Student';

  useEffect(() => {
    const studentId = linkedStudent?.id || user?.linkedStudentIds?.[0];
    if (studentId) {
      fetch(`/api/documents?ownerId=${encodeURIComponent(studentId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.documents) setDocCount(data.documents.length);
        })
        .catch(() => {});
    }
  }, [linkedStudent?.id, user?.linkedStudentIds]);

  const stats = [
    {
      label: 'Active Applications',
      value: '2',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
      color: 'blue',
    },
    {
      label: "Student's Documents",
      value: docCount !== null ? String(docCount) : '7',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      color: 'purple',
    },
    {
      label: 'Escrow Protected',
      value: '৳45K',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      color: 'amber',
    },
    {
      label: 'Linked Student',
      value: '1',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: 'emerald',
    },
  ];

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetingText}>{timeGreeting}, {firstName} 👋</h1>
          <p className={styles.greetingSubtitle}>
            Monitoring {studentName}&apos;s study abroad journey.
          </p>
        </div>
        <Link href="/dashboard/applications">
          <Button variant="outline" size="sm">View All Applications</Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow} role="list" aria-label="Dashboard statistics">
        {stats.map(s => (
          <div key={s.label} className={`${styles.statCard} ${styles[`stat-${s.color}`]}`}>
            <div className={styles.statHeader}>
              <div className={styles.statIconWrap} aria-hidden="true">{s.icon}</div>
            </div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Student's Active Application */}
        <div className={styles.appCard}>
          <div style={{ padding: 'var(--space-6)' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{studentName}&apos;s Active Application</h2>
              <Badge variant="pending" size="sm">Payment Pending</Badge>
            </div>

            <div className={styles.appInfo}>
              <div className={styles.appAgency}>
                <div className={styles.agencyLogo} aria-hidden="true">G</div>
                <div>
                  <div className={styles.agencyName}>Global Edu BD</div>
                  <Badge variant="verified" size="sm">Verified Agency</Badge>
                </div>
              </div>
              <div className={styles.appTarget}>
                <span className={styles.appLabel}>Target University</span>
                <span>University of Toronto, Canada 🇨🇦</span>
              </div>
            </div>

            {/* Stage Progress */}
            <div className={styles.stageSection} aria-label="Application progress">
              <div className={styles.stageBar} role="progressbar" aria-valuemin={0} aria-valuemax={stages.length - 1} aria-valuenow={currentStage}>
                {stages.map((s, i) => (
                  <div key={s} className={styles.stageWrap}>
                    <div
                      className={`${styles.stageDot} ${i < currentStage ? styles.stageDone : ''} ${i === currentStage ? styles.stageCurrent : ''}`}
                      title={s}
                    >
                      {i < currentStage ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : i + 1}
                      {i === currentStage && <span className={styles.stagePulse} aria-hidden="true" />}
                    </div>
                    {i < stages.length - 1 && (
                      <div className={`${styles.stageLine} ${i < currentStage ? styles.stageLineDone : ''}`} aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.stageLabels} aria-hidden="true">
                {stages.map((s, i) => (
                  <span key={s} className={`${styles.stageLabel} ${i === currentStage ? styles.stageLabelActive : ''}`}>{s}</span>
                ))}
              </div>
            </div>

            <div className={styles.appActions}>
              <Link href="/dashboard/applications/app-001" style={{ flex: 1 }}>
                <Button size="md" variant="outline" fullWidth>View Application Details</Button>
              </Link>
              <Link href="/dashboard/payments" style={{ flex: 1 }}>
                <Button size="md" variant="emerald" fullWidth glow>View Escrow & Payments</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className={styles.activityCard}>
          <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <ol className={styles.activityList} aria-label="Recent activity">
              {activity.map((a, i) => (
                <li key={i} className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ color: typeColors[a.type] }} aria-hidden="true" />
                  <div className={styles.activityBody}>
                    <p className={styles.activityText}>{a.text}</p>
                    <time className={styles.activityTime}>{a.time}</time>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        {[
          { href: '/dashboard/documents',   icon: '📁', label: "View Student's Docs"    },
          { href: '/dashboard/payments',     icon: '🔒', label: 'Escrow & Payments'     },
          { href: '/dashboard/chat',         icon: '💬', label: 'Message Agency'        },
          { href: '/dashboard/applications', icon: '📋', label: 'All Applications'      },
        ].map(q => (
          <Link key={q.href} href={q.href}>
            <div className={styles.quickCard} style={{ padding: 'var(--space-3)' }}>
              <span className={styles.quickIcon} aria-hidden="true">{q.icon}</span>
              <span className={styles.quickLabel}>{q.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
