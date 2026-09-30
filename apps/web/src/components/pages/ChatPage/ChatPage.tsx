'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchChatThreads, fetchThreadMessages, sendChatMessage, exportDisputeTranscript,
  type ChatThreadSummary, type ChatMessageItem, type ChatTranscript } from '@/lib/chatClient';
import { ChatWorkspaceSkeleton } from '@/components/ui/Skeleton';
import styles from './ChatPage.module.css';

type SignedInUser = NonNullable<ReturnType<typeof useAuth>['user']>;
export default function ChatPage() {
  const { user } = useAuth();
  if (!user) return <p>Please sign in to view your conversations.</p>;
  return <ConversationWorkspace key={user.id} user={user} />;
}

function ConversationWorkspace({ user }: { user: SignedInUser }) {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    fetchChatThreads().then(result => {
      if (!active) return;
      const params = new URLSearchParams(window.location.search);
      const requested = params.get('threadId') || params.get('thread');
      setSelected(result.some(t => t.id === requested) ? requested! : result[0]?.id || '');
      setError('');
    }).catch(() => { if (active) setError('Conversations could not be loaded. Please retry.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const thread = threads.find(t => t.id === selected);
  return <div className={styles.page}>
    <div className={styles.headerRow}><div className={styles.titleArea}>
      <h1>Application conversations</h1><p>Messages saved to your application record.</p>
    </div></div>
    {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
    {loading ? (
      <ChatWorkspaceSkeleton />
    ) : (
      <>
        {!error && threads.length === 0 && <p>No conversations yet. Conversations become available when an application is linked to an agency.</p>}
        <div className={styles.layout}>
          <nav className={styles.threadList} aria-label="Conversations">{threads.map(item =>
            <button key={item.id} className={styles.thread} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id}>
              <strong>{user.role === 'agency' ? item.studentName : item.agencyName}</strong>
              <span>{item.targetUniversity}</span><p>{item.lastMessage?.text || 'No messages yet'}</p>
            </button>)}</nav>
          {thread && <ThreadConversation key={thread.id} thread={thread} user={user} />}
        </div>
      </>
    )}
  </div>;
}

function ThreadConversation({ thread, user }: { thread: ChatThreadSummary; user: SignedInUser }) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [transcript, setTranscript] = useState<ChatTranscript | null>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    fetchThreadMessages(thread.id).then(result => { if (active) { setMessages(result.messages); setError(''); } })
      .catch(() => { if (active) setError('Messages could not be loaded. Please retry.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [thread.id, retry]);
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages]);
  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true); setError('');
    try {
      const message = await sendChatMessage({ threadId: thread.id, senderId: user.id, senderRole: user.role, body: input.trim() });
      setMessages(previous => [...previous, message]); setInput('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Message was not sent. Your draft has been kept.'); }
    finally { setSending(false); }
  };
  const exportMessages = async () => {
    setExporting(true); setError('');
    try { setTranscript(await exportDisputeTranscript(thread.id)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Transcript export failed.'); }
    finally { setExporting(false); }
  };
  return <section className={styles.chatPanel} aria-label="Selected conversation">
    <h2>{thread.agencyName} — {thread.targetUniversity}</h2>
    {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Reload</button></p>}
    <button onClick={exportMessages} disabled={exporting}>{exporting ? 'Exporting…' : 'Export saved transcript'}</button>
    <div ref={list} className={styles.messages} aria-live="polite">
      {loading && <p>Loading messages…</p>}
      {!loading && messages.length === 0 && <p>No saved messages yet.</p>}
      {messages.map(message => <article key={message.id} className={styles.message}>
        <strong>{message.senderId === user.id ? 'You' : message.senderRole}</strong>
        <p>{message.body}</p><time dateTime={message.sentAt}>{new Date(message.sentAt).toLocaleString()}</time>
        {message.attachmentDocId && <p>Document reference: {message.attachmentDocId}</p>}
      </article>)}
    </div>
    {user.role !== 'admin' && <form className={styles.inputRow} onSubmit={event => { event.preventDefault(); void send(); }}>
      <input className={styles.input} aria-label="Message" value={input} onChange={event => setInput(event.target.value)} maxLength={10000} disabled={sending} />
      <button className={styles.sendBtn} disabled={sending || !input.trim()}>{sending ? 'Sending…' : 'Send'}</button>
    </form>}
    {transcript && <section aria-label="Saved transcript">
      <h3>Saved transcript</h3><p>SHA-256 digest: {transcript.digest}</p>
      <p>This digest identifies exported content; it is not a digital signature or legal certification.</p>
      <pre className={styles.modalJson}>{JSON.stringify(transcript, null, 2)}</pre>
      <button onClick={() => setTranscript(null)}>Close</button>
    </section>}
  </section>;
}
