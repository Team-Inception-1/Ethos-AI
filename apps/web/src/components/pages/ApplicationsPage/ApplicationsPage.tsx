'use client';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import styles from './ApplicationsPage.module.css';

const APPS = [
  { id:'app-001', agency:'Global Edu BD',    target:'University of Toronto, Canada', stage:'Offer Received',    date:'Jul 25, 2026', status:'warning' as const },
  { id:'app-002', agency:'StudyBridge BD',   target:'Monash University, Australia',  stage:'Under Review',      date:'Jul 10, 2026', status:'info' as const    },
];

export default function ApplicationsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Applications</h1>
        <Link href="/directory"><Button size="sm">+ New Application</Button></Link>
      </div>

      <div className={styles.list} role="list" aria-label="Applications list">
        {APPS.map(app => (
          <GlassCard key={app.id} hover padding="lg" className={styles.appRow}>
            <div className={styles.appLeft}>
              <div className={styles.agencyLogo} aria-hidden="true">{app.agency[0]}</div>
              <div>
                <div className={styles.agencyName}>{app.agency}</div>
                <div className={styles.target}>{app.target}</div>
                <div className={styles.date}>Applied {app.date}</div>
              </div>
            </div>
            <div className={styles.appRight}>
              <Badge variant={app.status === 'warning' ? 'warning' : 'info'} size="md">{app.stage}</Badge>
              <Link href={`/dashboard/applications/${app.id}`}>
                <Button size="sm" variant="ghost">View Details →</Button>
              </Link>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Empty State Placeholder for members */}
      <div className={styles.emptyHint}>
        <p className={styles.hint}>🔧 <strong>@backend</strong>: Wire to <code>GET /applications</code> and replace mock data.</p>
      </div>
    </div>
  );
}
