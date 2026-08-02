'use client';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import styles from './ComparePage.module.css';

const AGENCIES = [
  { id:'agt-001', name:'Global Edu BD',    verified:true, rating:4.8, success:94,  fee:'৳25K–৳80K', refund:'Full refund within 30 days', response:'< 2 hours', countries:'🇨🇦 🇬🇧 🇦🇺' },
  { id:'agt-002', name:'Dream Abroad Ltd', verified:true, rating:4.6, success:89,  fee:'৳30K–৳100K', refund:'50% refund within 14 days', response:'< 6 hours', countries:'🇺🇸 🇩🇪 🇳🇱' },
  { id:'agt-005', name:'StudyBridge BD',   verified:true, rating:4.7, success:96,  fee:'৳35K–৳90K',  refund:'Full refund within 45 days', response:'< 1 hour',  countries:'🇨🇦 🇦🇺 🇺🇸' },
];

const rows = [
  { label: 'Verification', key: 'verified',  render: (v: boolean) => <Badge variant={v ? 'verified' : 'pending'}>{v ? 'Verified' : 'Pending'}</Badge> },
  { label: 'Rating',       key: 'rating',    render: (v: number) => <span className={styles.ratingVal}>{v} ⭐</span> },
  { label: 'Success Rate', key: 'success',   render: (v: number) => <span className={styles.successVal}>{v}%</span> },
  { label: 'Fee Range',    key: 'fee',       render: (v: string) => <span>{v}</span> },
  { label: 'Refund Policy',key: 'refund',    render: (v: string) => <span className={styles.policyText}>{v}</span> },
  { label: 'Response Time',key: 'response',  render: (v: string) => <span className={styles.responseVal}>{v}</span> },
  { label: 'Countries',    key: 'countries', render: (v: string) => <span>{v}</span> },
];

export default function ComparePage() {
  return (
    <main className={styles.page} style={{ paddingTop: 'var(--topbar-height)' }}>
      <div className={`${styles.inner} container`}>
        <div className={styles.header}>
          <h1>Agency Comparison</h1>
          <p className={styles.subtitle}>Side-by-side comparison of {AGENCIES.length} agencies</p>
          <Link href="/directory"><Button variant="ghost" size="sm">← Back to Directory</Button></Link>
        </div>

        <GlassCard padding="none" className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.table} aria-label="Agency comparison table">
              <thead>
                <tr>
                  <th className={styles.rowHeader} scope="col">Feature</th>
                  {AGENCIES.map(a => (
                    <th key={a.id} className={styles.colHeader} scope="col">
                      <div className={styles.agencyHead}>
                        <div className={styles.agencyAvatar} aria-hidden="true">{a.name[0]}</div>
                        <div>
                          <div className={styles.agencyName}>{a.name}</div>
                          <Badge variant={a.verified ? 'verified' : 'pending'} size="sm">{a.verified ? 'Verified' : 'Pending'}</Badge>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className={styles.addCol} scope="col">
                    <Link href="/directory"><div className={styles.addSlot}>+ Add Agency</div></Link>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key} className={i % 2 === 0 ? styles.rowEven : ''}>
                    <td className={styles.rowLabel}>{row.label}</td>
                    {AGENCIES.map(a => (
                      <td key={a.id} className={styles.cell}>
                        {/* @ts-expect-error dynamic key */}
                        {row.render(a[row.key])}
                      </td>
                    ))}
                    <td className={`${styles.cell} ${styles.addCol}`} />
                  </tr>
                ))}
                <tr>
                  <td className={styles.rowLabel} />
                  {AGENCIES.map(a => (
                    <td key={a.id} className={styles.cell}>
                      <Link href={`/directory/${a.id}`}><Button size="sm">View Profile</Button></Link>
                    </td>
                  ))}
                  <td className={`${styles.cell} ${styles.addCol}`} />
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
