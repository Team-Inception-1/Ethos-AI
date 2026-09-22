'use client';
import React, { useState, useEffect, useRef } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import styles from './DocumentsPage.module.css';

interface DocItem {
  id: string;
  name: string;
  type: 'offer_letter' | 'agreement' | 'passport' | 'transcript' | 'other';
  size: string;
  storageKey: string;
  storageUrl: string;
  version: number;
  riskScore: number | null;
  verdict: 'likely_genuine' | 'needs_review' | 'likely_fake' | null;
  flags: string[];
  uploadedAt: string;
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
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);

  // Upload modal states
  const [selectedType, setSelectedType] = useState<'offer_letter' | 'agreement' | 'passport' | 'transcript'>('offer_letter');
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [scanModalDoc, setScanModalDoc] = useState<DocItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const ownerParam = user?.id ? `?ownerId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`/api/documents${ownerParam}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [user?.id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', selectedType);
    formData.append('ownerId', user?.id || 'usr-student-01');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchDocs();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScan = async (doc: DocItem) => {
    setScanningId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}/scan`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setDocs((prev) =>
          prev.map((d) => (d.id === doc.id ? data.document : d))
        );
        setScanModalDoc(data.document);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Document Vault & Storage</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Encrypted document storage powered by <strong>Neon Object Storage (5 GB Free Tier)</strong> & AI Fraud Detection
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid var(--ink)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 700,
            }}
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
            accept=".pdf,.jpg,.jpeg,.png,.txt"
          />

          <Button
            size="sm"
            glow
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading to S3…' : '+ Upload Document'}
          </Button>
        </div>
      </div>

      {/* Storage & Upload Zone */}
      <GlassCard
        padding="lg"
        className={styles.uploadZone}
        onClick={() => fileInputRef.current?.click()}
        glow
      >
        <div className={styles.uploadIcon} aria-hidden="true">
          {uploading ? '⏳' : '☁️'}
        </div>
        <p className={styles.uploadLabel}>
          {uploading ? 'Uploading to Neon Object Storage…' : (
            <>
              Click or drag & drop to upload as <strong>{typeLabels[selectedType]}</strong>
            </>
          )}
        </p>
        <p className={styles.uploadHint}>
          PDF, JPG, PNG up to 20MB — Stored in S3 bucket <code>documents</code> with copy-on-write branching
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <Badge variant="verified" size="sm">✓ Neon S3 Active (5 GB Free Plan)</Badge>
          <Badge variant="ai" size="sm">⚡ Instant AI Fraud Scanner Ready</Badge>
        </div>
      </GlassCard>

      {/* Document Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
          Loading your document vault…
        </div>
      ) : (
        <div className={styles.docGrid} role="list" aria-label="Uploaded documents">
          {docs.map((d) => (
            <GlassCard key={d.id} hover padding="md" className={styles.docCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className={styles.docIcon} aria-hidden="true">
                    {typeIcons[d.type] || '📄'}
                  </div>
                  <div className={styles.docMeta}>
                    <div className={styles.docName}>{d.name}</div>
                    <div className={styles.docInfo}>
                      {d.size} · {formatDate(d.uploadedAt)} · v{d.version}
                    </div>
                  </div>
                </div>

                {d.verdict === 'likely_genuine' && (
                  <Badge variant="success" size="sm">
                    🟢 Low Risk ({d.riskScore ?? 4}%)
                  </Badge>
                )}
                {d.verdict === 'needs_review' && (
                  <Badge variant="warning" size="sm">
                    🟡 Review Needed ({d.riskScore ?? 25}%)
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

              {/* Flags summary */}
              {d.flags && d.flags.length > 0 && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-elevated)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                  }}
                >
                  🔍 {d.flags[0]}
                </div>
              )}

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
                  {scanningId === d.id ? 'Scanning…' : '⚡ AI Scan'}
                </Button>

                {d.verdict && (
                  <Button size="sm" variant="ghost" onClick={() => setScanModalDoc(d)}>
                    Inspect Report
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(d.id)}
                  style={{ color: 'var(--rose)', marginLeft: 'auto' }}
                >
                  Delete
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2.5px solid var(--ink)',
              boxShadow: '6px 6px 0 0 var(--ink)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Document Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div><strong>File Name:</strong> {previewDoc.name}</div>
              <div><strong>Document Type:</strong> {typeLabels[previewDoc.type]}</div>
              <div><strong>File Size:</strong> {previewDoc.size}</div>
              <div><strong>Uploaded At:</strong> {formatDate(previewDoc.uploadedAt)}</div>
              <div><strong>Storage Key (S3):</strong> <code>{previewDoc.storageKey}</code></div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <strong>Status:</strong>
                <Badge variant="verified">Stored on Neon Object Storage</Badge>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
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

      {/* AI Scan Inspection Modal */}
      {scanModalDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setScanModalDoc(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2.5px solid var(--ink)',
              boxShadow: '6px 6px 0 0 var(--ink)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>⚡ AI Fraud Inspection Report</h3>
              <button
                type="button"
                onClick={() => setScanModalDoc(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>Overall Risk Score</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Audited by Ethos AI Microservice</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: scanModalDoc.riskScore && scanModalDoc.riskScore > 30 ? 'var(--rose)' : 'var(--emerald)' }}>
                  {scanModalDoc.riskScore ?? 5} / 100
                </div>
              </div>

              <div>
                <strong>Verdict:</strong>{' '}
                <Badge
                  variant={
                    scanModalDoc.verdict === 'likely_genuine'
                      ? 'success'
                      : scanModalDoc.verdict === 'needs_review'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {scanModalDoc.verdict?.toUpperCase() || 'LIKELY GENUINE'}
                </Badge>
              </div>

              <div>
                <strong>Verification Findings:</strong>
                <ul style={{ marginTop: '6px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
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
