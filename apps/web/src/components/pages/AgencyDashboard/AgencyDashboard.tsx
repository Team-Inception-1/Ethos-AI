'use client';
import React from 'react';
import Link from 'next/link';
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard/chat" style={{ textDecoration: 'none' }}>
            <Button variant="emerald" size="sm">
              💬 Messages & Chat
            </Button>
          </Link>
          <Badge variant="verified">Verified Agency</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { 
            label:'Profile Views', 
            value:'1,284', 
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> 
          },
          { 
            label:'Chat Inquiries',     
            value:'47',    
            href: '/dashboard/chat',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> 
          },
          { 
            label:'Active Apps',   
            value:'12',    
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> 
          },
          { 
            label:'Conversion',    
            value:'34%',   
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> 
          },
        ].map(s => {
          const cardContent = (
            <GlassCard key={s.label} padding="md" className={styles.stat} hover={!!s.href}>
              <div className={styles.statIcon} aria-hidden="true">{s.icon}</div>
              <div className={styles.statVal}>{s.value}</div>
              <div className={styles.statLbl}>{s.label}{s.href ? ' (Open Chat) →' : ''}</div>
            </GlassCard>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              {cardContent}
            </Link>
          ) : (
            cardContent
          );
        })}
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
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link href="/dashboard/chat" style={{ textDecoration: 'none' }}>
                      <Button size="sm" variant="outline" title={`Chat with ${a.student}`}>
                        💬 Chat
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost">Advance Stage</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <p className={styles.devHint}>🔧 <strong>@backend</strong>: Wire to <code>GET /applications?agencyId=:id</code></p>
    </div>
  );
}
