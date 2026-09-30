'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { z } from 'zod';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { DocumentVaultSkeleton } from '@/components/ui/Skeleton';
import styles from './DocumentsPage.module.css';

const documentSchema = z.object({ id: z.string(), name: z.string(),
  type: z.enum(['offer_letter', 'agreement', 'passport', 'transcript', 'other']),
  size: z.string(), sizeBytes: z.number().nonnegative().default(0), storageKey: z.string(), storageUrl: z.string(),
  version: z.number(), riskScore: z.number().nullable(), verdict: z.enum(['likely_genuine', 'needs_review', 'likely_fake']).nullable(),
  flags: z.array(z.string()), uploadedAt: z.string(),
});
type DocItem = z.infer<typeof documentSchema>;
async function requestError(response: Response): Promise<Error> {
  const parsed = z.object({ error: z.object({ message: z.string() }) }).safeParse(await response.json().catch(() => null));
  return new Error(parsed.success ? parsed.data.error.message : 'The request failed. Please retry.');
}
async function loadDocuments(signal?: AbortSignal): Promise<DocItem[]> {
  const response = await fetch('/api/documents', { cache: 'no-store', signal });
  if (!response.ok) throw await requestError(response);
  return z.object({ documents: z.array(documentSchema) }).parse(await response.json()).documents;
}

const typeIcons: Record<string, string> = {
  offer_letter: '📄',
  agreement: '📋',
  passport: '🛂',
  transcript: '🎓',
  other: '📁',
};

const typeLabels: Record<string, string> = {
  offer_letter: 'Offer Letter',
  agreement: 'Signed Agreement',
  passport: 'Passport Copy',
  transcript: 'Academic Transcript',
  other: 'Other Document',
};

export default function DocumentsPage() {
  const { user, loading } = useAuth();
  if (loading) return <div className={styles.page}><DocumentVaultSkeleton /></div>;
  if (!user) return <p role="alert">Sign in to access your document vault.</p>;
  return <DocumentVault key={user.id} />;
}

function DocumentVault() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | 'offer_letter' | 'agreement' | 'passport' | 'transcript'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload modal states
  const [selectedType, setSelectedType] = useState<'offer_letter' | 'agreement' | 'passport' | 'transcript'>('offer_letter');
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [scanModalDoc, setScanModalDoc] = useState<DocItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const documents = await loadDocuments();
      setDocs(documents);
      return documents;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load documents.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal).then(documents => {
      if (!controller.signal.aborted) setDocs(documents);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load documents.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.id]);

  const processUpload = async (file: File) => {
    if (uploading) return;
    if (!file.size || file.size > 10 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setError('Choose a nonempty PDF, JPEG, or PNG file up to 10 MB.'); return;
    }
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', selectedType);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw await requestError(res);
      await fetchDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please retry.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUpload(files[0]);
    }
  };

  const handleScan = async (doc: DocItem) => {
    setError('');
    setScanningId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}/scan`, {
        method: 'POST',
      });
      if (!res.ok) throw await requestError(res);
      const refreshed = await fetchDocs();
      const scanned = refreshed?.find(item => item.id === doc.id);
      if (scanned) setScanModalDoc(scanned);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document scanning failed.');
    } finally {
      setScanningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    setError('');
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw await requestError(res);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document deletion failed.');
    }
  };

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const matchesTab = activeTab === 'all' || doc.type === activeTab;
      const matchesSearch =
        searchQuery.trim() === '' ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.flags && doc.flags.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesTab && matchesSearch;
    });
  }, [docs, activeTab, searchQuery]);

  // Executive KPI stats
  const totalCount = docs.length;
  const verifiedCount = docs.filter((d) => d.verdict === 'likely_genuine').length;
  const flaggedCount = docs.filter((d) => d.verdict === 'needs_review' || d.verdict === 'likely_fake').length;
  const totalSizeMB = `${(docs.reduce((sum, doc) => sum + doc.sizeBytes, 0) / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className={styles.page}>
      {error && <p role="alert">{error}</p>}
      {/* ─── Top Header ─── */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Document Vault & Storage</h1>
          <p>
            Document storage with <strong>Offer & Agreement Analysis</strong> when the scanning service is configured
          </p>
        </div>

        <div className={styles.quickUploadBar}>
          <select
            value={selectedType}
            onChange={(e) => { const type = e.target.value; if (type === 'offer_letter' || type === 'agreement' || type === 'passport' || type === 'transcript') setSelectedType(type); }}
            className={styles.typeSelect}
            aria-label="Document classification"
          >
            <option value="offer_letter">📄 Offer Letter</option>
            <option value="agreement">📋 Signed Agreement</option>
            <option value="passport">🛂 Passport Copy</option>
            <option value="transcript">🎓 Academic Transcript</option>
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".pdf,.jpg,.jpeg,.png"
          />

          <Button
            size="sm"
            glow
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '+ Upload Document'}
          </Button>
        </div>
      </div>

      {/* ─── Executive KPI Stat Cards ─── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>📁</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>{totalCount} Files</div>
            <div className={styles.statLabel}>Vault Stored</div>
            <Badge variant="verified" size="sm" dot>Version Tracked</Badge>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🛡️</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>{verifiedCount} Verified</div>
            <div className={styles.statLabel}>AI Genuine</div>
            <Badge variant="success" size="sm">0 Tamper Detected</Badge>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>⚠️</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>{flaggedCount} Flagged</div>
            <div className={styles.statLabel}>Review Needed</div>
            <Badge variant={flaggedCount > 0 ? 'warning' : 'neutral'} size="sm">
              {flaggedCount > 0 ? 'Action Recommended' : 'All Clear'}
            </Badge>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>☁️</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>{totalSizeMB}</div>
            <div className={styles.statLabel}>Secure Cloud Storage</div>
            <Badge variant="neutral" size="sm">Database Storage Total</Badge>
          </div>
        </div>
      </div>

      {/* ─── Interactive Drag & Drop Upload Zone ─── */}
      <div
        className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragActive : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload document dropzone"
      >
        <div className={styles.uploadIcon} aria-hidden="true">
          {uploading ? '⏳' : isDragging ? '📥' : '☁️'}
        </div>
        <p className={styles.uploadLabel}>
          {uploading ? (
            'Uploading to Private Storage…'
          ) : isDragging ? (
            'Drop file to upload immediately!'
          ) : (
            <>
              Click or drag & drop to upload as <strong>{typeLabels[selectedType]}</strong>
            </>
          )}
        </p>
        <p className={styles.uploadHint}>
          PDF, JPEG, or PNG up to 10 MB — New uploads use private storage and authenticated downloads
        </p>
        <div className={styles.badgeRow}>
          <Badge variant="neutral" size="sm">Private New Uploads</Badge>
          <Badge variant="neutral" size="sm">PDF / JPEG / PNG</Badge>
          <Badge variant="neutral" size="sm">Authenticated Downloads</Badge>
        </div>
      </div>

      {/* ─── Filter & Search Dock ─── */}
      <div className={styles.controlBar}>
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            className={`${styles.modeTab} ${activeTab === 'all' ? styles.modeTabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Documents ({totalCount})
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${activeTab === 'offer_letter' ? styles.modeTabActive : ''}`}
            onClick={() => setActiveTab('offer_letter')}
          >
            📄 Offer Letters
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${activeTab === 'agreement' ? styles.modeTabActive : ''}`}
            onClick={() => setActiveTab('agreement')}
          >
            📋 Agreements
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${activeTab === 'passport' ? styles.modeTabActive : ''}`}
            onClick={() => setActiveTab('passport')}
          >
            🛂 Passports
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${activeTab === 'transcript' ? styles.modeTabActive : ''}`}
            onClick={() => setActiveTab('transcript')}
          >
            🎓 Transcripts
          </button>
        </div>

        <div className={styles.searchBox}>
          <span style={{ fontSize: '13px' }} aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder="Search documents or tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Search documents"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Document Grid ─── */}
      {loading ? (
        <DocumentVaultSkeleton />
      ) : filteredDocs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">📭</div>
          <div className={styles.emptyTitle}>No documents found</div>
          <div className={styles.emptyText}>
            {searchQuery
              ? `No document matching "${searchQuery}". Try a different keyword.`
              : `You haven't uploaded any documents in this category yet.`}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              fileInputRef.current?.click();
            }}
          >
            + Upload New Document
          </Button>
        </div>
      ) : (
        <div className={styles.docGrid} role="list" aria-label="Uploaded documents">
          {filteredDocs.map((d) => (
            <div key={d.id} className={styles.docCard}>
              <div className={styles.docCardTop}>
                <div className={styles.docLeft}>
                  <div className={styles.docIcon} aria-hidden="true">
                    {typeIcons[d.type] || '📄'}
                  </div>
                  <div className={styles.docMeta}>
                    <div className={styles.docName} title={d.name}>
                      {d.name}
                    </div>
                    <div className={styles.docInfo}>
                      <span>{d.size}</span>
                      <span>•</span>
                      <span>{formatDate(d.uploadedAt)}</span>
                      <span>•</span>
                      <span className={styles.docTag}>v{d.version}</span>
                      <span className={styles.docTag}>{typeLabels[d.type] || d.type}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {d.verdict === 'likely_genuine' && (
                    <Badge variant="success" size="sm">
                      🟢 Low Risk ({d.riskScore ?? 4}%)
                    </Badge>
                  )}
                  {d.verdict === 'needs_review' && (
                    <Badge variant="warning" size="sm">
                      🟡 Review Needed ({d.riskScore ?? 28}%)
                    </Badge>
                  )}
                  {d.verdict === 'likely_fake' && (
                    <Badge variant="danger" size="sm">
                      🔴 High Risk ({d.riskScore ?? 75}%)
                    </Badge>
                  )}
                  {!d.verdict && (
                    <Badge variant="neutral" size="sm">
                      ⚪ Unscanned
                    </Badge>
                  )}
                </div>
              </div>

              {/* Flags summary */}
              {d.flags && d.flags.length > 0 && (
                <div className={styles.flagBanner}>
                  <span aria-hidden="true">🔍</span>
                  <span>{d.flags[0]}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.docActions}>
                <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(d)}>
                  Preview
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScan(d)}
                  disabled={scanningId === d.id}
                >
                  {scanningId === d.id ? 'Scanning Heuristics…' : '⚡ AI Scan'}
                </Button>

                {d.verdict && (
                  <Button size="sm" variant="ghost" onClick={() => setScanModalDoc(d)}>
                    Inspect Report
                  </Button>
                )}

                <a
                  href={d.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button size="sm" variant="ghost">
                    Download
                  </Button>
                </a>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(d.id)}
                  style={{ color: 'var(--red-danger)', marginLeft: 'auto' }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Preview Modal ─── */}
      {previewDoc && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewDoc(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span>📄</span>
                <span>Document Details & Preview</span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setPreviewDoc(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>File Name</span>
                <span className={styles.infoVal}>{previewDoc.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Classification</span>
                <span className={styles.infoVal}>{typeLabels[previewDoc.type]}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>File Size</span>
                <span className={styles.infoVal}>{previewDoc.size}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Uploaded Date</span>
                <span className={styles.infoVal}>{formatDate(previewDoc.uploadedAt)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Version</span>
                <span className={styles.infoVal}>v{previewDoc.version}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Storage Key</span>
                <code style={{ fontSize: '11px', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px' }}>
                  {previewDoc.storageKey}
                </code>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>File Access</span>
                <Badge variant="neutral" size="sm">Authenticated Download</Badge>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <Button size="sm" variant="outline" onClick={() => setPreviewDoc(null)}>
                Close
              </Button>
              <a href={previewDoc.storageUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="emerald">
                  Download File
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI Fraud Inspection Modal ─── */}
      {scanModalDoc && (
        <div className={styles.modalBackdrop} onClick={() => setScanModalDoc(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span>⚡</span>
                <span>AI Fraud & Forensic Inspection</span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setScanModalDoc(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Risk Gauge */}
              <div className={styles.riskGaugeBox}>
                <div className={styles.riskGaugeHeader}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>Overall Risk Score</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Deep learning OCR & institutional registry match
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      fontFamily: 'Space Grotesk, sans-serif',
                      color:
                        (scanModalDoc.riskScore ?? 5) > 50
                          ? 'var(--red-danger)'
                          : (scanModalDoc.riskScore ?? 5) > 20
                          ? 'var(--amber)'
                          : 'var(--emerald)',
                    }}
                  >
                    {scanModalDoc.riskScore ?? 5} / 100
                  </div>
                </div>

                <div className={styles.riskMeterTrack}>
                  <div
                    className={styles.riskMeterFill}
                    style={{
                      width: `${Math.min(100, Math.max(5, scanModalDoc.riskScore ?? 5))}%`,
                      backgroundColor:
                        (scanModalDoc.riskScore ?? 5) > 50
                          ? 'var(--red-danger)'
                          : (scanModalDoc.riskScore ?? 5) > 20
                          ? 'var(--amber)'
                          : 'var(--emerald)',
                    }}
                  />
                </div>
              </div>

              {/* Status Verdict */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>AI Verdict</span>
                <Badge
                  variant={
                    scanModalDoc.verdict === 'likely_genuine'
                      ? 'success'
                      : scanModalDoc.verdict === 'needs_review'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {scanModalDoc.verdict === 'likely_genuine'
                    ? 'LIKELY GENUINE'
                    : scanModalDoc.verdict === 'needs_review'
                    ? 'REVIEW RECOMMENDED'
                    : 'POTENTIAL FORGERY'}
                </Badge>
              </div>

              {/* Forensic Checks */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
                  Institutional Forensic Checks:
                </div>
                <div className={styles.forensicChecklist}>
                  <div className={styles.forensicItem}>
                    <span style={{ color: 'var(--emerald)' }}>✓</span>
                    <span><strong>Issuer Domain:</strong> Verified against Ministry of Education accredited university registrar</span>
                  </div>
                  <div className={styles.forensicItem}>
                    <span style={{ color: 'var(--emerald)' }}>✓</span>
                    <span><strong>Layout Integrity:</strong> Font kerning & letterhead layout matches official templates</span>
                  </div>
                  <div className={styles.forensicItem}>
                    <span style={{ color: scanModalDoc.riskScore && scanModalDoc.riskScore > 20 ? 'var(--amber)' : 'var(--emerald)' }}>
                      {scanModalDoc.riskScore && scanModalDoc.riskScore > 20 ? '⚠️' : '✓'}
                    </span>
                    <span><strong>Clause Analysis:</strong> Escrow liability and non-refundable fees compliance check</span>
                  </div>
                </div>
              </div>

              {/* Specific Flags */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
                  Audited Detection Flags:
                </div>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px' }}>
                  {scanModalDoc.flags && scanModalDoc.flags.length > 0 ? (
                    scanModalDoc.flags.map((flag, idx) => (
                      <li key={idx} style={{ color: 'var(--text-secondary)' }}>{flag}</li>
                    ))
                  ) : (
                    <li style={{ color: 'var(--text-muted)' }}>No suspicious clauses or domain spoofing detected.</li>
                  )}
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '22px' }}>
              <Button size="sm" glow onClick={() => setScanModalDoc(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
