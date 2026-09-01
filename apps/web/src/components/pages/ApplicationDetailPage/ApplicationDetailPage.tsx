'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './ApplicationDetailPage.module.css';

const stages = ['Submitted','Under Review','Offer Received','Payment Pending','Visa Processing','Approved'];
const currentStage = 2;

const history = [
  { stage:'Offer Received', actor:'Global Edu BD', time:'Jul 25, 2026 14:32', note:'Offer letter from U of Toronto received', doc:true },
  { stage:'Under Review',   actor:'Global Edu BD', time:'Jul 12, 2026 09:10', note:'Documents under agency review', doc:false },
  { stage:'Submitted',      actor:'Student',       time:'Jul 10, 2026 11:00', note:'Application submitted', doc:false },
];

const milestones = [
  { name:'Application Fee',  amount:15000, status:'released', condition:'Application submitted' },
  { name:'Offer Processing', amount:25000, status:'held',     condition:'Offer letter received' },
  { name:'Visa Filing',      amount:30000, status:'pending',  condition:'Visa application filed' },
];

const initialChat = [
  { from: 'agency', text: 'Hello! We have received your application for U of Toronto.', time: '10:00 AM' },
  { from: 'student', text: 'Thank you! When can I expect the offer letter?', time: '10:15 AM' },
  { from: 'agency', text: 'We received the offer letter and verified it via AI Scanner.', time: '02:32 PM' },
];

const tabs = ['Overview','Documents','Milestones','Chat'];

export default function ApplicationDetailPage({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [chatMsgs, setChatMsgs] = useState(initialChat);
  const [msgInput, setMsgInput] = useState('');

  const sendQuickMessage = () => {
    if (!msgInput.trim()) return;
    setChatMsgs(prev => [...prev, { from: 'student', text: msgInput.trim(), time: 'Just now' }]);
    setMsgInput('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Application #{id}</h1>
          <p className={styles.subtitle}>Global Edu BD → University of Toronto, Canada 🇨🇦</p>
        </div>
        <Badge variant="warning">Offer Received</Badge>
      </div>

      {/* Stage Progress */}
      <GlassCard padding="lg" className={styles.stageCard}>
        <h2 className={styles.cardTitle}>Application Progress</h2>
        <div className={styles.stageBar} role="progressbar" aria-valuenow={currentStage} aria-valuemin={0} aria-valuemax={stages.length - 1}>
          {stages.map((s, i) => (
            <div key={s} className={styles.stageWrap}>
              <div className={`${styles.stageDot} ${i < currentStage ? styles.done : ''} ${i === currentStage ? styles.current : ''}`} title={s}>
                {i < currentStage ? '✓' : i + 1}
                {i === currentStage && <span className={styles.pulse} aria-hidden="true" />}
              </div>
              {i < stages.length - 1 && <div className={`${styles.line} ${i < currentStage ? styles.lineDone : ''}`} aria-hidden="true" />}
            </div>
          ))}
        </div>
        <div className={styles.stageLabels} aria-hidden="true">
          {stages.map((s, i) => <span key={s} className={`${styles.stageLabel} ${i === currentStage ? styles.labelActive : ''}`}>{s}</span>)}
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Application sections">
        {tabs.map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={activeTab === t}
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div role="tabpanel" aria-label={activeTab}>
        {activeTab === 'Overview' && (
          <div className={styles.historyList} aria-label="Stage history">
            {history.map((h, i) => (
              <div key={i} className={styles.historyItem}>
                <div className={styles.historyDot} aria-hidden="true" />
                <GlassCard padding="md" className={styles.historyCard}>
                  <div className={styles.historyHeader}>
                    <span className={styles.historyStage}>{h.stage}</span>
                    <time className={styles.historyTime}>{h.time}</time>
                  </div>
                  <p className={styles.historyNote}>{h.note}</p>
                  <p className={styles.historyActor}>by {h.actor}</p>
                  {h.doc && <Badge variant="info" size="sm">📎 Document attached</Badge>}
                </GlassCard>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Milestones' && (
          <div className={styles.milestones} aria-label="Payment milestones">
            {milestones.map((m, i) => (
              <GlassCard key={i} padding="md" className={styles.milestoneCard}>
                <div className={styles.milestoneHeader}>
                  <div>
                    <div className={styles.milestoneName}>{m.name}</div>
                    <div className={styles.milestoneCondition}>{m.condition}</div>
                  </div>
                  <div className={styles.milestoneRight}>
                    <div className={styles.milestoneAmount}>৳{m.amount.toLocaleString()}</div>
                    <Badge
                      variant={m.status === 'released' ? 'success' : m.status === 'held' ? 'info' : 'neutral'}
                      size="sm"
                    >{m.status}</Badge>
                  </div>
                </div>
                {m.status === 'held' && (
                  <div className={styles.milestoneActions}>
                    <Button size="sm" variant="emerald">Release Payment</Button>
                    <Button size="sm" variant="danger">Dispute</Button>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        {activeTab === 'Documents' && (
          <GlassCard padding="lg" className={styles.placeholder}>
            <div className={styles.placeholderIcon} aria-hidden="true">📁</div>
            <h3>Application Document Vault</h3>
            <p>1. Offer_Letter_U_of_Toronto_Fall2026.pdf (Verified Low Risk)</p>
            <p>2. Academic_Transcript_HSC_Viqarunnisa.pdf (Attached to Application)</p>
          </GlassCard>
        )}

        {activeTab === 'Chat' && (
          <GlassCard padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>💬 Live Chat with Global Edu BD</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Messages are cryptographically logged for dispute resolution</p>
              </div>
              <Link href="/dashboard/chat">
                <Button size="sm" variant="outline">Open Full Chat Screen →</Button>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '12px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              {chatMsgs.map((m, idx) => (
                <div key={idx} style={{ alignSelf: m.from === 'student' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ background: m.from === 'student' ? 'var(--blue-primary)' : 'var(--bg-surface)', color: m.from === 'student' ? '#fff' : 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--ink)', fontSize: '13px' }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: m.from === 'student' ? 'right' : 'left', marginTop: '2px' }}>
                    {m.from === 'student' ? 'You' : 'Global Edu BD'} • {m.time}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type a message to Global Edu BD..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendQuickMessage()}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '2px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
              <Button size="sm" variant="emerald" onClick={sendQuickMessage} disabled={!msgInput.trim()}>
                Send
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
