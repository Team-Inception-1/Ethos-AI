'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { browserApi, errorMessage } from '@/lib/platform/browser';
import { stageTransitions, type AgencyDashboardData, type AgencyPayoutItem, type ApplicationStage, type BenchmarkView, type FeeSubmissionView } from '@/lib/platform/agency-contracts';
import { AdminTableSkeleton } from '@/components/ui/Skeleton';
import styles from './AgencyDashboard.module.css';

const tabs = ['applications', 'payouts', 'services', 'license', 'benchmarks'] as const;
const emptyPackage = { serviceName: '', country: '', amountBdt: '', whenCharged: '', refundPolicy: '', proofUrl: '' };
const emptyBenchmark = { country: '', countryCode: '', flagEmoji: '', currency: '', exchangeRateBdt: '',
  livingCostMonthlyBdtMin: '', livingCostMonthlyBdtMax: '', blockedAccountOrGicBdt: '', visaFeeBdt: '',
  healthInsuranceYearlyBdt: '', requirementType: 'BLOCKED_ACCOUNT', officialGovUrl: '', officialGovSourceTitle: '', notes: '' };
const moneyFields = [
  ['exchangeRateBdt', 'Exchange rate to BDT'], ['livingCostMonthlyBdtMin', 'Minimum monthly living cost (BDT)'],
  ['livingCostMonthlyBdtMax', 'Maximum monthly living cost (BDT)'], ['blockedAccountOrGicBdt', 'Required financial guarantee (BDT)'],
  ['visaFeeBdt', 'Visa fee (BDT)'], ['healthInsuranceYearlyBdt', 'Annual health insurance (BDT)'],
] as const;
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const fieldStyle = { display: 'grid', gap: 6, fontSize: 14 };
const inputStyle = { width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--bg-elevated)', color: 'var(--text-primary)' };
const STAGE_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  OFFER_RECEIVED: 'Offer Received',
  PAYMENT_PENDING: 'Payment Pending',
  VISA_PROCESSING: 'Visa Processing',
  VISA_APPROVED: 'Visa Approved',
  VISA_REJECTED: 'Visa Rejected',
  COMPLETED: 'Completed',
};
const human = (value: string) => STAGE_LABELS[value] ?? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const money = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

export default function AgencyDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = tabs.find(value => value === searchParams.get('tab')) ?? 'applications';
  const [dashboard, setDashboard] = useState<AgencyDashboardData | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkView[]>([]);
  const [submissions, setSubmissions] = useState<FeeSubmissionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [packageForm, setPackageForm] = useState(emptyPackage);
  const [showPackage, setShowPackage] = useState(false);
  const [benchmarkForm, setBenchmarkForm] = useState(emptyBenchmark);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AgencyDashboardData['applications'][number] | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<AgencyPayoutItem | null>(null);
  const [payoutFilter, setPayoutFilter] = useState<'ALL' | 'RELEASED' | 'AWAITING_ADMIN' | 'HELD'>('ALL');
  const [payoutSearch, setPayoutSearch] = useState('');
  const [nextStage, setNextStage] = useState<ApplicationStage>('UNDER_REVIEW');
  const [stageNote, setStageNote] = useState('');
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, benchmarkData, feeData] = await Promise.all([
        browserApi<AgencyDashboardData>('/api/agency/dashboard'),
        browserApi<{ benchmarks: BenchmarkView[] }>('/api/provenance/benchmarks?mine=true'),
        browserApi<{ submissions: FeeSubmissionView[] }>('/api/agency/fee-submissions'),
      ]);
      setDashboard(data); setBenchmarks(benchmarkData.benchmarks); setSubmissions(feeData.submissions); setError(null);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  async function mutate(work: () => Promise<void>) {
    setBusy(true); setError(null); setNotice(null);
    try { await work(); await refresh(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  function submitPackage(event: FormEvent) {
    event.preventDefault();
    void mutate(async () => {
      await browserApi('/api/agency/fee-submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...packageForm, amountBdt: Number(packageForm.amountBdt), refundable: true,
          proofDocumentUrls: [packageForm.proofUrl] }) });
      setShowPackage(false); setPackageForm(emptyPackage);
      setNotice('Package submitted for review. Published pricing changes only after approval.');
    });
  }
  function proposeBenchmark(event: FormEvent) {
    event.preventDefault();
    void mutate(async () => {
      await browserApi('/api/provenance/benchmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...benchmarkForm,
          ...Object.fromEntries(moneyFields.map(([key]) => [key, Number(benchmarkForm[key])])),
          keyRequirements: benchmarkForm.notes.split('\n').map(value => value.trim()).filter(Boolean),
        }) });
      setShowBenchmark(false); setNotice('Benchmark proposal saved for administrator review. The published source remains unchanged.');
    });
  }
  function editBenchmark(value: BenchmarkView) {
    setBenchmarkForm({ country: value.country, countryCode: value.countryCode, flagEmoji: value.flagEmoji,
      currency: value.currency, exchangeRateBdt: String(value.exchangeRateBdt),
      livingCostMonthlyBdtMin: String(value.livingCostMonthlyBdtMin), livingCostMonthlyBdtMax: String(value.livingCostMonthlyBdtMax),
      blockedAccountOrGicBdt: String(value.blockedAccountOrGicBdt), visaFeeBdt: String(value.visaFeeBdt),
      healthInsuranceYearlyBdt: String(value.healthInsuranceYearlyBdt), requirementType: value.requirementType,
      officialGovUrl: value.officialGovUrl, officialGovSourceTitle: value.officialGovSourceTitle, notes: value.keyRequirements.join('\n') });
    setShowBenchmark(true);
  }

  const filteredPayouts = (dashboard?.payouts ?? []).filter(p => {
    if (payoutFilter === 'RELEASED' && p.status !== 'RELEASED') return false;
    if (payoutFilter === 'AWAITING_ADMIN' && !(p.status === 'HELD' && p.releaseRequested)) return false;
    if (payoutFilter === 'HELD' && !(p.status === 'HELD' && !p.releaseRequested)) return false;
    if (!payoutSearch.trim()) return true;
    const term = payoutSearch.toLowerCase();
    return (
      p.student.name.toLowerCase().includes(term) ||
      p.student.email.toLowerCase().includes(term) ||
      p.milestoneName.toLowerCase().includes(term) ||
      p.application.targetUniversity.toLowerCase().includes(term) ||
      p.application.targetProgram.toLowerCase().includes(term) ||
      (p.providerTxnId && p.providerTxnId.toLowerCase().includes(term)) ||
      (p.txHash && p.txHash.toLowerCase().includes(term))
    );
  });

  return <div className={styles.page}>
    <div className={styles.header}>
      <div>
        <h1>Agency Management Portal</h1>
        <p className={styles.sub}>{dashboard?.agency.name ?? 'Agency account'} · {dashboard?.agency.licenseNo ?? 'Loading profile'}</p>
        {dashboard && <Badge variant={dashboard.agency.licenseStatus === 'VERIFIED' ? 'verified' : 'pending'}>{dashboard.agency.licenseStatus}</Badge>}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={() => void refresh()} loading={loading}>Refresh</Button>
        <Button variant="primary" onClick={() => router.push('/agency/dashboard?tab=payouts', { scroll: false })}>
          💰 Escrow Payouts {dashboard?.payoutsSummary ? `(${money(dashboard.payoutsSummary.totalReleasedBdt)})` : ''}
        </Button>
      </div>
    </div>
    {error && <div role="alert" style={{ color: 'var(--red, #b91c1c)' }}>{error}</div>}
    {notice && <div role="status">{notice}</div>}
    <nav aria-label="Agency sections" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {tabs.map(value => <Button key={value} variant={tab === value ? 'primary' : 'outline'}
        onClick={() => router.push(`/agency/dashboard?tab=${value}`, { scroll: false })}>
        {value === 'license' ? 'License & documents' : value === 'payouts' ? 'Escrow & Payouts' : human(value)}
      </Button>)}
    </nav>
    {!dashboard && loading && <AdminTableSkeleton rows={4} />}
    {dashboard && tab === 'applications' && <>
      <div style={grid}>
        <GlassCard>
          <h2>{dashboard.applications.length}</h2>
          <p>Applications in this view</p>
        </GlassCard>
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: '#10b981' }}>{money(dashboard.payoutsSummary?.totalReleasedBdt ?? 0)}</h2>
              <p>Total Received Payouts (Admin Released)</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push('/agency/dashboard?tab=payouts', { scroll: false })}>
              View Payouts →
            </Button>
          </div>
        </GlassCard>
        <GlassCard>
          <h2>{money(dashboard.payoutsSummary?.totalHeldBdt ?? dashboard.applications.reduce((sum, app) => sum + app.heldBdt, 0))}</h2>
          <p>Recorded Held Escrow</p>
        </GlassCard>
        <GlassCard>
          <h2 style={{ color: '#f59e0b' }}>{money(dashboard.payoutsSummary?.totalPendingAdminBdt ?? 0)}</h2>
          <p>Awaiting Admin Verification</p>
        </GlassCard>
      </div>
      {dashboard.agency.licenseStatus !== 'VERIFIED' && <p>Student records become accessible after agency verification.</p>}
      <p>Applications appear here after students are linked to your agency. New applicant onboarding is not available in this portal.</p>
      <input aria-label="Search applications" placeholder="Search student, university or program" style={inputStyle} value={search} onChange={event => setSearch(event.target.value)} />
      <GlassCard className={styles.tableCard}><table className={styles.table}><thead><tr><th>Student</th><th>Application</th><th>Stage</th><th>Held escrow</th><th>Actions</th></tr></thead><tbody>
        {dashboard.applications.filter(app => `${app.student.name} ${app.targetUniversity} ${app.targetProgram}`.toLowerCase().includes(search.toLowerCase())).map(app => <tr key={app.id}>
          <td>{app.student.name}<br /><small>{app.student.email}</small></td><td>{app.targetUniversity}<br />{app.targetProgram}<br /><small>{app.targetCountry} · {app.intakeSemester}</small></td>
          <td>{human(app.stage)}</td><td>{money(app.heldBdt)}</td><td><Button size="sm" variant="outline" onClick={() => {
            setSelectedApplication(app); setNextStage(stageTransitions[app.stage][0] ?? app.stage); setStageNote('');
          }}>View application</Button></td></tr>)}
      </tbody></table>{dashboard.applications.length === 0 && <p>No applications found.</p>}</GlassCard>
      {selectedApplication && <GlassCard><h2>{selectedApplication.student.name} · Application details</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0 12px 0' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Current stage:</span>
          <Badge variant="outline">{human(selectedApplication.stage)}</Badge>
        </div>
        <p>{selectedApplication.lastNote ?? 'No stage notes recorded.'}</p>
        <p>Documents: {selectedApplication.documents.length === 0 ? 'None' : selectedApplication.documents.map(document => document.fileName).join(', ')}</p>
        <Link href="/dashboard/documents">Open document vault</Link>
        {stageTransitions[selectedApplication.stage].length > 0 && <form onSubmit={event => { event.preventDefault(); void mutate(async () => {
          await browserApi('/api/agency/dashboard', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: selectedApplication.id, stage: nextStage, note: stageNote }) });
          setSelectedApplication(null); setNotice('Stage saved. No escrow funds were moved.');
        }); }} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <label style={fieldStyle}>Update stage to<select style={inputStyle} value={nextStage} onChange={event => setNextStage(event.target.value as ApplicationStage)}>
            {stageTransitions[selectedApplication.stage].map(stage => <option key={stage} value={stage}>{human(stage)}</option>)}</select></label>
          <label style={fieldStyle}>Stage note<textarea style={inputStyle} placeholder="Add an optional progress update or note for the student" maxLength={10000} value={stageNote} onChange={event => setStageNote(event.target.value)} /></label>
          <Button type="submit" loading={busy}>Save stage</Button>
        </form>}<Button variant="ghost" onClick={() => setSelectedApplication(null)}>Close details</Button></GlassCard>}
    </>}
    {dashboard && tab === 'payouts' && <>
      <div style={grid}>
        <GlassCard>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Money Received (Admin Released)</span>
          <h2 style={{ fontSize: 28, color: '#10b981', margin: '6px 0 2px 0' }}>
            {money(dashboard.payoutsSummary?.totalReleasedBdt ?? 0)}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {dashboard.payoutsSummary?.releasedCount ?? 0} disbursed milestones
          </p>
        </GlassCard>
        <GlassCard>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Secured in Escrow</span>
          <h2 style={{ fontSize: 28, color: '#3b82f6', margin: '6px 0 2px 0' }}>
            {money(dashboard.payoutsSummary?.totalHeldBdt ?? 0)}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {dashboard.payoutsSummary?.heldCount ?? 0} milestones currently held
          </p>
        </GlassCard>
        <GlassCard>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Awaiting Admin Release</span>
          <h2 style={{ fontSize: 28, color: '#f59e0b', margin: '6px 0 2px 0' }}>
            {money(dashboard.payoutsSummary?.totalPendingAdminBdt ?? 0)}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Student authorized; waiting for admin audit
          </p>
        </GlassCard>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'RELEASED', label: `Disbursed to Agency (${dashboard.payouts?.filter(p => p.status === 'RELEASED').length ?? 0})` },
            { id: 'AWAITING_ADMIN', label: `Awaiting Admin (${dashboard.payouts?.filter(p => p.status === 'HELD' && p.releaseRequested).length ?? 0})` },
            { id: 'HELD', label: `Held in Escrow (${dashboard.payouts?.filter(p => p.status === 'HELD' && !p.releaseRequested).length ?? 0})` },
          ].map(f => (
            <Button
              key={f.id}
              size="sm"
              variant={payoutFilter === f.id ? 'primary' : 'outline'}
              onClick={() => setPayoutFilter(f.id as any)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div style={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
          <input
            aria-label="Search payouts"
            placeholder="Search student, email, university or milestone..."
            style={inputStyle}
            value={payoutSearch}
            onChange={e => setPayoutSearch(e.target.value)}
          />
        </div>
      </div>

      <GlassCard className={styles.tableCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Escrow Payout Statement & Ledger</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {filteredPayouts.length} of {dashboard.payouts?.length ?? 0} transactions
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Amount</th>
              <th>Status</th>
              <th>From Whom (Student)</th>
              <th>Where (Program & Milestone)</th>
              <th>When (Release / Deposit)</th>
              <th>Gateway / Ledger Proof</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.map(payout => (
              <tr key={payout.id}>
                <td>
                  <strong style={{ fontSize: 16, color: payout.status === 'RELEASED' ? '#10b981' : 'var(--text-primary)' }}>
                    {money(payout.amountBdt)}
                  </strong>
                </td>
                <td>
                  {payout.status === 'RELEASED' ? (
                    <Badge variant="verified">✅ Disbursed</Badge>
                  ) : payout.status === 'HELD' && payout.releaseRequested ? (
                    <Badge variant="pending">⏳ Awaiting Admin</Badge>
                  ) : payout.status === 'HELD' ? (
                    <Badge variant="outline">🔒 In Escrow</Badge>
                  ) : (
                    <Badge variant="outline">{payout.status}</Badge>
                  )}
                </td>
                <td>
                  <strong>{payout.student.name}</strong>
                  <br />
                  <small style={{ color: 'var(--text-secondary)' }}>{payout.student.email}</small>
                  {payout.student.phone && <><br /><small style={{ color: 'var(--text-muted)' }}>{payout.student.phone}</small></>}
                </td>
                <td>
                  <strong>{payout.milestoneName}</strong> (Step #{payout.orderIndex})
                  <br />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {payout.application.targetUniversity}
                  </span>
                  <br />
                  <small style={{ color: 'var(--text-muted)' }}>
                    {payout.application.targetProgram} · {payout.application.targetCountry}
                  </small>
                </td>
                <td>
                  {payout.releasedAt ? (
                    <div>
                      <span style={{ fontWeight: 600, color: '#10b981', fontSize: 13 }}>
                        Disbursed: {new Date(payout.releasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <br />
                      <small style={{ color: 'var(--text-muted)' }}>
                        {new Date(payout.releasedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  ) : payout.heldAt ? (
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Deposited: {new Date(payout.heldAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {payout.releaseRequested && (
                        <>
                          <br />
                          <small style={{ color: '#f59e0b', fontWeight: 600 }}>Release requested</small>
                        </>
                      )}
                    </div>
                  ) : (
                    <small style={{ color: 'var(--text-muted)' }}>Pending deposit</small>
                  )}
                </td>
                <td>
                  <Badge variant="outline" size="sm">{payout.provider}</Badge>
                  {payout.txHash && (
                    <div style={{ marginTop: 4 }}>
                      <code style={{ fontSize: 10, background: 'var(--bg-elevated)', padding: '2px 4px', borderRadius: 4 }} title={payout.txHash}>
                        {payout.txHash.slice(0, 8)}...{payout.txHash.slice(-6)}
                      </code>
                    </div>
                  )}
                </td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => setSelectedPayout(payout)}>
                    View Voucher
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPayouts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            No payouts match the selected filter or search term.
          </div>
        )}
      </GlassCard>

      {selectedPayout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedPayout(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640 }}>
            <GlassCard style={{ maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Official Escrow Disbursement Voucher</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Ledger Reference: {selectedPayout.id}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedPayout(null)}>✕ Close</Button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Disbursed Amount</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: selectedPayout.status === 'RELEASED' ? '#10b981' : 'var(--text-primary)', marginTop: 4 }}>
                    {money(selectedPayout.amountBdt)}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Badge variant={selectedPayout.status === 'RELEASED' ? 'verified' : 'pending'}>
                      {selectedPayout.status === 'RELEASED' ? 'Disbursed to Agency' : 'Held in Escrow'}
                    </Badge>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Payment Channel</span>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedPayout.provider}</div>
                  {selectedPayout.providerTxnId && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all' }}>
                      Txn: {selectedPayout.providerTxnId}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>From (Student):</span>
                  <div>
                    <strong>{selectedPayout.student.name}</strong> ({selectedPayout.student.email})
                    {selectedPayout.student.phone && <div>Phone: {selectedPayout.student.phone}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payee (Agency):</span>
                  <div>
                    <strong>{dashboard.agency.name}</strong> (License: {dashboard.agency.licenseNo})
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Milestone:</span>
                  <div>
                    <strong>{selectedPayout.milestoneName}</strong> (Step #{selectedPayout.orderIndex})
                    {selectedPayout.releaseCondition && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Criteria: {selectedPayout.releaseCondition}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Program:</span>
                  <div>
                    {selectedPayout.application.targetUniversity} · {selectedPayout.application.targetProgram}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {selectedPayout.application.targetCountry} ({selectedPayout.application.intakeSemester ?? 'N/A'})
                    </div>
                  </div>
                </div>

                {selectedPayout.releaseNote && (
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Student Note:</span>
                    <div style={{ fontStyle: 'italic', background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 4 }}>
                      "{selectedPayout.releaseNote}"
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timeline:</span>
                  <div style={{ fontSize: 13 }}>
                    {selectedPayout.heldAt && <div>Deposited: {new Date(selectedPayout.heldAt).toLocaleString()}</div>}
                    {selectedPayout.releaseRequestedAt && <div>Release Authorized: {new Date(selectedPayout.releaseRequestedAt).toLocaleString()}</div>}
                    {selectedPayout.releasedAt && <div style={{ color: '#10b981', fontWeight: 600 }}>Disbursed by Admin: {new Date(selectedPayout.releasedAt).toLocaleString()}</div>}
                  </div>
                </div>

                {selectedPayout.txHash && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Cryptographic Ledger Hash (SHA-256)
                    </span>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', background: 'var(--bg-elevated)', padding: 8, borderRadius: 4, marginTop: 4 }}>
                      {selectedPayout.txHash}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <Button variant="outline" onClick={() => window.print()}>Print Voucher</Button>
                <Button variant="primary" onClick={() => setSelectedPayout(null)}>Done</Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </>}
    {dashboard && tab === 'services' && <>
      <Button onClick={() => { setPackageForm(emptyPackage); setShowPackage(true); }}>Propose service package</Button>
      <div style={grid}>{dashboard.services.map(service => <GlassCard key={service.id}><h2>{service.serviceName}</h2>
        <p>{money(service.amountBdt)} · {service.whenCharged}</p><p>{service.conditions}</p>
        <Button size="sm" variant="outline" onClick={() => { setPackageForm({ serviceName: service.serviceName, country: '', amountBdt: String(service.amountBdt),
          whenCharged: service.whenCharged, refundPolicy: service.conditions ?? '', proofUrl: '' }); setShowPackage(true); }}>Propose updated terms</Button>{' '}
        <Button size="sm" variant="danger" disabled={busy} onClick={() => void mutate(async () => {
          await browserApi(`/api/agency/services/${encodeURIComponent(service.id)}`, { method: 'DELETE' }); setNotice('Service removed from published pricing.');
        })}>Remove package</Button></GlassCard>)}</div>
      {dashboard.services.length === 0 && <p>No published service packages.</p>}
      {showPackage && <GlassCard><h2>Submit package for review</h2><form onSubmit={submitPackage} style={{ display: 'grid', gap: 16 }}>
        <div style={grid}>{([['serviceName', 'Service name'], ['country', 'Country'], ['amountBdt', 'Fee (BDT)'], ['whenCharged', 'When charged'], ['proofUrl', 'Evidence URL (HTTPS)']] as const).map(([key, label]) =>
          <label key={key} style={fieldStyle}>{label}<input required style={inputStyle} type={key === 'amountBdt' ? 'number' : key === 'proofUrl' ? 'url' : 'text'}
            min={key === 'amountBdt' ? 0 : undefined} step={key === 'amountBdt' ? '0.01' : undefined} value={packageForm[key]}
            onChange={event => setPackageForm(value => ({ ...value, [key]: event.target.value }))} /></label>)}</div>
        <label style={fieldStyle}>Refund policy<textarea required style={inputStyle} value={packageForm.refundPolicy} onChange={event => setPackageForm(value => ({ ...value, refundPolicy: event.target.value }))} /></label>
        <Button type="submit" loading={busy}>Submit for review</Button><Button type="button" variant="ghost" onClick={() => setShowPackage(false)}>Cancel</Button>
      </form></GlassCard>}
      <GlassCard><h2>Submission history</h2>{submissions.length === 0 ? <p>No submissions yet.</p> : submissions.map(submission => <div key={submission.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
        <strong>{submission.serviceName}</strong> · {submission.country} · {money(submission.amountBdt)} · <Badge variant={submission.status === 'APPROVED' ? 'verified' : 'pending'}>{submission.status}</Badge>
        {submission.adminFeedback && <p>{submission.adminFeedback}</p>}</div>)}</GlassCard>
    </>}
    {dashboard && tab === 'license' && <GlassCard><h2>License & documents</h2>
      <p>License {dashboard.agency.licenseNo}: {dashboard.agency.licenseStatus}. Uploaded files are not automatically verified.</p>
      <Link href="/dashboard/documents">Upload or manage files in the document vault</Link>
      {dashboard.documents.length === 0 ? <p>No documents uploaded by this account.</p> : <ul>{dashboard.documents.map(document => <li key={document.id}>
        {document.fileName} · {human(document.type)} · {new Date(document.uploadedAt).toLocaleDateString()}
      </li>)}</ul>}
    </GlassCard>}
    {tab === 'benchmarks' && <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Country cost benchmarks</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--muted-foreground, #666)', fontSize: 14 }}>
            Benchmark proposals submitted by your agency. Administrators verify each proposal before publication.
          </p>
        </div>
        <Button onClick={() => { setBenchmarkForm(emptyBenchmark); setShowBenchmark(true); }}>Propose country benchmark</Button>
      </div>
      <div style={grid}>{benchmarks.map(benchmark => <GlassCard key={benchmark.id}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>{benchmark.flagEmoji} {benchmark.country}</h2>
          <Badge variant={benchmark.status === 'VERIFIED' ? 'verified' : benchmark.status === 'REJECTED' ? 'rejected' : 'pending'}>
            {benchmark.status || (benchmark.isVerified ? 'VERIFIED' : 'PENDING')}
          </Badge>
        </div>
        <p>{human(benchmark.requirementType)}: {money(benchmark.blockedAccountOrGicBdt)}</p>
        <p>Monthly living: {money(benchmark.livingCostMonthlyBdtMin)}–{money(benchmark.livingCostMonthlyBdtMax)}</p>
        <a href={benchmark.officialGovUrl} target="_blank" rel="noopener noreferrer">{benchmark.officialGovSourceTitle}</a><br />
        <Button size="sm" variant="outline" onClick={() => editBenchmark(benchmark)} style={{ marginTop: 8 }}>Propose correction</Button></GlassCard>)}</div>
      {benchmarks.length === 0 && !loading && (
        <GlassCard style={{ textAlign: 'center', padding: '36px 20px', marginTop: 12 }}>
          <h3>No benchmark submissions yet</h3>
          <p style={{ maxWidth: 480, margin: '8px auto 20px', color: 'var(--muted-foreground, #666)', fontSize: 14 }}>
            Your agency has not submitted any country cost benchmarks yet. Sourced cost benchmarks help students understand official living and visa expenses.
          </p>
          <Button onClick={() => { setBenchmarkForm(emptyBenchmark); setShowBenchmark(true); }}>Propose country benchmark</Button>
        </GlassCard>
      )}
      {showBenchmark && <GlassCard><h2>Benchmark proposal</h2><p>Provide sourced values. An administrator must review this proposal before publication.</p>
        <form onSubmit={proposeBenchmark} style={{ display: 'grid', gap: 16 }}><div style={grid}>
          {([['country', 'Country'], ['countryCode', 'Country code (2 or 3 uppercase letters)'], ['currency', 'Currency code (3 uppercase letters)'], ['officialGovUrl', 'Official source URL (HTTPS)'], ['officialGovSourceTitle', 'Official source title']] as const).map(([key, label]) =>
            <label key={key} style={fieldStyle}>{label}<input required style={inputStyle} type={key === 'officialGovUrl' ? 'url' : 'text'} value={benchmarkForm[key]}
              onChange={event => setBenchmarkForm(value => ({ ...value, [key]: event.target.value }))} /></label>)}
          {moneyFields.map(([key, label]) => <label key={key} style={fieldStyle}>{label}<input required style={inputStyle} type="number" min={key === 'exchangeRateBdt' ? 0.0001 : 0} step={key === 'exchangeRateBdt' ? 'any' : '0.01'}
            value={benchmarkForm[key]} onChange={event => setBenchmarkForm(value => ({ ...value, [key]: event.target.value }))} /></label>)}
          <label style={fieldStyle}>Requirement type<select style={inputStyle} value={benchmarkForm.requirementType} onChange={event => setBenchmarkForm(value => ({ ...value, requirementType: event.target.value }))}>
            {['BLOCKED_ACCOUNT', 'GIC', 'MAINTENANCE_FUNDS', 'BANK_SOLVENCY'].map(value => <option key={value}>{value}</option>)}</select></label>
        </div><label style={fieldStyle}>Requirements and source notes (one per line)<textarea style={inputStyle} value={benchmarkForm.notes} onChange={event => setBenchmarkForm(value => ({ ...value, notes: event.target.value }))} /></label>
          <Button type="submit" loading={busy}>Submit proposal</Button><Button type="button" variant="ghost" onClick={() => setShowBenchmark(false)}>Cancel</Button>
        </form></GlassCard>}
    </>}
  </div>;
}
