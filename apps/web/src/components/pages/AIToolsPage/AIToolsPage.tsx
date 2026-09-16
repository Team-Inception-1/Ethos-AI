'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  analyzeAgreementFile,
  analyzeOfferLetterFile,
  AiServiceError,
  type AnalyzeAgreementResponse,
  type AnalyzeOfferLetterResponse,
  type OfferLetterVerdict,
} from '@/lib/aiService';
import styles from './AIToolsPage.module.css';

type BadgeVariant = 'info' | 'warning' | 'danger' | 'neutral';

const AGREEMENT_VERDICT_LABEL: Record<AnalyzeAgreementResponse['verdict'], { label: string; variant: BadgeVariant }> = {
  clear:        { label: 'Clear',        variant: 'neutral' },
  needs_review: { label: 'Needs Review', variant: 'warning' },
  high_risk:    { label: 'High Risk',    variant: 'danger'  },
};

const AGREEMENT_GAUGE: Record<AnalyzeAgreementResponse['verdict'], { score: number; color: string; label: string; offset: number }> = {
  clear:        { score: 8,  color: 'var(--emerald)',    label: 'LOW RISK',      offset: 144 },
  needs_review: { score: 52, color: 'var(--amber)',      label: 'NEEDS REVIEW',  offset: 76  },
  high_risk:    { score: 88, color: 'var(--red-danger)', label: 'HIGH RISK',     offset: 19  },
};

const OFFER_VERDICT_META: Record<OfferLetterVerdict, { label: string; variant: BadgeVariant; color: string; gaugeLabel: string }> = {
  genuine:    { label: 'Verified Genuine', variant: 'neutral', color: 'var(--emerald)',    gaugeLabel: 'LOW RISK'      },
  suspicious: { label: 'Suspicious Offer', variant: 'warning', color: 'var(--amber)',      gaugeLabel: 'NEEDS REVIEW'  },
  fake:       { label: 'High Risk / Fake', variant: 'danger',  color: 'var(--red-danger)', gaugeLabel: 'HIGH FRAUD RISK'},
};

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.txt'];

export default function AIToolsPage() {
  // Document Fraud Checker State
  const [docResult, setDocResult]               = useState<AnalyzeOfferLetterResponse | null>(null);
  const [docLoading, setDocLoading]             = useState(false);
  const [docError, setDocError]                 = useState<string | null>(null);
  const [docFileName, setDocFileName]           = useState<string | null>(null);
  const [expectedUni, setExpectedUni]           = useState('');
  const [senderEmail, setSenderEmail]           = useState('');
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Smart Agreement Analyzer State
  const [agreementResult, setAgreementResult]   = useState<AnalyzeAgreementResponse | null>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementError, setAgreementError]     = useState<string | null>(null);
  const [agreementFileName, setAgreementFileName] = useState<string | null>(null);
  const agreementFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Document Fraud Check
  const handleDocFile = async (file: File) => {
    setDocError(null);

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setDocError(`Unsupported file type "${ext}". Accepted: PDF, JPG, PNG, WEBP, BMP, TIFF, TXT.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setDocError('File too large — maximum allowed size is 20MB.');
      return;
    }

    setDocFileName(file.name);
    setDocLoading(true);
    try {
      const result = await analyzeOfferLetterFile(file, {
        senderEmail: senderEmail.trim() || undefined,
        expectedUniversity: expectedUni.trim() || undefined,
      });
      setDocResult(result);
    } catch (err) {
      setDocError(
        err instanceof AiServiceError
          ? err.message
          : 'Could not connect to the document verification service. Please try again in a moment.'
      );
      setDocFileName(null);
    } finally {
      setDocLoading(false);
    }
  };

  const onDocDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleDocFile(file);
  };

  const resetDoc = () => {
    setDocResult(null);
    setDocError(null);
    setDocFileName(null);
    if (docFileInputRef.current) docFileInputRef.current.value = '';
  };

  // Handle Agreement Analysis
  const handleAgreementFile = async (file: File) => {
    setAgreementError(null);

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setAgreementError(`Unsupported file type "${ext}". Accepted: PDF, JPG, PNG, WEBP, BMP, TIFF, TXT.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setAgreementError('File too large — maximum allowed size is 20MB.');
      return;
    }

    setAgreementFileName(file.name);
    setAgreementLoading(true);
    try {
      const result = await analyzeAgreementFile(file);
      setAgreementResult(result);
    } catch (err) {
      setAgreementError(
        err instanceof AiServiceError
          ? err.message
          : 'Could not reach the AI service. Please try again in a moment.'
      );
      setAgreementFileName(null);
    } finally {
      setAgreementLoading(false);
    }
  };

  const onAgreementDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleAgreementFile(file);
  };

  const resetAgreement = () => {
    setAgreementResult(null);
    setAgreementError(null);
    setAgreementFileName(null);
    if (agreementFileInputRef.current) agreementFileInputRef.current.value = '';
  };

  const agreementGauge = agreementResult ? AGREEMENT_GAUGE[agreementResult.verdict] : null;
  const agreementVerdictMeta = agreementResult ? AGREEMENT_VERDICT_LABEL[agreementResult.verdict] : null;

  // Calculate arc offset for offer letter gauge: full arc is 157 length (from 0 to 100)
  const docVerdictMeta = docResult ? OFFER_VERDICT_META[docResult.verdict] : null;
  const docGaugeOffset = docResult ? Math.max(0, 157 - (docResult.riskScore / 100) * 157) : 157;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>AI Verification Suite</h1>
          <p className={styles.toolSubtitle}>Verify consultancy agreements &amp; admission offer letters before making milestone payments</p>
        </div>
        <Badge variant="ai" size="md">✦ Powered by Ethos AI</Badge>
      </div>

      <div className={styles.grid}>
        {/* Document Fraud Checker — LIVE, Module 5.8 / K-21 */}
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
              <p className={styles.toolSubtitle}>Scan offer letters for forged templates &amp; spoofed domains</p>
            </div>
          </div>

          <input
            ref={docFileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDocFile(file);
            }}
          />

          {!docResult && !docLoading && (
            <>
              <div
                className={styles.uploadZone}
                role="button"
                tabIndex={0}
                aria-label="Upload offer letter for fraud analysis"
                onClick={() => docFileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && docFileInputRef.current?.click()}
                onDrop={onDocDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <span className={styles.uploadIcon} aria-hidden="true">📄</span>
                <p>Drop offer letter here or <span className={styles.link}>browse file</span></p>
                <p className={styles.uploadHint}>PDF, PNG, JPG, WEBP, TXT up to 20MB</p>
              </div>

              <div className={styles.optionalInputs}>
                <div className={styles.inputRow}>
                  <label htmlFor="expectedUni" className={styles.inputLabel}>Expected University (optional)</label>
                  <input
                    id="expectedUni"
                    type="text"
                    placeholder="e.g. University of Toronto, Oxford, UIU"
                    value={expectedUni}
                    onChange={(e) => setExpectedUni(e.target.value)}
                    className={styles.textInput}
                  />
                </div>
                <div className={styles.inputRow}>
                  <label htmlFor="senderEmail" className={styles.inputLabel}>Sender / Communication Email (optional)</label>
                  <input
                    id="senderEmail"
                    type="email"
                    placeholder="e.g. admissions@utoronto.ca"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className={styles.textInput}
                  />
                </div>
              </div>
            </>
          )}

          {docLoading && (
            <div className={styles.loadingState} aria-live="polite" aria-busy="true">
              <span className={styles.spinner} aria-hidden="true" />
              <p>Scanning <strong>{docFileName}</strong>…</p>
              <p className={styles.uploadHint}>Running OCR, verifying university sender domain, and checking structural authenticity.</p>
            </div>
          )}

          {docError && !docLoading && (
            <div className={styles.errorState} role="alert">
              <p>⚠ {docError}</p>
              <Button size="sm" variant="ghost" onClick={resetDoc}>Try Again</Button>
            </div>
          )}

          {docResult && !docLoading && (
            <div className={styles.clauses} aria-live="polite">
              <div className={styles.verdictRow}>
                {docVerdictMeta && <Badge variant={docVerdictMeta.variant} size="md">{docVerdictMeta.label}</Badge>}
                <Badge variant="ai" size="sm">✦ AI Fraud Scanner</Badge>
              </div>

              {docVerdictMeta && (
                <div className={styles.gaugeWrap} aria-label={`Risk score: ${docResult.riskScore} out of 100`}>
                  <svg viewBox="0 0 120 70" className={styles.gauge}>
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" />
                    <path
                      d="M10 60 A50 50 0 0 1 110 60"
                      fill="none"
                      stroke={docVerdictMeta.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="157"
                      strokeDashoffset={docGaugeOffset}
                      className={styles.gaugeArc}
                    />
                    <text x="60" y="58" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800">
                      {docResult.riskScore}
                    </text>
                    <text x="60" y="69" textAnchor="middle" fill={docVerdictMeta.color} fontSize="9" fontWeight="700">
                      {docVerdictMeta.gaugeLabel}
                    </text>
                  </svg>
                </div>
              )}

              <div className={styles.flags}>
                {docResult.flags.length > 0 ? (
                  docResult.flags.map((f, idx) => (
                    <div
                      key={idx}
                      className={`${styles.flagItem} ${
                        f.severity === 'danger'
                          ? styles.flagItemDanger
                          : f.severity === 'warning'
                          ? styles.flagItemWarn
                          : styles.flagItemInfo
                      }`}
                    >
                      <div className={styles.flagHeader}>
                        <Badge variant={f.severity as BadgeVariant} size="sm">{f.code.replace(/_/g, ' ')}</Badge>
                        {f.points > 0 && (
                          <span className={styles.flagPoints}>+{f.points} Risk Pts</span>
                        )}
                      </div>
                      <p className={styles.flagText}>{f.message}</p>
                    </div>
                  ))
                ) : (
                  <div className={`${styles.flagItem} ${styles.flagItemInfo}`}>
                    <Badge variant="neutral" size="sm">Clean Document</Badge>
                    <p className={styles.flagText}>No suspicious clauses, domain mismatches, or predatory payment terms found.</p>
                  </div>
                )}
              </div>

              <Button size="sm" variant="ghost" onClick={resetDoc}>← Scan Another Offer Letter</Button>
            </div>
          )}
        </GlassCard>

        {/* Smart Agreement Analyzer — Module 5.9 / Issue #16 */}
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
              <p className={styles.toolSubtitle}>Extract hidden fees &amp; ambiguous refund policies</p>
            </div>
          </div>

          <input
            ref={agreementFileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAgreementFile(file);
            }}
          />

          {!agreementResult && !agreementLoading && (
            <div
              className={styles.uploadZone}
              role="button"
              tabIndex={0}
              aria-label="Upload agreement for analysis"
              onClick={() => agreementFileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && agreementFileInputRef.current?.click()}
              onDrop={onAgreementDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <span className={styles.uploadIcon} aria-hidden="true">📤</span>
              <p>Drop agreement PDF here or <span className={styles.link}>browse file</span></p>
              <p className={styles.uploadHint}>PDF, JPG, PNG, TXT up to 20MB</p>
            </div>
          )}

          {agreementLoading && (
            <div className={styles.loadingState} aria-live="polite" aria-busy="true">
              <span className={styles.spinner} aria-hidden="true" />
              <p>Analyzing <strong>{agreementFileName}</strong>…</p>
              <p className={styles.uploadHint}>Extracting clauses, checking for hidden fees &amp; ambiguous refund terms.</p>
            </div>
          )}

          {agreementError && !agreementLoading && (
            <div className={styles.errorState} role="alert">
              <p>⚠ {agreementError}</p>
              <Button size="sm" variant="ghost" onClick={resetAgreement}>Try Again</Button>
            </div>
          )}

          {agreementResult && !agreementLoading && (
            <div className={styles.clauses} aria-live="polite">
              <div className={styles.verdictRow}>
                {agreementVerdictMeta && <Badge variant={agreementVerdictMeta.variant} size="md">{agreementVerdictMeta.label}</Badge>}
                <Badge variant="ai" size="sm">
                  {agreementResult.model_used === 'gemini' ? '✦ AI Agreement Analyzer' : '✦ Rule Analysis Engine'}
                </Badge>
                {agreementResult.truncated && <Badge variant="neutral" size="sm">Truncated Input</Badge>}
              </div>

              {agreementGauge && (
                <div className={styles.gaugeWrap} aria-label={`Risk verdict: ${agreementVerdictMeta?.label}`}>
                  <svg viewBox="0 0 120 70" className={styles.gauge}>
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"/>
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={agreementGauge.color} strokeWidth="10" strokeLinecap="round" strokeDasharray="157" strokeDashoffset={agreementGauge.offset} className={styles.gaugeArc}/>
                    <text x="60" y="58" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800">{agreementGauge.score}</text>
                    <text x="60" y="69" textAnchor="middle" fill={agreementGauge.color} fontSize="9" fontWeight="700">{agreementGauge.label}</text>
                  </svg>
                </div>
              )}

              {agreementResult.flags.length > 0 ? (
                agreementResult.flags.map((f, i) => (
                  <div key={i} className={styles.clause}>
                    <Badge variant={f.severity as BadgeVariant} size="sm">{f.tag}</Badge>
                    <p className={styles.clauseText}>{f.message_en}</p>
                    {f.related_quote && <p className={styles.clauseQuote}>&ldquo;{f.related_quote}&rdquo;</p>}
                  </div>
                ))
              ) : (
                <div className={styles.clause}>
                  <Badge variant="neutral" size="sm">No Flags</Badge>
                  <p className={styles.clauseText}>No hidden fees or ambiguous refund language detected.</p>
                </div>
              )}

              <details className={styles.rawClauses}>
                <summary>View {agreementResult.clauses.length} extracted clause(s)</summary>
                {agreementResult.clauses.map((c, i) => (
                  <div key={i} className={styles.clause}>
                    <Badge variant="neutral" size="sm">{c.clause_type}</Badge>
                    <p className={styles.clauseText}>{c.summary_en}</p>
                  </div>
                ))}
              </details>

              <Button size="sm" variant="ghost" onClick={resetAgreement}>← Upload Another Agreement</Button>
            </div>
          )}
        </GlassCard>
      </div>

      {/* AI Counselor Banner — Module 5.18 */}
      <GlassCard padding="lg" className={styles.counselorBanner}>
        <div className={styles.counselorContent}>
          <div>
            <h2 className={styles.counselorTitle}>✦ Ethos AI Counselor</h2>
            <p className={styles.counselorDesc}>Get personalized university recommendations, admission chance heuristics, and customized application roadmaps tailored for Bangladeshi applicants.</p>
          </div>
          <Link href="/counselor">
            <Button variant="primary" size="lg">
              Launch AI Counselor →
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
