'use client';
import React, { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import styles from './ChatPage.module.css';

const MSGS = [
  { from:'agency', text:'Hello! We have received your application and are reviewing it.', time:'Jul 25, 10:00' },
  { from:'student',text:'Thank you! When can I expect the offer letter?', time:'Jul 25, 10:15' },
  { from:'agency', text:'We expect to send it within 5-7 business days. We will notify you immediately.', time:'Jul 25, 10:18' },
  { from:'student',text:'Great, thank you! Please also share the visa processing timeline.', time:'Jul 25, 11:00' },
];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState(MSGS);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { from:'student', text:input, time:'Now' }]);
    setInput('');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Secure Chat</h1>

      <div className={styles.layout}>
        {/* Thread List */}
        <div className={styles.threadList} role="list" aria-label="Chat threads">
          <GlassCard padding="sm" className={styles.thread} hover>
            <div className={styles.threadAvatar} aria-hidden="true">G</div>
            <div className={styles.threadMeta}>
              <div className={styles.threadName}>Global Edu BD</div>
              <div className={styles.threadPrev}>We expect to send it within 5-7...</div>
            </div>
            <div className={styles.threadTime}>11m</div>
          </GlassCard>
        </div>

        {/* Chat Window */}
        <GlassCard padding="none" className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar} aria-hidden="true">G</div>
            <div>
              <div className={styles.chatName}>Global Edu BD</div>
              <div className={styles.chatStatus}>🟢 Online</div>
            </div>
          </div>

          <div className={styles.messages} aria-live="polite" aria-label="Chat messages">
            {msgs.map((m, i) => (
              <div key={i} className={`${styles.msg} ${m.from === 'student' ? styles.msgSelf : styles.msgOther}`}>
                <div className={styles.msgBubble}>{m.text}</div>
                <time className={styles.msgTime}>{m.time}</time>
              </div>
            ))}
          </div>

          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              aria-label="Message input"
              id="chat-input"
            />
            <button className={styles.attachBtn} aria-label="Attach file" title="Attach file">📎</button>
            <button className={styles.sendBtn} onClick={send} disabled={!input.trim()} aria-label="Send message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className={styles.devHint}>🔧 <strong>@backend</strong>: Wire to WebSocket + <code>GET/POST /chat/threads/:id/messages</code></p>
        </GlassCard>
      </div>
    </div>
  );
}
