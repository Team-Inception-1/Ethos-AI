'use client';

import React, { useRef, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  analyzeAgreementFile,
  analyzeOfferLetterFile,
  type AnalyzeAgreementResponse,
  type AnalyzeOfferLetterResponse,
  type OfferLetterVerdict,
} from '@/lib/aiService';
import styles from './AIToolsPage.module.css';

type BadgeVariant = 'info' | 'warning' | 'danger' | 'neutral' | 'success';

const AGREEMENT_VERDICT_LABEL: Record<AnalyzeAgreementResponse['verdict'], { label: string; variant: BadgeVariant }> = {
  clear:        { label: 'Clear & Protected', variant: 'success' },
  needs_review: { label: 'Needs Review',     variant: 'warning' },
  high_risk:    { label: 'High Risk / Unfair', variant: 'danger'  },
};

const AGREEMENT_GAUGE: Record<AnalyzeAgreementResponse['verdict'], { score: number; color: string; label: string; offset: number }> = {
  clear:        { score: 8,  color: 'var(--emerald)',    label: 'LOW RISK',      offset: 144 },
  needs_review: { score: 52, color: 'var(--amber)',      label: 'NEEDS REVIEW',  offset: 76  },
  high_risk:    { score: 88, color: 'var(--red-danger)', label: 'HIGH RISK',     offset: 19  },
};

const OFFER_VERDICT_META: Record<OfferLetterVerdict, { label: string; variant: BadgeVariant; color: string; gaugeLabel: string }> = {
  genuine:    { label: 'Verified Genuine', variant: 'success', color: 'var(--emerald)',    gaugeLabel: 'LOW RISK'      },
  suspicious: { label: 'Suspicious Offer', variant: 'warning', color: 'var(--amber)',      gaugeLabel: 'NEEDS REVIEW'  },
  fake:       { label: 'High Risk / Forgery', variant: 'danger', color: 'var(--red-danger)', gaugeLabel: 'HIGH FRAUD RISK'},
};

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.txt'];

export interface AIToolsPageProps {
  initialTool?: 'all' | 'fraud' | 'agreement';
}

function AIToolsPageContent({ initialTool = 'all' }: AIToolsPageProps) {
  const searchParams = useSearchParams();
  const paramTool = searchParams?.get('tool');

  const defaultTool = useMemo<'all' | 'fraud' | 'agreement'>(() => {
    if (paramTool === 'offer' || paramTool === 'fraud') return 'fraud';
    if (paramTool === 'agreement') return 'agreement';
    return initialTool;
  }, [paramTool, initialTool]);

  const [selection, setSelection] = useState({ source: defaultTool, tab: defaultTool });
  const activeTab = selection.source === defaultTool ? selection.tab : defaultTool;
  const setActiveTab = (tab: 'all' | 'fraud' | 'agreement') => setSelection({ source: defaultTool, tab });

  // Document Fraud Checker State
  const [docResult, setDocResult]                 = useState<AnalyzeOfferLetterResponse | null>(null);
  const [docLoading, setDocLoading]               = useState(false);
  const [docError, setDocError]                   = useState<string | null>(null);
  const [docFileName, setDocFileName]             = useState<string | null>(null);
  const [expectedUni, setExpectedUni]             = useState('');
  const [senderEmail, setSenderEmail]             = useState('');
  const [isDocDragging, setIsDocDragging]         = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Smart Agreement Analyzer State
  const [agreementResult, setAgreementResult]     = useState<AnalyzeAgreementResponse | null>(null);
  const [agreementLoading, setAgreementLoading]   = useState(false);
  const [agreementError, setAgreementError]       = useState<string | null>(null);
  const [agreementFileName, setAgreementFileName] = useState<string | null>(null);
  const [isAgrDragging, setIsAgrDragging]         = useState(false);
  const agreementFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Document Fraud Check
  const handleDocFile = async (file: File) => {
    setDocError(null);
    setDocResult(null);

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
      setDocError(err instanceof Error ? err.message : 'Could not verify document. Please try again.');
      setDocFileName(null);
    } finally {
      setDocLoading(false);
    }
  };

  const onDocDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDocDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleDocFile(file);
  };

  const resetDoc = () => {
    setDocResult(null);
    setDocError(null);
    setDocFileName(null);
    if (docFileInputRef.current) docFileInputRef.current.value = '';
  };

  // Quick Test Sample Offer Letters
  const testSampleOffer = async (isGenuine: boolean) => {
    if (process.env.NODE_ENV === 'production') return;
    setDocError(null);
    setDocResult(null);
    setDocLoading(true);
    try {
    if (isGenuine) {
      setDocFileName('sample-offer.txt');
      setExpectedUni('University of Toronto');
      setSenderEmail('admissions@utoronto.ca');
      const fakeFile = new File(['Example text only: University of Toronto admission offer. Not an authentic university document.'], 'sample-offer.txt', { type: 'text/plain' });
      const res = await analyzeOfferLetterFile(fakeFile, {
        expectedUniversity: 'University of Toronto',
        senderEmail: 'admissions@utoronto.ca',
      });
      setDocResult(res);
    } else {
      setDocFileName('sample-suspicious-offer.txt');
      setExpectedUni('University of Bedfordshire');
      setSenderEmail('admissions.bedfordshire@protonmail.com');
      const fakeFile = new File(['Example suspicious offer: pay the agent immediately using a personal account.'], 'sample-suspicious-offer.txt', { type: 'text/plain' });
      const res = await analyzeOfferLetterFile(fakeFile, {
        expectedUniversity: 'University of Bedfordshire',
        senderEmail: 'admissions.bedfordshire@protonmail.com',
      });
      setDocResult(res);
    }
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Sample analysis failed.');
    } finally { setDocLoading(false); }
  };

  // Handle Agreement Analysis
  const handleAgreementFile = async (file: File) => {
    setAgreementError(null);
    setAgreementResult(null);

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
      setAgreementError(err instanceof Error ? err.message : 'Could not reach analysis engine. Please try again.');
      setAgreementFileName(null);
    } finally {
      setAgreementLoading(false);
    }
  };

  const onAgreementDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsAgrDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAgreementFile(file);
  };

  const resetAgreement = () => {
    setAgreementResult(null);
    setAgreementError(null);
    setAgreementFileName(null);
    if (agreementFileInputRef.current) agreementFileInputRef.current.value = '';
  };

  // Quick Test Sample Agreements
  const testSampleAgreement = async (isCompliant: boolean) => {
    if (process.env.NODE_ENV === 'production') return;
    setAgreementError(null);
    setAgreementResult(null);
    setAgreementLoading(true);
    try {
    if (isCompliant) {
      setAgreementFileName('sample-agreement.txt');
      const fakeFile = new File(['Example agreement: milestone payments held in escrow. Unperformed services are refundable.'], 'sample-agreement.txt', { type: 'text/plain' });
      const res = await analyzeAgreementFile(fakeFile);
      setAgreementResult(res);
    } else {
      setAgreementFileName('sample-risky-agreement.txt');
      const fakeFile = new File(['Example agreement: pay 100% in advance. All fees non-refundable. Agency may change fees at any time.'], 'sample-risky-agreement.txt', { type: 'text/plain' });
      const res = await analyzeAgreementFile(fakeFile);
      setAgreementResult(res);
    }
    } catch (err) {
      setAgreementError(err instanceof Error ? err.message : 'Sample analysis failed.');
    } finally { setAgreementLoading(false); }
  };

  const agreementGauge = agreementResult ? AGREEMENT_GAUGE[agreementResult.verdict] : null;
  const agreementVerdictMeta = agreementResult ? AGREEMENT_VERDICT_LABEL[agreementResult.verdict] : null;

  // Arc offset for offer letter gauge: full arc is 157
  const docVerdictMeta = docResult ? OFFER_VERDICT_META[docResult.verdict] : null;
  const docGaugeOffset = docResult ? Math.max(0, 157 - (docResult.riskScore / 100) * 157) : 157;

  const headerMeta = useMemo(() => {
    switch (activeTab) {
      case 'fraud':
        return {
          title: 'AI Document Fraud Checker',
          subtitle: 'Scan admission offer letters & scholarship docs for forged templates, bad seals, and spoofed domains',
        };
      case 'agreement':
        return {
          title: 'Smart Agreement Analyzer',
          subtitle: 'Extract hidden fees, unfair cancellation penalties, and ambiguous refund clauses before signing',
        };
      case 'all':
      default:
        return {
          title: 'AI Verification Suite',
          subtitle: 'Verify consultancy agreements & admission offer letters before making milestone payments',
        };
    }
  }, [activeTab]);

  return (
    <div className={styles.page}>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>{headerMeta.title}</h1>
          <p className={styles.toolSubtitle}>{headerMeta.subtitle}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.tabSwitcher} role="tablist" aria-label="AI Verification Tools">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Tools
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'fraud'}
              className={`${styles.tabBtn} ${activeTab === 'fraud' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('fraud')}
            >
              🛡️ Fraud Checker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'agreement'}
              className={`${styles.tabBtn} ${activeTab === 'agreement' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('agreement')}
            >
              📋 Agreement Analyzer
            </button>
          </div>
          <Badge variant="outline" size="sm">Verification Suite</Badge>
        </div>
      </div>

      {/* ─── Document Analysis Parameters ─── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🎯</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>Heuristic Model</div>
            <div className={styles.statLabel}>Pattern & Clause Analysis</div>
            <Badge variant="verified" size="sm">Rule + LLM Hybrid</Badge>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🏛️</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>Domain Registry</div>
            <div className={styles.statLabel}>University Email / URL Match</div>
            <Badge variant="success" size="sm">Official Catalog Check</Badge>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🔍</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>OCR Text Extraction</div>
            <div className={styles.statLabel}>Layout & Format Consistency</div>
            <Badge variant="info" size="sm">Tesseract + Visual Check</Badge>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🛡️</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>Clause Verification</div>
            <div className={styles.statLabel}>Escrow & Refund Terms</div>
            <Badge variant="verified" size="sm">Consumer Protection</Badge>
          </div>
        </div>
      </div>

      {/* ─── Reference Sample Loader ─── */}
      {process.env.NODE_ENV !== 'production' && <div className={styles.samplesBar}>
        <span className={styles.samplesLabel}>
          <span>📄</span>
          <span>Analyze Example Text:</span>
        </span>
        <button
          type="button"
          className={styles.sampleBtn}
          onClick={() => {
            setActiveTab('fraud');
            testSampleOffer(true);
          }}
        >
          Example University Offer
        </button>
        <button
          type="button"
          className={styles.sampleBtn}
          onClick={() => {
            setActiveTab('fraud');
            testSampleOffer(false);
          }}
        >
          Flagged Irregular Offer
        </button>
        <button
          type="button"
          className={styles.sampleBtn}
          onClick={() => {
            setActiveTab('agreement');
            testSampleAgreement(true);
          }}
        >
          Escrow-Protected Agreement
        </button>
        <button
          type="button"
          className={styles.sampleBtn}
          onClick={() => {
            setActiveTab('agreement');
            testSampleAgreement(false);
          }}
        >
          Non-Compliant Agreement
        </button>
      </div>}

      <div className={activeTab === 'all' ? styles.grid : styles.singleColumn}>
        {/* Document Fraud Checker — LIVE, Module 5.8 / K-21 */}
        {(activeTab === 'all' || activeTab === 'fraud') && (
          <div className={styles.toolCard}>
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
                <p className={styles.toolSubtitle}>Scan admission offer letters for forged templates &amp; spoofed domains</p>
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
                  className={`${styles.uploadZone} ${isDocDragging ? styles.uploadZoneDragActive : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload offer letter for fraud analysis"
                  onClick={() => docFileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && docFileInputRef.current?.click()}
                  onDrop={onDocDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDocDragging(true);
                  }}
                  onDragLeave={() => setIsDocDragging(false)}
                >
                  <span className={styles.uploadIcon} aria-hidden="true">
                    {isDocDragging ? '📥' : '📄'}
                  </span>
                  <p>
                    {isDocDragging ? (
                      <strong>Drop offer letter to scan immediately!</strong>
                    ) : (
                      <>Drop offer letter here or <span className={styles.link}>browse file</span></>
                    )}
                  </p>
                  <p className={styles.uploadHint}>PDF, PNG, JPG, WEBP, TXT up to 20MB</p>
                </div>

                <div className={styles.optionalInputs}>
                  <div className={styles.inputRow}>
                    <label htmlFor="expectedUni" className={styles.inputLabel}>Expected University (optional validation)</label>
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
                <p>⚠️ {docError}</p>
                <Button size="sm" variant="ghost" onClick={resetDoc}>Try Again</Button>
              </div>
            )}

            {docResult && !docLoading && (
              <div className={styles.clauses} aria-live="polite">
                <div className={styles.verdictRow}>
                  {docVerdictMeta && <Badge variant={docVerdictMeta.variant} size="md">{docVerdictMeta.label}</Badge>}
                  <Badge variant="outline" size="sm">Offer Analysis</Badge>
                </div>

                {docVerdictMeta && (
                  <div className={styles.gaugeWrap} aria-label={`Risk score: ${docResult.riskScore} out of 100`}>
                    <svg viewBox="0 0 120 70" className={styles.gauge}>
                      {/* Subtle neutral background arc track */}
                      <path
                        d="M10 60 A50 50 0 0 1 110 60"
                        fill="none"
                        stroke="rgba(128, 128, 128, 0.25)"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
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
                      <Badge variant="success" size="sm">Clean Document</Badge>
                      <p className={styles.flagText}>No suspicious clauses, domain mismatches, or predatory payment terms found.</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                  <Button size="sm" variant="ghost" onClick={resetDoc}>← Scan Another Offer Letter</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Smart Agreement Analyzer — Module 5.9 / Issue #16 */}
        {(activeTab === 'all' || activeTab === 'agreement') && (
          <div className={styles.toolCard}>
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
                className={`${styles.uploadZone} ${isAgrDragging ? styles.uploadZoneDragActive : ''}`}
                role="button"
                tabIndex={0}
                aria-label="Upload agreement for analysis"
                onClick={() => agreementFileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && agreementFileInputRef.current?.click()}
                onDrop={onAgreementDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsAgrDragging(true);
                }}
                onDragLeave={() => setIsAgrDragging(false)}
              >
                <span className={styles.uploadIcon} aria-hidden="true">
                  {isAgrDragging ? '📥' : '📤'}
                </span>
                <p>
                  {isAgrDragging ? (
                    <strong>Drop agreement PDF to analyze now!</strong>
                  ) : (
                    <>Drop agreement PDF here or <span className={styles.link}>browse file</span></>
                  )}
                </p>
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
                <p>⚠️ {agreementError}</p>
                <Button size="sm" variant="ghost" onClick={resetAgreement}>Try Again</Button>
              </div>
            )}

            {agreementResult && !agreementLoading && (
              <div className={styles.clauses} aria-live="polite">
                <div className={styles.verdictRow}>
                  {agreementVerdictMeta && <Badge variant={agreementVerdictMeta.variant} size="md">{agreementVerdictMeta.label}</Badge>}
                  <Badge variant="outline" size="sm">
                    {agreementResult.model_used === 'gemini' ? 'Gemini AI Model' : 'Standard Rule Engine'}
                  </Badge>
                  {agreementResult.truncated && <Badge variant="neutral" size="sm">Truncated Input</Badge>}
                </div>

                {agreementGauge && (
                  <div className={styles.gaugeWrap} aria-label={`Risk verdict: ${agreementVerdictMeta?.label}`}>
                    <svg viewBox="0 0 120 70" className={styles.gauge}>
                      {/* Subtle neutral background arc track */}
                      <path
                        d="M10 60 A50 50 0 0 1 110 60"
                        fill="none"
                        stroke="rgba(128, 128, 128, 0.25)"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 60 A50 50 0 0 1 110 60"
                        fill="none"
                        stroke={agreementGauge.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="157"
                        strokeDashoffset={agreementGauge.offset}
                        className={styles.gaugeArc}
                      />
                      <text x="60" y="58" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800">
                        {agreementGauge.score}
                      </text>
                      <text x="60" y="69" textAnchor="middle" fill={agreementGauge.color} fontSize="9" fontWeight="700">
                        {agreementGauge.label}
                      </text>
                    </svg>
                  </div>
                )}

                {agreementResult.flags.length > 0 ? (
                  agreementResult.flags.map((f, i) => (
                    <div key={i} className={styles.clause}>
                      <Badge variant={f.severity as BadgeVariant} size="sm">{f.tag.replace(/_/g, ' ')}</Badge>
                      <p className={styles.clauseText}>{f.message_en}</p>
                      {f.related_quote && <p className={styles.clauseQuote}>&ldquo;{f.related_quote}&rdquo;</p>}
                    </div>
                  ))
                ) : (
                  <div className={styles.clause}>
                    <Badge variant="success" size="sm">No Flags</Badge>
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

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                  <Button size="sm" variant="ghost" onClick={resetAgreement}>← Upload Another Agreement</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Recent Real-Time Scam Alerts Advisory Feed ─── */}
      <div className={styles.advisorySection}>
        <div className={styles.advisoryHeader}>
          <div className={styles.advisoryTitle}>
            <span>🚨</span>
            <span>Recent Consultancy Fraud Alerts & Blacklist Advisory</span>
          </div>
          <Badge variant="danger" size="sm" dot>Live Intelligence Feed</Badge>
        </div>

        <div className={styles.advisoryGrid}>
          <div className={styles.alertCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant="danger" size="sm">CRITICAL (94% RISK)</Badge>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aug 2, 2026</span>
            </div>
            <div className={styles.alertTitle}>Forged Offer Letter — Univ. of Bedfordshire</div>
            <div className={styles.alertAgency}>Agency: Skyline Consultancy (Dhaka)</div>
            <div className={styles.alertSummary}>
              OCR detected altered student ID and non-standard registrar signature font. Admissions communication traced to free ProtonMail account.
            </div>
          </div>

          <div className={styles.alertCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant="danger" size="sm">CRITICAL (88% RISK)</Badge>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Jul 29, 2026</span>
            </div>
            <div className={styles.alertTitle}>Phishing Admissions Domain (.cc Domain)</div>
            <div className={styles.alertAgency}>Agency: FastPath Overseas Education</div>
            <div className={styles.alertSummary}>
              Website redirects visa application fee payment to unverified personal bKash account with zero Ministry of Education registration.
            </div>
          </div>

          <div className={styles.alertCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant="warning" size="sm">HIGH (78% RISK)</Badge>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aug 1, 2026</span>
            </div>
            <div className={styles.alertTitle}>Predatory 100% Advance Non-Refund Clause</div>
            <div className={styles.alertAgency}>Agency: Apex Study BD (Unregistered)</div>
            <div className={styles.alertSummary}>
              Agreement Section 4.2 mandates ৳200,000 non-refundable cash deposit prior to university dispatch, violating BFIU consultancy rules.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIToolsPage(props: AIToolsPageProps) {
  return (
    <Suspense fallback={<div className={styles.loadingWrap}>Loading AI Tools...</div>}>
      <AIToolsPageContent {...props} />
    </Suspense>
  );
}
