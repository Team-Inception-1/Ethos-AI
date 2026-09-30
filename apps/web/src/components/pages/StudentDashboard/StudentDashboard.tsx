'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { applicationListSchema, stageLabel } from '@/lib/applications/contracts';
import { useApplicationData } from '@/lib/applications/use-data';
import styles from './StudentDashboard.module.css';

const ClipboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>;
const FolderIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

const STAGES = ['SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] as const;

function formatMoney(poisha: string) {
  return (Number(poisha) / 100).toLocaleString(undefined, { style: 'currency', currency: 'BDT' });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, error, loading, retry } = useApplicationData('/api/applications', applicationListSchema);
  const primary = data?.applications[0];
  const currentStage = primary
    ? Math.max(0, STAGES.indexOf(primary.stage === 'VISA_REJECTED' ? 'VISA_PROCESSING' : primary.stage))
    : 0;
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const stats = data ? [
    { label: 'Active Applications', value: String(data.summary.activeApplications), meta: `${data.total} total`, icon: <ClipboardIcon />, color: 'blue' },
    { label: 'Application Documents', value: String(data.summary.documentCount), meta: 'Accessible to you', icon: <FolderIcon />, color: 'purple' },
    { label: 'Escrow Held', value: formatMoney(data.summary.heldPoisha), meta: 'Across accessible applications', icon: <LockIcon />, color: 'amber' },
  ] : [];

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetingText}>{greeting}, {firstName}</h1>
          <p className={styles.greetingSubtitle}>Here is the latest data from your account.</p>
        </div>
        <Link href="/dashboard/applications"><Button variant="outline" size="sm">View all applications</Button></Link>
      </div>

      {loading && <GlassCard padding="lg"><p role="status">Loading dashboard…</p></GlassCard>}
      {error && (
        <GlassCard padding="lg">
          <p role="alert">{error}</p>
          <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
        </GlassCard>
      )}

      {data && (
        <>
          <div className={styles.statsRow} role="list" aria-label="Dashboard statistics">
            {stats.map((stat) => (
              <div key={stat.label} className={`${styles.statCard} ${styles[`stat-${stat.color}`]}`} role="listitem">
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <div className={styles.statIconWrap} aria-hidden="true">{stat.icon}</div>
                </div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statFooter}><span className={styles.statMetaText}>{stat.meta}</span></div>
              </div>
            ))}
          </div>

          <div className={styles.grid}>
            <div className={styles.appCard}>
              <div style={{ padding: 'var(--space-6)' }}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Most recently updated application</h2>
                  {primary && <Badge variant={primary.stage === 'VISA_REJECTED' ? 'rejected' : 'info'} size="sm">{stageLabel(primary.stage)}</Badge>}
                </div>

                {!primary ? (
                  <div>
                    <p>No applications are available to your account.</p>
                    <Link href="/directory"><Button size="sm" variant="outline">Find an agency</Button></Link>
                  </div>
                ) : (
                  <>
                    <div className={styles.appInfo}>
                      <div className={styles.appAgency}>
                        <div className={styles.agencyLogo} aria-hidden="true">{primary.agency.name.slice(0, 1).toUpperCase()}</div>
                        <div><div className={styles.agencyName}>{primary.agency.name}</div><Badge variant="neutral" size="sm">{primary.targetCountry}</Badge></div>
                      </div>
                      <div className={styles.appTarget}><span className={styles.appLabel}>Target</span><span>{primary.targetUniversity} · {primary.targetProgram}</span></div>
                    </div>
                    <div className={styles.stageSection} aria-label="Application progress">
                      <div className={styles.stageBar} role="progressbar" aria-valuemin={0} aria-valuemax={STAGES.length - 1} aria-valuenow={currentStage}>
                        {STAGES.map((stage, index) => (
                          <div key={stage} className={styles.stageWrap}>
                            <div className={`${styles.stageDot} ${index < currentStage ? styles.stageDone : ''} ${index === currentStage ? styles.stageCurrent : ''}`} title={stageLabel(stage)}>
                              {index < currentStage ? '✓' : index + 1}
                              {index === currentStage && <span className={styles.stagePulse} aria-hidden="true" />}
                            </div>
                            {index < STAGES.length - 1 && <div className={`${styles.stageLine} ${index < currentStage ? styles.stageLineDone : ''}`} />}
                          </div>
                        ))}
                      </div>
                      <div className={styles.stageLabels} aria-hidden="true">
                        {STAGES.map((stage, index) => <span key={stage} className={`${styles.stageLabel} ${index === currentStage ? styles.stageLabelActive : ''}`}>{stageLabel(stage)}</span>)}
                      </div>
                    </div>
                    <div className={styles.appActions}>
                      <Link href={`/dashboard/applications/${primary.id}`} style={{ flex: 1 }}><Button size="md" variant="outline" fullWidth>View details</Button></Link>
                      <Link href="/dashboard/payments" style={{ flex: 1 }}><Button size="md" variant="emerald" fullWidth>View milestones</Button></Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.activityCard}>
              <div style={{ padding: 'var(--space-6)' }}>
                <h2 className={styles.cardTitle}>Recent application updates</h2>
                {data.applications.length === 0 ? <p>No updates yet.</p> : (
                  <ol className={styles.activityList} aria-label="Recent application updates">
                    {data.applications.slice(0, 5).map((application) => (
                      <li key={application.id} className={styles.activityItem}>
                        <div className={styles.activityDot} aria-hidden="true" />
                        <div className={styles.activityBody}>
                          <p className={styles.activityText}>{application.targetUniversity}: {stageLabel(application.stage)}</p>
                          <time className={styles.activityTime} dateTime={application.updatedAt}>Updated {formatDate(application.updatedAt)}</time>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
