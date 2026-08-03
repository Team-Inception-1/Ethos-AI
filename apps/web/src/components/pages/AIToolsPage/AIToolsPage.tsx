'use client';
import React, { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './AIToolsPage.module.css';

export default function AIToolsPage() {
  const [docUploaded, setDocUploaded]       = useState(false);
  const [agreeUploaded, setAgreeUploaded]   = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>AI Tools</h1>
        <Badge variant="ai" size="md">✦ Powered by Ethos AI</Badge>
      </div>

      <div className={styles.grid}>
        {/* Fraud Checker */}
        <GlassCard padding="lg" className={styles.toolCard} glow>
          <div className={styles.toolHeader}>
            <div className={styles.toolIconWrap} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <h2 className={styles.toolTitle}>Document Fraud Checker</h2>
              <p className={styles.toolSubtitle}>Upload offer letters or agreements for AI analysis</p>
            </div>
          </div>

          {!docUploaded ? (
            <div
              className={styles.uploadZone}
              role="button"
              tabIndex={0}
              aria-label="Upload document for fraud check"
              onClick={() => setDocUploaded(true)}
              onKeyDown={e => e.key === 'Enter' && setDocUploaded(true)}
            >
              <span className={styles.uploadIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </span>
              <p>Drop offer letter PDF here or <span className={styles.link}>click to upload</span></p>
              <p className={styles.uploadHint}>PDF, JPG, PNG up to 20MB</p>
            </div>
          ) : (
            <div className={styles.results} aria-live="polite">
              {/* Risk Gauge */}
              <div className={styles.gaugeWrap} aria-label="Risk score: 23 out of 100 — Low Risk">
                <svg viewBox="0 0 120 70" className={styles.gauge}>
                  <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"/>
                  <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--emerald)" strokeWidth="10" strokeLinecap="round" strokeDasharray="157" strokeDashoffset="121" className={styles.gaugeArc}/>
                  <text x="60" y="58" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800">23</text>
                  <text x="60" y="70" textAnchor="middle" fill="var(--emerald)" fontSize="9" fontWeight="600">LOW RISK</text>
                </svg>
              </div>
              <ul className={styles.flags} aria-label="AI analysis results">
                <li className={styles.flagOk}>✓ University domain matches official records</li>
                <li className={styles.flagOk}>✓ Offer letter format matches known templates</li>
                <li className={styles.flagOk}>✓ Program name verified against university database</li>
                <li className={styles.flagWarn}>⚠ Date format inconsistency detected (minor)</li>
              </ul>
              <Button size="sm" variant="ghost" onClick={() => setDocUploaded(false)}>← Upload Another</Button>
            </div>
          )}
          <p className={styles.devHint}>🔧 <strong>@ai</strong>: Wire to <code>POST /fraud/analyze-document</code></p>
        </GlassCard>

        {/* Agreement Analyzer */}
        <GlassCard padding="lg" className={styles.toolCard} glow>
          <div className={styles.toolHeader}>
            <div className={styles.toolIconWrap} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <h2 className={styles.toolTitle}>Smart Agreement Analyzer</h2>
              <p className={styles.toolSubtitle}>AI extracts and flags clauses in your agreement</p>
            </div>
          </div>

          {!agreeUploaded ? (
            <div
              className={styles.uploadZone}
              role="button"
              tabIndex={0}
              aria-label="Upload agreement for analysis"
              onClick={() => setAgreeUploaded(true)}
              onKeyDown={e => e.key === 'Enter' && setAgreeUploaded(true)}
            >
              <span className={styles.uploadIcon} aria-hidden="true">📤</span>
              <p>Drop agreement PDF here or <span className={styles.link}>click to upload</span></p>
            </div>
          ) : (
            <div className={styles.clauses} aria-live="polite">
              {[
                { tag:'Fee Clause',    color:'info',    text:'Total service fee: ৳65,000 (non-refundable after 7 days)' },
                { tag:'Refund Clause', color:'warning', text:'50% refund if visa rejected. Ambiguous — "processing fees" undefined.' },
                { tag:'Hidden Fee',    color:'danger',  text:'৳5,000 "documentation charge" not in declared pricing' },
                { tag:'Liability',     color:'neutral', text:'Agency not liable for rejection due to incomplete student documents.' },
              ].map(c => (
                <div key={c.tag} className={styles.clause}>
                  <Badge variant={c.color as 'info'|'warning'|'danger'|'neutral'} size="sm">{c.tag}</Badge>
                  <p className={styles.clauseText}>{c.text}</p>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setAgreeUploaded(false)}>← Upload Another</Button>
            </div>
          )}
          <p className={styles.devHint}>🔧 <strong>@ai</strong>: Wire to <code>POST /agreement/analyze</code></p>
        </GlassCard>
      </div>

      {/* AI Counselor Banner */}
      <GlassCard padding="lg" className={styles.counselorBanner}>
        <div className={styles.counselorContent}>
          <div>
            <h2 className={styles.counselorTitle}>✦ AI Counselor</h2>
            <p className={styles.counselorDesc}>Get personalized university recommendations, admission chances, and your custom application roadmap.</p>
            <p className={styles.devHint}>🔧 <strong>@ai</strong>: Wire to <code>POST /counselor/recommend</code></p>
          </div>
          <Button variant="outline" size="lg">Get Recommendations →</Button>
        </div>
      </GlassCard>
    </div>
  );
}
