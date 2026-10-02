'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import {
  fetchChatThreads,
  fetchThreadMessages,
  sendChatMessage,
  exportDisputeTranscript,
  createChatThread,
  type ChatThreadSummary,
  type ChatMessageItem,
  type ChatTranscript,
} from '@/lib/chatClient';
import styles from './ChatPage.module.css';

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

interface VaultDocSummary {
  id: string;
  name: string;
  size: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const isAgency = user?.role?.toLowerCase() === 'agency';
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ChatMessageItem[]>>({});
  const [nextCursorByThread, setNextCursorByThread] = useState<Record<string, string | null>>({});
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [exportData, setExportData] = useState<ChatTranscript | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalTab, setExportModalTab] = useState<'cert' | 'json'>('cert');
  const [isExporting, setIsExporting] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<VaultDocSummary | null>(null);
  const [showVaultSelector, setShowVaultSelector] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<VaultDocSummary[]>([]);
  const [loadingVaultDocs, setLoadingVaultDocs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load threads on mount / user change with query navigation (AUD-017)
  useEffect(() => {
    let isMounted = true;
    fetchChatThreads()
      .then(async (res) => {
        if (!isMounted) return;
        setThreads(res);

        if (typeof window !== 'undefined') {
          const search = new URLSearchParams(window.location.search);
          const reqThread = search.get('thread') || search.get('threadId') || '';
          const reqApp = search.get('application') || search.get('applicationId') || '';
          const reqAgency = search.get('agency') || search.get('agencyId') || '';

          let matched = res.find((t) => t.id === reqThread);
          if (!matched && reqApp) {
            matched = res.find((t) => t.applicationId === reqApp);
            if (!matched) {
              try {
                const created = await createChatThread(reqApp);
                if (!isMounted) return;
                const refreshed = await fetchChatThreads();
                if (!isMounted) return;
                setThreads(refreshed);
                matched = refreshed.find((t) => t.id === created.id) || created;
              } catch (err) {
                console.warn('Could not auto-provision chat thread for application:', err);
              }
            }
          }
          if (!matched && reqAgency) {
            matched = res.find((t) => t.agencyId === reqAgency);
          }
          const nextThread = matched || res[0];
          if (nextThread?.id) {
            setActiveThreadId(nextThread.id);
          }
        }
      })
      .catch((e) => {
        console.warn('Could not load live threads:', e);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Load messages whenever active thread changes
  useEffect(() => {
    let isMounted = true;
    if (!activeThreadId) return;
    const threadId = activeThreadId;

    fetchThreadMessages(threadId)
      .then((res) => {
        if (!isMounted) return;
        setMessagesByThread((previous) => ({
          ...previous,
          [threadId]: res.messages.map((m) => ({ ...m, status: 'sent' as const })),
        }));
        setNextCursorByThread((previous) => ({
          ...previous,
          [threadId]: res.nextCursor || null,
        }));
      })
      .catch((e) => {
        console.warn('Could not load live messages:', e);
      });

    return () => {
      isMounted = false;
    };
  }, [activeThreadId]);

  // Bounded Polling for real-time delivery and unread count synchronization (AUD-018)
  useEffect(() => {
    if (!activeThreadId) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;

      fetchThreadMessages(activeThreadId)
        .then((res) => {
          setMessagesByThread((prev) => {
            const currentList = prev[activeThreadId] || [];
            const serverMsgs = res.messages.map((m) => ({ ...m, status: 'sent' as const }));

            const localPending = currentList.filter(
              (m) => m.status === 'sending' || m.status === 'failed'
            );

            const serverIds = new Set(serverMsgs.map((m) => m.id));
            const merged = [
              ...serverMsgs,
              ...localPending.filter((m) => !serverIds.has(m.id)),
            ];
            return { ...prev, [activeThreadId]: merged };
          });
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [activeThreadId]);

  // Periodic thread unread count refresh
  useEffect(() => {
    const threadInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchChatThreads()
        .then((refreshed) => setThreads(refreshed))
        .catch(() => {});
    }, 12000);

    return () => clearInterval(threadInterval);
  }, []);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0],
    [threads, activeThreadId]
  );

  // Lazy-load real documents for this application on attachment button click (AUD-014)
  const handleToggleVaultSelector = () => {
    const nextOpen = !showVaultSelector;
    setShowVaultSelector(nextOpen);
    if (nextOpen && activeThread?.applicationId) {
      setLoadingVaultDocs(true);
      fetch(`/api/documents?applicationId=${encodeURIComponent(activeThread.applicationId)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Fetch failed'))))
        .then((body: { documents: { id: string; name: string; size: string }[] }) => {
          setVaultDocs(body.documents || []);
        })
        .catch(() => setVaultDocs([]))
        .finally(() => setLoadingVaultDocs(false));
    }
  };

  const messages = useMemo(() => {
    return messagesByThread[activeThreadId] || [];
  }, [messagesByThread, activeThreadId]);

  const nextCursor = nextCursorByThread[activeThreadId] ?? null;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Load earlier messages with cursor pagination (AUD-018)
  const handleLoadEarlier = async () => {
    if (!activeThreadId || !nextCursor || isLoadingEarlier) return;
    setIsLoadingEarlier(true);
    try {
      const res = await fetchThreadMessages(activeThreadId, nextCursor);
      setMessagesByThread((prev) => {
        const existing = prev[activeThreadId] || [];
        const older = res.messages.map((m) => ({ ...m, status: 'sent' as const }));
        const existingIds = new Set(existing.map((m) => m.id));
        const filteredOlder = older.filter((m) => !existingIds.has(m.id));
        return {
          ...prev,
          [activeThreadId]: [...filteredOlder, ...existing],
        };
      });
      setNextCursorByThread((prev) => ({
        ...prev,
        [activeThreadId]: res.nextCursor || null,
      }));
    } catch (err) {
      console.warn('Could not load earlier messages:', err);
    } finally {
      setIsLoadingEarlier(false);
    }
  };

  const handleSend = async () => {
    if (!activeThreadId || (!input.trim() && !attachedDoc) || isSending) return;
    const textToSend = input.trim();
    const threadId = activeThreadId;
    const docToAttach = attachedDoc;
    setInput('');
    setAttachedDoc(null);
    setShowVaultSelector(false);
    setIsSending(true);

    const senderRole = (isAgency ? 'AGENCY' : (user?.role?.toUpperCase() || 'STUDENT')) as
      | 'STUDENT'
      | 'PARENT'
      | 'AGENCY'
      | 'ADMIN';
    const senderId = user?.id || (isAgency ? 'usr-agency-01' : 'usr-student-01');

    // Optimistic message with 'sending' status (AUD-015)
    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessageItem = {
      id: tempId,
      threadId,
      senderId,
      senderRole,
      body: textToSend || (docToAttach ? `Attached document: ${docToAttach.name}` : ''),
      attachmentDocId: docToAttach?.id || null,
      msgHash: 'pending',
      isRead: true,
      sentAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessagesByThread((previous) => ({
      ...previous,
      [threadId]: [...(previous[threadId] || []), tempMsg],
    }));

    try {
      const realMsg = await sendChatMessage({
        threadId,
        senderId,
        senderRole,
        body: tempMsg.body,
        attachmentDocId: docToAttach?.id || undefined,
      });
      setMessagesByThread((previous) => ({
        ...previous,
        [threadId]: (previous[threadId] || []).map((m) =>
          m.id === tempId ? { ...realMsg, status: 'sent' } : m
        ),
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Message delivery failed.';
      setMessagesByThread((previous) => ({
        ...previous,
        [threadId]: (previous[threadId] || []).map((m) =>
          m.id === tempId ? { ...m, status: 'failed', error: errorMsg } : m
        ),
      }));
    } finally {
      setIsSending(false);
    }
  };

  const retrySend = async (failedMsg: ChatMessageItem) => {
    const threadId = failedMsg.threadId;
    setMessagesByThread((prev) => ({
      ...prev,
      [threadId]: (prev[threadId] || []).map((m) =>
        m.id === failedMsg.id ? { ...m, status: 'sending', error: undefined } : m
      ),
    }));

    try {
      const realMsg = await sendChatMessage({
        threadId,
        senderId: failedMsg.senderId,
        senderRole: failedMsg.senderRole,
        body: failedMsg.body,
        attachmentDocId: failedMsg.attachmentDocId || undefined,
      });
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map((m) =>
          m.id === failedMsg.id ? { ...realMsg, status: 'sent' } : m
        ),
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Retry failed.';
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map((m) =>
          m.id === failedMsg.id ? { ...m, status: 'failed', error: errorMsg } : m
        ),
      }));
    }
  };

  const dismissMessage = (msgId: string) => {
    setMessagesByThread((prev) => ({
      ...prev,
      [activeThreadId]: (prev[activeThreadId] || []).filter((m) => m.id !== msgId),
    }));
  };

  const handleExportDispute = async () => {
    if (!activeThreadId) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const data = await exportDisputeTranscript(activeThreadId);
      setExportData(data);
      setShowExportModal(true);
    } catch (err) {
      setExportData(null);
      setExportError(err instanceof Error ? err.message : 'Could not export transcript from server.');
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
      {/* ─── Top Header & Trust Row (AUD-025 truthful claims) ─── */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>1-on-1 Secure Agency Chat</h1>
          <p className={styles.headerSubtitle}>
            Transport encrypted (TLS) with SHA-256 server audit log (Module 5.12)
          </p>
        </div>

        <div className={styles.trustBar}>
          <div className={styles.trustPill}>
            <span>🛡️</span>
            <span>SHA-256 Digest</span>
          </div>
          <div className={styles.trustPill}>
            <span>⚖️</span>
            <span>Audit Logged</span>
          </div>
          <div className={styles.trustPill}>
            <span>💼</span>
            <span>{activeThread ? `Application #${activeThread.applicationId.slice(0, 8)}` : 'Application chat'}</span>
          </div>
        </div>
      </div>

      {exportError && (
        <div role="alert" style={{ padding: '10px 14px', background: '#fee2e2', border: '1.5px solid #dc2626', borderRadius: '8px', color: '#991b1b', fontSize: '13px', fontWeight: 600 }}>
          {exportError}
        </div>
      )}

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
          {threads.length === 0 && (
            <p style={{ padding: '18px 8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No application conversations available yet.
            </p>
          )}
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
                  {activeThread?.targetUniversity && (
                    <span className={styles.chatAppBadge}>• {activeThread.targetUniversity}</span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDispute}
              disabled={isExporting || !activeThreadId}
              title="Export cryptographic audit transcript for Grievance & Dispute Resolution"
            >
              📄 {isExporting ? 'Exporting…' : 'Export Dispute Log'}
            </Button>
          </div>

          {/* Prompt Suggestion Chips */}
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

          {/* Messages Feed */}
          <div className={styles.messages} aria-live="polite" aria-label="Chat messages">
            {!activeThread && (
              <p style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center' }}>
                Select an application conversation from the left to start chatting.
              </p>
            )}

            {/* Cursor pagination older messages button (AUD-018) */}
            {nextCursor && (
              <div className={styles.loadOlderContainer}>
                <button
                  type="button"
                  className={styles.loadOlderBtn}
                  onClick={handleLoadEarlier}
                  disabled={isLoadingEarlier}
                >
                  {isLoadingEarlier ? 'Loading earlier messages…' : '↑ Load earlier messages'}
                </button>
              </div>
            )}

            {activeThread && messages.length === 0 && (
              <p style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center' }}>
                No messages yet. Send the first message below.
              </p>
            )}

            {messages.map((m) => {
              const self = isSelf(m);
              const senderRoleUpper = m.senderRole?.toUpperCase();
              let senderLabel: string;
              if (senderRoleUpper === 'AGENCY') {
                senderLabel = isAgency ? 'You' : (activeThread?.agencyName || 'Agency Consultant');
              } else if (senderRoleUpper === 'STUDENT') {
                senderLabel = isAgency ? (activeThread?.studentName || 'Student Applicant') : 'You';
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
                        <span>Attached document: <strong>{m.attachmentDocId}</strong></span>
                      </div>
                    )}
                  </div>
                  <div className={styles.msgMeta}>
                    <time>{formatTime(m.sentAt)}</time>
                    {m.status === 'sending' && (
                      <span className={styles.msgSendingBadge}>Sending…</span>
                    )}
                    {m.status === 'failed' && (
                      <div className={styles.msgFailedBadge}>
                        <span>⚠️ Failed to send</span>
                        <button type="button" className={styles.retryBtn} onClick={() => retrySend(m)}>Retry</button>
                        <button type="button" className={styles.retryBtn} onClick={() => dismissMessage(m.id)}>✕</button>
                      </div>
                    )}
                    {m.status === 'sent' && m.msgHash && m.msgHash !== 'pending' && (
                      <span className={styles.msgHashBadge} title={`Integrity Hash: ${m.msgHash}`}>
                        🔒 {m.msgHash.slice(0, 10)}…
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            {/* Vault Attachment Dropdown with real application documents (AUD-014) */}
            {showVaultSelector && (
              <div className={styles.vaultDropdown}>
                <div className={styles.vaultDropdownTitle}>
                  <span>Select Application Document:</span>
                  <button
                    type="button"
                    onClick={() => setShowVaultSelector(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </div>
                {loadingVaultDocs && (
                  <p style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Loading documents…</p>
                )}
                {!loadingVaultDocs && vaultDocs.length === 0 && (
                  <p style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    No documents attached to this application yet.
                  </p>
                )}
                {!loadingVaultDocs && vaultDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className={styles.vaultDocItem}
                    onClick={() => {
                      setAttachedDoc(doc);
                      setShowVaultSelector(false);
                    }}
                  >
                    <span>📄 {doc.name}</span>
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
                <span>📎 Attached: <strong>{attachedDoc.name}</strong> ({attachedDoc.size})</span>
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
                onClick={handleToggleVaultSelector}
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

            <div className={styles.auditFooter}>
              <span className={styles.auditBadge}>
                ✓ Audit Logging Enabled
              </span>
              <span>Messages stored with SHA-256 cryptographic integrity hashes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Server-Generated Dispute Evidence Modal (AUD-016 & AUD-025) ─── */}
      {showExportModal && exportData && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Dispute Evidence Export">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  <span>🛡️</span>
                  <span>Dispute Evidence Transcript</span>
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 700, marginTop: '2px' }}>
                  Server Digest: {exportData.digest}
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
                📜 Transcript View
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
                          Server-Generated Ethos AI Audit Transcript
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Official ledger record exported on {new Date(exportData.exportedAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="verified" size="sm">SHA-256 Digest</Badge>
                    </div>

                    <div className={styles.certGrid}>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Student</span>
                        <span className={styles.certVal}>
                          {activeThread?.studentName || 'Unavailable'}
                        </span>
                      </div>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Consultancy Agency</span>
                        <span className={styles.certVal}>
                          {activeThread?.agencyName || 'Unavailable'}
                        </span>
                      </div>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Target University</span>
                        <span className={styles.certVal}>
                          {activeThread?.targetUniversity || 'Unavailable'}
                        </span>
                      </div>
                      <div className={styles.certItem}>
                        <span className={styles.certLabel}>Application ID</span>
                        <span className={styles.certVal}>
                          {activeThread?.applicationId || 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                      Message Ledger ({exportData.transcript?.length || 0} Entries):
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
                        {exportData.transcript?.map((entry, index) => (
                          <tr key={entry.id}>
                            <td><strong>{index + 1}</strong></td>
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
                                {entry.msgHash?.slice(0, 12)}…
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
