'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './StudentDashboard.module.css';

// SVGs to replace emojis
const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  </svg>
);

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const RobotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const stages = ['Submitted', 'Under Review', 'Offer Received', 'Payment Pending', 'Visa Processing', 'Approved'];
const currentStage = 2; // 0-indexed

const stats = [
  { label: 'Active Applications', value: '2',     icon: <ClipboardIcon />, color: 'blue'    },
  { label: 'Documents Uploaded',  value: '7',     icon: <FolderIcon />,    color: 'purple'  },
  { label: 'Escrow Held',         value: '৳45K',  icon: <LockIcon />,      color: 'amber'   },
  { label: 'AI Scans Done',       value: '3',     icon: <RobotIcon />,     color: 'emerald' },
];

const activity = [
  { time: '2h ago', text: 'Offer letter uploaded by Global Edu BD', type: 'doc' },
  { time: '1d ago', text: 'Application stage advanced to Offer Received', type: 'stage' },
  { time: '2d ago', text: 'Milestone ৳15,000 held in escrow', type: 'payment' },
  { time: '3d ago', text: 'Document fraud scan completed — Low Risk', type: 'ai' },
  { time: '5d ago', text: 'Application submitted to Global Edu BD', type: 'submit' },
];

const typeColors: Record<string, string> = {
  doc: 'var(--blue-primary)', 
  stage: 'var(--emerald)', 
  payment: 'var(--amber)', 
  ai: 'var(--purple-accent)', 
  submit: 'var(--cyan)',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [docCount, setDocCount] = useState<number | null>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [benchmark, setBenchmark] = useState<any>(null);

  useEffect(() => {
    const owner = user?.id || 'usr-student-01';
    fetch(`/api/documents?ownerId=${encodeURIComponent(owner)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.documents) {
          setDocCount(data.documents.length);
          setRecentDocs(data.documents.slice(0, 3));
        }
      })
      .catch(() => {});

    // Fetch official benchmark for student's primary target country (Germany/Canada)
    const targetCountry = user?.studentDetails?.targetCountries?.[0] || 'Germany';
    const cleanCountry = targetCountry.replace(/[^\w\s]/gi, '').trim() || 'Germany';
    fetch(`/api/provenance/benchmarks?country=${encodeURIComponent(cleanCountry)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.benchmark) setBenchmark(data.benchmark);
      })
      .catch(() => {});
  }, [user?.id, user?.studentDetails?.targetCountries]);

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const dynamicStats = [
    {
      label: 'Active Applications',
      value: '2',
      badge: 'Canada & UK',
      meta: 'Targeting Fall 2025 intake',
      icon: <ClipboardIcon />,
      color: 'blue',
    },
    {
      label: 'Documents Uploaded',
      value: docCount !== null ? String(docCount) : '7',
      badge: 'Verified',
      meta: 'SOP, IELTS & Transcripts',
      icon: <FolderIcon />,
      color: 'purple',
    },
    {
      label: 'Escrow Protection',
      value: '৳45,000',
      badge: 'Protected',
      meta: 'Released on milestone approval',
      icon: <LockIcon />,
      color: 'amber',
    },
    {
      label: 'AI Scans Completed',
      value: '3',
      badge: 'Low Risk',
      meta: 'Fraud & visa readiness passed',
      icon: <RobotIcon />,
      color: 'emerald',
    },
  ];

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetingText}>{timeGreeting}, {firstName} 👋</h1>
          <p className={styles.greetingSubtitle}>Here&apos;s your application summary for today.</p>
        </div>
        <Link href="/dashboard/applications">
          <Button variant="outline" size="sm">View All Applications</Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow} role="list" aria-label="Dashboard statistics">
        {dynamicStats.map((s) => (
          <div key={s.label} className={`${styles.statCard} ${styles[`stat-${s.color}`]}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>{s.label}</span>
              <div className={styles.statIconWrap} aria-hidden="true">{s.icon}</div>
            </div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statFooter}>
              <span className={`${styles.statBadge} ${styles[`badge-${s.color}`]}`}>{s.badge}</span>
              <span className={styles.statMetaText}>{s.meta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Official Claimable Financial Solvency Card (e.g. Germany Blocked Account, Canada GIC) */}
      {benchmark && (
        <div style={{
          background: 'var(--glass-bg)',
          border: '2px solid var(--emerald)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '20px' }}>🏛️</span>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                  Target Country Solvency: {benchmark.country} {benchmark.requirementType.replace(/_/g, ' ')}
                </strong>
                <Badge variant="verified" size="sm">Admin Verified</Badge>
                <Badge variant="info" size="sm">Agency Certified</Badge>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Official mandatory financial proof required by embassy: <strong>৳{benchmark.blockedAccountOrGicBdt.toLocaleString('en-IN')} BDT</strong>
                {benchmark.currency !== 'BDT' && ` (~${benchmark.currency} ${(benchmark.blockedAccountOrGicBdt / benchmark.exchangeRateBdt).toLocaleString(undefined, { maximumFractionDigits: 0 })})`}.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px' }}>
                <span>📍 <strong>Claimable Source:</strong> <a href={benchmark.officialGovUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-primary)', textDecoration: 'underline' }}>{benchmark.officialGovSourceTitle} ↗</a></span>
                <span>🏢 <strong>Agency Verification:</strong> Verified by Global Edu BD &amp; licensed consultancies</span>
                <span>🔍 <strong>Audit Status:</strong> 0.0% discrepancy vs official visa regulations</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: '160px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Official Requirement</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald)', letterSpacing: '-0.02em' }}>
                ৳{benchmark.blockedAccountOrGicBdt.toLocaleString('en-IN')}
              </div>
              <Link href="/dashboard/campus-living" style={{ fontSize: '12px', color: 'var(--blue-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                Explore Monthly Living Breakdown →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* Active Application Card */}
        <div className={styles.appCard}>
          <div style={{ padding: 'var(--space-6)' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Active Application</h2>
              <Badge variant="pending" size="sm">Payment Pending</Badge>
            </div>

            <div className={styles.appInfo}>
              <div className={styles.appAgency}>
                <div className={styles.agencyLogo} aria-hidden="true">G</div>
                <div>
                  <div className={styles.agencyName}>Global Edu BD</div>
                  <Badge variant="verified" size="sm">Verified</Badge>
                </div>
              </div>
              <div className={styles.appTarget}>
                <span className={styles.appLabel}>Target</span>
                <span>University of Toronto, Canada 🇨🇦</span>
              </div>
            </div>

            {/* Stage Progress */}
            <div className={styles.stageSection} aria-label="Application progress">
              <div className={styles.stageBar} role="progressbar" aria-valuemin={0} aria-valuemax={stages.length - 1} aria-valuenow={currentStage}>
                {stages.map((s, i) => (
                  <div key={s} className={styles.stageWrap}>
                    <div className={`${styles.stageDot} ${i < currentStage ? styles.stageDone : ''} ${i === currentStage ? styles.stageCurrent : ''}`} title={s}>
                      {i < currentStage ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : i + 1}
                      {i === currentStage && <span className={styles.stagePulse} aria-hidden="true" />}
                    </div>
                    {i < stages.length - 1 && (
                      <div className={`${styles.stageLine} ${i < currentStage ? styles.stageLineDone : ''}`} aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.stageLabels} aria-hidden="true">
                {stages.map((s, i) => (
                  <span key={s} className={`${styles.stageLabel} ${i === currentStage ? styles.stageLabelActive : ''}`}>{s}</span>
                ))}
              </div>
            </div>

            <div className={styles.appActions}>
              <Link href="/dashboard/applications/app-001" style={{ flex: 1 }}>
                <Button size="md" variant="outline" fullWidth>View Details</Button>
              </Link>
              <Link href="/dashboard/payments" style={{ flex: 1 }}>
                <Button size="md" variant="emerald" fullWidth glow>Pay Milestone ৳15,000</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Document Storage Vault Card */}
        <div className={styles.activityCard}>
          <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '8px' }}>
              <h2 className={styles.cardTitle}>Document Storage Vault</h2>
              <Link href="/dashboard/documents">
                <Button size="sm" variant="outline">+ Upload Document</Button>
              </Link>
            </div>
            {recentDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No documents uploaded yet.</p>
                <Link href="/dashboard/documents" style={{ display: 'inline-block', marginTop: '10px' }}>
                  <Button size="sm" variant="emerald">Upload First Document</Button>
                </Link>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentDocs.map((doc: any) => (
                  <li key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '20px' }}>📄</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }} title={doc.name}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {doc.size} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={doc.verdict === 'likely_genuine' ? 'verified' : 'info'} size="sm">
                        {doc.verdict === 'likely_genuine' ? 'Verified' : 'Uploaded'}
                      </Badge>
                      {doc.storageUrl && (
                        <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--blue-primary)', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', textDecoration: 'none' }}>
                          View ↗
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '12px', textAlign: 'center' }}>
              <Link href="/dashboard/documents" style={{ fontSize: '12px', color: 'var(--blue-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                Open Full Document Vault ({docCount || 0} Files) →
              </Link>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className={styles.activityCard} style={{ gridColumn: '1 / -1' }}>
          <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <ol className={styles.activityList} aria-label="Recent activity">
              {activity.map((a, i) => (
                <li key={i} className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ color: typeColors[a.type] }} aria-hidden="true" />
                  <div className={styles.activityBody}>
                    <p className={styles.activityText}>{a.text}</p>
                    <time className={styles.activityTime}>{a.time}</time>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        {[
          { href: '/dashboard/documents', icon: <FolderIcon />, label: 'Upload Documents' },
          { href: '/dashboard/fraud-checker', icon: <RobotIcon />, label: 'AI Fraud Checker' },
          { href: '/directory',           icon: <SearchIcon />, label: 'Find Agencies' },
          { href: '/dashboard/chat',      icon: <ChatIcon />,   label: 'Chat with Agency' },
        ].map(q => (
          <Link key={q.href} href={q.href}>
            <div className={styles.quickCard} style={{ padding: 'var(--space-3)' }}>
              <span className={styles.quickIcon} aria-hidden="true">{q.icon}</span>
              <span className={styles.quickLabel}>{q.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
