'use client';
import React, { useState } from 'react';
import styles from './AIBubble.module.css';

export default function AIBubble() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      from: 'ai',
      text: lang === 'en'
        ? 'Hello! I\'m your Ethos AI assistant. How can I help you today?'
        : 'হ্যালো! আমি আপনার Ethos AI সহকারী। আজ আমি কীভাবে সাহায্য করতে পারি?',
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(m => [
      ...m,
      { from: 'user', text: input },
      { from: 'ai', text: lang === 'en'
          ? 'This feature will be implemented by the AI team. Stay tuned!'
          : 'এই ফিচারটি AI টিম দ্বারা বাস্তবায়িত হবে। আপডেটের জন্য অপেক্ষা করুন!' },
    ]);
    setInput('');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        id="ai-assistant-bubble"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Assistant"
        aria-expanded={open}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5-1.34L2 22l1.34-5A9.96 9.96 0 0 1 2 12 10 10 0 0 1 12 2z"/>
            <circle cx="8.5" cy="12.5" r="1.2" fill="currentColor"/>
            <circle cx="12" cy="12.5" r="1.2" fill="currentColor"/>
            <circle cx="15.5" cy="12.5" r="1.2" fill="currentColor"/>
          </svg>
        )}
        {!open && <span className={styles.pulse} aria-hidden="true" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Ethos AI Assistant">
          {/* Header */}
          <div className={styles.panelHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.aiAvatar} aria-hidden="true">✦</div>
              <div>
                <div className={styles.aiName}>Ethos AI</div>
                <div className={styles.aiStatus}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {lang === 'en' ? 'Online' : 'অনলাইন'}
                </div>
              </div>
            </div>
            <button
              className={styles.langSwitch}
              onClick={() => setLang(l => l === 'en' ? 'bn' : 'en')}
              title="Switch language"
            >
              {lang === 'en' ? 'বাং' : 'EN'}
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages} aria-live="polite" aria-label="Chat messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgAI}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'en' ? 'Ask me anything…' : 'যেকোনো প্রশ্ন করুন…'}
              className={styles.input}
              aria-label="Chat input"
            />
            <button
              onClick={handleSend}
              className={styles.sendBtn}
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
