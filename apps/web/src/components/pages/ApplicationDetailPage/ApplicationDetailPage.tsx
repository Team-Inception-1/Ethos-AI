'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import styles from './ApplicationDetailPage.module.css';

const stages = ['Submitted', 'Under Review', 'Offer Received', 'Payment Pending', 'Visa Processing', 'Approved'];

interface AppConfig {
  university: string;
  country: string;
  agencyName: string;
  agencyUserId: string;
  program: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'verified';
  stageLabel: string;
  currentStage: number;
  history: Array<{ stage: string; actor: string; time: string; note: string; doc: boolean }>;
  milestones: Array<{ name: string; amount: number; status: string; condition: string }>;
  docs: Array<{ name: string; note: string }>;
}

const APP_CONFIGS: Record<string, AppConfig> = {
  'app-002': {
    university: 'Technical University of Munich',
    country: 'Germany 🇩🇪',
    agencyName: 'Dream Abroad Ltd',
    agencyUserId: 'usr-agency-02',
    program: 'M.Sc. in Electrical & Electronic Engineering (Winter 2026)',
    badgeVariant: 'info',
    stageLabel: 'Under Review',
    currentStage: 1,
    history: [
      { stage: 'Under Review', actor: 'Dream Abroad Ltd', time: 'Aug 3, 2026 10:15', note: 'Blocked account proof & transcript credits under review', doc: false },
      { stage: 'Submitted', actor: 'Student', time: 'Aug 1, 2026 09:00', note: 'Application submitted for TUM Winter 2026', doc: true },
    ],
    milestones: [
      { name: 'Profile Assessment', amount: 10000, status: 'released', condition: 'University shortlist confirmed' },
      { name: 'Blocked Account Setup', amount: 20000, status: 'held', condition: 'Blocked account documents verified' },
      { name: 'Embassy Visa Filing', amount: 35000, status: 'pending', condition: 'German Embassy interview booked' },
    ],
    docs: [
      { name: 'German_Blocked_Account_Confirmation.pdf', note: 'Verified by Dream Abroad' },
      { name: 'Academic_Transcript_Notre_Dame.pdf', note: 'Attached to Application' },
    ],
  },
  'app-001': {
    university: 'University of Toronto',
    country: 'Canada 🇨🇦',
    agencyName: 'Global Edu BD',
    agencyUserId: 'usr-agency-01',
    program: 'M.Sc. in Computer Science (Fall 2026)',
    badgeVariant: 'warning',
    stageLabel: 'Offer Received',
    currentStage: 2,
    history: [
      { stage: 'Offer Received', actor: 'Global Edu BD', time: 'Jul 25, 2026 14:32', note: 'Offer letter from U of Toronto received & scanned', doc: true },
      { stage: 'Under Review', actor: 'Global Edu BD', time: 'Jul 12, 2026 09:10', note: 'Documents under agency review', doc: false },
      { stage: 'Submitted', actor: 'Student', time: 'Jul 10, 2026 11:00', note: 'Application submitted', doc: false },
    ],
    milestones: [
      { name: 'Application Fee', amount: 15000, status: 'released', condition: 'Application submitted' },
      { name: 'Offer Processing', amount: 25000, status: 'held', condition: 'Offer letter received' },
      { name: 'Visa Filing', amount: 30000, status: 'pending', condition: 'Visa application filed' },
    ],
    docs: [
      { name: 'Offer_Letter_U_of_Toronto_Fall2026.pdf', note: 'Verified Low Risk (0 Flags)' },
      { name: 'Academic_Transcript_HSC_Viqarunnisa.pdf', note: 'Attached to Application' },
    ],
  },
};

const tabs = ['Overview', 'Documents', 'Milestones', 'Chat'];

export default function ApplicationDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const config = APP_CONFIGS[id] || APP_CONFIGS['app-001'];

  const [activeTab, setActiveTab] = useState('Overview');
  const [chatMsgs, setChatMsgs] = useState<Array<{ id: string; from: 'student' | 'agency'; text: string; time: string }>>([]);
  const [msgInput, setMsgInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat messages from API
  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat/threads/${id}/messages`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          const mapped = data.messages.map((m: any) => ({
            id: m.id,
            from: (m.senderRole === 'STUDENT' ? 'student' : 'agency') as 'student' | 'agency',
            text: m.body,
            time: formatTime(m.sentAt),
          }));
          setChatMsgs(mapped);
          return;
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3500);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMsgs, isTyping]);

  const handleSendMessage = async () => {
    const text = msgInput.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setMsgInput('');

    const optimisticId = `local-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      from: 'student' as const,
      text,
      time: 'Just now',
    };
    setChatMsgs((prev) => [...prev, optimisticMsg]);

    try {
      await fetch(`/api/chat/threads/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id || 'usr-student-01',
          senderRole: 'STUDENT',
          body: text,
        }),
      });

      // Agency Auto-Reply Simulation for Realtime Demo Interactivity
      setIsTyping(true);
      setTimeout(async () => {
        try {
          const agencyReplies = id === 'app-002'
            ? [
                `Thank you for your message! Our Munich counseling desk is reviewing this. Your blocked account documents look solid.`,
                `Got it! We have noted your request regarding Technical University of Munich winter admission timeline.`,
                `Understood. We will sync this update with TUM's international admissions portal today.`,
              ]
            : [
                `Thank you! We've received your note and our Toronto desk has logged it in your case file.`,
                `Noted! We are preparing the visa documentation checklist for your next stage.`,
                `We have received your update. The official verification certificate has been linked to your escrow milestone.`,
              ];

          const replyText = agencyReplies[Math.floor(Math.random() * agencyReplies.length)];

          await fetch(`/api/chat/threads/${id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderId: config.agencyUserId,
              senderRole: 'AGENCY',
              body: replyText,
            }),
          });

          await loadMessages();
        } catch {
          // ignore
        } finally {
          setIsTyping(false);
        }
      }, 1500);
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  function formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return 'Just now';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Application #{id}</h1>
          <p className={styles.subtitle}>
            {config.agencyName} → {config.university}, {config.country}
          </p>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{config.program}</span>
        </div>
        <Badge variant={config.badgeVariant}>{config.stageLabel}</Badge>
      </div>

      {/* Stage Progress */}
      <GlassCard padding="lg" className={styles.stageCard}>
        <h2 className={styles.cardTitle}>Application Progress</h2>
        <div
          className={styles.stageBar}
          role="progressbar"
          aria-valuenow={config.currentStage}
          aria-valuemin={0}
          aria-valuemax={stages.length - 1}
        >
          {stages.map((s, i) => (
            <div key={s} className={styles.stageWrap}>
              <div
                className={`${styles.stageDot} ${i < config.currentStage ? styles.done : ''} ${i === config.currentStage ? styles.current : ''}`}
                title={s}
              >
                {i < config.currentStage ? '✓' : i + 1}
                {i === config.currentStage && <span className={styles.pulse} aria-hidden="true" />}
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`${styles.line} ${i < config.currentStage ? styles.lineDone : ''}`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
        <div className={styles.stageLabels} aria-hidden="true">
          {stages.map((s, i) => (
            <span
              key={s}
              className={`${styles.stageLabel} ${i === config.currentStage ? styles.labelActive : ''}`}
            >
              {s}
            </span>
          ))}
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Application sections">
        {tabs.map((t) => (
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
            {config.history.map((h, i) => (
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
            {config.milestones.map((m, i) => (
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
                    >
                      {m.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {m.status === 'held' && (
                  <div className={styles.milestoneActions}>
                    <Link href="/dashboard/payments">
                      <Button size="sm" variant="emerald">Manage in Escrow →</Button>
                    </Link>
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
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {config.docs.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>📄 {d.name}</span>
                  <Badge variant="verified" size="sm">{d.note}</Badge>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px' }}>
              <Link href="/dashboard/documents">
                <Button size="sm" variant="outline">Open Document Vault & AI Scanner →</Button>
              </Link>
            </div>
          </GlassCard>
        )}

        {activeTab === 'Chat' && (
          <GlassCard padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>💬 Live Chat with {config.agencyName}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Persistent real-time messages · Cryptographically hashed for dispute resolution
                </p>
              </div>
              <Link href="/dashboard/chat">
                <Button size="sm" variant="outline">Open Full Chat Screen →</Button>
              </Link>
            </div>

            <div
              ref={chatContainerRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '300px',
                minHeight: '160px',
                overflowY: 'auto',
                marginBottom: '12px',
                padding: '12px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border)',
              }}
            >
              {chatMsgs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>
                  No messages yet. Send a message to start communicating with {config.agencyName}.
                </div>
              ) : (
                chatMsgs.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.from === 'student' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                    }}
                  >
                    <div
                      style={{
                        background: m.from === 'student' ? 'var(--blue-primary)' : 'var(--bg-surface)',
                        color: m.from === 'student' ? '#fff' : 'var(--text-primary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--ink)',
                        fontSize: '13px',
                        boxShadow: '1px 1px 0 0 var(--ink)',
                      }}
                    >
                      {m.text}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        textAlign: m.from === 'student' ? 'right' : 'left',
                        marginTop: '2px',
                      }}
                    >
                      {m.from === 'student' ? 'You' : config.agencyName} • {m.time}
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1.5px dashed var(--border)',
                      fontSize: '12px',
                      fontStyle: 'italic',
                    }}
                  >
                    {config.agencyName} is typing…
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={`Type a message to ${config.agencyName}...`}
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isSending}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <Button
                size="sm"
                variant="emerald"
                onClick={handleSendMessage}
                disabled={!msgInput.trim() || isSending}
              >
                {isSending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
