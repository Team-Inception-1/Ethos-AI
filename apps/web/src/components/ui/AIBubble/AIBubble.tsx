'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  queryNavigationAssistant,
  getContextualSuggestions,
  QUICK_CATEGORIES,
  NavAction,
} from '@/lib/navigationBot';
import styles from './AIBubble.module.css';

interface Message {
  id: string;
  from: 'ai' | 'user';
  text: string;
  actions?: NavAction[];
  suggestions?: { en: string; bn: string }[];
  timestamp: string;
}

export default function AIBubble() {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitialMessages = (l: 'en' | 'bn'): Message[] => [
    {
      id: 'init-1',
      from: 'ai',
      text:
        l === 'en'
          ? "Hello! I am your Ethos study-abroad guide and navigator. Whether you are exploring verified agencies, comparing processing fees, verifying an offer letter, or asking how milestone escrow protects your money, feel free to ask me anytime.\n\nWhat stage of your application are you currently preparing for?"
          : 'হ্যালো! আমি আপনার Ethos AI উচ্চশিক্ষা সহায়ক ও ন্যাভিগেটর। বিশ্বস্ত এজেন্সি বাছাই, ফি তুলনা, অফার লেটার যাচাই বা নিরাপদ এসক্রো পেমেন্ট—যেকোনো বিষয়ে নির্দ্বিধায় আমাকে জিজ্ঞাসা করতে পারেন।\n\nআপনি বর্তমানে আপনার উচ্চশিক্ষার কোন পর্যায়ের প্রস্তুতি নিচ্ছেন?',
      actions: [
        { label: 'Browse Agencies', labelBn: 'এজেন্সি ডিরেক্টরি', href: '/directory', icon: '🏢' },
        { label: 'Compare Fees', labelBn: 'ফি তুলনা করুন', href: '/compare', icon: '⚖️' },
        { label: 'AI Fraud Tools', labelBn: 'এআই ফ্রড টুলস', href: '/ai-tools', icon: '🛡️' },
        { label: 'AI Counselor', labelBn: 'এআই কাউন্সেলর', href: '/counselor', icon: '🎓' },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages('en'));

  // Auto-scroll to bottom of message list
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Keyboard shortcut: Ctrl+/ or Cmd+/ to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen(prev => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Contextual tips based on active page
  const contextualTips = getContextualSuggestions(pathname, lang);

  const handleSendQuery = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Detect language if user typed in Bengali
    const containsBengali = /[\u0980-\u09FF]/.test(query);
    const activeLang = containsBengali ? 'bn' : lang;
    if (containsBengali && lang !== 'bn') {
      setLang('bn');
    }

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      from: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Simulate natural thinking transition with fast response
    setTimeout(() => {
      const response = queryNavigationAssistant(query, pathname);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        from: 'ai',
        text: activeLang === 'bn' ? response.textBn : response.text,
        actions: response.actions,
        suggestions: response.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 320);
  };

  const handleActionClick = (href: string) => {
    router.push(href);
  };

  const handleResetChat = () => {
    setMessages(getInitialMessages(lang));
  };

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'bn' : 'en';
    setLang(newLang);
    // Update initial greeting text if chat was just initiated
    if (messages.length === 1 && messages[0].id === 'init-1') {
      setMessages(getInitialMessages(newLang));
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        id="ai-assistant-bubble"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Toggle Ethos AI Navigation Assistant"
        aria-expanded={open}
        title="Open Navigation Helper (Ctrl + /)"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <div className={styles.triggerInner}>
            <span className={styles.botIcon}>✦</span>
            <span className={styles.triggerBadge}>Helper</span>
          </div>
        )}
        {!open && <span className={styles.pulse} aria-hidden="true" />}
      </button>

      {/* Main Chat Assistant Modal */}
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Ethos AI System Navigation Helper">
          {/* Header */}
          <div className={styles.panelHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.aiAvatar} aria-hidden="true">
                <span>✦</span>
              </div>
              <div>
                <div className={styles.aiName}>
                  Ethos <span className={styles.accentText}>Navigator</span>
                </div>
                <div className={styles.aiStatus}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {lang === 'en' ? 'Site-Wide Helper • Ctrl+/' : 'সাইট ন্যাভিগেটর • Ctrl+/'}
                </div>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                className={styles.resetBtn}
                onClick={handleResetChat}
                title={lang === 'en' ? 'Reset Conversation' : 'নতুন কথোপকথন শুরু করুন'}
                aria-label="Reset chat"
              >
                ↺
              </button>
              <button
                className={styles.langSwitch}
                onClick={toggleLanguage}
                title={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}
              >
                {lang === 'en' ? 'বাং' : 'EN'}
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                title="Close"
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Context Banner */}
          <div className={styles.contextBanner}>
            <span className={styles.contextIcon}>📍</span>
            <span className={styles.contextText}>
              {lang === 'en' ? 'Current Page:' : 'বর্তমান পেজ:'}{' '}
              <code>{pathname === '/' ? 'Home' : pathname}</code>
            </span>
          </div>

          {/* Messages Area */}
          <div className={styles.messages} aria-live="polite" aria-label="Chat messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${msg.from === 'user' ? styles.msgRowUser : styles.msgRowAI}`}
              >
                <div className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgAI}`}>
                  <div className={styles.msgText}>
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} style={{ marginBottom: line.trim() ? '4px' : '0' }}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Direct Action Link Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className={styles.actionsContainer}>
                      <div className={styles.actionsHeader}>
                        {lang === 'en' ? 'Direct Actions & Pages:' : 'সরাসরি পেজ ও টুলস:'}
                      </div>
                      <div className={styles.actionsGrid}>
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            className={styles.actionBtn}
                            onClick={() => handleActionClick(act.href)}
                            title={`Navigate to ${act.href}`}
                          >
                            <span className={styles.actionIcon}>{act.icon}</span>
                            <span className={styles.actionLabel}>
                              {lang === 'en' ? act.label : act.labelBn}
                            </span>
                            <span className={styles.actionArrow}>→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Question Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className={styles.suggestionsList}>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          className={styles.suggestionPill}
                          onClick={() => handleSendQuery(lang === 'en' ? sug.en : sug.bn)}
                        >
                          💬 {lang === 'en' ? sug.en : sug.bn}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.msgTime}>{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className={`${styles.msgRow} ${styles.msgRowAI}`}>
                <div className={`${styles.msg} ${styles.msgAI} ${styles.typingMsg}`}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Category Chips */}
          <div className={styles.quickBar}>
            <div className={styles.quickHeader}>
              <span>{lang === 'en' ? 'Quick Topics' : 'দ্রুত সহায়তা'}:</span>
            </div>
            <div className={styles.quickChips}>
              {QUICK_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={styles.quickChip}
                  onClick={() => handleSendQuery(lang === 'en' ? cat.promptEn : cat.promptBn)}
                  title={lang === 'en' ? cat.promptEn : cat.promptBn}
                >
                  <span className={styles.chipIcon}>{cat.icon}</span>
                  <span>{lang === 'en' ? cat.titleEn : cat.titleBn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contextual Suggestions for Current Page */}
          {contextualTips.length > 0 && (
            <div className={styles.contextTips}>
              {contextualTips.map((tip, idx) => (
                <button
                  key={idx}
                  className={styles.contextTipBtn}
                  onClick={() => {
                    if (tip.action) {
                      handleActionClick(tip.action.href);
                    } else {
                      handleSendQuery(tip.text);
                    }
                  }}
                >
                  <span>{tip.text}</span>
                  {tip.action && <span className={styles.tipActionLabel}>[{lang === 'en' ? tip.action.label : tip.action.labelBn}]</span>}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendQuery()}
              placeholder={lang === 'en' ? 'Type query or page to find… (e.g. Escrow, Fraud)' : 'যেকোনো প্রশ্ন করুন… (যেমন: এসক্রো, অফার লেটার)'}
              className={styles.input}
              aria-label="Ask Ethos AI Navigator"
            />
            <button
              onClick={() => handleSendQuery()}
              className={styles.sendBtn}
              disabled={!input.trim() || isTyping}
              aria-label="Send query"
              title="Send (Enter)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
