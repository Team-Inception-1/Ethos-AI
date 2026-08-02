'use client';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './DocumentsPage.module.css';

const DOCS = [
  { name:'Offer Letter - U of Toronto', type:'offer_letter', size:'1.2 MB', date:'Jul 25, 2026', version:1, risk:'low'  },
  { name:'Signed Agreement - Global Edu BD', type:'agreement', size:'856 KB', date:'Jul 10, 2026', version:2, risk:'medium' },
  { name:'Passport Copy',  type:'passport', size:'320 KB', date:'Jul 5, 2026', version:1, risk:null },
  { name:'Academic Transcript', type:'transcript', size:'2.1 MB', date:'Jun 28, 2026', version:1, risk:null },
];

const typeIcons: Record<string, string> = { offer_letter:'📄', agreement:'📋', passport:'🛂', transcript:'🎓' };

export default function DocumentsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Documents</h1>
        <Button size="sm">+ Upload Document</Button>
      </div>

      {/* Upload Zone */}
      <GlassCard padding="lg" className={styles.uploadZone} glow>
        <div className={styles.uploadIcon} aria-hidden="true">☁️</div>
        <p className={styles.uploadLabel}>Drag & drop files here, or <span className={styles.uploadLink}>browse</span></p>
        <p className={styles.uploadHint}>PDF, JPG, PNG up to 20MB — Offer letters, agreements, passports, transcripts</p>
        <p className={styles.devHint}>🔧 <strong>@backend</strong>: Wire to <code>POST /documents</code></p>
      </GlassCard>

      {/* Document Grid */}
      <div className={styles.docGrid} role="list" aria-label="Uploaded documents">
        {DOCS.map((d, i) => (
          <GlassCard key={i} hover padding="md" className={styles.docCard}>
            <div className={styles.docIcon} aria-hidden="true">{typeIcons[d.type]}</div>
            <div className={styles.docMeta}>
              <div className={styles.docName}>{d.name}</div>
              <div className={styles.docInfo}>{d.size} · {d.date} · v{d.version}</div>
            </div>
            {d.risk && (
              <Badge variant={d.risk === 'low' ? 'success' : 'warning'} size="sm">
                {d.risk === 'low' ? '🟢 Low Risk' : '🟡 Review Needed'}
              </Badge>
            )}
            <div className={styles.docActions}>
              <Button size="sm" variant="ghost">Preview</Button>
              {!d.risk && <Button size="sm" variant="outline">AI Scan</Button>}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
