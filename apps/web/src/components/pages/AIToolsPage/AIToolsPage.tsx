'use client';
import React, { useRef, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  analyzeAgreementFile,
  AiServiceError,
  type AnalyzeAgreementResponse,
} from '@/lib/aiService';
import styles from './AIToolsPage.module.css';

type BadgeVariant = 'info' | 'warning' | 'danger' | 'neutral';

const VERDICT_LABEL: Record<AnalyzeAgreementResponse['verdict'], { label: string; variant: BadgeVariant }> = {
  clear:        { label: 'Clear',        variant: 'neutral' },
  needs_review: { label: 'Needs Review', variant: 'warning' },
  high_risk:    { label: 'High Risk',    variant: 'danger'  },
};

// Risk gauge: map a verdict to a 0-100-ish display score + arc offset, purely
// for the visual gauge (the real signal is `flags[]`/`verdict`, not this number).
const VERDICT_GAUGE: Record<AnalyzeAgreementResponse['verdict'], { score: number; color: string; label: string; offset: number }> = {
  clear:        { score: 8,  color: 'var(--emerald)',    label: 'LOW RISK',      offset: 144 },
  needs_review: { score: 52, color: 'var(--amber)',      label: 'NEEDS REVIEW',  offset: 76  },
  high_risk:    { score: 88, color: 'var(--red-danger)', label: 'HIGH RISK',     offset: 19  },
};

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.txt'];

export default function AIToolsPage() {
  const [agreementResult, setAgreementResult]   = useState<AnalyzeAgreementResponse | null>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementError, setAgreementError]     = useState<string | null>(null);
  const [fileName, setFileName]                 = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setAgreementError(null);

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setAgreementError(`Unsupported file type "${ext}". Accepted: PDF, JPG, PNG, WEBP, BMP, TIFF, TXT.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setAgreementError('File too large — max 20MB.');
      return;
    }

    setFileName(file.name);
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
      setFileName(null);
    } finally {
      setAgreementLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setAgreementResult(null);
    setAgreementError(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const gauge = agreementResult ? VERDICT_GAUGE[agreementResult.verdict] : null;
  const verdictMeta = agreementResult ? VERDICT_LABEL[agreementResult.verdict] : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>AI Tools</h1>
        <Badge variant="ai" size="md">✦ Powered by Ethos AI</Badge>
      </div>

      <div className={styles.grid}>
        {/* Fraud Checker — offer-letter OCR fraud detection (Module 5.8, Issue #22)
            is not yet implemented by its owner, so this card stays clearly
            marked as pending rather than being wired to a mock. */}
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
              <p className={styles.toolSubtitle}>Upload offer letters for AI analysis</p>
            </div>
          </div>

          <div className={styles.comingSoon} aria-live="polite">
            <span className={styles.comingSoonIcon} aria-hidden="true">🚧</span>
            <p>Offer-letter OCR fraud detection (Module 5.8) is still being built.</p>
            <Badge variant="pending" size="sm">Coming Soon</Badge>
          </div>
          <p className={styles.devHint}>🔧 <strong>@Souravg223</strong>: Owns Issue #22 — <code>POST /api/ai/analyze-offer-letter</code></p>
        </GlassCard>

        {/* Agreement Analyzer — LIVE, wired to the real Gemini-backed
            Smart Agreement Analyzer service (Module 5.9, Issue #16). */}
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

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {!agreementResult && !agreementLoading && (
            <div
              className={styles.uploadZone}
              role="button"
              tabIndex={0}
              aria-label="Upload agreement for analysis"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <span className={styles.uploadIcon} aria-hidden="true">📤</span>
              <p>Drop agreement PDF here or <span className={styles.link}>click to upload</span></p>
              <p className={styles.uploadHint}>PDF, JPG, PNG, TXT up to 20MB</p>
            </div>
          )}

          {agreementLoading && (
            <div className={styles.loadingState} aria-live="polite" aria-busy="true">
              <span className={styles.spinner} aria-hidden="true" />
              <p>Analyzing {fileName} with Gemini…</p>
              <p className={styles.uploadHint}>Extracting clauses, checking for hidden fees &amp; ambiguous refund terms.</p>
            </div>
          )}

          {agreementError && !agreementLoading && (
            <div className={styles.errorState} role="alert">
              <p>⚠ {agreementError}</p>
              <Button size="sm" variant="ghost" onClick={reset}>Try Again</Button>
            </div>
          )}

          {agreementResult && !agreementLoading && (
            <div className={styles.clauses} aria-live="polite">
              <div className={styles.verdictRow}>
                {verdictMeta && <Badge variant={verdictMeta.variant} size="md">{verdictMeta.label}</Badge>}
                <Badge variant="ai" size="sm">
                  {agreementResult.model_used === 'gemini' ? '✦ Analyzed by Gemini' : '✦ Analyzed (offline fallback)'}
                </Badge>
                {agreementResult.truncated && <Badge variant="neutral" size="sm">Truncated Input</Badge>}
              </div>

              {gauge && (
                <div className={styles.gaugeWrap} aria-label={`Risk verdict: ${verdictMeta?.label}`}>
                  <svg viewBox="0 0 120 70" className={styles.gauge}>
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"/>
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={gauge.color} strokeWidth="10" strokeLinecap="round" strokeDasharray="157" strokeDashoffset={gauge.offset} className={styles.gaugeArc}/>
                    <text x="60" y="58" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800">{gauge.score}</text>
                    <text x="60" y="70" textAnchor="middle" fill={gauge.color} fontSize="9" fontWeight="600">{gauge.label}</text>
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

              <Button size="sm" variant="ghost" onClick={reset}>← Upload Another</Button>
            </div>
          )}
        </GlassCard>
      </div>

      {/* AI Counselor Banner — Module 5.18 (Issue #24), not yet implemented */}
      <GlassCard padding="lg" className={styles.counselorBanner}>
        <div className={styles.counselorContent}>
          <div>
            <h2 className={styles.counselorTitle}>✦ AI Counselor</h2>
            <p className={styles.counselorDesc}>Get personalized university recommendations, admission chances, and your custom application roadmap.</p>
            <p className={styles.devHint}>🔧 <strong>@Souravg223</strong>: Owns Issue #24 — <code>POST /api/ai/counselor/recommend</code></p>
          </div>
          <Button variant="outline" size="lg" disabled>Coming Soon</Button>
        </div>
      </GlassCard>
    </div>
  );
}
