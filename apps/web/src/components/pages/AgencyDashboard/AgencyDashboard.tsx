'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { VerifiedKnowledgeEngine, VerifiedAgencyRecord, AgencyServicePackage } from '@/lib/verifiedKnowledgeStore';
import styles from './AgencyDashboard.module.css';

interface ApplicationItem {
  id: string;
  student: string;
  program: string;
  country: string;
  stage: 'Submitted' | 'Under Review' | 'Offer Received' | 'Visa Processing' | 'Completed';
  date: string;
  escrowStatus: 'Held' | 'Milestone 1 Released' | 'Pending Release' | 'Completed';
  escrowAmount: string;
}

const INITIAL_APPS: ApplicationItem[] = [
  { id: 'app-1', student: 'Riya Ahmed',  program: 'M.Sc. Computer Science, U of Toronto', country: 'Canada 🇨🇦', stage: 'Offer Received', date: 'Jul 25', escrowStatus: 'Milestone 1 Released', escrowAmount: '৳18,000' },
  { id: 'app-2', student: 'Mehedi Hasan', program: 'Master of Data Science, Monash Uni', country: 'Australia 🇦🇺', stage: 'Under Review', date: 'Jul 22', escrowStatus: 'Held', escrowAmount: '৳24,000' },
  { id: 'app-3', student: 'Sara Islam',  program: 'B.Sc. Mechanical Eng, TU Berlin', country: 'Germany 🇩🇪', stage: 'Submitted', date: 'Jul 18', escrowStatus: 'Held', escrowAmount: '৳15,000' },
  { id: 'app-4', student: 'Arif Khan',   program: 'M.Sc. AI, University of Manchester', country: 'UK 🇬🇧', stage: 'Visa Processing', date: 'Aug 02', escrowStatus: 'Pending Release', escrowAmount: '৳36,000' },
];

export default function AgencyDashboard() {
  const [agency, setAgency] = useState<VerifiedAgencyRecord | null>(null);
  const [apps, setApps] = useState<ApplicationItem[]>(INITIAL_APPS);
  const [activeTab, setActiveTab] = useState<'applications' | 'services' | 'license' | 'benchmarks'>('applications');

  // New Service Package Modal State
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgAmount, setPkgAmount] = useState<number>(45000);
  const [pkgWhen, setPkgWhen] = useState('30% on Offer, 40% on Visa Filing, 30% on Visa');
  const [pkgRefund, setPkgRefund] = useState('Full 100% refund of unreleased milestone funds upon refusal');
  const [notification, setNotification] = useState<string | null>(null);

  // Country Cost Benchmark State (Sir's Verified Financial Provenance)
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [showAddBenchmark, setShowAddBenchmark] = useState(false);
  const [bmkCountry, setBmkCountry] = useState('Germany');
  const [bmkType, setBmkType] = useState('BLOCKED_ACCOUNT');
  const [bmkAmount, setBmkAmount] = useState<number>(1547520);
  const [bmkSourceUrl, setBmkSourceUrl] = useState('https://www.auswaertiges-amt.de/en/visa-service/blocked-account');
  const [bmkSourceTitle, setBmkSourceTitle] = useState('German Federal Foreign Office (Auswärtiges Amt)');
  const [bmkNotes, setBmkNotes] = useState('€11,904/year mandatory blocked account per Section 16b AufenthG');

  const fetchBenchmarks = () => {
    fetch('/api/provenance/benchmarks')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.benchmarks) setBenchmarks(d.benchmarks);
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Default to Global Edu BD
    const current = VerifiedKnowledgeEngine.getAgencyById('agt-001') || VerifiedKnowledgeEngine.getAllVerifiedAgencies()[0];
    if (current) {
      setAgency(current);
    }

    const handleHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        if (['applications', 'services', 'license', 'benchmarks'].includes(hash)) {
          setActiveTab(hash as any);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    fetchBenchmarks();

    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAdvanceStage = (id: string) => {
    setApps(prev => prev.map(app => {
      if (app.id !== id) return app;
      const order: ApplicationItem['stage'][] = ['Submitted', 'Under Review', 'Offer Received', 'Visa Processing', 'Completed'];
      const currentIdx = order.indexOf(app.stage);
      const nextStage = currentIdx < order.length - 1 ? order[currentIdx + 1] : order[currentIdx];
      return { ...app, stage: nextStage };
    }));
    showToast('Application stage updated and synced with Student & Parent portal.');
  };

  const handleAddServicePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency || !pkgName.trim()) return;

    const newPkg: AgencyServicePackage = {
      id: `srv-${Date.now()}`,
      name: pkgName.trim(),
      nameBn: pkgName.trim(),
      amountBdt: Number(pkgAmount) || 30000,
      whenCharged: pkgWhen,
      whenChargedBn: pkgWhen,
      refundable: true,
      refundPolicy: pkgRefund,
      refundPolicyBn: pkgRefund,
    };

    const updatedAgency: VerifiedAgencyRecord = {
      ...agency,
      services: [...agency.services, newPkg],
      feeMinBdt: Math.min(agency.feeMinBdt, newPkg.amountBdt),
      feeMaxBdt: Math.max(agency.feeMaxBdt, newPkg.amountBdt),
    };

    VerifiedKnowledgeEngine.updateAgency(updatedAgency);
    setAgency(updatedAgency);
    setShowAddPackage(false);
    setPkgName('');
    showToast(`Package "${newPkg.name}" added successfully! The AI Chatbot & Comparison Engine are now updated.`);
  };

  const handleDeletePackage = (pkgId: string) => {
    if (!agency) return;
    const updatedServices = agency.services.filter(s => s.id !== pkgId);
    const updatedAgency = { ...agency, services: updatedServices };
    VerifiedKnowledgeEngine.updateAgency(updatedAgency);
    setAgency(updatedAgency);
    showToast('Service package removed.');
  };

  const handleAddBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const codeMap: Record<string, string> = { Germany: 'DEU', Canada: 'CAN', 'United Kingdom': 'GBR', 'United States': 'USA', Australia: 'AUS' };
      const flagMap: Record<string, string> = { Germany: '🇩🇪', Canada: '🇨🇦', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸', Australia: '🇦🇺' };
      const curMap: Record<string, string> = { Germany: 'EUR', Canada: 'CAD', 'United Kingdom': 'GBP', 'United States': 'USD', Australia: 'AUD' };
      const rateMap: Record<string, number> = { Germany: 130, Canada: 89.5, 'United Kingdom': 152, 'United States': 121, Australia: 80 };

      const res = await fetch('/api/provenance/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: bmkCountry,
          countryCode: codeMap[bmkCountry] || 'INTL',
          flagEmoji: flagMap[bmkCountry] || '🌍',
          currency: curMap[bmkCountry] || 'USD',
          exchangeRateBdt: rateMap[bmkCountry] || 120,
          livingCostMonthlyBdtMin: 110000,
          livingCostMonthlyBdtMax: 150000,
          blockedAccountOrGicBdt: Number(bmkAmount),
          requirementType: bmkType,
          visaFeeBdt: 12000,
          healthInsuranceYearlyBdt: 120000,
          officialGovUrl: bmkSourceUrl,
          officialGovSourceTitle: bmkSourceTitle,
          keyRequirements: [
            bmkNotes,
            `Verified and submitted by licensed consultancy: ${agency?.name || 'Global Edu BD'} (License: ${agency?.licenseNo || 'MOE-BD-2024-889'})`,
          ],
          verifiedByAdminId: 'usr-admin-01',
        }),
      });

      if (res.ok) {
        showToast(`Official benchmark for ${bmkCountry} submitted! Ethos Admin will cross-check and publish to students.`);
        setShowAddBenchmark(false);
        fetchBenchmarks();
      } else {
        showToast('Failed to submit benchmark. Please check all fields.');
      }
    } catch {
      showToast('Network error submitting benchmark.');
    }
  };

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--ink, #14120E)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          border: '2px solid var(--emerald, #10B981)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          animation: 'fadeUp 0.3s ease-out',
        }}>
          <span>✅</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Agency Management Portal</h1>
            <Badge variant="verified">Admin Verified</Badge>
          </div>
          <p className={styles.sub}>
            {agency?.name || 'Global Edu BD'} • License: <code>{agency?.licenseNo || 'TRAD/DNCC/041289/2022'}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/agency/chat" style={{ textDecoration: 'none' }}>
            <Button variant="emerald" size="sm">
              💬 Live Student Chat
            </Button>
          </Link>
          <Link href="/directory" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              🌐 View Public Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Profile Views', value: '1,490', icon: '👁️' },
          { label: 'Chat Inquiries', value: '52', href: '/agency/chat', icon: '💬' },
          { label: 'Active Applications', value: apps.length.toString(), icon: '📋' },
          { label: 'Escrow Funds Protected', value: '৳93,000', icon: '🔒' },
        ].map(s => (
          <GlassCard key={s.label} padding="md" className={styles.stat}>
            <div className={styles.statIcon} aria-hidden="true">{s.icon}</div>
            <div className={styles.statVal}>{s.value}</div>
            <div className={styles.statLbl}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0', borderBottom: '2px solid var(--border-color, #E5E7EB)', paddingBottom: '10px' }}>
        {[
          { id: 'applications', label: 'Student Applications', icon: '👥' },
          { id: 'services', label: 'Service Fees & Escrow Packages', icon: '💰' },
          { id: 'benchmarks', label: 'Country Cost Benchmarks', icon: '🏛️' },
          { id: 'license', label: 'License & Verification Info', icon: '📜' },
        ].map(t => (
          <Button
            key={t.id}
            size="sm"
            variant={activeTab === t.id ? 'primary' : 'ghost'}
            onClick={() => {
              setActiveTab(t.id as any);
              if (typeof window !== 'undefined') window.location.hash = t.id;
            }}
          >
            {t.icon} {t.label}
          </Button>
        ))}
      </div>

      {/* TAB 1: Student Applications */}
      {activeTab === 'applications' && (
        <GlassCard padding="none" className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Active Application Queue ({apps.length})</h2>
          </div>
          <table className={styles.table} aria-label="Application queue">
            <thead>
              <tr>
                <th>Student</th>
                <th>Program & Country</th>
                <th>Stage Machine</th>
                <th>Escrow Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td className={styles.studentName}>
                    <strong>{a.student}</strong>
                  </td>
                  <td className={styles.program}>
                    <div>{a.program}</div>
                    <small style={{ color: 'var(--text-secondary)' }}>{a.country}</small>
                  </td>
                  <td>
                    <Badge variant={a.stage === 'Completed' ? 'success' : a.stage === 'Offer Received' ? 'verified' : 'info'} size="sm">
                      {a.stage}
                    </Badge>
                  </td>
                  <td className={styles.amount}>
                    <strong>{a.escrowAmount}</strong>
                    <div style={{ fontSize: '11px', color: '#10B981' }}>{a.escrowStatus}</div>
                  </td>
                  <td className={styles.date}>{a.date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Link
                        href={`/agency/chat?threadId=thd-${a.id}&student=${encodeURIComponent(a.student)}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button size="sm" variant="outline" title={`Chat with ${a.student}`}>
                          💬
                        </Button>
                      </Link>
                      <Button size="sm" variant="emerald" onClick={() => handleAdvanceStage(a.id)}>
                        Advance Stage →
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* TAB 2: Service Packages & Pricing */}
      {activeTab === 'services' && (
        <GlassCard padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Verified Fee & Service Packages</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                These rates feed directly into the Ethos AI Comparison Engine, Student Directory, and AI Counselor Bot.
              </p>
            </div>
            <Button variant="emerald" size="sm" onClick={() => setShowAddPackage(true)}>
              ➕ Add New Service Package
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {agency?.services.map(s => (
              <div key={s.id} style={{
                background: 'var(--card-bg, #fff)',
                border: '2px solid var(--ink, #14120E)',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '3px 3px 0 0 var(--ink)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{s.name}</h3>
                    <Badge variant="verified" size="sm">৳{s.amountBdt.toLocaleString()} BDT</Badge>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <strong>Trigger:</strong> {s.whenCharged}
                  </p>
                  <p style={{ fontSize: '13px', color: '#059669', marginTop: '4px' }}>
                    <strong>Refund Policy:</strong> {s.refundPolicy}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button size="sm" variant="danger" onClick={() => handleDeletePackage(s.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* TAB 3: License & Verification Info */}
      {activeTab === 'license' && (
        <GlassCard padding="lg">
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px' }}>Official Regulatory & Verification Records</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
              <small style={{ color: 'var(--text-secondary)' }}>Government Trade License</small>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{agency?.licenseNo}</div>
              <div style={{ marginTop: '8px' }}>
                <Badge variant="verified" size="sm">Verified & Active</Badge>
              </div>
            </div>
            <div style={{ padding: '14px', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
              <small style={{ color: 'var(--text-secondary)' }}>Registered Owner</small>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{agency?.ownerName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Phone: {agency?.phone}</div>
            </div>
            <div style={{ padding: '14px', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
              <small style={{ color: 'var(--text-secondary)' }}>Head Office Address</small>
              <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{agency?.address}</div>
            </div>
            <div style={{ padding: '14px', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
              <small style={{ color: 'var(--text-secondary)' }}>AI Heuristic Risk Score</small>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                {agency?.riskScore}/100 (Very Low Risk)
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* TAB 4: Country Cost Benchmarks — Verified Financial Provenance */}
      {activeTab === 'benchmarks' && (
        <GlassCard padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>🏛️ Country Cost Benchmarks</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Submit official visa solvency figures (blocked accounts, GIC amounts, bank solvency) from real government sources.
                Ethos Admin will cross-verify and publish verified data to students.
              </p>
            </div>
            <Button variant="emerald" size="sm" onClick={() => setShowAddBenchmark(true)}>
              + Submit New Benchmark
            </Button>
          </div>

          {benchmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontWeight: 700 }}>No benchmarks yet</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Submit your first official cost benchmark for admin verification.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Country</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Requirement Type</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Amount (BDT)</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Official Source</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.map((b: any) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{b.flagEmoji} {b.country}</td>
                      <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{String(b.requirementType).replace(/_/g, ' ').toLowerCase()}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--emerald, #10B981)' }}>
                        ৳{Number(b.blockedAccountOrGicBdt).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <a href={b.officialGovUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-primary, #3B82F6)', fontSize: '12px' }}>
                          {b.officialGovSourceTitle} ↗
                        </a>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge variant={b.isVerified ? 'verified' : 'pending'} size="sm">
                          {b.isVerified ? '✓ Admin Verified' : '⏳ Pending Review'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '14px', background: 'var(--bg-secondary, #F9FAFB)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>📌 How This Works:</strong> Your submitted benchmarks are reviewed by Ethos Admins who cross-verify figures
            against official government embassy and immigration authority websites. Once approved, the data is shown to students
            as &ldquo;Agency + Admin Verified&rdquo; — giving them trustworthy, claimable cost figures.
          </div>
        </GlassCard>
      )}

      {/* Add Benchmark Modal */}
      {showAddBenchmark && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', border: '3px solid var(--ink, #14120E)', borderRadius: '12px', padding: '24px', maxWidth: '540px', width: '100%', boxShadow: '6px 6px 0 0 var(--ink)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>🏛️ Submit Official Country Cost Benchmark</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              All figures must reference official government or embassy sources. Data will be admin-reviewed before publishing.
            </p>
            <form onSubmit={handleAddBenchmark} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Country</label>
                <select value={bmkCountry} onChange={e => setBmkCountry(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                  {['Germany', 'Canada', 'United Kingdom', 'United States', 'Australia', 'Netherlands', 'Sweden', 'Denmark', 'France', 'Italy'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Requirement Type</label>
                <select value={bmkType} onChange={e => setBmkType(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                  {['BLOCKED_ACCOUNT', 'GIC', 'MAINTENANCE_FUNDS', 'BANK_SOLVENCY'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Required Amount in BDT ৳</label>
                <input type="number" required min={1} value={bmkAmount} onChange={e => setBmkAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Official Government Source URL</label>
                <input type="url" required placeholder="https://..." value={bmkSourceUrl} onChange={e => setBmkSourceUrl(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Source Title / Document Name</label>
                <input type="text" required placeholder="e.g. German Federal Foreign Office (Auswärtiges Amt)" value={bmkSourceTitle} onChange={e => setBmkSourceTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Notes / Key Requirements</label>
                <input type="text" placeholder="e.g. €11,904/year mandatory blocked account" value={bmkNotes} onChange={e => setBmkNotes(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <Button type="button" variant="ghost" onClick={() => setShowAddBenchmark(false)}>Cancel</Button>
                <Button type="submit" variant="emerald">Submit for Admin Verification</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddPackage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-primary, #fff)',
            border: '3px solid var(--ink, #14120E)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '6px 6px 0 0 var(--ink)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Add Verified Service Package</h2>
            <form onSubmit={handleAddServicePackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Admission & Visa Processing"
                  value={pkgName}
                  onChange={e => setPkgName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Total Package Fee (BDT)</label>
                <input
                  type="number"
                  required
                  min={5000}
                  step={1000}
                  value={pkgAmount}
                  onChange={e => setPkgAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Escrow Milestone Release Schedule</label>
                <input
                  type="text"
                  required
                  value={pkgWhen}
                  onChange={e => setPkgWhen(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Refund Policy Guarantee</label>
                <input
                  type="text"
                  required
                  value={pkgRefund}
                  onChange={e => setPkgRefund(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button type="button" variant="ghost" onClick={() => setShowAddPackage(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="emerald">
                  Save & Publish to Ethos AI
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
