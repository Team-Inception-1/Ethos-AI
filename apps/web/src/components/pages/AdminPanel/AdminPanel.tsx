'use client';
import React, { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './AdminPanel.module.css';

const PENDING = [
  { name:'Skyline Consultancy', date:'Jul 28, 2026', docs:'3 docs', risk:67 },
  { name:'EduWings BD',         date:'Jul 30, 2026', docs:'2 docs', risk:14 },
];

const DISPUTES = [
  { id:'DSP-001', student:'Riya Ahmed',  agency:'Skyline Consultancy', amount:'৳30,000', status:'open' },
  { id:'DSP-002', student:'Arif Khan',   agency:'FastPath Edu',        amount:'৳15,000', status:'investigating' },
];

const TABS = ['Agency Verification','Disputes','Scam Alerts','Users'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('Agency Verification');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Admin Panel</h1>
        <Badge variant="danger">Admin Access</Badge>
      </div>

      <div className={styles.tabs} role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={activeTab === t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {activeTab === 'Agency Verification' && (
        <GlassCard padding="none">
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Pending Agency Verifications ({PENDING.length})</h2></div>
          <table className={styles.table} aria-label="Agency verification queue">
            <thead><tr><th>Agency</th><th>Applied</th><th>Documents</th><th>AI Risk</th><th>Actions</th></tr></thead>
            <tbody>
              {PENDING.map((a, i) => (
                <tr key={i}>
                  <td className={styles.agencyName}>{a.name}</td>
                  <td className={styles.cell}>{a.date}</td>
                  <td className={styles.cell}>{a.docs}</td>
                  <td><Badge variant={a.risk < 30 ? 'success' : 'danger'} size="sm">{a.risk}/100</Badge></td>
                  <td className={styles.actions}>
                    <Button size="sm" variant="emerald">Approve</Button>
                    <Button size="sm" variant="danger">Reject</Button>
                    <Button size="sm" variant="ghost">Review</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {activeTab === 'Disputes' && (
        <GlassCard padding="none">
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Active Disputes ({DISPUTES.length})</h2></div>
          <table className={styles.table} aria-label="Disputes list">
            <thead><tr><th>ID</th><th>Student</th><th>Agency</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {DISPUTES.map((d, i) => (
                <tr key={i}>
                  <td className={styles.id}>{d.id}</td>
                  <td>{d.student}</td>
                  <td className={styles.cell}>{d.agency}</td>
                  <td className={styles.amount}>{d.amount}</td>
                  <td><Badge variant={d.status === 'open' ? 'danger' : 'warning'} size="sm">{d.status}</Badge></td>
                  <td><Button size="sm" variant="ghost">Resolve</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {(activeTab === 'Scam Alerts' || activeTab === 'Users') && (
        <GlassCard padding="lg" className={styles.placeholder}>
          <div className={styles.icon} aria-hidden="true">{activeTab === 'Scam Alerts' ? '🚨' : '👥'}</div>
          <h3>{activeTab}</h3>
          <p>🔧 <strong>@backend</strong>: Wire to admin API endpoints for {activeTab.toLowerCase()}.</p>
        </GlassCard>
      )}

      <p className={styles.devHint}>🔧 <strong>@backend</strong>: Wire to admin-only endpoints with <code>@Roles(&apos;admin&apos;)</code> guard</p>
    </div>
  );
}
