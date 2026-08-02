'use client';
import React from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './StudentDashboard.module.css';

const stages = ['Submitted','Under Review','Offer Received','Payment Pending','Visa Processing','Approved'];
const currentStage = 2; // 0-indexed

const stats = [
  { label: 'Active Applications', value: '2',     icon: '📋', color: 'blue'    },
  { label: 'Documents Uploaded',  value: '7',     icon: '📁', color: 'purple'  },
  { label: 'Escrow Held',         value: '৳45K',  icon: '🔒', color: 'amber'   },
  { label: 'AI Scans Done',       value: '3',     icon: '🤖', color: 'emerald' },
];

const activity = [
  { time: '2h ago', text: 'Offer letter uploaded by Global Edu BD', type: 'doc' },
  { time: '1d ago', text: 'Application stage advanced to Offer Received', type: 'stage' },
  { time: '2d ago', text: 'Milestone ৳15,000 held in escrow', type: 'payment' },
  { time: '3d ago', text: 'Document fraud scan completed — Low Risk', type: 'ai' },
  { time: '5d ago', text: 'Application submitted to Global Edu BD', type: 'submit' },
];

const typeColors: Record<string, string> = {
  doc: '#4F8EF7', stage: '#10B981', payment: '#F59E0B', ai: '#8B5CF6', submit: '#06B6D4',
};

export default function StudentDashboard() {
  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetingText}>Good evening, Riya 👋</h1>
          <p className={styles.greetingSubtitle}>Here&apos;s your application summary for today.</p>
        </div>
        <Link href="/dashboard/applications">
          <Button variant="outline" size="sm">View All Applications</Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow} role="list" aria-label="Dashboard statistics">
        {stats.map(s => (
          <GlassCard key={s.label} padding="md" className={`${styles.statCard} ${styles[`stat-${s.color}`]}`}>
            <div className={styles.statIconWrap} aria-hidden="true">{s.icon}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Active Application Card */}
        <GlassCard padding="lg" className={styles.appCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Active Application</h2>
            <Badge variant="pending" size="sm">Payment Pending</Badge>
          </div>

          <div className={styles.appInfo}>
            <div className={styles.appAgency}>
              <div className={styles.agencyLogo} aria-hidden="true">G</div>
              <div>
                <div className={styles.agencyName}>Global Edu BD</div>
                <Badge variant="verified" size="sm">Verified</Badge>
              </div>
            </div>
            <div className={styles.appTarget}>
              <span className={styles.appLabel}>Target</span>
              <span>University of Toronto, Canada 🇨🇦</span>
            </div>
          </div>

          {/* Stage Progress */}
          <div className={styles.stageSection} aria-label="Application progress">
            <div className={styles.stageBar} role="progressbar" aria-valuemin={0} aria-valuemax={stages.length - 1} aria-valuenow={currentStage}>
              {stages.map((s, i) => (
                <div key={s} className={styles.stageWrap}>
                  <div className={`${styles.stageDot} ${i < currentStage ? styles.stageDone : ''} ${i === currentStage ? styles.stageCurrent : ''}`} title={s}>
                    {i < currentStage ? '✓' : i + 1}
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
            <Link href="/dashboard/applications/app-001">
              <Button size="sm">View Details</Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button size="sm" variant="emerald">Pay Milestone ৳15,000</Button>
            </Link>
          </div>
        </GlassCard>

        {/* Activity Feed */}
        <GlassCard padding="lg" className={styles.activityCard}>
          <h2 className={styles.cardTitle}>Recent Activity</h2>
          <ol className={styles.activityList} aria-label="Recent activity">
            {activity.map((a, i) => (
              <li key={i} className={styles.activityItem}>
                <div className={styles.activityDot} style={{ background: typeColors[a.type] }} aria-hidden="true" />
                <div className={styles.activityBody}>
                  <p className={styles.activityText}>{a.text}</p>
                  <time className={styles.activityTime}>{a.time}</time>
                </div>
              </li>
            ))}
          </ol>
        </GlassCard>
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        {[
          { href: '/dashboard/documents', icon: '📁', label: 'Upload Documents' },
          { href: '/dashboard/ai-tools',  icon: '🤖', label: 'AI Fraud Checker' },
          { href: '/directory',           icon: '🔍', label: 'Find Agencies' },
          { href: '/dashboard/chat',      icon: '💬', label: 'Chat with Agency' },
        ].map(q => (
          <Link key={q.href} href={q.href}>
            <GlassCard hover padding="sm" className={styles.quickCard}>
              <span className={styles.quickIcon} aria-hidden="true">{q.icon}</span>
              <span className={styles.quickLabel}>{q.label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
