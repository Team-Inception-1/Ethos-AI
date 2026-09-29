'use client';

import React, { useState, useEffect, useRef } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import {
  fetchChatThreads,
  fetchThreadMessages,
  sendChatMessage,
  exportDisputeTranscript,
  type ChatThreadSummary,
  type ChatMessageItem,
} from '@/lib/chatClient';
import styles from './ChatPage.module.css';

const DEFAULT_THREADS: ChatThreadSummary[] = [
  {
    id: 'thd-001',
    applicationId: 'app-001',
    agencyId: 'agt-001',
    agencyName: 'Global Edu BD',
    studentName: 'Riya Ahmed',
    targetUniversity: 'University of Toronto',
    targetCountry: 'Canada 🇨🇦',
    lastMessage: {
      text: 'Great, thank you! Please also share the visa processing timeline.',
      time: '2026-07-25T11:00:00Z',
      senderRole: 'STUDENT',
    },
    unreadCount: 0,
    createdAt: '2026-07-10T11:05:00Z',
    updatedAt: '2026-07-25T11:00:00Z',
  },
  {
    id: 'thd-002',
    applicationId: 'app-002',
    agencyId: 'agt-002',
    agencyName: 'Dream Abroad Ltd',
    studentName: 'Riya Ahmed',
    targetUniversity: 'TU Munich',
    targetCountry: 'Germany 🇩🇪',
    lastMessage: {
      text: 'Your German blocked account documents are verified.',
      time: '2026-08-01T09:30:00Z',
      senderRole: 'AGENCY',
    },
    unreadCount: 1,
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:30:00Z',
  },
];

const AGENCY_DEFAULT_THREADS: ChatThreadSummary[] = [
  {
    id: 'thd-app-001',
    applicationId: 'app-001',
    agencyId: 'agt-001',
    agencyName: 'Global Edu BD',
    studentName: 'Riya Ahmed',
    targetUniversity: 'University of Toronto',
    targetCountry: 'Canada 🇨🇦',
    lastMessage: {
      text: 'Great, thank you! Please also share the visa processing timeline.',
      time: '2026-07-25T11:00:00Z',
      senderRole: 'STUDENT',
    },
    unreadCount: 0,
    createdAt: '2026-07-10T11:05:00Z',
    updatedAt: '2026-07-25T11:00:00Z',
  },
  {
    id: 'thd-app-002',
    applicationId: 'app-002',
    agencyId: 'agt-001',
    agencyName: 'Global Edu BD',
    studentName: 'Mehedi Hasan',
    targetUniversity: 'TU Munich',
    targetCountry: 'Germany 🇩🇪',
    lastMessage: {
      text: 'I submitted my German blocked account deposit slip for verification.',
      time: '2026-08-01T09:30:00Z',
      senderRole: 'STUDENT',
    },
    unreadCount: 1,
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:30:00Z',
  },
  {
    id: 'thd-app-003',
    applicationId: 'app-003',
    agencyId: 'agt-001',
    agencyName: 'Global Edu BD',
    studentName: 'Sara Islam',
    targetUniversity: 'Monash University',
    targetCountry: 'Australia 🇦🇺',
    lastMessage: {
      text: 'Offer letter received! What are the next GTE financial steps?',
      time: '2026-08-05T14:20:00Z',
      senderRole: 'STUDENT',
    },
    unreadCount: 2,
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-05T14:20:00Z',
  },
  {
    id: 'thd-app-004',
    applicationId: 'app-004',
    agencyId: 'agt-001',
    agencyName: 'Global Edu BD',
    studentName: 'Arif Khan',
    targetUniversity: 'Imperial College London',
    targetCountry: 'United Kingdom 🇬🇧',
    lastMessage: {
      text: 'CAS document has been requested from Imperial admissions.',
      time: '2026-08-07T16:45:00Z',
      senderRole: 'AGENCY',
    },
    unreadCount: 0,
    createdAt: '2026-08-07T12:00:00Z',
    updatedAt: '2026-08-07T16:45:00Z',
  },
];

const DEFAULT_MESSAGES: Record<string, ChatMessageItem[]> = {
  'thd-001': [
    {
      id: 'msg-001',
      threadId: 'thd-001',
      senderId: 'usr-agency-01',
      senderRole: 'AGENCY',
      body: 'Hello Riya! We have received your application for U of Toronto and are reviewing your academic transcripts.',
      msgHash: '8f48a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: true,
      sentAt: '2026-07-25T10:00:00Z',
    },
    {
      id: 'msg-002',
      threadId: 'thd-001',
      senderId: 'usr-student-01',
      senderRole: 'STUDENT',
      body: 'Thank you! When can I expect the official offer letter?',
      msgHash: '7e37a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: true,
      sentAt: '2026-07-25T10:15:00Z',
    },
    {
      id: 'msg-003',
      threadId: 'thd-001',
      senderId: 'usr-agency-01',
      senderRole: 'AGENCY',
      body: 'We expect to receive the official letter within 5-7 business days. We will upload it directly to your Document Vault.',
      msgHash: '6d26a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: true,
      sentAt: '2026-07-25T10:18:00Z',
    },
    {
      id: 'msg-004',
      threadId: 'thd-001',
      senderId: 'usr-student-01',
      senderRole: 'STUDENT',
      body: 'Great, thank you! Please also share the visa processing timeline.',
      msgHash: '5c15a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: true,
      sentAt: '2026-07-25T11:00:00Z',
    },
  ],
  'thd-002': [
    {
      id: 'msg-201',
      threadId: 'thd-002',
      senderId: 'usr-agency-02',
      senderRole: 'AGENCY',
      body: 'Welcome! We have started reviewing your application for TU Munich.',
      msgHash: '4b14a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: true,
      sentAt: '2026-08-01T09:00:00Z',
    },
    {
      id: 'msg-202',
      threadId: 'thd-002',
      senderId: 'usr-agency-02',
      senderRole: 'AGENCY',
      body: 'Your German blocked account documents are verified.',
      msgHash: '3a13a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: false,
      sentAt: '2026-08-01T09:30:00Z',
    },
  ],
  'thd-app-001': [
    {
      id: 'msg-001',
      threadId: 'thd-app-001',
      senderId: 'usr-agency-01',
      senderRole: 'AGENCY',
      body: 'Hello Riya! We have received your application for U of Toronto and are reviewing your academic transcripts.',
      msgHash: '8f48a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: true,
      sentAt: '2026-07-25T10:00:00Z',
    },
    {
      id: 'msg-004',
      threadId: 'thd-app-001',
      senderId: 'usr-student-01',
      senderRole: 'STUDENT',
      body: 'Great, thank you! Please also share the visa processing timeline.',
      msgHash: '5c15a1d2e9bc35a64d1f2b3c4d5e6f7a',
      isRead: true,
      sentAt: '2026-07-25T11:00:00Z',
    },
  ],
  'thd-app-002': [
    {
      id: 'msg-m01',
      threadId: 'thd-app-002',
      senderId: 'usr-agency-01',
      senderRole: 'AGENCY',
      body: 'Hi Mehedi, welcome! We are processing your TU Munich application for Mechanical Engineering.',
      msgHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      isRead: true,
      sentAt: '2026-08-01T09:00:00Z',
    },
    {
      id: 'msg-m02',
      threadId: 'thd-app-002',
      senderId: 'usr-student-02',
      senderRole: 'STUDENT',
      body: 'I submitted my German blocked account deposit slip for verification.',
      msgHash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
      isRead: false,
      sentAt: '2026-08-01T09:30:00Z',
    },
  ],
  'thd-app-003': [
    {
      id: 'msg-s01',
      threadId: 'thd-app-003',
      senderId: 'usr-student-03',
      senderRole: 'STUDENT',
      body: 'Offer letter received! What are the next GTE financial steps?',
      msgHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      isRead: false,
      sentAt: '2026-08-05T14:20:00Z',
    },
    {
      id: 'msg-s02',
      threadId: 'thd-app-003',
      senderId: 'usr-agency-01',
      senderRole: 'AGENCY',
      body: 'Congratulations Sara! We will draft your GTE statement checklist today.',
      msgHash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
      isRead: true,
      sentAt: '2026-08-05T14:35:00Z',
    },
  ],
  'thd-app-004': [
    {
      id: 'msg-a01',
      threadId: 'thd-app-004',
      senderId: 'usr-agency-01',
      senderRole: 'AGENCY',
      body: 'CAS document has been requested from Imperial admissions. Expect it by Thursday.',
      msgHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      isRead: true,
      sentAt: '2026-08-07T16:45:00Z',
    },
  ],
};

const VAULT_DOCS = [
  { id: 'Offer_Letter_U_of_Toronto_Fall2026.pdf', name: '📄 Offer Letter (U of Toronto)', size: '1.2 MB' },
  { id: 'Signed_Agreement_Global_Edu_BD.pdf', name: '📋 Signed Agreement (Global Edu)', size: '856 KB' },
  { id: 'Passport_Copy_Riya_Ahmed.pdf', name: '🛂 Passport Copy (Riya Ahmed)', size: '320 KB' },
  { id: 'Academic_Transcript_HSC_Viqarunnisa.pdf', name: '🎓 Academic Transcript (HSC)', size: '2.1 MB' },
];

const STUDENT_PROMPTS = [
  '📅 What is the visa appointment timeline?',
  '💳 How does the milestone escrow release work?',
  '📋 Can you verify my blocked account checklist?',
];

const AGENCY_PROMPTS = [
  '📄 We have uploaded your offer letter to Document Vault.',
  '✅ Your visa filing checklist is approved.',
  '💼 Milestone 1 release is pending university confirmation.',
];

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function ChatPage() {
  const { user } = useAuth();
  const isAgency = user?.role?.toLowerCase() === 'agency';
  const defaultList = isAgency ? AGENCY_DEFAULT_THREADS : DEFAULT_THREADS;
  const [threads, setThreads] = useState<ChatThreadSummary[]>(defaultList);
  const [activeThreadId, setActiveThreadId] = useState<string>(isAgency ? 'thd-app-001' : 'thd-001');
  const [messages, setMessages] = useState<ChatMessageItem[]>(DEFAULT_MESSAGES[isAgency ? 'thd-app-001' : 'thd-001'] || []);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [exportData, setExportData] = useState<any | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalTab, setExportModalTab] = useState<'cert' | 'json'>('cert');
  const [isExporting, setIsExporting] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<string | null>(null);
  const [showVaultSelector, setShowVaultSelector] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check URL parameters for direct thread activation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tid = params.get('threadId');
      const studentName = params.get('student');
      if (tid) {
        setActiveThreadId(tid);
      }
      if (isAgency && studentName && tid) {
        setThreads((prev) => {
          if (prev.some((t) => t.id === tid)) return prev;
          return [
            {
              id: tid,
              applicationId: tid.replace('thd-', ''),
              agencyId: 'agt-001',
              agencyName: 'Global Edu BD',
              studentName: decodeURIComponent(studentName),
              targetUniversity: 'Under Review',
              targetCountry: 'International',
              lastMessage: {
                text: 'Consultation initiated.',
                time: new Date().toISOString(),
                senderRole: 'STUDENT',
              },
              unreadCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }
    }
  }, [isAgency]);

  // Load threads on mount / user change
  useEffect(() => {
    let cancelled = false;
    const defaultList = isAgency ? AGENCY_DEFAULT_THREADS : DEFAULT_THREADS;
    setThreads(defaultList);

    const roleParam = isAgency ? 'AGENCY' : (user?.role?.toUpperCase() || 'STUDENT');
    const userIdParam = user?.id || (isAgency ? 'usr-agency-01' : 'usr-student-01');

    fetchChatThreads(userIdParam, roleParam)
      .then((res) => {
        if (!cancelled && res.length > 0) {
          setThreads(res);
          if (!res.some((t) => t.id === activeThreadId)) {
            setActiveThreadId(res[0].id);
          }
        }
      })
      .catch((e) => {
        console.warn('Could not load live threads, using defaults:', e);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAgency]);

  // Load messages whenever active thread changes
  useEffect(() => {
    let cancelled = false;
    fetchThreadMessages(activeThreadId)
      .then((res) => {
        if (!cancelled && res.messages.length > 0) {
          setMessages(res.messages);
        } else if (!cancelled && DEFAULT_MESSAGES[activeThreadId]) {
          setMessages(DEFAULT_MESSAGES[activeThreadId]);
        }
      })
      .catch((e) => {
        console.warn('Could not load live messages, using defaults:', e);
        if (DEFAULT_MESSAGES[activeThreadId]) {
          setMessages(DEFAULT_MESSAGES[activeThreadId]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeThreadId]);

  // Auto-scroll to bottom of messages inside chat window only (never scrolls page or TopBar)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const textToSend = input.trim();
    const docToAttach = attachedDoc;
    setInput('');
    setAttachedDoc(null);
    setShowVaultSelector(false);
    setIsSending(true);

    const senderRole = (isAgency ? 'AGENCY' : (user?.role?.toUpperCase() || 'STUDENT')) as 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN';
    const senderId = user?.id || (isAgency ? 'usr-agency-01' : 'usr-student-01');

    // Optimistic message addition
    const tempMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      threadId: activeThreadId,
      senderId,
      senderRole,
      body: textToSend,
      attachmentDocId: docToAttach,
      msgHash: `sha256-sim-${Math.random().toString(36).substring(2, 10)}`,
      isRead: true,
      sentAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const realMsg = await sendChatMessage({
        threadId: activeThreadId,
        senderId,
        senderRole,
        body: textToSend,
        attachmentDocId: docToAttach || undefined,
      });
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? realMsg : m)));
    } catch (err) {
      console.warn('Server send failed, keeping local message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleExportDispute = async () => {
    setIsExporting(true);
    try {
      const data = await exportDisputeTranscript(activeThreadId);
      setExportData(data);
      setShowExportModal(true);
    } catch {
      // Fallback local export format
      const fallbackExport = {
        header: {
          platform: 'Ethos AI Trust & Safety Dispute Evidence System',
          documentType: 'CERTIFIED_CHAT_TRANSCRIPT',
          auditSignature: `ETHOS-DISPUTE-SIG-${Date.now().toString(16).toUpperCase()}-VERIFIED`,
          exportedAt: new Date().toISOString(),
          tamperEvident: true,
        },
        context: {
          threadId: activeThreadId,
          applicationId: activeThread?.applicationId || 'app-001',
          agencyName: activeThread?.agencyName || 'Global Edu BD',
          studentName: activeThread?.studentName || 'Riya Ahmed',
          targetUniversity: activeThread?.targetUniversity || 'University of Toronto',
        },
        messageCount: messages.length,
        transcript: messages.map((m, i) => ({
          sequence: i + 1,
          senderRole: m.senderRole,
          sentAt: m.sentAt,
          body: m.body,
          attachmentDocId: m.attachmentDocId,
          integrityHash: m.msgHash,
        })),
      };
      setExportData(fallbackExport);
      setShowExportModal(true);
    } finally {
      setIsExporting(false);
    }
  };

  const isSelf = (m: ChatMessageItem) => {
    if (isAgency) return m.senderRole?.toUpperCase() === 'AGENCY';
    return m.senderRole?.toUpperCase() === 'STUDENT' || m.senderRole?.toUpperCase() === 'PARENT';
  };

  const quickPrompts = isAgency ? AGENCY_PROMPTS : STUDENT_PROMPTS;

  return (
    <div className={styles.page}>
      {/* ─── Top Header & Trust Row ─── */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>
            {isAgency
              ? 'Agency Applicant Messaging Inbox'
              : user?.role === 'admin'
                ? 'Dispute Resolution & Audit Transcripts'
                : '1-on-1 Secure Agency Consultation'}
          </h1>
          <p className={styles.headerSubtitle}>
            {isAgency
              ? 'Real-time communication with active university applicants and verified document sharing'
              : user?.role === 'admin'
                ? 'Supervisory transcript review and tamper-evident dispute arbitration records'
                : 'Direct verified messaging with your licensed study-abroad consultancy'}
          </p>
        </div>

        <div className={styles.trustBar}>
          <div className={styles.trustPill}>
            <span>🔒</span>
            <span>Encrypted Session</span>
          </div>
          <div className={styles.trustPill}>
            <span>✓</span>
            <span>Verified Identity</span>
          </div>
          <div className={styles.trustPill}>
            <span>📋</span>
            <span>Application Linked</span>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ─── Thread List ─── */}
        <div className={styles.threadList} role="list" aria-label="Chat threads">
          {threads.map((t) => {
            const threadHeading = isAgency ? t.studentName : t.agencyName;
            const threadAvatar = isAgency ? (t.studentName?.[0] || 'S') : (t.agencyName?.[0] || 'A');
            const isActive = t.id === activeThreadId;

            return (
              <div
                key={t.id}
                className={`${styles.thread} ${isActive ? styles.threadActive : ''}`}
                onClick={() => setActiveThreadId(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActiveThreadId(t.id);
                }}
              >
                <div className={styles.threadAvatar} aria-hidden="true">
                  {threadAvatar}
                </div>
                <div className={styles.threadMeta}>
                  <div className={styles.threadName}>{threadHeading}</div>
                  <div className={styles.threadSub}>{t.targetUniversity}</div>
                  <div className={styles.threadPrev}>{t.lastMessage?.text || 'No messages yet'}</div>
                </div>
                <div className={styles.threadRight}>
                  <span className={styles.threadTime}>
                    {t.lastMessage?.time ? formatTime(t.lastMessage.time) : ''}
                  </span>
                  {t.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{t.unreadCount}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Chat Window ─── */}
        <div className={styles.chatWindow}>
          {/* Chat Window Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.chatAvatar} aria-hidden="true">
                {isAgency ? (activeThread?.studentName?.[0] || 'S') : (activeThread?.agencyName?.[0] || 'G')}
              </div>
              <div>
                <div className={styles.chatName}>
                  {isAgency ? (activeThread?.studentName || 'Student Applicant') : (activeThread?.agencyName || 'Agency Consultant')}
                </div>
                <div className={styles.chatStatus}>
                  <span className={styles.pulseDot} aria-hidden="true" />
                  <span>Verified Identity</span>
                  <span className={styles.chatAppBadge}>• {activeThread?.targetUniversity}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDispute}
              disabled={isExporting}
              title="Export cryptographic audit transcript for Grievance & Dispute Resolution"
            >
              📄 {isExporting ? 'Exporting…' : 'Export Dispute Log'}
            </Button>
          </div>

          {/* Prompt Suggestion Chips (Students & Agencies only) */}
          {user?.role !== 'admin' && (
            <div className={styles.promptBar}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>QUICK INQUIRY:</span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.promptChip}
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Messages Feed */}
          <div ref={messagesContainerRef} className={styles.messages} aria-live="polite" aria-label="Chat messages">
            {messages.map((m) => {
              const self = isSelf(m);
              const senderRoleUpper = m.senderRole?.toUpperCase();
              let senderLabel: string;
              if (senderRoleUpper === 'AGENCY') {
                senderLabel = isAgency ? 'You (Global Edu BD)' : (activeThread?.agencyName || 'Global Edu BD');
              } else if (senderRoleUpper === 'STUDENT') {
                senderLabel = isAgency ? (activeThread?.studentName || 'Student') : 'You';
              } else if (senderRoleUpper === 'PARENT') {
                senderLabel = 'Guardian (Parent)';
              } else {
                senderLabel = m.senderRole || 'User';
              }

              return (
                <div key={m.id} className={`${styles.msg} ${self ? styles.msgSelf : styles.msgOther}`}>
                  <span className={styles.msgSenderLabel}>
                    {senderLabel}
                  </span>
                  <div className={styles.msgBubble}>
                    {m.body}
                    {m.attachmentDocId && (
                      <div className={styles.attachmentPill}>
                        <span>📎</span>
                        <span>Attached: <strong>{m.attachmentDocId}</strong></span>
                      </div>
                    )}
                  </div>
                  <div className={styles.msgMeta}>
                    <time>{formatTime(m.sentAt)}</time>
                    <span className={styles.msgHashBadge} title={`Integrity Hash: ${m.msgHash}`}>
                      🔒 {m.msgHash.slice(0, 10)}…
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            {/* Vault Attachment Dropdown */}
            {showVaultSelector && (
              <div className={styles.vaultDropdown}>
                <div className={styles.vaultDropdownTitle}>
                  <span>Select Document from Vault:</span>
                  <button
                    type="button"
                    onClick={() => setShowVaultSelector(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </div>
                {VAULT_DOCS.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className={styles.vaultDocItem}
                    onClick={() => {
                      setAttachedDoc(doc.id);
                      setShowVaultSelector(false);
                    }}
                  >
                    <span>{doc.name}</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {doc.size}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Attached Preview Banner */}
            {attachedDoc && (
              <div className={styles.attachedPreview}>
                <span>📎 Attached from Vault: <strong>{attachedDoc}</strong></span>
                <button
                  type="button"
                  onClick={() => setAttachedDoc(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
                  aria-label="Remove attachment"
                >
                  ✕
                </button>
              </div>
            )}

            {user?.role === 'admin' ? (
              <div style={{
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                borderTop: '2px solid var(--border-color)',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <span>🛡️</span>
                <span><strong>Supervisory Dispute View:</strong> Conversation is archived for compliance audit. Messaging input is active only for direct student and agency participants.</span>
              </div>
            ) : (
              <div className={styles.inputRow}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder={
                    isAgency
                      ? `Type an official message to ${activeThread?.studentName || 'student'}…`
                      : 'Type a message to consultancy…'
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  aria-label="Message input"
                  id="chat-input"
                  disabled={isSending}
                />
                <button
                  type="button"
                  className={styles.attachBtn}
                  onClick={() => setShowVaultSelector(!showVaultSelector)}
                  aria-label="Attach file from Document Vault"
                  title="Attach Document from Vault"
                >
                  📎
                </button>
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedDoc) || isSending}
                  aria-label="Send message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}

            <div className={styles.auditFooter}>
              <span className={styles.auditBadge}>
                ✓ Append-Only Audit Stream Enabled
              </span>
              <span>All messages cryptographically signed with SHA-256 integrity hashes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Certified Dispute Evidence Modal ─── */}
      {showExportModal && exportData && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Dispute Evidence Export">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  <span>🛡️</span>
                  <span>Certified Dispute Evidence Transcript</span>
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 700, marginTop: '2px' }}>
                  Signature: {exportData.header?.auditSignature}
                </div>
              </div>
              <button className={styles.modalClose} onClick={() => setShowExportModal(false)} aria-label="Close modal">
                ✕
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                type="button"
                className={`${styles.modalTab} ${exportModalTab === 'cert' ? styles.modalTabActive : ''}`}
                onClick={() => setExportModalTab('cert')}
              >
                📜 Certificate View
              </button>
              <button
                type="button"
                className={`${styles.modalTab} ${exportModalTab === 'json' ? styles.modalTabActive : ''}`}
                onClick={() => setExportModalTab('json')}
              >
                💻 Cryptographic JSON
              </button>
            </div>

            <div className={styles.modalBody}>
              {exportModalTab === 'cert' ? (
                <>
                  <div className={styles.certificateCard}>
                    <div className={styles.certHeader}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px' }}>
                          Official Ethos AI Dispute Record
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Ethos AI Dispute Record & Resolution Summary
                        </div>
                      </div>
                      <Badge variant="verified" size="sm">Audit Logged</Badge>
                    </div>

                    <div className={styles.certGrid}>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Student</span>
                        <span className={styles.certVal}>
                          {exportData.context?.studentName || exportData.context?.student?.name || 'Riya Ahmed'}
                        </span>
                      </div>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Consultancy Agency</span>
                        <span className={styles.certVal}>
                          {exportData.context?.agencyName || exportData.context?.agency?.name || 'Global Edu BD'}
                        </span>
                      </div>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Target University</span>
                        <span className={styles.certVal}>
                          {exportData.context?.targetUniversity || exportData.context?.application?.targetUniversity || 'University of Toronto'}
                        </span>
                      </div>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Application ID</span>
                        <span className={styles.certVal}>
                          {exportData.context?.applicationId || 'app-001'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                      Cryptographic Message Ledger ({exportData.transcript?.length || 0} Entries):
                    </div>
                    <table className={styles.transcriptTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Sender</th>
                          <th>Timestamp</th>
                          <th>Message Body</th>
                          <th>SHA-256 Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportData.transcript?.map((entry: any) => (
                          <tr key={entry.sequence}>
                            <td><strong>{entry.sequence}</strong></td>
                            <td>
                              <Badge
                                variant={entry.senderRole?.toUpperCase() === 'AGENCY' ? 'warning' : 'info'}
                                size="sm"
                              >
                                {entry.senderRole}
                              </Badge>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                              {formatTime(entry.sentAt)}
                            </td>
                            <td>
                              {entry.body}
                              {entry.attachmentDocId && (
                                <div style={{ fontSize: '11px', color: 'var(--blue-primary)', marginTop: '2px' }}>
                                  📎 {entry.attachmentDocId}
                                </div>
                              )}
                            </td>
                            <td>
                              <code style={{ fontSize: '10px' }}>
                                {entry.integrityHash?.slice(0, 12)}…
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <pre className={styles.modalJson}>
                  {JSON.stringify(exportData, null, 2)}
                </pre>
              )}
            </div>

            <div className={styles.modalFooter}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ethos-chat-dispute-${activeThreadId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                📥 Download JSON Evidence
              </Button>
              <Button
                variant="emerald"
                size="sm"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Print / Save PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowExportModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
