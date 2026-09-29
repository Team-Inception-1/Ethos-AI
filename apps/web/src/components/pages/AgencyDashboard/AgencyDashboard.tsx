'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  VerifiedKnowledgeEngine,
  type VerifiedAgencyRecord,
  type AgencyServicePackage,
} from '@/lib/verifiedKnowledgeStore';
import styles from './AgencyDashboard.module.css';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type AppStage = 'Submitted' | 'Under Review' | 'Offer Received' | 'Visa Processing' | 'Completed' | 'Withdrawn';
type EscrowStatus = 'Held' | 'Milestone 1 Released' | 'Pending Release' | 'Fully Released' | 'Refunded';

interface ApplicationItem {
  id: string;
  student: string;
  studentId: string;
  phone: string;
  email: string;
  program: string;
  university: string;
  country: string;
  stage: AppStage;
  date: string;
  escrowStatus: EscrowStatus;
  escrowAmount: string;
  escrowAmountRaw: number;
  intake: string;
  notes: string;
  documents: { name: string; status: string }[];
}

interface ComplianceDoc {
  id: string;
  name: string;
  status: 'verified' | 'expiring' | 'expired' | 'pending';
  expiry: string;
  issuedBy: string;
}

/* ─── Sample Data ────────────────────────────────────────────────────────── */

const INITIAL_APPS: ApplicationItem[] = [
  {
    id: 'app-1',
    student: 'Riya Ahmed',
    studentId: 'STU-2024-001',
    phone: '+880-1711-234567',
    email: 'riya.ahmed@student.ethos.ai',
    program: 'M.Sc. Computer Science',
    university: 'University of Toronto',
    country: 'Canada 🇨🇦',
    stage: 'Offer Received',
    date: 'Jul 25, 2026',
    escrowStatus: 'Milestone 1 Released',
    escrowAmount: '৳18,000',
    escrowAmountRaw: 18000,
    intake: 'Fall 2026',
    notes: 'Offer letter received. CAS requested.',
    documents: [
      { name: 'Passport (Valid 2030)', status: '✓ Verified' },
      { name: 'Undergraduate Transcript', status: '✓ UGC Attested' },
      { name: 'IELTS TRF (7.5 Band)', status: '✓ BC Verified' },
      { name: 'Bank Solvency Certificate', status: '✓ Verified' },
    ],
  },
  {
    id: 'app-2',
    student: 'Mehedi Hasan',
    studentId: 'STU-2024-002',
    phone: '+880-1812-345678',
    email: 'mehedi.hasan@student.ethos.ai',
    program: 'Master of Data Science',
    university: 'Monash University',
    country: 'Australia 🇦🇺',
    stage: 'Under Review',
    date: 'Jul 22, 2026',
    escrowStatus: 'Held',
    escrowAmount: '৳24,000',
    escrowAmountRaw: 24000,
    intake: 'Semester 1, 2027',
    notes: 'Awaiting conditional offer. GTE preparation in progress.',
    documents: [
      { name: 'Passport (Valid 2029)', status: '✓ Verified' },
      { name: 'Bachelor Certificate', status: '✓ MoE Attested' },
      { name: 'IELTS TRF (7.0 Band)', status: '✓ BC Verified' },
      { name: 'Financial Statement', status: '⏳ Pending Review' },
    ],
  },
  {
    id: 'app-3',
    student: 'Sara Islam',
    studentId: 'STU-2024-003',
    phone: '+880-1911-456789',
    email: 'sara.islam@student.ethos.ai',
    program: 'B.Sc. Mechanical Engineering',
    university: 'TU Berlin',
    country: 'Germany 🇩🇪',
    stage: 'Submitted',
    date: 'Jul 18, 2026',
    escrowStatus: 'Held',
    escrowAmount: '৳15,000',
    escrowAmountRaw: 15000,
    intake: 'Winter Semester 2026',
    notes: 'Uni-Assist application submitted. Awaiting assessment.',
    documents: [
      { name: 'Passport (Valid 2031)', status: '✓ Verified' },
      { name: 'HSC & Degree Transcripts', status: '✓ UGC Attested' },
      { name: 'German A1 Certificate', status: '✓ Goethe Verified' },
      { name: 'Blocked Account (€11,904)', status: '⏳ Pending' },
    ],
  },
  {
    id: 'app-4',
    student: 'Arif Khan',
    studentId: 'STU-2024-004',
    phone: '+880-1711-567890',
    email: 'arif.khan@student.ethos.ai',
    program: 'M.Sc. Artificial Intelligence',
    university: 'University of Manchester',
    country: 'United Kingdom 🇬🇧',
    stage: 'Visa Processing',
    date: 'Aug 02, 2026',
    escrowStatus: 'Pending Release',
    escrowAmount: '৳36,000',
    escrowAmountRaw: 36000,
    intake: 'September 2026',
    notes: 'CAS received. UKVI appointment booked Aug 20.',
    documents: [
      { name: 'Passport (Valid 2028)', status: '✓ Verified' },
      { name: 'MSc Admission Letter + CAS', status: '✓ UMcr Issued' },
      { name: 'IELTS TRF (7.5 Band)', status: '✓ BC Verified' },
      { name: 'TB Test Certificate', status: '✓ DGHS Verified' },
    ],
  },
];

const COMPLIANCE_DOCS: ComplianceDoc[] = [
  { id: 'lic-001', name: 'Government Trade License', status: 'verified', expiry: '2027-06-30', issuedBy: 'Dhaka North City Corporation' },
  { id: 'lic-002', name: 'Bangladesh Education Board Registration', status: 'verified', expiry: '2026-12-31', issuedBy: 'Ministry of Education, BD' },
  { id: 'lic-003', name: 'Bangladesh Association of International Recruiters (BAIR)', status: 'expiring', expiry: '2026-11-15', issuedBy: 'BAIR Secretariat' },
  { id: 'lic-004', name: 'Money Receipts & Escrow Registration', status: 'verified', expiry: '2027-03-31', issuedBy: 'Bangladesh Bank' },
  { id: 'lic-005', name: 'BIDA Investment Registration', status: 'verified', expiry: '2028-01-01', issuedBy: 'Bangladesh Investment Development Authority' },
  { id: 'lic-006', name: 'Student Visa Processing Authorization', status: 'expiring', expiry: '2026-10-30', issuedBy: 'Department of Immigration, BD' },
];

const STAGE_ORDER: AppStage[] = ['Submitted', 'Under Review', 'Offer Received', 'Visa Processing', 'Completed', 'Withdrawn'];

/* ─── Utility ────────────────────────────────────────────────────────────── */

const stageColor = (s: AppStage) => {
  if (s === 'Completed') return '#10B981';
  if (s === 'Offer Received') return '#3B82F6';
  if (s === 'Visa Processing') return '#8B5CF6';
  if (s === 'Under Review') return '#F59E0B';
  if (s === 'Withdrawn') return '#EF4444';
  return '#6B7280';
};

const escrowColor = (e: EscrowStatus) => {
  if (e === 'Fully Released') return '#10B981';
  if (e === 'Milestone 1 Released') return '#3B82F6';
  if (e === 'Pending Release') return '#F59E0B';
  if (e === 'Refunded') return '#EF4444';
  return '#6B7280';
};

const complianceColor = (s: ComplianceDoc['status']) => {
  if (s === 'verified') return '#10B981';
  if (s === 'expiring') return '#F59E0B';
  if (s === 'expired') return '#EF4444';
  return '#6B7280';
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function AgencyDashboard() {
  const [agency, setAgency] = useState<VerifiedAgencyRecord | null>(null);
  const [apps, setApps] = useState<ApplicationItem[]>(INITIAL_APPS);
  const [activeTab, setActiveTab] = useState<'applications' | 'services' | 'license' | 'benchmarks'>('applications');

  // Student Queue state
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStageFilter, setQueueStageFilter] = useState<AppStage | 'all'>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [appStageSelect, setAppStageSelect] = useState<AppStage>('Submitted');
  const [milestoneNote, setMilestoneNote] = useState('');
  const [newStudentModal, setNewStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', phone: '', email: '', program: '', university: '', country: 'Canada 🇨🇦', intake: 'Fall 2026', escrowAmount: 30000 });

  // Service Package state
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editingPkg, setEditingPkg] = useState<AgencyServicePackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgAmount, setPkgAmount] = useState<number>(45000);
  const [pkgCountry, setPkgCountry] = useState('Canada');
  const [pkgWhen, setPkgWhen] = useState('30% on Offer, 40% on Visa Filing, 30% on Visa');
  const [pkgRefund, setPkgRefund] = useState('Full 100% refund of unreleased milestone funds upon refusal');
  const [pkgProofUrl, setPkgProofUrl] = useState('');
  const [submittingPkg, setSubmittingPkg] = useState(false);
  const [feeSubmissions, setFeeSubmissions] = useState<any[]>([]);

  // Benchmark state
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [bmkSearch, setBmkSearch] = useState('');
  const [showAddBenchmark, setShowAddBenchmark] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<any | null>(null);
  const [bmkCountry, setBmkCountry] = useState('Germany');
  const [bmkType, setBmkType] = useState('BLOCKED_ACCOUNT');
  const [bmkAmount, setBmkAmount] = useState<number>(1547520);
  const [bmkSourceUrl, setBmkSourceUrl] = useState('https://www.auswaertiges-amt.de/en/visa-service/blocked-account');
  const [bmkSourceTitle, setBmkSourceTitle] = useState('German Federal Foreign Office (Auswärtiges Amt)');
  const [bmkNotes, setBmkNotes] = useState('€11,904/year mandatory blocked account per Section 16b AufenthG');

  // License & Compliance state
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDoc[]>(COMPLIANCE_DOCS);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadIssuedBy, setUploadIssuedBy] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [showUploadDoc, setShowUploadDoc] = useState(false);

  // Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  /* ─── Data fetching ──────────────────────────────────────────────────── */

  useEffect(() => {
    const current = VerifiedKnowledgeEngine.getAgencyById('agt-001') || VerifiedKnowledgeEngine.getAllVerifiedAgencies()[0];
    if (current) setAgency(current);

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

    fetch('/api/provenance/benchmarks')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.benchmarks) setBenchmarks(d.benchmarks); })
      .catch(() => {});

    fetch('/api/agency/fee-submissions')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.submissions) setFeeSubmissions(d.submissions); })
      .catch(() => {});

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  /* ─── Student Queue ──────────────────────────────────────────────────── */

  const filteredApps = useMemo(() => {
    return apps.filter(a => {
      const matchSearch = !queueSearch ||
        a.student.toLowerCase().includes(queueSearch.toLowerCase()) ||
        a.program.toLowerCase().includes(queueSearch.toLowerCase()) ||
        a.university.toLowerCase().includes(queueSearch.toLowerCase()) ||
        a.studentId.toLowerCase().includes(queueSearch.toLowerCase());
      const matchStage = queueStageFilter === 'all' || a.stage === queueStageFilter;
      return matchSearch && matchStage;
    });
  }, [apps, queueSearch, queueStageFilter]);

  const handleAdvanceStage = (id: string) => {
    setApps(prev => prev.map(app => {
      if (app.id !== id) return app;
      const ci = STAGE_ORDER.indexOf(app.stage);
      const next = ci < STAGE_ORDER.length - 2 ? STAGE_ORDER[ci + 1] : app.stage;
      return { ...app, stage: next };
    }));
    showToast('Stage advanced. Student portal updated automatically.');
  };

  const handleUpdateStage = (appId: string) => {
    setApps(prev => prev.map(app => {
      if (app.id !== appId) return app;
      const escrowStatus: EscrowStatus =
        appStageSelect === 'Completed' ? 'Fully Released' :
        appStageSelect === 'Offer Received' ? 'Milestone 1 Released' :
        appStageSelect === 'Visa Processing' ? 'Pending Release' :
        app.escrowStatus;
      return { ...app, stage: appStageSelect, escrowStatus };
    }));
    if (selectedApp?.id === appId) {
      setSelectedApp(prev => prev ? {
        ...prev, stage: appStageSelect,
        escrowStatus:
          appStageSelect === 'Completed' ? 'Fully Released' :
          appStageSelect === 'Offer Received' ? 'Milestone 1 Released' :
          appStageSelect === 'Visa Processing' ? 'Pending Release' :
          prev.escrowStatus,
      } : null);
    }
    showToast(`Application updated to "${appStageSelect}". Synced with Student & Parent portals.`);
  };

  const handleSubmitMilestoneEvidence = (appId: string) => {
    if (!milestoneNote.trim()) { showToast('Please enter milestone completion notes or reference.'); return; }
    setApps(prev => prev.map(a => a.id !== appId ? a : { ...a, escrowStatus: 'Pending Release' }));
    if (selectedApp?.id === appId) setSelectedApp(p => p ? { ...p, escrowStatus: 'Pending Release' } : null);
    showToast(`Evidence submitted: "${milestoneNote}". Awaiting platform verification.`);
    setMilestoneNote('');
  };

  const handleAddNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) return;
    const newApp: ApplicationItem = {
      id: `app-${Date.now()}`,
      student: newStudentForm.name,
      studentId: `STU-2026-${String(apps.length + 1).padStart(3, '0')}`,
      phone: newStudentForm.phone,
      email: newStudentForm.email,
      program: newStudentForm.program,
      university: newStudentForm.university,
      country: newStudentForm.country,
      stage: 'Submitted',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      escrowStatus: 'Held',
      escrowAmount: `৳${Number(newStudentForm.escrowAmount).toLocaleString()}`,
      escrowAmountRaw: newStudentForm.escrowAmount,
      intake: newStudentForm.intake,
      notes: 'New application registered.',
      documents: [],
    };
    setApps(prev => [newApp, ...prev]);
    setNewStudentModal(false);
    setNewStudentForm({ name: '', phone: '', email: '', program: '', university: '', country: 'Canada 🇨🇦', intake: 'Fall 2026', escrowAmount: 30000 });
    showToast(`New applicant "${newApp.student}" registered. Escrow hold initiated.`);
  };

  /* ─── Service Packages ───────────────────────────────────────────────── */

  const openAddPackage = () => {
    setEditingPkg(null);
    setPkgName(''); setPkgAmount(45000); setPkgCountry('Canada');
    setPkgWhen('30% on Offer, 40% on Visa Filing, 30% on Visa');
    setPkgRefund('Full 100% refund of unreleased milestone funds upon refusal');
    setPkgProofUrl('');
    setShowAddPackage(true);
  };

  const openEditPackage = (pkg: AgencyServicePackage) => {
    setEditingPkg(pkg);
    setPkgName(pkg.name); setPkgAmount(pkg.amountBdt); setPkgCountry('Canada');
    setPkgWhen(pkg.whenCharged); setPkgRefund(pkg.refundPolicy); setPkgProofUrl('');
    setShowAddPackage(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency || !pkgName.trim()) return;
    try {
      setSubmittingPkg(true);
      if (!editingPkg) {
        // Create new package
        const res = await fetch('/api/agency/fee-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceName: pkgName.trim(), country: pkgCountry,
            amountBdt: Number(pkgAmount) || 30000,
            whenCharged: pkgWhen, refundable: true, refundPolicy: pkgRefund,
            proofDocumentUrls: pkgProofUrl ? [pkgProofUrl] : [],
          }),
        });
        const data = await res.json().catch(() => null);
        const newPkg: AgencyServicePackage = {
          id: data?.submission?.id || `srv-${Date.now()}`,
          name: pkgName.trim(), nameBn: pkgName.trim(),
          amountBdt: Number(pkgAmount) || 30000,
          whenCharged: pkgWhen, whenChargedBn: pkgWhen,
          refundable: true, refundPolicy: pkgRefund, refundPolicyBn: pkgRefund,
        };
        const updated = { ...agency, services: [...agency.services, newPkg] };
        VerifiedKnowledgeEngine.updateAgency(updated);
        setAgency(updated);
        showToast(`Package "${newPkg.name}" submitted for Admin verification.`);
      } else {
        // Edit existing
        const updatedPkg: AgencyServicePackage = {
          ...editingPkg, name: pkgName.trim(), nameBn: pkgName.trim(),
          amountBdt: Number(pkgAmount), whenCharged: pkgWhen, whenChargedBn: pkgWhen,
          refundPolicy: pkgRefund, refundPolicyBn: pkgRefund,
        };
        const updatedServices = agency.services.map(s => s.id === editingPkg.id ? updatedPkg : s);
        const updated = { ...agency, services: updatedServices };
        VerifiedKnowledgeEngine.updateAgency(updated);
        setAgency(updated);
        showToast(`Package "${updatedPkg.name}" updated. Re-submitted for Admin verification.`);
      }
      fetch('/api/agency/fee-submissions').then(r => r.ok ? r.json() : null).then(d => { if (d?.submissions) setFeeSubmissions(d.submissions); }).catch(() => {});
      setShowAddPackage(false);
    } catch {
      showToast('Network error. Changes saved locally.');
    } finally {
      setSubmittingPkg(false);
    }
  };

  const handleDeletePackage = (pkgId: string) => {
    if (!agency) return;
    const updated = { ...agency, services: agency.services.filter(s => s.id !== pkgId) };
    VerifiedKnowledgeEngine.updateAgency(updated);
    setAgency(updated);
    showToast('Service package removed from public directory.');
  };

  /* ─── Cost Benchmarks ────────────────────────────────────────────────── */

  const filteredBenchmarks = useMemo(() => {
    if (!bmkSearch) return benchmarks;
    return benchmarks.filter((b: any) =>
      b.country?.toLowerCase().includes(bmkSearch.toLowerCase()) ||
      b.requirementType?.toLowerCase().includes(bmkSearch.toLowerCase())
    );
  }, [benchmarks, bmkSearch]);

  const handleAddBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const codeMap: Record<string, string> = { Germany: 'DEU', Canada: 'CAN', 'United Kingdom': 'GBR', 'United States': 'USA', Australia: 'AUS', Netherlands: 'NLD', Sweden: 'SWE' };
      const flagMap: Record<string, string> = { Germany: '🇩🇪', Canada: '🇨🇦', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸', Australia: '🇦🇺', Netherlands: '🇳🇱', Sweden: '🇸🇪' };
      const curMap: Record<string, string> = { Germany: 'EUR', Canada: 'CAD', 'United Kingdom': 'GBP', 'United States': 'USD', Australia: 'AUD', Netherlands: 'EUR', Sweden: 'SEK' };
      const rateMap: Record<string, number> = { Germany: 130, Canada: 89.5, 'United Kingdom': 152, 'United States': 121, Australia: 80, Netherlands: 130, Sweden: 11.5 };

      const res = await fetch('/api/provenance/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: bmkCountry, countryCode: codeMap[bmkCountry] || 'INTL',
          flagEmoji: flagMap[bmkCountry] || '🌍', currency: curMap[bmkCountry] || 'USD',
          exchangeRateBdt: rateMap[bmkCountry] || 120,
          livingCostMonthlyBdtMin: 110000, livingCostMonthlyBdtMax: 150000,
          blockedAccountOrGicBdt: Number(bmkAmount),
          requirementType: bmkType, visaFeeBdt: 12000, healthInsuranceYearlyBdt: 120000,
          officialGovUrl: bmkSourceUrl, officialGovSourceTitle: bmkSourceTitle,
          keyRequirements: [bmkNotes, `Submitted by: ${agency?.name || 'Agency'} (${agency?.licenseNo || 'License'})`],
          verifiedByAdminId: null,
        }),
      });
      if (res.ok) {
        showToast(`Benchmark for ${bmkCountry} submitted! Ethos Admin will cross-verify and publish.`);
        setShowAddBenchmark(false);
        fetch('/api/provenance/benchmarks').then(r => r.ok ? r.json() : null).then(d => { if (d?.benchmarks) setBenchmarks(d.benchmarks); }).catch(() => {});
      } else { showToast('Submission failed. Please check all fields.'); }
    } catch { showToast('Network error submitting benchmark.'); }
  };

  /* ─── License & Compliance ───────────────────────────────────────────── */

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocName.trim()) return;
    const newDoc: ComplianceDoc = {
      id: `lic-${Date.now()}`,
      name: uploadDocName,
      status: 'pending',
      expiry: uploadExpiry || '—',
      issuedBy: uploadIssuedBy || 'Pending verification',
    };
    setComplianceDocs(prev => [...prev, newDoc]);
    setUploadDocName(''); setUploadIssuedBy(''); setUploadExpiry('');
    setShowUploadDoc(false);
    showToast(`"${newDoc.name}" submitted for Admin review.`);
  };

  /* ─── Stats ──────────────────────────────────────────────────────────── */
  const totalEscrow = apps.reduce((s, a) => s + a.escrowAmountRaw, 0);
  const activeCount = apps.filter(a => !['Completed', 'Withdrawn'].includes(a.stage)).length;
  const expiredDocs = complianceDocs.filter(d => d.status === 'expired').length;
  const expiringDocs = complianceDocs.filter(d => d.status === 'expiring').length;

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: 'var(--ink, #14120E)', color: '#fff', padding: '12px 20px',
          borderRadius: '8px', border: '2px solid #10B981',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)', display: 'flex',
          alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '14px',
          maxWidth: '420px', animation: 'fadeUp 0.3s ease-out',
        }}>
          <span>✅</span><span>{notification}</span>
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
            {agency?.name || 'Global Edu BD'} · License: <code>{agency?.licenseNo || 'TRAD/DNCC/041289/2022'}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/agency/chat" style={{ textDecoration: 'none' }}>
            <Button variant="emerald" size="sm">💬 Applicant Inbox</Button>
          </Link>
          <Link href="/directory" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">🌐 Public Profile</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'Profile Views', value: '1,490', icon: '👁️' },
          { label: 'Active Applications', value: activeCount.toString(), icon: '📋' },
          { label: 'Escrow Protected', value: `৳${totalEscrow.toLocaleString()}`, icon: '🔒' },
          { label: 'Compliance Alerts', value: (expiredDocs + expiringDocs).toString(), icon: expiredDocs > 0 ? '🚨' : expiringDocs > 0 ? '⚠️' : '✅' },
        ].map(s => (
          <GlassCard key={s.label} padding="md" className={styles.stat}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div className={styles.statVal}>{s.value}</div>
            <div className={styles.statLbl}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '2px solid var(--border, #E5E7EB)', paddingBottom: '10px' }}>
        {[
          { id: 'applications', label: 'Student Queue', icon: '👥' },
          { id: 'services', label: 'Service Packages', icon: '💰' },
          { id: 'benchmarks', label: 'Cost Benchmarks', icon: '🏛️' },
          { id: 'license', label: 'License & Compliance', icon: '📜' },
        ].map(t => (
          <Button key={t.id} size="sm"
            variant={activeTab === t.id ? 'primary' : 'ghost'}
            onClick={() => { setActiveTab(t.id as any); if (typeof window !== 'undefined') window.location.hash = t.id; }}>
            {t.icon} {t.label}
          </Button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1 — STUDENT APPLICATION QUEUE
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <GlassCard padding="none" className={styles.tableCard}>
          {/* Queue Controls */}
          <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 className={styles.tableTitle}>Student Application Queue ({filteredApps.length})</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                placeholder="Search student, program, ID..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
                style={{ padding: '7px 12px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '13px', minWidth: '220px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <select
                value={queueStageFilter}
                onChange={e => setQueueStageFilter(e.target.value as any)}
                style={{ padding: '7px 12px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <option value="all">All Stages</option>
                {STAGE_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button size="sm" variant="emerald" onClick={() => setNewStudentModal(true)}>
                ➕ Add Applicant
              </Button>
            </div>
          </div>

          {/* Stage progress legend */}
          <div style={{ padding: '10px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated, #F8FAFC)' }}>
            {STAGE_ORDER.slice(0, 5).map((s, i) => (
              <button key={s} onClick={() => setQueueStageFilter(queueStageFilter === s ? 'all' : s)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '9999px', border: `1.5px solid ${stageColor(s)}`, background: queueStageFilter === s ? stageColor(s) : 'transparent', color: queueStageFilter === s ? '#fff' : stageColor(s), fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                <span>{apps.filter(a => a.stage === s).length}</span>
                <span>{s}</span>
              </button>
            ))}
          </div>

          <table className={styles.table} aria-label="Student application queue">
            <thead>
              <tr>
                <th>Student</th>
                <th>Program & Destination</th>
                <th>Application Stage</th>
                <th>Escrow</th>
                <th>Intake</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No applications match your filters.</td></tr>
              ) : filteredApps.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>{a.student}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.studentId}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{a.program}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.university}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.country}</div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', background: `${stageColor(a.stage)}20`, border: `1.5px solid ${stageColor(a.stage)}`, color: stageColor(a.stage), fontSize: '12px', fontWeight: 700 }}>
                      {a.stage}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '13px' }}>{a.escrowAmount}</div>
                    <div style={{ fontSize: '11px', color: escrowColor(a.escrowStatus), fontWeight: 700 }}>{a.escrowStatus}</div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{a.intake}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedApp(a); setAppStageSelect(a.stage); }}>
                        📂 Dossier
                      </Button>
                      <Link href={`/agency/chat?threadId=thd-${a.id}&student=${encodeURIComponent(a.student)}`} style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="ghost" title={`Chat with ${a.student}`}>💬</Button>
                      </Link>
                      <Button size="sm" variant="emerald" onClick={() => handleAdvanceStage(a.id)} disabled={a.stage === 'Completed'}>
                        Advance →
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2 — SERVICE PACKAGES & PRICING
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'services' && (
        <GlassCard padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Verified Fee & Service Packages</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                These rates feed the AI Counselor, Student Directory, and Escrow Engine. All submitted fees undergo Admin audit before going live.
              </p>
            </div>
            <Button variant="emerald" size="sm" onClick={openAddPackage}>➕ Add New Package</Button>
          </div>

          {/* Admin Pipeline */}
          {feeSubmissions.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Admin Verification Pipeline
                <Badge variant="info" size="sm">{feeSubmissions.length} Submissions</Badge>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {feeSubmissions.map(fs => (
                  <div key={fs.id} style={{ background: 'var(--bg-elevated, #F8FAFC)', border: '2px solid var(--ink, #14120E)', borderRadius: '10px', padding: '16px', boxShadow: '3px 3px 0 0 var(--ink)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>{fs.serviceName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Destination: {fs.country}</div>
                      </div>
                      <Badge variant={fs.status === 'APPROVED' ? 'verified' : fs.status === 'REJECTED' ? 'danger' : 'pending'} size="sm">
                        {fs.status === 'APPROVED' ? '✓ Live' : fs.status === 'REJECTED' ? '✕ Revision Needed' : '⏳ Under Review'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', marginTop: '10px' }}>
                      ৳{Number(fs.amountBdt).toLocaleString()} BDT
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      <strong>Milestone Schedule:</strong> {fs.whenCharged}
                    </p>
                    <p style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                      <strong>Refund:</strong> {fs.refundPolicy}
                    </p>
                    {fs.adminFeedback && (
                      <div style={{ marginTop: '10px', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '12px' }}>
                        <strong>Admin Feedback:</strong> {fs.adminFeedback}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Submitted: {new Date(fs.submittedAt || Date.now()).toLocaleDateString()}</span>
                      {fs.status === 'APPROVED' && <span style={{ color: '#10B981', fontWeight: 700 }}>Published to Students ✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Packages */}
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>🌟 Active Packages in Public Directory</h3>
          {(!agency?.services || agency.services.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>💼</div>
              <div style={{ fontWeight: 700 }}>No packages yet</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Add your first service package to appear in the AI Counselor and Student Directory.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {agency.services.map(s => (
                <div key={s.id} style={{ background: 'var(--bg-elevated, #F8FAFC)', border: '2px solid var(--ink, #14120E)', borderRadius: '10px', padding: '16px', boxShadow: '3px 3px 0 0 var(--ink)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>{s.name}</h4>
                    <Badge variant="verified" size="sm">৳{s.amountBdt.toLocaleString()} BDT</Badge>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    <strong>Milestone Trigger:</strong> {s.whenCharged}
                  </p>
                  <p style={{ fontSize: '12px', color: '#059669', margin: 0 }}>
                    <strong>Refund Policy:</strong> {s.refundPolicy}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button size="sm" variant="outline" onClick={() => openEditPackage(s)}>✏️ Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeletePackage(s.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3 — COST BENCHMARKS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'benchmarks' && (
        <GlassCard padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>🏛️ Country Cost Benchmarks</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Submit verified visa solvency figures (blocked accounts, GIC) from official government sources. Ethos Admin cross-verifies before publishing to students.
              </p>
            </div>
            <Button variant="emerald" size="sm" onClick={() => setShowAddBenchmark(true)}>+ Submit Benchmark</Button>
          </div>

          <input
            placeholder="Search by country or requirement type..."
            value={bmkSearch}
            onChange={e => setBmkSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />

          {filteredBenchmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontWeight: 700 }}>{bmkSearch ? 'No benchmarks match your search' : 'No benchmarks yet'}</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Submit official cost figures for admin verification.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Country', 'Requirement Type', 'Amount (BDT)', 'Exchange Rate', 'Official Source', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBenchmarks.map((b: any) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{b.flagEmoji} {b.country}</td>
                      <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{String(b.requirementType).replace(/_/g, ' ').toLowerCase()}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#10B981' }}>৳{Number(b.blockedAccountOrGicBdt).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>1 {b.currency} = ৳{b.exchangeRateBdt}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <a href={b.officialGovUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-primary, #3B82F6)', fontSize: '12px' }}>
                          {(b.officialGovSourceTitle || '').substring(0, 32)}… ↗
                        </a>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', border: `1.5px solid ${b.isVerified ? '#10B981' : '#F59E0B'}`, color: b.isVerified ? '#10B981' : '#F59E0B', fontSize: '11px', fontWeight: 700 }}>
                          {b.isVerified ? '✓ Admin Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Button size="sm" variant="outline" onClick={() => setSelectedBenchmark(b)}>Inspect</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '14px', background: 'var(--bg-elevated, #F9FAFB)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>📌 How This Works:</strong> Submitted benchmarks are reviewed by Ethos Admins who cross-verify figures against official government, embassy, and immigration authority websites.
            Once approved, data is shown to students as <strong>"Agency + Admin Verified"</strong> — giving them trustworthy, attributable cost figures your agency takes accountability for.
          </div>
        </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4 — LICENSE & COMPLIANCE
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'license' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Agency Identity Card */}
          <GlassCard padding="lg">
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Official Regulatory & Verification Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {[
                { label: 'Trade License No.', value: agency?.licenseNo || 'TRAD/DNCC/041289/2022', badge: '✓ Active' },
                { label: 'Registered Owner', value: agency?.ownerName || 'Md. Khairul Islam', badge: null },
                { label: 'Office Phone', value: agency?.phone || '+880-2-9871234', badge: null },
                { label: 'Ethos Risk Score', value: `${agency?.riskScore ?? 4}/100 — Very Low Risk`, badge: '🟢 Safe' },
                { label: 'Success Rate', value: `${agency?.successRate ?? 95}%`, badge: null },
                { label: 'Active Countries', value: agency?.countriesServed?.slice(0, 3).join(', ') || 'Canada, UK, Australia', badge: null },
              ].map(f => (
                <div key={f.label} style={{ padding: '14px', border: '1.5px solid var(--border)', borderRadius: '8px', background: 'var(--bg-elevated, #F8FAFC)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{f.value}</div>
                  {f.badge && <div style={{ marginTop: '6px', fontSize: '12px', color: '#10B981', fontWeight: 700 }}>{f.badge}</div>}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Compliance Document Register */}
          <GlassCard padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>📋 Compliance Document Register</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Track license renewals and compliance documents. Submit new documents for Admin verification.
                </p>
              </div>
              <Button variant="emerald" size="sm" onClick={() => setShowUploadDoc(true)}>📤 Submit Document</Button>
            </div>

            {/* Alert banner */}
            {(expiredDocs > 0 || expiringDocs > 0) && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', background: expiredDocs > 0 ? '#FEF2F2' : '#FFFBEB', border: `2px solid ${expiredDocs > 0 ? '#EF4444' : '#F59E0B'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{expiredDocs > 0 ? '🚨' : '⚠️'}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: expiredDocs > 0 ? '#DC2626' : '#B45309' }}>
                    {expiredDocs > 0 ? `${expiredDocs} document(s) EXPIRED — Action Required` : `${expiringDocs} document(s) expiring soon — Schedule Renewal`}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Expired documents will suspend your agency's verified status on the platform.</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {complianceDocs.map(doc => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: `1.5px solid ${doc.status === 'expired' ? '#EF4444' : doc.status === 'expiring' ? '#F59E0B' : 'var(--border)'}`, borderRadius: '8px', background: 'var(--bg-elevated, #F8FAFC)', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{doc.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Issued by: {doc.issuedBy}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {doc.status === 'expired' ? '🔴 Expired:' : doc.status === 'expiring' ? '🟡 Expires:' : doc.status === 'verified' ? '✅ Valid until:' : '⏳ Expiry:'} {doc.expiry}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '9999px', border: `1.5px solid ${complianceColor(doc.status)}`, color: complianceColor(doc.status), fontSize: '12px', fontWeight: 700, textTransform: 'capitalize' }}>
                      {doc.status === 'verified' ? '✓ Verified & Active' : doc.status === 'expiring' ? '⚠ Expiring Soon' : doc.status === 'expired' ? '✕ Expired' : '⏳ Pending Review'}
                    </span>
                    {(doc.status === 'expiring' || doc.status === 'expired') && (
                      <Button size="sm" variant="outline" onClick={() => showToast(`Renewal reminder sent for "${doc.name}".`)}>
                        🔄 Renew
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Annual Compliance Checklist */}
          <GlassCard padding="lg">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>✅ Annual Compliance Checklist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { task: 'Trade License renewal submitted to DNCC', done: true },
                { task: 'Education Board accreditation renewed', done: true },
                { task: 'Escrow account annual audit completed', done: true },
                { task: 'Agency staff background verification updated', done: true },
                { task: 'BAIR membership renewal submitted', done: false },
                { task: 'Anti-Money Laundering (AML) training completed', done: true },
                { task: 'Student Visa Processing Authorization renewal', done: false },
                { task: 'Annual platform compliance report submitted to Ethos Admin', done: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px', background: item.done ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)', border: `1px solid ${item.done ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }}>
                  <span style={{ fontSize: '16px' }}>{item.done ? '✅' : '⏳'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: item.done ? 'none' : 'none' }}>{item.task}</span>
                  {!item.done && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#F59E0B', fontWeight: 700, whiteSpace: 'nowrap' }}>Action Required</span>}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════ */}

      {/* Modal: Student Application Dossier */}
      {selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', border: '3px solid var(--ink, #14120E)', borderRadius: '12px', padding: '24px', maxWidth: '680px', width: '100%', boxShadow: '6px 6px 0 0 var(--ink)', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid var(--ink)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>👤 {selectedApp.student} — Application Dossier</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedApp.studentId} · Applied: {selectedApp.date} · {selectedApp.country}
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: '2px solid var(--ink)', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 800, fontSize: '14px' }}>✕</button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Current Stage', value: <span style={{ color: stageColor(selectedApp.stage), fontWeight: 800 }}>{selectedApp.stage}</span> },
                { label: 'Escrow Protected', value: <span style={{ color: '#10B981', fontWeight: 800 }}>{selectedApp.escrowAmount}</span> },
                { label: 'Escrow Status', value: <span style={{ color: escrowColor(selectedApp.escrowStatus), fontWeight: 700, fontSize: '12px' }}>{selectedApp.escrowStatus}</span> },
              ].map(m => (
                <div key={m.label} style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '14px' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Program */}
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: '6px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Program & University</div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedApp.program}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedApp.university} · {selectedApp.intake}</div>
            </div>

            {/* Contact */}
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: '6px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Student Contact</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
                <span>📞 {selectedApp.phone}</span>
                <span>✉️ {selectedApp.email}</span>
              </div>
            </div>

            {/* Documents */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>📂 Verified Document Repository:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {selectedApp.documents.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No documents uploaded yet.</div>
                ) : selectedApp.documents.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}>
                    <span>📄 {doc.name}</span>
                    <span style={{ color: doc.status.includes('✓') ? '#10B981' : '#F59E0B', fontWeight: 700 }}>{doc.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <strong>Notes:</strong> {selectedApp.notes}
            </div>

            {/* Escrow Milestones */}
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', border: '2px solid var(--ink)', borderRadius: '8px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>🔒 Escrow Milestone Schedule</div>
              {[
                { label: 'Milestone 1: University Application & Offer Dispatch', amount: '৳18,000', released: selectedApp.escrowStatus !== 'Held' },
                { label: 'Milestone 2: Embassy Docs Prep & Visa Filing', amount: '৳24,000', released: selectedApp.escrowStatus === 'Fully Released' },
                { label: 'Milestone 3: Visa Issuance & Pre-Departure Briefing', amount: '৳15,000', released: selectedApp.escrowStatus === 'Fully Released' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px dashed var(--border)' : 'none', fontSize: '12px' }}>
                  <span>{m.label}</span>
                  <span style={{ fontWeight: 700, color: m.released ? '#10B981' : '#6B7280' }}>{m.amount} · {m.released ? '✅ Released' : '🔒 Locked'}</span>
                </div>
              ))}

              {/* Milestone Evidence */}
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Submit Milestone Completion Evidence:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="e.g. Offer letter dispatched; Ref: UTO-2024-912" value={milestoneNote} onChange={e => setMilestoneNote(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', border: '1.5px solid var(--ink)', borderRadius: '5px', fontSize: '12px' }} />
                  <Button size="sm" variant="emerald" onClick={() => handleSubmitMilestoneEvidence(selectedApp.id)}>Submit Proof</Button>
                </div>
              </div>
            </div>

            {/* Stage Updater */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', fontWeight: 700 }}>Update Stage:</label>
              <select value={appStageSelect} onChange={e => setAppStageSelect(e.target.value as AppStage)}
                style={{ padding: '6px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)', fontWeight: 700, fontSize: '13px' }}>
                {STAGE_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button size="sm" variant="primary" onClick={() => handleUpdateStage(selectedApp.id)}>Update Stage</Button>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--ink)', paddingTop: '12px' }}>
              <Link href={`/agency/chat?threadId=thd-${selectedApp.id}&student=${encodeURIComponent(selectedApp.student)}`} style={{ textDecoration: 'none' }}>
                <Button size="sm" variant="emerald">💬 Open Live Chat with Student</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => setSelectedApp(null)}>Close Dossier</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Service Package */}
      {showAddPackage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', border: '3px solid var(--ink)', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '6px 6px 0 0 var(--ink)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{editingPkg ? '✏️ Edit Service Package' : '📦 Submit New Service Package'}</h2>
              <button onClick={() => setShowAddPackage(false)} style={{ background: 'none', border: '2px solid var(--ink)', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              All packages undergo compliance review and Admin audit before being published to students.
            </p>
            <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Destination Country', type: 'select', options: ['Canada', 'Germany', 'United Kingdom', 'United States', 'Australia', 'Netherlands', 'Sweden', 'Other'], value: pkgCountry, onChange: (v: string) => setPkgCountry(v) },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <select value={f.value} onChange={e => f.onChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                    {f.options?.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Package Name *</label>
                <input required type="text" placeholder="e.g. Master Admission & Visa Processing" value={pkgName} onChange={e => setPkgName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Total Fee (BDT ৳) *</label>
                <input required type="number" min={5000} step={1000} value={pkgAmount} onChange={e => setPkgAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Escrow Milestone Release Schedule *</label>
                <input required type="text" value={pkgWhen} onChange={e => setPkgWhen(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Refund Policy *</label>
                <input required type="text" value={pkgRefund} onChange={e => setPkgRefund(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Proof Document URL (optional)</label>
                <input type="url" placeholder="https://..." value={pkgProofUrl} onChange={e => setPkgProofUrl(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <Button type="button" variant="ghost" onClick={() => setShowAddPackage(false)}>Cancel</Button>
                <Button type="submit" variant="emerald" loading={submittingPkg}>{editingPkg ? 'Save & Resubmit' : 'Submit for Admin Verification'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Cost Benchmark */}
      {showAddBenchmark && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', border: '3px solid var(--ink)', borderRadius: '12px', padding: '24px', maxWidth: '540px', width: '100%', boxShadow: '6px 6px 0 0 var(--ink)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>🏛️ Submit Country Cost Benchmark</h2>
              <button onClick={() => setShowAddBenchmark(false)} style={{ background: 'none', border: '2px solid var(--ink)', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              All figures must reference official government or embassy sources. Data is admin-reviewed before publishing to students.
            </p>
            <form onSubmit={handleAddBenchmark} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Country *</label>
                <select value={bmkCountry} onChange={e => setBmkCountry(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                  {['Germany', 'Canada', 'United Kingdom', 'United States', 'Australia', 'Netherlands', 'Sweden', 'Denmark', 'France', 'Italy'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Requirement Type *</label>
                <select value={bmkType} onChange={e => setBmkType(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                  {['BLOCKED_ACCOUNT', 'GIC', 'MAINTENANCE_FUNDS', 'BANK_SOLVENCY'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Required Amount (BDT ৳) *</label>
                <input required type="number" min={1} value={bmkAmount} onChange={e => setBmkAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Official Government Source URL *</label>
                <input required type="url" placeholder="https://..." value={bmkSourceUrl} onChange={e => setBmkSourceUrl(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Source Title / Document Name *</label>
                <input required type="text" placeholder="e.g. German Federal Foreign Office" value={bmkSourceTitle} onChange={e => setBmkSourceTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Key Notes / Legal Reference</label>
                <input type="text" placeholder="e.g. €11,904/year per Section 16b AufenthG" value={bmkNotes} onChange={e => setBmkNotes(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <Button type="button" variant="ghost" onClick={() => setShowAddBenchmark(false)}>Cancel</Button>
                <Button type="submit" variant="emerald">Submit for Admin Verification</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Benchmark Inspection */}
      {selectedBenchmark && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', border: '3px solid var(--ink)', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '6px 6px 0 0 var(--ink)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid var(--ink)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                {selectedBenchmark.flagEmoji} {selectedBenchmark.country} Cost Benchmark
              </h2>
              <button onClick={() => setSelectedBenchmark(null)} style={{ background: 'none', border: '2px solid var(--ink)', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              {[
                { label: 'Requirement Type', value: String(selectedBenchmark.requirementType).replace(/_/g, ' ') },
                { label: 'Total Solvency Amount (BDT)', value: `৳${Number(selectedBenchmark.blockedAccountOrGicBdt).toLocaleString('en-IN')}`, highlight: true },
                { label: 'Currency', value: selectedBenchmark.currency },
                { label: 'Exchange Rate', value: `1 ${selectedBenchmark.currency} = ৳${selectedBenchmark.exchangeRateBdt}` },
                { label: 'Living Cost/Month (BDT)', value: `৳${Number(selectedBenchmark.livingCostMonthlyBdtMin || 0).toLocaleString()} – ৳${Number(selectedBenchmark.livingCostMonthlyBdtMax || 0).toLocaleString()}` },
                { label: 'Visa Fee (BDT)', value: `৳${Number(selectedBenchmark.visaFeeBdt || 0).toLocaleString()}` },
                { label: 'Health Insurance/Year', value: `৳${Number(selectedBenchmark.healthInsuranceYearlyBdt || 0).toLocaleString()}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{row.label}:</span>
                  <span style={{ fontWeight: 800, color: row.highlight ? '#10B981' : 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
              <div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Verification Status:</span>
                <Badge variant={selectedBenchmark.isVerified ? 'verified' : 'pending'} size="sm">
                  {selectedBenchmark.isVerified ? '✓ Admin Verified & Published' : '⏳ Pending Admin Review'}
                </Badge>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Official Government Source:</span>
                <a href={selectedBenchmark.officialGovUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-primary, #3B82F6)', textDecoration: 'underline', wordBreak: 'break-all', fontSize: '12px' }}>
                  {selectedBenchmark.officialGovSourceTitle} ↗
                </a>
              </div>
              {selectedBenchmark.keyRequirements?.length > 0 && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Key Statutory Requirements:</span>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
                    {selectedBenchmark.keyRequirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <Button size="sm" variant="ghost" onClick={() => setSelectedBenchmark(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Student Applicant */}
      {newStudentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', border: '3px solid var(--ink)', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '6px 6px 0 0 var(--ink)', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>➕ Register New Applicant</h2>
              <button onClick={() => setNewStudentModal(false)} style={{ background: 'none', border: '2px solid var(--ink)', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <form onSubmit={handleAddNewStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Applicant full name' },
                { label: 'Phone *', key: 'phone', type: 'tel', placeholder: '+880-XXXX-XXXXXX' },
                { label: 'Email *', key: 'email', type: 'email', placeholder: 'student@email.com' },
                { label: 'Target Program *', key: 'program', type: 'text', placeholder: 'e.g. M.Sc. Computer Science' },
                { label: 'Target University *', key: 'university', type: 'text', placeholder: 'University name' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input
                    required={f.label.includes('*')}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(newStudentForm as any)[f.key]}
                    onChange={e => setNewStudentForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Destination Country</label>
                <select value={newStudentForm.country} onChange={e => setNewStudentForm(p => ({ ...p, country: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                  {['Canada 🇨🇦', 'Germany 🇩🇪', 'United Kingdom 🇬🇧', 'United States 🇺🇸', 'Australia 🇦🇺', 'Netherlands 🇳🇱', 'Sweden 🇸🇪'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Intake</label>
                <select value={newStudentForm.intake} onChange={e => setNewStudentForm(p => ({ ...p, intake: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                  {['Fall 2026', 'Winter 2026', 'Spring 2027', 'Summer 2027', 'Fall 2027'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Escrow Amount (BDT ৳)</label>
                <input type="number" min={5000} step={1000} value={newStudentForm.escrowAmount} onChange={e => setNewStudentForm(p => ({ ...p, escrowAmount: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <Button type="button" variant="ghost" onClick={() => setNewStudentModal(false)}>Cancel</Button>
                <Button type="submit" variant="emerald">Register Applicant</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Compliance Document */}
      {showUploadDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary, #fff)', border: '3px solid var(--ink)', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '6px 6px 0 0 var(--ink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>📤 Submit Compliance Document</h2>
              <button onClick={() => setShowUploadDoc(false)} style={{ background: 'none', border: '2px solid var(--ink)', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <form onSubmit={handleUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Document Name *</label>
                <input required type="text" placeholder="e.g. BAIR Membership Renewal 2026" value={uploadDocName} onChange={e => setUploadDocName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Issuing Authority</label>
                <input type="text" placeholder="e.g. Ministry of Education, BD" value={uploadIssuedBy} onChange={e => setUploadIssuedBy(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Expiry Date</label>
                <input type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '2px solid var(--ink)', borderRadius: '6px' }} />
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-elevated, #F8FAFC)', border: '1.5px dashed var(--border)', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>📎</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click to attach document file (PDF, JPG, PNG)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>File upload to Admin portal is handled out-of-band. Submit this form to notify Ethos Admin.</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <Button type="button" variant="ghost" onClick={() => setShowUploadDoc(false)}>Cancel</Button>
                <Button type="submit" variant="emerald">Submit to Admin</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
