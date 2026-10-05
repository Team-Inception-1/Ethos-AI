'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { applicationDetailSchema, stageLabel } from '@/lib/applications/contracts';
import { useApplicationData } from '@/lib/applications/use-data';
import { ApplicationDetailSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import styles from './ApplicationDetailPage.module.css';

const STAGES = ['SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED', 'PAYMENT_PENDING', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] as const;
const TABS = ['Overview', 'Documents', 'Milestones', 'Chat'] as const;
type Tab = (typeof TABS)[number];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatMoney(poisha: string) {
  return (Number(poisha) / 100).toLocaleString(undefined, { style: 'currency', currency: 'BDT' });
}

function milestoneVariant(status: string): 'verified' | 'warning' | 'danger' | 'info' | 'pending' {
  if (status === 'RELEASED' || status === 'REFUNDED') return 'verified';
  if (status === 'DISPUTED') return 'danger';
  if (status === 'HELD') return 'warning';
  if (status === 'PENDING') return 'pending';
  return 'info';
}

export default function ApplicationDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const { data, error, loading, retry } = useApplicationData(`/api/applications/${encodeURIComponent(id)}`, applicationDetailSchema);
  const application = data?.application;
  const progressIndex = application
    ? Math.max(0, STAGES.indexOf(application.stage === 'VISA_REJECTED' ? 'VISA_PROCESSING' : application.stage))
    : 0;

  const isStudentOwner =
    user?.role?.toLowerCase() === 'student' &&
    application?.student?.id === user?.id;
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const hasActiveEscrow = application?.milestones.some(
    (m) => m.status === 'HELD' || m.status === 'DISPUTED'
  ) ?? false;

  const canWithdraw =
    (isStudentOwner || isAdmin) &&
    application &&
    application.stage !== 'COMPLETED' &&
    application.stage !== 'VISA_APPROVED' &&
    !hasActiveEscrow;

  async function handleWithdrawSubmit() {
    if (!application) return;
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(application.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: withdrawReason }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Could not withdraw application.');
      }
      router.push('/dashboard/applications?withdrawn=true');
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Failed to withdraw application.');
      setWithdrawing(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/dashboard/applications" className={styles.backLink}>← Back to applications</Link>

      {loading && <ApplicationDetailSkeleton />}
      {error && (
        <GlassCard padding="lg">
          <p role="alert">{error}</p>
          <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
        </GlassCard>
      )}

      {application && (
        <>
          <div className={styles.header}>
            <div>
              <h1>{application.targetUniversity}</h1>
              <p className={styles.subtitle}>{application.targetProgram} · {application.targetCountry}</p>
              {application.intakeSemester && <p className={styles.subtitle}>Intake: {application.intakeSemester}</p>}
            </div>
            <div className={styles.headerRight}>
              <Badge variant={application.stage === 'VISA_REJECTED' ? 'rejected' : 'info'} size="md">
                {stageLabel(application.stage)}
              </Badge>
              {canWithdraw && (
                <Button
                  size="sm"
                  variant="outline"
                  className={styles.withdrawHeaderBtn}
                  onClick={() => {
                    setWithdrawError(null);
                    setWithdrawOpen(true);
                  }}
                >
                  Withdraw Application
                </Button>
              )}
            </div>
          </div>


          <GlassCard padding="lg" className={styles.stageCard}>
            <h2 className={styles.cardTitle}>Application progress</h2>
            <div className={styles.stageBar} role="progressbar" aria-valuemin={0} aria-valuemax={STAGES.length - 1} aria-valuenow={progressIndex}>
              {STAGES.map((stage, index) => (
                <div key={stage} className={styles.stageWrap}>
                  <div className={`${styles.stageDot} ${index < progressIndex ? styles.done : ''} ${index === progressIndex ? styles.current : ''}`}>
                    {index < progressIndex ? '✓' : index + 1}
                    {index === progressIndex && <span className={styles.pulse} aria-hidden="true" />}
                  </div>
                  {index < STAGES.length - 1 && <div className={`${styles.line} ${index < progressIndex ? styles.lineDone : ''}`} />}
                </div>
              ))}
            </div>
            <div className={styles.stageLabels} aria-hidden="true">
              {STAGES.map((stage, index) => <span key={stage} className={`${styles.stageLabel} ${index === progressIndex ? styles.labelActive : ''}`}>{stageLabel(stage)}</span>)}
            </div>
          </GlassCard>

          <div className={styles.tabs} role="tablist" aria-label="Application details">
            {TABS.map((tab) => (
              <button key={tab} type="button" role="tab" aria-selected={activeTab === tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <>
              <GlassCard padding="lg">
                <h2 className={styles.cardTitle}>Recorded activity</h2>
                {application.stageEvents.length === 0 ? <p>No stage updates have been recorded.</p> : (
                  <div className={styles.historyList}>
                    {application.stageEvents.map((event) => (
                      <div key={event.id} className={styles.historyItem}>
                        <div className={styles.historyDot} aria-hidden="true" />
                        <div className={styles.historyCard}>
                          <div className={styles.historyHeader}>
                            <span className={styles.historyStage}>{stageLabel(event.stage)}</span>
                            <time className={styles.historyTime} dateTime={event.timestamp}>{formatDate(event.timestamp)}</time>
                          </div>
                          {event.note && <p className={styles.historyNote}>{event.note}</p>}
                          <p className={styles.historyActor}>Updated by {event.actor.name} ({stageLabel(event.actorRole)})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {canWithdraw && (
                <GlassCard padding="lg" className={styles.withdrawCard}>
                  <div className={styles.withdrawCardContent}>
                    <div>
                      <h3 className={styles.withdrawCardTitle}>Cancel or Withdraw Application</h3>
                      <p className={styles.withdrawCardText}>
                        If your study abroad plans changed or you wish to switch consultancies, you can withdraw this application before milestone escrow is funded.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className={styles.withdrawHeaderBtn}
                      onClick={() => {
                        setWithdrawError(null);
                        setWithdrawOpen(true);
                      }}
                    >
                      Withdraw Application
                    </Button>
                  </div>
                </GlassCard>
              )}

              {isStudentOwner && hasActiveEscrow && (
                <GlassCard padding="lg" className={styles.withdrawLockedCard}>
                  <div className={styles.withdrawCardContent}>
                    <div>
                      <h3 className={styles.withdrawCardTitle}>🛡️ Escrow Funds Protected</h3>
                      <p className={styles.withdrawCardText}>
                        This application has active funds in milestone escrow. To cancel or withdraw, please request a milestone refund or open a dispute in the Escrow dashboard first.
                      </p>
                    </div>
                    <Link href="/dashboard/payments">
                      <Button size="sm" variant="emerald">Manage Escrow →</Button>
                    </Link>
                  </div>
                </GlassCard>
              )}
            </>
          )}

          {activeTab === 'Documents' && (
            <GlassCard padding="lg">
              <h2 className={styles.cardTitle}>Documents ({application.documentCount})</h2>
              {application.documents.length === 0 ? <p>No accessible documents are attached.</p> : (
                <div className={styles.historyList}>
                  {application.documents.map((document) => (
                    <div key={document.id} className={styles.historyCard}>
                      <strong>{document.fileName}</strong>
                      <p className={styles.historyNote}>{document.mimeType} · {(document.fileSize / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB</p>
                      <time className={styles.historyTime} dateTime={document.uploadedAt}>Uploaded {formatDate(document.uploadedAt)}</time>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {activeTab === 'Milestones' && (
            <div className={styles.milestones}>
              {application.milestones.length === 0 ? <GlassCard padding="lg"><p>No milestones have been created.</p></GlassCard> : application.milestones.map((milestone) => (
                <GlassCard key={milestone.id} padding="lg" className={styles.milestoneCard}>
                  <div className={styles.milestoneHeader}>
                    <div>
                      <div className={styles.milestoneName}>{milestone.name}</div>
                      <p className={styles.milestoneCondition}>{milestone.releaseCondition}</p>
                      {milestone.dueDate && <time className={styles.historyTime} dateTime={milestone.dueDate}>Due {formatDate(milestone.dueDate)}</time>}
                    </div>
                    <div className={styles.milestoneRight}>
                      <span className={styles.milestoneAmount}>{formatMoney(milestone.amountPoisha)}</span>
                      <Badge variant={milestoneVariant(milestone.status)} size="sm">{stageLabel(milestone.status)}</Badge>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'Chat' && (
            <GlassCard padding="lg" className={styles.placeholder}>
              {application.chatThread ? (
                <><h2>Application conversation</h2><p>A conversation is linked to this application.</p><Link href={`/dashboard/chat?thread=${encodeURIComponent(application.chatThread.id)}`}><Button size="sm">Open chat</Button></Link></>
              ) : (
                <><h2>No conversation</h2><p>No chat thread has been created for this application.</p></>
              )}
            </GlassCard>
          )}

          {withdrawOpen && (
            <div
              className={styles.modalBackdrop}
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget && !withdrawing) setWithdrawOpen(false);
              }}
            >
              <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="withdraw-dialog-title"
              >
                <div className={styles.modalHeader}>
                  <div>
                    <h2 id="withdraw-dialog-title" className={styles.modalTitleDanger}>Withdraw Application</h2>
                    <p>
                      Are you sure you want to withdraw your application for <strong>{application.targetUniversity}</strong> ({application.targetCountry}) with <strong>{application.agency.name}</strong>?
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.closeButton}
                    aria-label="Close dialog"
                    onClick={() => setWithdrawOpen(false)}
                    disabled={withdrawing}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <p className={styles.withdrawWarning}>
                    ⚠️ This will cancel the application and notify <strong>{application.agency.name}</strong>. Attached documents will remain safe in your Document Vault.
                  </p>

                  <label className={styles.reasonLabel}>
                    Reason for withdrawal (optional)
                    <textarea
                      className={styles.reasonInput}
                      rows={3}
                      placeholder="e.g. Decided to defer intake, changed program preference, or choosing a different partner."
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      disabled={withdrawing}
                      maxLength={1000}
                    />
                  </label>

                  {withdrawError && (
                    <p role="alert" className={styles.modalError}>
                      {withdrawError}
                    </p>
                  )}

                  <div className={styles.modalActions}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setWithdrawOpen(false)}
                      disabled={withdrawing}
                    >
                      Keep Application
                    </Button>
                    <Button
                      type="button"
                      className={styles.confirmWithdrawBtn}
                      onClick={handleWithdrawSubmit}
                      disabled={withdrawing}
                    >
                      {withdrawing ? 'Withdrawing…' : 'Confirm Withdrawal'}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
