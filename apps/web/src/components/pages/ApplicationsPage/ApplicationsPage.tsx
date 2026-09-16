'use client';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import styles from './ApplicationsPage.module.css';

const APPS = [
  { id:'app-001', agency:'Global Edu BD',    target:'University of Toronto, Canada', stage:'Offer Received',    date:'Jul 25, 2026', status:'warning' as const },
  { id:'app-002', agency:'StudyBridge BD',   target:'Monash University, Australia',  stage:'Under Review',      date:'Jul 10, 2026', status:'info' as const    },
];

export default function ApplicationsPage() {
  const [shortlist, setShortlist] = React.useState<Array<{
    id: string;
    name: string;
    country: string;
    city: string;
    odds: number;
    tier: string;
  }>>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('ethos_counselor_shortlist');
      if (raw) setShortlist(JSON.parse(raw));
    } catch {
      // Ignore
    }
  }, []);

  const handleRemoveShortlist = (id: string) => {
    const updated = shortlist.filter((s) => s.id !== id);
    setShortlist(updated);
    try {
      localStorage.setItem('ethos_counselor_shortlist', JSON.stringify(updated));
      const trackedIds = updated.map((u) => u.id);
      localStorage.setItem('ethos_tracked_unis', JSON.stringify(trackedIds));
    } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Applications</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/counselor"><Button size="sm" variant="outline">✦ AI Counselor</Button></Link>
          <Link href="/directory"><Button size="sm">+ New Application</Button></Link>
        </div>
      </div>

      {/* Shortlisted Universities from AI Counselor */}
      {shortlist.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
              ✦ Shortlisted by AI Counselor ({shortlist.length})
            </h2>
            <Link href="/counselor">
              <Button size="sm" variant="ghost">Re-Evaluate Profile →</Button>
            </Link>
          </div>

          <div className={styles.list}>
            {shortlist.map((u) => (
              <GlassCard key={u.id} hover padding="md" className={styles.appRow}>
                <div className={styles.appLeft}>
                  <div className={styles.agencyLogo} style={{ background: '#8b5cf6' }}>🎓</div>
                  <div>
                    <div className={styles.agencyName}>{u.name}</div>
                    <div className={styles.target}>📍 {u.city}, {u.country}</div>
                    <div className={styles.date}>Admission Odds: {u.odds}% • Tier: {u.tier.toUpperCase()}</div>
                  </div>
                </div>
                <div className={styles.appRight}>
                  <Badge variant={u.tier === 'dream' ? 'warning' : u.tier === 'safe' ? 'verified' : 'info'} size="md">
                    {u.tier.toUpperCase()}
                  </Badge>
                  <Link href={`/directory?country=${encodeURIComponent(u.country)}`}>
                    <Button size="sm" variant="primary">🏢 Find Agency & Apply →</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveShortlist(u.id)} title="Remove from shortlist">
                    ✕
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: shortlist.length > 0 ? 'var(--space-4)' : 0 }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', margin: '0 0 var(--space-3) 0' }}>
          Active Agency Applications
        </h2>
        <div className={styles.list} role="list" aria-label="Applications list">
          {APPS.map(app => (
            <GlassCard key={app.id} hover padding="lg" className={styles.appRow}>
              <div className={styles.appLeft}>
                <div className={styles.agencyLogo} aria-hidden="true">{app.agency[0]}</div>
                <div>
                  <div className={styles.agencyName}>{app.agency}</div>
                  <div className={styles.target}>{app.target}</div>
                  <div className={styles.date}>Applied {app.date}</div>
                </div>
              </div>
              <div className={styles.appRight}>
                <Badge variant={app.status === 'warning' ? 'warning' : 'info'} size="md">{app.stage}</Badge>
                <Link href={`/dashboard/applications/${app.id}`}>
                  <Button size="sm" variant="ghost">View Details →</Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Empty State Placeholder for members */}
      <div className={styles.emptyHint}>
        <p className={styles.hint}>🔧 <strong>@backend</strong>: Wire to <code>GET /applications</code> and replace mock data.</p>
      </div>
    </div>
  );
}
