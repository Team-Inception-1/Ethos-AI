'use client';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './PaymentsPage.module.css';

const LEDGER = [
  { type:'hold',    amount:15000, milestone:'Application Fee',  date:'Jul 10, 2026', status:'released', ref:'SSLCommerz-78XXXX' },
  { type:'hold',    amount:25000, milestone:'Offer Processing', date:'Jul 25, 2026', status:'held',     ref:'SSLCommerz-81XXXX' },
  { type:'pending', amount:30000, milestone:'Visa Filing',      date:'—',            status:'pending',  ref:'—' },
];

const statusVariant = (s: string) => s === 'released' ? 'success' : s === 'held' ? 'info' : 'neutral';

export default function PaymentsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Payments & Escrow</h1>
        <div className={styles.summary}>
          <div className={styles.summaryItem}><span className={styles.summaryVal}>৳40,000</span><span className={styles.summaryLabel}>Held in Escrow</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryVal}>৳15,000</span><span className={styles.summaryLabel}>Released</span></div>
        </div>
      </div>

      <GlassCard padding="none" className={styles.tableCard}>
        <table className={styles.table} aria-label="Payment ledger">
          <thead>
            <tr>
              <th scope="col">Milestone</th><th scope="col">Amount</th><th scope="col">Date</th>
              <th scope="col">Status</th><th scope="col">Gateway Ref</th><th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {LEDGER.map((e, i) => (
              <tr key={i}>
                <td className={styles.milestoneName}>{e.milestone}</td>
                <td className={styles.amount}>৳{e.amount.toLocaleString()}</td>
                <td className={styles.date}>{e.date}</td>
                <td><Badge variant={statusVariant(e.status)} size="sm">{e.status}</Badge></td>
                <td className={styles.ref}>{e.ref}</td>
                <td>
                  {e.status === 'pending'  && <Button size="sm" variant="emerald">Pay Now</Button>}
                  {e.status === 'released' && <Button size="sm" variant="ghost">Receipt</Button>}
                  {e.status === 'held'     && <Button size="sm" variant="ghost">Dispute</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <p className={styles.devHint}>🔧 <strong>@backend</strong>: Wire to <code>GET /milestones?applicationId=:id</code></p>
    </div>
  );
}
