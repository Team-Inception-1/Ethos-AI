'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { z } from 'zod';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { applicationListSchema, stageLabel, type ApplicationItem } from '@/lib/applications/contracts';
import { useApplicationData } from '@/lib/applications/use-data';
import { ApplicationListSkeleton } from '@/components/ui/Skeleton';
import styles from './ApplicationsPage.module.css';

type BadgeVariant = 'verified' | 'pending' | 'rejected' | 'warning' | 'info';

const agencyListSchema = z.object({ agencies: z.array(z.object({
  id: z.string(),
  name: z.string(),
  pricingServices: z.array(z.object({
    id: z.string(),
    serviceName: z.string(),
    amountPoisha: z.string(),
    whenCharged: z.string(),
    refundable: z.boolean(),
    conditions: z.string().nullable(),
  })),
})) });
const mutationSchema = z.object({
  data: z.object({
    application: z.object({
      id: z.string(),
      milestoneCount: z.number().optional().default(0),
    }),
  }),
});
const mutationErrorSchema = z.object({ error: z.object({ message: z.string() }) });

type ApplicationsPageProps = { initialAgencyId?: string };

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

export default function ApplicationsPage({ initialAgencyId = '' }: ApplicationsPageProps) {
  const { data, error, loading, retry } = useApplicationData('/api/applications', applicationListSchema);
  const agencies = useApplicationData('/api/agencies', agencyListSchema);
  const [isFormOpen, setIsFormOpen] = useState(Boolean(initialAgencyId));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    agencyId: initialAgencyId,
    pricingServiceIds: [] as string[],
    targetCountry: 'Canada',
    targetUniversity: '',
    targetProgram: '',
    intakeSemester: 'Fall 2027',
  });
  const selectedAgency = agencies.data?.agencies.find(agency => agency.id === form.agencyId);

  function togglePricingService(pricingServiceId: string) {
    setForm(value => ({
      ...value,
      pricingServiceIds: value.pricingServiceIds.includes(pricingServiceId)
        ? value.pricingServiceIds.filter(id => id !== pricingServiceId)
        : [...value.pricingServiceIds, pricingServiceId],
    }));
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const failure = mutationErrorSchema.safeParse(body);
        throw new Error(failure.success ? failure.data.error.message : 'Could not create the application.');
      }
      const created = mutationSchema.parse(body);
      const count = created.data.application.milestoneCount;
      setCreatedMessage(
        count > 0
          ? `Application ${created.data.application.id.slice(0, 8)} was created and ${count} escrow milestone${count === 1 ? '' : 's'} are ready.`
          : `Application ${created.data.application.id.slice(0, 8)} was created.`
      );
      setIsFormOpen(false);
      setForm(value => ({ ...value, pricingServiceIds: [], targetUniversity: '', targetProgram: '' }));
      retry();
    } catch (submissionError) {
      setSubmitError(submissionError instanceof Error ? submissionError.message : 'Could not create the application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>My Applications</h1>
          <p className={styles.target}>Applications available to your signed-in account.</p>
        </div>
        <Button size="sm" onClick={() => { setSubmitError(null); setIsFormOpen(true); }}>+ New Application</Button>
      </div>

      {createdMessage && <div className={styles.successBanner} role="status">✓ {createdMessage}</div>}

      {loading && <ApplicationListSkeleton count={3} />}

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

      {isFormOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !submitting) setIsFormOpen(false);
        }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="new-application-title">
            <div className={styles.modalHeader}>
              <div>
                <h2 id="new-application-title">Start a protected application</h2>
                <p>Your identity is taken from your signed-in account. Fees use the agency’s verified pricing.</p>
              </div>
              <button type="button" className={styles.closeButton} aria-label="Close application form"
                onClick={() => setIsFormOpen(false)} disabled={submitting}>×</button>
            </div>
            <form className={styles.form} onSubmit={submitApplication}>
              <label>Verified agency
                <select required value={form.agencyId} onChange={event => setForm({
                  ...form,
                  agencyId: event.target.value,
                  pricingServiceIds: [],
                })}>
                  <option value="">Select an agency</option>
                  {agencies.data?.agencies.map(agency => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
                </select>
              </label>
              {agencies.loading && <p className={styles.formHint}>Loading verified agencies…</p>}
              {agencies.error && <p role="alert" className={styles.formError}>{agencies.error}</p>}
              {selectedAgency && (
                <fieldset className={styles.packageFieldset}>
                  <legend>Service packages</legend>
                  <p className={styles.formHint}>Choose the agency services to include as protected escrow milestones.</p>
                  {selectedAgency.pricingServices.length === 0 ? (
                    <p role="alert" className={styles.formError}>This agency has no approved service packages.</p>
                  ) : (
                    <div className={styles.packageList}>
                      {selectedAgency.pricingServices.map(service => {
                        const checked = form.pricingServiceIds.includes(service.id);
                        return (
                          <label key={service.id} className={`${styles.packageOption} ${checked ? styles.packageOptionSelected : ''}`}>
                            <input type="checkbox" checked={checked} onChange={() => togglePricingService(service.id)} />
                            <span className={styles.packageContent}>
                              <span className={styles.packageHeading}>
                                <strong>{service.serviceName}</strong>
                                <strong>{(Number(service.amountPoisha) / 100).toLocaleString(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })}</strong>
                              </span>
                              <span>{service.whenCharged}{service.refundable ? ' · Refundable' : ' · Non-refundable'}</span>
                              {service.conditions && <small>{service.conditions}</small>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              )}
              <div className={styles.formGrid}>
                <label>Destination country
                  <input required minLength={2} maxLength={100} value={form.targetCountry}
                    onChange={event => setForm({ ...form, targetCountry: event.target.value })} />
                </label>
                <label>Intake
                  <input required minLength={2} maxLength={100} placeholder="Fall 2027" value={form.intakeSemester}
                    onChange={event => setForm({ ...form, intakeSemester: event.target.value })} />
                </label>
              </div>
              <label>University
                <input required minLength={2} maxLength={200} placeholder="University of British Columbia" value={form.targetUniversity}
                  onChange={event => setForm({ ...form, targetUniversity: event.target.value })} />
              </label>
              <label>Program
                <input required minLength={2} maxLength={200} placeholder="M.Sc. in Computer Science" value={form.targetProgram}
                  onChange={event => setForm({ ...form, targetProgram: event.target.value })} />
              </label>
              {submitError && <p role="alert" className={styles.formError}>{submitError}</p>}
              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" variant="emerald" loading={submitting}
                  disabled={!form.agencyId || form.pricingServiceIds.length === 0 || agencies.loading}>
                  Create protected application
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
