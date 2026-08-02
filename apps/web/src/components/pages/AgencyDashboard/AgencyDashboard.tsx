'use client';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './AgencyDashboard.module.css';

const APPS = [
  { student:'Riya Ahmed',  program:'U of Toronto, Canada', stage:'Offer Received', date:'Jul 25' },
  { student:'Mehedi H.',   program:'Monash Uni, Australia', stage:'Under Review',   date:'Jul 22' },
  { student:'Sara Islam',  program:'TU Berlin, Germany',   stage:'Submitted',      date:'Jul 18' },
];

export default function AgencyDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Agency Dashboard</h1>
          <p className={styles.sub}>Global Edu BD</p>
        </div>
        <Badge variant="verified">Verified Agency</Badge>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label:'Profile Views', value:'1,284', icon:'👁️' },
          { label:'Inquiries',     value:'47',    icon:'📩' },
          { label:'Active Apps',   value:'12',    icon:'📋' },
          { label:'Conversion',    value:'34%',   icon:'📈' },
        ].map(s => (
          <GlassCard key={s.label} padding="md" className={styles.stat}>
            <div className={styles.statIcon} aria-hidden="true">{s.icon}</div>
            <div className={styles.statVal}>{s.value}</div>
            <div className={styles.statLbl}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Application Queue */}
      <GlassCard padding="none" className={styles.tableCard}>
        <div className={styles.tableHeader}><h2 className={styles.tableTitle}>Application Queue</h2></div>
        <table className={styles.table} aria-label="Application queue">
          <thead><tr><th>Student</th><th>Program</th><th>Stage</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {APPS.map((a, i) => (
              <tr key={i}>
                <td className={styles.studentName}>{a.student}</td>
                <td className={styles.program}>{a.program}</td>
                <td><Badge variant="info" size="sm">{a.stage}</Badge></td>
                <td className={styles.date}>{a.date}</td>
                <td><Button size="sm" variant="ghost">Advance Stage</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <p className={styles.devHint}>🔧 <strong>@backend</strong>: Wire to <code>GET /applications?agencyId=:id</code></p>
    </div>
  );
}
