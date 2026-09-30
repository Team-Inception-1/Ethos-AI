'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { applicationListSchema, stageLabel, type ApplicationItem } from '@/lib/applications/contracts';
import { useApplicationData } from '@/lib/applications/use-data';
import styles from './ApplicationsPage.module.css';

type BadgeVariant = 'verified' | 'pending' | 'rejected' | 'warning' | 'info';

function stageVariant(stage: ApplicationItem['stage']): BadgeVariant {
  if (stage === 'COMPLETED' || stage === 'VISA_APPROVED') return 'verified';
  if (stage === 'VISA_REJECTED') return 'rejected';
  if (stage === 'OFFER_RECEIVED' || stage === 'PAYMENT_PENDING') return 'warning';
  if (stage === 'UNDER_REVIEW' || stage === 'VISA_PROCESSING') return 'info';
  return 'pending';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export default function ApplicationsPage() {
  const { data, error, loading, retry } = useApplicationData('/api/applications', applicationListSchema);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>My Applications</h1>
          <p className={styles.target}>Applications available to your signed-in account.</p>
        </div>
        <Link href="/directory"><Button size="sm">+ New Application</Button></Link>
      </div>

      {loading && <GlassCard padding="lg"><p role="status">Loading applications…</p></GlassCard>}

      {error && (
        <GlassCard padding="lg">
          <p role="alert">{error}</p>
          <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
        </GlassCard>
      )}

      {data && data.applications.length === 0 && (
        <GlassCard padding="lg">
          <h2>No applications yet</h2>
          <p className={styles.target}>When an application is created, its verified status and milestones will appear here.</p>
          <Link href="/directory"><Button size="sm" variant="outline">Find an agency</Button></Link>
        </GlassCard>
      )}

      {data && data.applications.length > 0 && (
        <div className={styles.list} role="list" aria-label="Applications list">
          {data.applications.map((application) => (
            <GlassCard key={application.id} hover padding="lg" className={styles.appRow}>
              <div className={styles.appLeft}>
                <div className={styles.agencyLogo} aria-hidden="true">{application.agency.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className={styles.agencyName}>{application.agency.name}</div>
                  <div className={styles.target}>{application.targetUniversity}, {application.targetCountry}</div>
                  <div className={styles.date}>{application.targetProgram} · Updated {formatDate(application.updatedAt)}</div>
                </div>
              </div>
              <div className={styles.appRight}>
                <Badge variant={stageVariant(application.stage)} size="md">{stageLabel(application.stage)}</Badge>
                <Link href={`/dashboard/applications/${application.id}`}>
                  <Button size="sm" variant="ghost">View details →</Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {data && (
        <div className={styles.escrowBanner}>
          <div className={styles.escrowBannerLeft}>
            <div className={styles.escrowShieldIcon} aria-hidden="true">🛡️</div>
            <div>
              <h3 className={styles.escrowBannerTitle}>Escrow summary</h3>
              <p className={styles.escrowBannerDesc}>
                {(Number(data.summary.heldPoisha) / 100).toLocaleString(undefined, { style: 'currency', currency: 'BDT' })} is currently held across the applications you can access.
              </p>
            </div>
          </div>
          <Link href="/dashboard/payments"><Button size="sm" variant="emerald">Manage escrow →</Button></Link>
        </div>
      )}
    </div>
  );
}
