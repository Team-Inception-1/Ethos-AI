'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { browserApi, errorMessage } from '@/lib/platform/browser';
import { stageTransitions, type AgencyDashboardData, type ApplicationStage, type BenchmarkView, type FeeSubmissionView } from '@/lib/platform/agency-contracts';
import { AdminTableSkeleton } from '@/components/ui/Skeleton';
import styles from './AgencyDashboard.module.css';

const tabs = ['applications', 'services', 'license', 'benchmarks'] as const;
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

  return <div className={styles.page}>
    <div className={styles.header}><div><h1>Agency Management Portal</h1>
      <p className={styles.sub}>{dashboard?.agency.name ?? 'Agency account'} · {dashboard?.agency.licenseNo ?? 'Loading profile'}</p>
      {dashboard && <Badge variant={dashboard.agency.licenseStatus === 'VERIFIED' ? 'verified' : 'pending'}>{dashboard.agency.licenseStatus}</Badge>}
    </div><Button variant="outline" onClick={() => void refresh()} loading={loading}>Refresh</Button></div>
    {error && <div role="alert" style={{ color: 'var(--red, #b91c1c)' }}>{error}</div>}
    {notice && <div role="status">{notice}</div>}
    <nav aria-label="Agency sections" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {tabs.map(value => <Button key={value} variant={tab === value ? 'primary' : 'outline'}
        onClick={() => router.push(`/agency/dashboard?tab=${value}`, { scroll: false })}>{value === 'license' ? 'License & documents' : human(value)}</Button>)}
    </nav>
    {!dashboard && loading && <AdminTableSkeleton rows={4} />}
    {dashboard && tab === 'applications' && <>
      <div style={grid}><GlassCard><h2>{dashboard.applications.length}</h2><p>Applications in this view</p></GlassCard>
        <GlassCard><h2>{money(dashboard.applications.reduce((sum, app) => sum + app.heldBdt, 0))}</h2><p>Recorded held escrow</p></GlassCard></div>
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
