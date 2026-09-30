'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AdminPanel.module.css';
import { browserApi, errorMessage } from '@/lib/platform/browser';

interface AdminStats {
  agencies: { total: number; verified: number; pending: number; rejected: number };
  disputes: { activeCount: number; disputedBDT: number; disputedFormatted: string };
  escrow: { held: number; released: number; pending: number; totalSecuredBDT: number; totalSecuredFormatted: string };
  scamAlerts: { pendingCount: number; totalCount: number };
  users: { total: number; students: number; parents: number; agencies: number; admins: number };
}

interface AgencyItem {
  id: string;
  name: string;
  licenseNo: string;
  licenseStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  countriesServed: string[];
  foundedYear: number;
  riskScore: number;
  rating: number;
  reviewCount: number;
  successRate: number;
  address: string;
  website: string;
  description: string;
  owner?: { name: string; email: string; phone: string } | null;
  submittedDocs?: { name: string; status: string; size: string }[];
}

interface DisputeItem {
  id: string;
  milestoneId: string;
  applicationId: string;
  milestoneName: string;
  amountPoisha: string;
  amountBDT: number;
  amountFormatted: string;
  status: 'disputed' | 'refunded' | 'released' | string;
  reason: string;
  disputedAt: string;
  student: { id: string; name: string; email: string; phone: string };
  agency: { id: string; name: string; licenseNo: string };
  application: { targetUniversity: string; targetProgram: string; targetCountry: string };
  ledgerCount: number;
}

interface ScamAlertItem {
  id: string;
  type: string;
  title: string;
  agencyName: string;
  agencyId: string | null;
  studentName: string;
  studentEmail: string;
  riskScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING_REVIEW' | 'FLAGGED' | 'RESOLVED' | 'DISMISSED';
  evidenceSummary: string;
  detectedAt: string;
  actionTaken: string | null;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN' | string;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  details?: { linkCode?: string; licenseNo?: string; agencyName?: string; licenseStatus?: string; targetCountries?: string[]; targetField?: string; budgetRange?: string; riskScore?: number } | null;
  linkedAccountsCount: number;
}

interface LedgerItem {
  id: string;
  milestoneId: string;
  type: string;
  amountFormatted: string;
  provider: string;
  providerTxnId: string;
  txHash: string;
  txHashShort: string;
  actorId: string;
  note: string;
  timestamp: string;
}

interface CountryBenchmarkItem {
  id: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  currency: string;
  exchangeRateBdt: number;
  livingCostMonthlyBdtMin: number;
  livingCostMonthlyBdtMax: number;
  blockedAccountOrGicBdt: number;
  requirementType: string;
  visaFeeBdt: number;
  healthInsuranceYearlyBdt: number;
  officialGovUrl: string;
  officialGovSourceTitle: string;
  isVerified: boolean;
  verifiedByAdminId: string;
  lastAuditedAt: string;
  keyRequirements: string[];
}

interface CourseCatalogItem {
  id: string;
  benchmarkId?: string;
  universityName: string;
  country: string;
  countryCode: string;
  degreeLevel: string;
  programName: string;
  annualTuitionLocal: number;
  currency: string;
  annualTuitionBdt: number;
  officialCatalogUrl: string;
  officialSourceTitle: string;
  intakeYear: string;
  isVerified: boolean;
  status: string;
  lastAuditedAt: string;
}

interface FeeSubmissionItem {
  id: string;
  agencyId: string;
  agencyName: string;
  country: string;
  serviceName: string;
  amountBdt: number;
  whenCharged: string;
  refundable: boolean;
  refundPolicy: string;
  proofDocumentUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminFeedback?: string | null;
  reviewedByAdminId?: string | null;
  reviewedAt?: string | null;
  submittedAt: string;
}

type TabType = 'Agency Verification' | 'Data Provenance' | 'Disputes' | 'Scam Alerts' | 'Users' | 'Audit Ledger';
const TABS: TabType[] = ['Agency Verification', 'Data Provenance', 'Disputes', 'Scam Alerts', 'Users', 'Audit Ledger'];

const TAB_MAP: Record<string, TabType> = {
  agencies: 'Agency Verification',
  agency: 'Agency Verification',
  provenance: 'Data Provenance',
  benchmarks: 'Data Provenance',
  disputes: 'Disputes',
  scams: 'Scam Alerts',
  alerts: 'Scam Alerts',
  users: 'Users',
  ledger: 'Audit Ledger',
};

const TAB_REVERSE_MAP: Record<TabType, string> = {
  'Agency Verification': 'agencies',
  'Data Provenance': 'provenance',
  'Disputes': 'disputes',
  'Scam Alerts': 'scams',
  'Users': 'users',
  'Audit Ledger': 'ledger',
};

export default function AdminPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab')?.toLowerCase();
  const activeTab: TabType = (tabParam && TAB_MAP[tabParam]) || 'Agency Verification';

  const setActiveTab = (tab: TabType) => {
    const slug = TAB_REVERSE_MAP[tab] || 'agencies';
    router.push(`/admin?tab=${slug}`, { scroll: false });
  };

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [agencies, setAgencies] = useState<AgencyItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [scamAlerts, setScamAlerts] = useState<ScamAlertItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [benchmarks, setBenchmarks] = useState<CountryBenchmarkItem[]>([]);
  const [courseCatalogs, setCourseCatalogs] = useState<CourseCatalogItem[]>([]);
  const [feeSubmissions, setFeeSubmissions] = useState<FeeSubmissionItem[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN'>('ALL');
  const [provenanceSubTab, setProvenanceSubTab] = useState<'submissions' | 'benchmarks' | 'catalogs'>('submissions');

  // Modals
  const [selectedAgencyDossier, setSelectedAgencyDossier] = useState<AgencyItem | null>(null);
  const [selectedDisputeEvidence, setSelectedDisputeEvidence] = useState<DisputeItem | null>(null);
  const [selectedScamReport, setSelectedScamReport] = useState<ScamAlertItem | null>(null);
  const [selectedFeeSubDossier, setSelectedFeeSubDossier] = useState<FeeSubmissionItem | null>(null);
  const [selectedUserDossier, setSelectedUserDossier] = useState<UserItem | null>(null);
  const [feeSubFeedback, setFeeSubFeedback] = useState<string>('');
  const [agencyAuditNote, setAgencyAuditNote] = useState<string>('');
  const [disputeResolutionNote, setDisputeResolutionNote] = useState<string>('');
  const [userRoleUpdate, setUserRoleUpdate] = useState<string>('');
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);
  const [newCatalogForm, setNewCatalogForm] = useState({
    universityName: '',
    country: 'Canada',
    countryCode: 'CAN',
    degreeLevel: 'Master',
    programName: '',
    annualTuitionLocal: 0,
    currency: 'CAD',
    officialCatalogUrl: '',
    officialSourceTitle: '',
  });

  // Toast feedback helper
  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Fetch all live data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ovRes, agRes, dpRes, scRes, usRes, ldRes, bmRes, ctRes, fsRes] = await Promise.all([
        browserApi<{ stats: AdminStats }>('/api/admin/overview'),
        browserApi<{ agencies: AgencyItem[] }>('/api/admin/agencies'),
        browserApi<{ disputes: DisputeItem[] }>('/api/admin/disputes'),
        browserApi<{ alerts: ScamAlertItem[] }>('/api/admin/scam-alerts'),
        browserApi<{ users: UserItem[] }>('/api/admin/users'),
        browserApi<{ entries: LedgerItem[] }>('/api/escrow/ledger'),
        browserApi<{ benchmarks: CountryBenchmarkItem[] }>('/api/provenance/benchmarks'),
        browserApi<{ catalogs: CourseCatalogItem[] }>('/api/provenance/catalogs'),
        browserApi<{ submissions: FeeSubmissionItem[] }>('/api/admin/fee-submissions'),
      ]);
      setStats(ovRes.stats); setAgencies(agRes.agencies); setDisputes(dpRes.disputes);
      setScamAlerts(scRes.alerts); setUsersList(usRes.users); setLedgerEntries(ldRes.entries);
      setBenchmarks(bmRes.benchmarks); setCourseCatalogs(ctRes.catalogs); setFeeSubmissions(fsRes.submissions);
    } catch (err) {
      setFeedback(errorMessage(err, 'Unable to load admin dashboard. Refresh to retry.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  // Support legacy hash links by migrating them to query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash.replace('#', '').toLowerCase();
    if (h && TAB_MAP[h]) {
      router.replace(`/admin?tab=${TAB_REVERSE_MAP[TAB_MAP[h]]}`, { scroll: false });
    }
  }, [router]);

  // Handler: Fee submission review
  const handleFeeSubmissionAction = async (id: string, action: 'APPROVED' | 'REJECTED', note?: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch('/api/admin/fee-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: id,
          action,
          adminFeedback: note || (action === 'APPROVED' ? 'Verified against agency trade license and student escrow terms.' : 'Rejected due to non-compliant terms.'),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(errorMessage(data.error, 'Failed to review fee submission'));
      showToast(data.message || `Submission was ${action.toLowerCase()}.`);
      setSelectedFeeSubDossier(null);
      await fetchData();
    } catch (err) {
      showToast(`Error: ${errorMessage(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler: Add official course catalog
  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoadingId('new-catalog');
      const res = await fetch('/api/provenance/catalogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCatalogForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(errorMessage(data.error, 'Failed to save catalog'));
      showToast(`Course catalog for ${newCatalogForm.universityName} verified and published.`);
      setShowAddCatalogModal(false);
      setNewCatalogForm({
        universityName: '',
        country: 'Canada',
        countryCode: 'CAN',
        degreeLevel: 'Master',
        programName: '',
        annualTuitionLocal: 0,
        currency: 'CAD',
        officialCatalogUrl: '',
        officialSourceTitle: '',
      });
      await fetchData();
    } catch (err) {
      showToast(`Error: ${errorMessage(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler: Benchmark verify / reject
  const handleBenchmarkVerify = async (benchmarkId: string, approve: boolean) => {
    try {
      setActionLoadingId(benchmarkId);
      const res = await fetch('/api/provenance/benchmarks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: benchmarkId, isVerified: approve }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(errorMessage(data.error, 'Failed to update benchmark'));
      await fetchData();
      showToast(approve ? '✓ Benchmark approved & published to students.' : '✕ Benchmark rejected.');
    } catch (err) {
      showToast(`Error: ${errorMessage(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler: Agency Verification action
  const handleAgencyAction = async (agencyId: string, action: 'VERIFIED' | 'REJECTED', note?: string) => {
    try {
      setActionLoadingId(agencyId);
      const res = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, action, note }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAgencies((prev) =>
          prev.map((a) => (a.id === agencyId ? { ...a, licenseStatus: action } : a))
        );
        showToast(`✓ Agency verification updated: ${action}`);
        if (selectedAgencyDossier?.id === agencyId) {
          setSelectedAgencyDossier(null);
        }
        // Refresh overview stats
        fetch('/api/admin/overview')
          .then((r) => r.json())
          .then((d) => d.stats && setStats(d.stats))
          .catch(() => {});
      } else {
        showToast(`✕ Error: ${errorMessage(data.error, 'Failed to update agency')}`);
      }
    } catch {
      showToast('✕ Network error processing agency verification');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler: Dispute resolution
  const handleResolveDispute = async (milestoneId: string, action: 'REFUND' | 'RELEASE', reason: string) => {
    try {
      setActionLoadingId(milestoneId);
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, action, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextStatus = action === 'REFUND' ? 'refunded' : 'released';
        setDisputes((prev) =>
          prev.map((d) => (d.milestoneId === milestoneId ? { ...d, status: nextStatus } : d))
        );
        showToast(data.sandbox ? 'Sandbox dispute recorded. No real funds moved.' : (data.message || 'Dispute resolution recorded.'));
        setSelectedDisputeEvidence(null);
        // Refresh stats and ledger
        fetchData();
      } else {
        showToast(`✕ Error: ${errorMessage(data.error, 'Failed to resolve dispute')}`);
      }
    } catch {
      showToast('✕ Network error resolving dispute');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler: Scam Alert Action
  const handleScamAlertAction = async (alertId: string, action: 'FLAG_AGENCY' | 'BAN_AGENCY' | 'DISMISS') => {
    try {
      setActionLoadingId(alertId);
      const res = await fetch('/api/admin/scam-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setScamAlerts((prev) =>
          prev.map((s) => (s.id === alertId ? { ...s, status: action === 'DISMISS' ? 'DISMISSED' : 'FLAGGED' } : s))
        );
        showToast(`✓ Scam enforcement action executed: ${action}`);
        setSelectedScamReport(null);
        fetchData();
      } else {
        showToast(`✕ Error: ${errorMessage(data.error, 'Failed to apply action')}`);
      }
    } catch {
      showToast('✕ Network error executing scam alert action');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler: User verification toggle
  const handleToggleUserVerify = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoadingId(userId);
      const nextStatus = !currentStatus;
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isVerified: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isVerified: nextStatus } : u))
        );
        showToast(`✓ User verification status changed: ${nextStatus ? 'Verified' : 'Pending'}`);
      } else {
        showToast(`✕ Error: ${errorMessage(data.error, 'Failed to update user')}`);
      }
    } catch {
      showToast('✕ Network error toggling user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler: Update User Role (RBAC)
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setActionLoadingId(userId);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        if (selectedUserDossier && selectedUserDossier.id === userId) {
          setSelectedUserDossier((prev) => (prev ? { ...prev, role: newRole } : null));
        }
        showToast(`✓ User role updated to ${newRole}`);
      } else {
        showToast(`✕ Error: ${errorMessage(data.error, 'Failed to update user role')}`);
      }
    } catch {
      showToast('✕ Network error updating user role');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered agencies
  const filteredAgencies = useMemo(() => {
    return agencies.filter((a) => {
      const matchesFilter =
        agencyFilter === 'ALL' ||
        (agencyFilter === 'PENDING' && a.licenseStatus === 'PENDING') ||
        (agencyFilter === 'VERIFIED' && a.licenseStatus === 'VERIFIED') ||
        (agencyFilter === 'REJECTED' && a.licenseStatus === 'REJECTED');
      const matchesSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.licenseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.countriesServed.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [agencies, agencyFilter, searchQuery]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesRole = userRoleFilter === 'ALL' || u.role.toUpperCase() === userRoleFilter;
      const matchesSearch =
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery);
      return matchesRole && matchesSearch;
    });
  }, [usersList, userRoleFilter, searchQuery]);

  const pendingAgenciesCount = agencies.filter((a) => a.licenseStatus === 'PENDING').length;
  const activeDisputesCount = disputes.filter((d) => d.status === 'disputed').length;
  const pendingScamCount = scamAlerts.filter((s) => s.status === 'PENDING_REVIEW' || s.status === 'FLAGGED').length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Admin Governance Dashboard</h1>
          <p className={styles.subtitle}>
            Platform oversight, consultancy license audits, escrow dispute adjudication & AI fraud enforcement
          </p>
        </div>
        <div className={styles.headerRight}>
          <Badge variant="verified" size="sm">
            Platform Administrator
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchData}
            loading={loading}
          >
            ↻ Refresh Data
          </Button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && <div className={styles.feedbackToast}>{feedback}</div>}

      {/* Top Stat Cards as Interactive Buttons */}
      <div className={styles.statGrid} role="region" aria-label="Quick Navigation Cards">
        {/* Box 1: Agencies */}
        <button
          type="button"
          className={`${styles.statCard} ${activeTab === 'Agency Verification' ? styles.statCardActive : ''}`}
          onClick={() => {
            setActiveTab('Agency Verification');
            setSearchQuery('');
          }}
          aria-label="View Agencies Verification details"
        >
          {activeTab === 'Agency Verification' && (
            <span className={styles.activeIndicator}>● Viewing</span>
          )}
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-primary)' }}>
            🏢
          </div>
          <div>
            <div className={styles.statValue}>
              {stats?.agencies.verified ?? 0}
              <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {' '}/ {stats?.agencies.total ?? 0}
              </span>
            </div>
            <div className={styles.statLabel}>Agencies Verified</div>
            <div className={styles.statSubtext}>{pendingAgenciesCount} pending audit</div>
            <div className={styles.clickHint}>
              {activeTab === 'Agency Verification' ? 'Viewing details below ↓' : 'Click to view details →'}
            </div>
          </div>
        </button>

        {/* Box 2: Disputes */}
        <button
          type="button"
          className={`${styles.statCard} ${activeTab === 'Disputes' ? styles.statCardActive : ''}`}
          onClick={() => {
            setActiveTab('Disputes');
            setSearchQuery('');
          }}
          aria-label="View Escrow Disputes details"
        >
          {activeTab === 'Disputes' && (
            <span className={styles.activeIndicator}>● Viewing</span>
          )}
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            ⚖️
          </div>
          <div>
            <div className={styles.statValue}>{stats?.disputes.disputedFormatted ?? '৳0'}</div>
            <div className={styles.statLabel}>Escrow in Dispute</div>
            <div className={styles.statSubtext}>{activeDisputesCount} active disputes</div>
            <div className={styles.clickHint}>
              {activeTab === 'Disputes' ? 'Viewing details below ↓' : 'Click to view details →'}
            </div>
          </div>
        </button>

        {/* Box 3: Protected in Escrow */}
        <button
          type="button"
          className={`${styles.statCard} ${activeTab === 'Audit Ledger' ? styles.statCardActive : ''}`}
          onClick={() => {
            setActiveTab('Audit Ledger');
            setSearchQuery('');
          }}
          aria-label="View Protected Escrow Ledger details"
        >
          {activeTab === 'Audit Ledger' && (
            <span className={styles.activeIndicator}>● Viewing</span>
          )}
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            🔒
          </div>
          <div>
            <div className={styles.statValue}>{stats?.escrow.totalSecuredFormatted ?? '৳0'}</div>
            <div className={styles.statLabel}>Protected in Escrow</div>
            <div className={styles.statSubtext}>৳{((stats?.escrow.held ?? 0)).toLocaleString('en-IN')} currently held</div>
            <div className={styles.clickHint}>
              {activeTab === 'Audit Ledger' ? 'Viewing details below ↓' : 'Click to view details →'}
            </div>
          </div>
        </button>

        {/* Box 4: AI Fraud Flags */}
        <button
          type="button"
          className={`${styles.statCard} ${activeTab === 'Scam Alerts' ? styles.statCardActive : ''}`}
          onClick={() => {
            setActiveTab('Scam Alerts');
            setSearchQuery('');
          }}
          aria-label="View AI Fraud Flags and Scam Alerts details"
        >
          {activeTab === 'Scam Alerts' && (
            <span className={styles.activeIndicator}>● Viewing</span>
          )}
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            🚨
          </div>
          <div>
            <div className={styles.statValue}>{pendingScamCount}</div>
            <div className={styles.statLabel}>AI Fraud Flags</div>
            <div className={styles.statSubtext}>{stats?.scamAlerts.totalCount ?? 0} total logged</div>
            <div className={styles.clickHint}>
              {activeTab === 'Scam Alerts' ? 'Viewing details below ↓' : 'Click to view details →'}
            </div>
          </div>
        </button>

        {/* Box 5: Platform Members */}
        <button
          type="button"
          className={`${styles.statCard} ${activeTab === 'Users' ? styles.statCardActive : ''}`}
          onClick={() => {
            setActiveTab('Users');
            setSearchQuery('');
          }}
          aria-label="View Platform Members directory details"
        >
          {activeTab === 'Users' && (
            <span className={styles.activeIndicator}>● Viewing</span>
          )}
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            👥
          </div>
          <div>
            <div className={styles.statValue}>{stats?.users.total ?? 0}</div>
            <div className={styles.statLabel}>Platform Members</div>
            <div className={styles.statSubtext}>
              {stats?.users.students ?? 0} stu · {stats?.users.parents ?? 0} par · {stats?.users.agencies ?? 0} agc
            </div>
            <div className={styles.clickHint}>
              {activeTab === 'Users' ? 'Viewing details below ↓' : 'Click to view details →'}
            </div>
          </div>
        </button>

        {/* Box 6: Data Provenance */}
        <button
          type="button"
          className={`${styles.statCard} ${activeTab === 'Data Provenance' ? styles.statCardActive : ''}`}
          onClick={() => {
            setActiveTab('Data Provenance');
            setSearchQuery('');
          }}
          aria-label="View Data Provenance and Cost Benchmark verification queue"
        >
          {activeTab === 'Data Provenance' && (
            <span className={styles.activeIndicator}>● Viewing</span>
          )}
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#059669' }}>
            🏛️
          </div>
          <div>
            <div className={styles.statValue}>{benchmarks.filter(b => !b.isVerified).length}</div>
            <div className={styles.statLabel}>Benchmarks Pending</div>
            <div className={styles.statSubtext}>{feeSubmissions.filter(f => f.status === 'PENDING').length} fee submissions · {courseCatalogs.length} catalogs</div>
            <div className={styles.clickHint}>
              {activeTab === 'Data Provenance' ? 'Viewing details below ↓' : 'Click to view details →'}
            </div>
          </div>
        </button>
      </div>


      {/* Dynamic Active View Banner */}
      <div className={styles.activeViewBanner}>
        <div className={styles.activeViewTitle}>
          <span>Current Active Section:</span>
          <strong>{activeTab === 'Audit Ledger' ? 'Protected in Escrow (Vault & Ledger)' : activeTab}</strong>
        </div>
        <div className={styles.activeViewSub}>
          {activeTab === 'Agency Verification' && '🔍 Inspecting agency trade licenses, visa success rates & accreditation'}
          {activeTab === 'Data Provenance' && '🏛️ Cross-verifying country cost benchmarks, agency fee submissions & official catalogs'}
          {activeTab === 'Disputes' && '⚖️ Adjudicating student disputes with direct escrow refund & release controls'}
          {activeTab === 'Audit Ledger' && '🔒 Cryptographic SHA-256 escrow chain & real-time fund allocations'}
          {activeTab === 'Scam Alerts' && '🤖 Reviewing OCR-flagged fraudulent offer letters & predatory contract clauses'}
          {activeTab === 'Users' && '👥 Managing student, parent, agency, and administrator credentials'}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => {
            const count =
              t === 'Agency Verification'
                ? pendingAgenciesCount
                : t === 'Disputes'
                ? activeDisputesCount
                : t === 'Scam Alerts'
                ? pendingScamCount
                : null;

            return (
              <button
                key={t}
                role="tab"
                aria-selected={activeTab === t}
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(t);
                  setSearchQuery('');
                }}
              >
                <span>{t}</span>
                {count !== null && count > 0 && <span className={styles.tabCount}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: AGENCY VERIFICATION */}
      {activeTab === 'Agency Verification' && (
        <div className={styles.tableContainer}>
          <div className={styles.controlsBar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search agency by name, license, country..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterPills}>
              {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  className={`${styles.pillBtn} ${agencyFilter === filter ? styles.pillBtnActive : ''}`}
                  onClick={() => setAgencyFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <table className={styles.table} aria-label="Agency verification directory">
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>License & Reg</th>
                <th>Countries</th>
                <th>Success / Rating</th>
                <th>AI Risk Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td><Skeleton width="75%" height={16} /><Skeleton width="45%" height={12} style={{ marginTop: 4 }} /></td>
                    <td><Skeleton width={110} height={14} /></td>
                    <td><Skeleton width={120} height={14} /></td>
                    <td><Skeleton width={80} height={14} /></td>
                    <td><Skeleton width={60} height={20} rounded="full" /></td>
                    <td><Skeleton width={75} height={22} rounded="md" /></td>
                    <td><Skeleton width={85} height={30} rounded="md" /></td>
                  </tr>
                ))
              ) : (
                filteredAgencies.map((agency) => {
                const isActionLoading = actionLoadingId === agency.id;
                const riskClass =
                  agency.riskScore < 30
                    ? styles.riskLow
                    : agency.riskScore < 60
                    ? styles.riskMedium
                    : styles.riskHigh;

                return (
                  <tr key={agency.id}>
                    <td>
                      <div className={styles.primaryCell}>{agency.name}</div>
                      <div className={styles.subInfo}>{agency.address}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{agency.licenseNo}</div>
                      <div className={styles.subInfo}>Est. {agency.foundedYear}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {agency.countriesServed.map((c) => (
                          <span
                            key={c}
                            style={{
                              fontSize: '11px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              fontWeight: 700,
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>★ {agency.rating} / 5.0</div>
                      <div className={styles.subInfo}>{agency.successRate}% visa success</div>
                    </td>
                    <td>
                      <span className={`${styles.riskBadge} ${riskClass}`}>
                        {agency.riskScore}/100
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant={
                          agency.licenseStatus === 'VERIFIED'
                            ? 'verified'
                            : agency.licenseStatus === 'PENDING'
                            ? 'pending'
                            : 'rejected'
                        }
                        size="sm"
                      >
                        {agency.licenseStatus}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {agency.licenseStatus !== 'VERIFIED' && (
                          <Button
                            size="sm"
                            variant="emerald"
                            disabled={isActionLoading}
                            loading={isActionLoading}
                            onClick={() => handleAgencyAction(agency.id, 'VERIFIED')}
                          >
                            Approve
                          </Button>
                        )}
                        {agency.licenseStatus !== 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isActionLoading}
                            onClick={() => handleAgencyAction(agency.id, 'REJECTED', 'Failed verification audit')}
                          >
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAgencyDossier(agency)}
                        >
                          Dossier
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
              {!loading && filteredAgencies.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📂</div>
                      <div>No consultancies match the selected search or filter criteria.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ESCROW DISPUTES */}
      {activeTab === 'Disputes' && (
        <div className={styles.tableContainer}>
          <div className={styles.controlsBar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search dispute by student, agency, or ID..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              🛡️ All decisions append SHA-256 chained transaction records to the escrow ledger.
            </div>
          </div>

          <table className={styles.table} aria-label="Escrow disputes list">
            <thead>
              <tr>
                <th>Dispute ID</th>
                <th>Student</th>
                <th>Agency</th>
                <th>Target University</th>
                <th>Disputed Milestone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Adjudication</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td><Skeleton width={60} height={14} /></td>
                    <td><Skeleton width={110} height={14} /><Skeleton width={140} height={12} style={{ marginTop: 4 }} /></td>
                    <td><Skeleton width={110} height={14} /></td>
                    <td><Skeleton width={130} height={14} /></td>
                    <td><Skeleton width={100} height={14} /></td>
                    <td><Skeleton width={80} height={14} /></td>
                    <td><Skeleton width={70} height={20} rounded="full" /></td>
                    <td><Skeleton width={90} height={30} rounded="md" /></td>
                  </tr>
                ))
              ) : (
                disputes
                  .filter((d) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    d.id.toLowerCase().includes(q) ||
                    d.student.name.toLowerCase().includes(q) ||
                    d.agency.name.toLowerCase().includes(q)
                  );
                })
                .map((d) => {
                  const isActionLoading = actionLoadingId === d.milestoneId;
                  const isPending = d.status === 'disputed';

                  return (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{d.id}</td>
                      <td>
                        <div className={styles.primaryCell}>{d.student.name}</div>
                        <div className={styles.subInfo}>{d.student.email}</div>
                      </td>
                      <td>
                        <div className={styles.primaryCell}>{d.agency.name}</div>
                        <div className={styles.subInfo}>{d.agency.licenseNo}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{d.application.targetUniversity}</div>
                        <div className={styles.subInfo}>{d.application.targetProgram}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{d.milestoneName}</div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={d.reason}
                        >
                          &quot;{d.reason}&quot;
                        </div>
                      </td>
                      <td className={styles.amount}>{d.amountFormatted}</td>
                      <td>
                        <Badge
                          variant={
                            d.status === 'disputed'
                              ? 'danger'
                              : d.status === 'refunded'
                              ? 'verified'
                              : 'info'
                          }
                          size="sm"
                        >
                          {d.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                variant="emerald"
                                loading={isActionLoading}
                                disabled={isActionLoading}
                                onClick={() =>
                                  handleResolveDispute(
                                    d.milestoneId,
                                    'REFUND',
                                    'Admin verified student dispute: 100% refund returned to student account.'
                                  )
                                }
                                title="Refund held funds back to the student"
                              >
                                Refund Student
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isActionLoading}
                                onClick={() =>
                                  handleResolveDispute(
                                    d.milestoneId,
                                    'RELEASE',
                                    'Admin verified agency delivered milestone requirement: Funds released.'
                                  )
                                }
                                title="Release held funds to the agency"
                              >
                                Release
                              </Button>
                            </>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Resolved
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedDisputeEvidence(d)}
                          >
                            Evidence
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              {!loading && disputes.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>🕊️</div>
                      <div>No active disputes recorded in the escrow system.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SCAM ALERTS & FRAUD */}
      {activeTab === 'Scam Alerts' && (
        <div className={styles.tableContainer}>
          <div className={styles.controlsBar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search fraud alerts by title, target, or student..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              🤖 Real-time heuristics & OCR document anomaly classifier
            </div>
          </div>

          <table className={styles.table} aria-label="Scam alerts table">
            <thead>
              <tr>
                <th>Alert ID & Type</th>
                <th>Incident Details</th>
                <th>Target Agency / Entity</th>
                <th>Affected Student</th>
                <th>AI Risk Score</th>
                <th>Enforcement Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td><Skeleton width={80} height={14} /><Skeleton width={55} height={18} rounded="full" style={{ marginTop: 4 }} /></td>
                    <td><Skeleton width={140} height={16} /><Skeleton width={180} height={12} style={{ marginTop: 4 }} /></td>
                    <td><Skeleton width={110} height={14} /></td>
                    <td><Skeleton width={100} height={14} /></td>
                    <td><Skeleton width={60} height={20} rounded="full" /></td>
                    <td><Skeleton width={80} height={22} rounded="md" /></td>
                    <td><Skeleton width={90} height={30} rounded="md" /></td>
                  </tr>
                ))
              ) : (
                scamAlerts
                  .filter((s) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    s.title.toLowerCase().includes(q) ||
                    s.agencyName.toLowerCase().includes(q) ||
                    s.studentName.toLowerCase().includes(q)
                  );
                })
                .map((alert) => {
                  const isActionLoading = actionLoadingId === alert.id;
                  const isPending = alert.status === 'PENDING_REVIEW' || alert.status === 'FLAGGED';

                  return (
                    <tr key={alert.id}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800 }}>{alert.id}</div>
                        <Badge
                          variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {alert.type}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.primaryCell}>{alert.title}</div>
                        <div className={styles.subInfo} style={{ maxWidth: '280px' }}>
                          {alert.evidenceSummary}
                        </div>
                      </td>
                      <td>
                        <div className={styles.primaryCell}>{alert.agencyName}</div>
                        <div className={styles.subInfo}>
                          {alert.agencyId ? `ID: ${alert.agencyId}` : 'Unregistered / Entity'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{alert.studentName}</div>
                        <div className={styles.subInfo}>{alert.studentEmail}</div>
                      </td>
                      <td>
                        <span
                          className={`${styles.riskBadge} ${
                            alert.riskScore > 80
                              ? styles.riskHigh
                              : alert.riskScore > 50
                              ? styles.riskMedium
                              : styles.riskLow
                          }`}
                        >
                          {alert.riskScore}/100
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            alert.status === 'RESOLVED'
                              ? 'verified'
                              : alert.status === 'FLAGGED'
                              ? 'danger'
                              : alert.status === 'DISMISSED'
                              ? 'neutral'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {alert.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                variant="danger"
                                loading={isActionLoading}
                                disabled={isActionLoading}
                                onClick={() => handleScamAlertAction(alert.id, 'BAN_AGENCY')}
                                title="Ban agency and revoke verification across platform"
                              >
                                Ban Agency
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isActionLoading}
                                onClick={() => handleScamAlertAction(alert.id, 'FLAG_AGENCY')}
                                title="Issue public warning on agency profile"
                              >
                                Flag
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isActionLoading}
                                onClick={() => handleScamAlertAction(alert.id, 'DISMISS')}
                                title="Dismiss as false positive"
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedScamReport(alert)}
                          >
                            Report
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              {!loading && scamAlerts.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>🛡️</div>
                      <div>No fraud incidents or scam alerts recorded.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: USERS & RBAC */}
      {activeTab === 'Users' && (
        <div className={styles.tableContainer}>
          <div className={styles.controlsBar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search user by name, email, phone..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterPills}>
              {(['ALL', 'STUDENT', 'PARENT', 'AGENCY', 'ADMIN'] as const).map((role) => (
                <button
                  key={role}
                  className={`${styles.pillBtn} ${userRoleFilter === role ? styles.pillBtnActive : ''}`}
                  onClick={() => setUserRoleFilter(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <table className={styles.table} aria-label="Users governance directory">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th>Verification</th>
                <th>Metadata / Linked Code</th>
                <th>Member Since</th>
                <th>Governance Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Skeleton width={32} height={32} circle />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <Skeleton width={110} height={14} />
                          <Skeleton width={140} height={12} />
                        </div>
                      </div>
                    </td>
                    <td><Skeleton width={90} height={14} /></td>
                    <td><Skeleton width={60} height={20} rounded="full" /></td>
                    <td><Skeleton width={70} height={20} rounded="md" /></td>
                    <td><Skeleton width={110} height={14} /></td>
                    <td><Skeleton width={80} height={14} /></td>
                    <td><Skeleton width={85} height={30} rounded="md" /></td>
                  </tr>
                ))
              ) : (
                filteredUsers.map((u) => {
                const isActionLoading = actionLoadingId === u.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {u.avatarUrl ? (
                          <Image
                            src={u.avatarUrl}
                            alt={u.name}
                            width={32}
                            height={32}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              border: '1.5px solid var(--border)',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              border: '1.5px solid var(--border)',
                              background: 'var(--bg-elevated)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                            }}
                          >
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className={styles.primaryCell}>{u.name}</div>
                          <div className={styles.subInfo}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{u.phone}</td>
                    <td>
                      <Badge
                        variant={
                          u.role === 'ADMIN'
                            ? 'danger'
                            : u.role === 'AGENCY'
                            ? 'info'
                            : u.role === 'PARENT'
                            ? 'warning'
                            : 'ai'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      {u.role?.toUpperCase() === 'AGENCY' ? (
                        <Badge variant={u.isVerified ? 'verified' : 'pending'} size="sm">
                          {u.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {u.details?.linkCode && (
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>
                          Code: {u.details.linkCode}
                        </span>
                      )}
                      {u.details?.licenseNo && (
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>
                          Lic: {u.details.licenseNo}
                        </span>
                      )}
                      {!u.details?.linkCode && !u.details?.licenseNo && (
                        <span className={styles.subInfo}>Platform Governance</span>
                      )}
                    </td>
                    <td className={styles.subInfo}>{u.createdAt}</td>
                    <td>
                      <div className={styles.actions}>
                        {u.role?.toUpperCase() === 'AGENCY' && (
                          <Button
                            size="sm"
                            variant={u.isVerified ? 'ghost' : 'emerald'}
                            disabled={isActionLoading}
                            loading={isActionLoading}
                            onClick={() => handleToggleUserVerify(u.id, u.isVerified)}
                          >
                            {u.isVerified ? 'Revoke Verify' : 'Verify Agency'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUserDossier(u);
                            setUserRoleUpdate(u.role);
                          }}
                          title="Manage user account, roles, verification and security audit records"
                        >
                          Audit & Manage
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>👤</div>
                      <div>No users found matching your filters.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: AUDIT LEDGER & ESCROW VAULT */}
      {activeTab === 'Audit Ledger' && (
        <div className={styles.tableContainer}>
          {/* Live Escrow Vault Capital Breakdown */}
          <div className={styles.vaultGrid}>
            <div className={styles.vaultCard}>
              <div className={styles.vaultLabel}>🔒 Currently Held in Vault</div>
              <div className={styles.vaultValue} style={{ color: 'var(--blue-primary)' }}>
                ৳{(stats?.escrow.held ?? 0).toLocaleString('en-IN')}
              </div>
              <div className={styles.vaultSub}>Locked safely for active student applications</div>
            </div>
            <div className={styles.vaultCard}>
              <div className={styles.vaultLabel}>⚖️ Frozen in Dispute</div>
              <div className={styles.vaultValue} style={{ color: '#ef4444' }}>
                {stats?.disputes.disputedFormatted ?? '৳45,000'}
              </div>
              <div className={styles.vaultSub}>{activeDisputesCount} contested milestones under audit</div>
            </div>
            <div className={styles.vaultCard}>
              <div className={styles.vaultLabel}>✅ Successfully Released</div>
              <div className={styles.vaultValue} style={{ color: '#10b981' }}>
                ৳{(stats?.escrow.released ?? 0).toLocaleString('en-IN')}
              </div>
              <div className={styles.vaultSub}>Transferred on verified milestone completion</div>
            </div>
            <div className={styles.vaultCard}>
              <div className={styles.vaultLabel}>⏳ Pending Student Deposits</div>
              <div className={styles.vaultValue} style={{ color: '#f59e0b' }}>
                ৳{(stats?.escrow.pending ?? 0).toLocaleString('en-IN')}
              </div>
              <div className={styles.vaultSub}>Awaiting gateway confirmation</div>
            </div>
          </div>

          <div className={styles.controlsBar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search ledger entries by ID, milestone, or provider..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Ledger hashes are recorded for integrity review.
            </div>
          </div>

          <table className={styles.table} aria-label="Immutable audit ledger">
            <thead>
              <tr>
                <th>Entry ID</th>
                <th>Type</th>
                <th>Milestone</th>
                <th>Amount</th>
                <th>Provider & TXN</th>
                <th>Cryptographic SHA-256 Hash</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td><Skeleton width={80} height={14} /></td>
                    <td><Skeleton width={55} height={20} rounded="full" /></td>
                    <td><Skeleton width={110} height={14} /><Skeleton width={140} height={12} style={{ marginTop: 4 }} /></td>
                    <td><Skeleton width={80} height={14} /></td>
                    <td><Skeleton width={80} height={14} /><Skeleton width={120} height={12} style={{ marginTop: 4 }} /></td>
                    <td><Skeleton width={120} height={16} rounded="md" /></td>
                    <td><Skeleton width={100} height={14} /></td>
                  </tr>
                ))
              ) : (
                ledgerEntries
                  .filter((e) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      e.id.toLowerCase().includes(q) ||
                      e.milestoneId.toLowerCase().includes(q) ||
                      e.provider.toLowerCase().includes(q)
                    );
                  })
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{entry.id}</td>
                      <td>
                        <Badge
                          variant={
                            entry.type === 'HOLD'
                              ? 'info'
                              : entry.type === 'RELEASE'
                              ? 'verified'
                              : entry.type === 'REFUND'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {entry.type}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{entry.milestoneId}</div>
                        <div className={styles.subInfo}>{entry.note}</div>
                      </td>
                      <td className={styles.amount}>{entry.amountFormatted}</td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{entry.provider}</div>
                        <div className={styles.subInfo} style={{ fontFamily: 'monospace' }}>
                          {entry.providerTxnId}
                        </div>
                      </td>
                      <td>
                        <span className={styles.hashBadge} title={entry.txHash}>
                          {entry.txHashShort || entry.txHash}
                        </span>
                      </td>
                      <td className={styles.subInfo}>{new Date(entry.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
              )}
              {!loading && ledgerEntries.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>⛓️</div>
                      <div>No ledger transactions recorded yet.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: DATA PROVENANCE — Benchmark Audit Queue + Fee Submissions + Course Catalogs */}
      {activeTab === 'Data Provenance' && (
        <div className={styles.tableContainer}>
          {/* Sub-tab navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['submissions', 'benchmarks', 'catalogs'] as const).map(st => (
              <button
                key={st}
                onClick={() => setProvenanceSubTab(st)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: '2px solid var(--ink)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: provenanceSubTab === st ? 'var(--ink)' : 'transparent',
                  color: provenanceSubTab === st ? '#fff' : 'var(--text-primary)',
                }}
              >
                {st === 'submissions' && `📋 Fee Submissions (${feeSubmissions.filter(f => f.status === 'PENDING').length} pending)`}
                {st === 'benchmarks' && `🏛️ Cost Benchmarks (${benchmarks.filter(b => !b.isVerified).length} unverified)`}
                {st === 'catalogs' && `📚 Course Catalogs (${courseCatalogs.length})`}
              </button>
            ))}
          </div>

          {/* SUB-TAB A: Agency Fee Submissions */}
          {provenanceSubTab === 'submissions' && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>
                📋 Agency Service Fee Submissions — Awaiting Admin Cross-Verification
              </h3>
              {feeSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No fee submissions yet.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Agency</th>
                      <th>Service</th>
                      <th>Amount (BDT)</th>
                      <th>When Charged</th>
                      <th>Refundable</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeSubmissions.map(fs => (
                      <tr key={fs.id}>
                        <td style={{ fontWeight: 700 }}>{fs.agencyName}</td>
                        <td>{fs.serviceName}</td>
                        <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>৳{fs.amountBdt.toLocaleString('en-IN')}</td>
                        <td style={{ fontSize: '12px' }}>{fs.whenCharged}</td>
                        <td>{fs.refundable ? '✅ Yes' : '❌ No'}</td>
                        <td>
                          <Badge
                            variant={fs.status === 'APPROVED' ? 'verified' : fs.status === 'REJECTED' ? 'danger' : 'pending'}
                            size="sm"
                          >
                            {fs.status}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFeeSubDossier(fs);
                                setFeeSubFeedback(fs.adminFeedback || '');
                              }}
                            >
                              Inspect Dossier
                            </Button>
                            {fs.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="emerald"
                                  loading={actionLoadingId === fs.id}
                                  onClick={() => handleFeeSubmissionAction(fs.id, 'APPROVED')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  loading={actionLoadingId === fs.id}
                                  onClick={() => handleFeeSubmissionAction(fs.id, 'REJECTED', 'Service fee package does not satisfy escrow guidelines.')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {fs.status !== 'PENDING' && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fs.adminFeedback || 'Reviewed'}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* SUB-TAB B: Country Cost Benchmarks */}
          {provenanceSubTab === 'benchmarks' && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>
                🏛️ Country Cost Benchmarks — Admin Verification Queue
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Verify agency-submitted financial solvency figures (blocked accounts, GICs, bank solvency) before they are displayed to students.
                Always cross-check against the official government source URL.
              </p>
              {benchmarks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No benchmarks submitted yet.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Type</th>
                      <th>Amount (BDT ৳)</th>
                      <th>Official Source</th>
                      <th>Last Audited</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarks.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700 }}>{b.flagEmoji} {b.country}</td>
                        <td style={{ fontSize: '12px', textTransform: 'capitalize' }}>{String(b.requirementType).replace(/_/g, ' ').toLowerCase()}</td>
                        <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>৳{Number(b.blockedAccountOrGicBdt).toLocaleString('en-IN')}</td>
                        <td>
                          <a href={b.officialGovUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-primary)', fontSize: '12px' }}>
                            {b.officialGovSourceTitle} ↗
                          </a>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.lastAuditedAt ? new Date(b.lastAuditedAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <Badge variant={b.isVerified ? 'verified' : 'pending'} size="sm">
                            {b.isVerified ? '✓ Verified' : '⏳ Pending'}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {!b.isVerified && (
                              <Button
                                size="sm"
                                variant="emerald"
                                loading={actionLoadingId === b.id}
                                onClick={() => handleBenchmarkVerify(b.id, true)}
                              >
                                Verify
                              </Button>
                            )}
                            {b.isVerified && (
                              <Button
                                size="sm"
                                variant="danger"
                                loading={actionLoadingId === b.id}
                                onClick={() => handleBenchmarkVerify(b.id, false)}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* SUB-TAB C: Course Catalogs */}
          {provenanceSubTab === 'catalogs' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  📚 Official Course Catalogs — Admin-Verified Tuition Data
                </h3>
                <Button variant="emerald" size="sm" onClick={() => setShowAddCatalogModal(true)}>
                  + Add Official Catalog
                </Button>
              </div>
              {courseCatalogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No course catalogs yet. Add official tuition data.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>University</th>
                      <th>Country</th>
                      <th>Program</th>
                      <th>Level</th>
                      <th>Annual Tuition (BDT)</th>
                      <th>Official Source</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseCatalogs.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>{c.universityName}</td>
                        <td>{c.country}</td>
                        <td style={{ fontSize: '12px' }}>{c.programName}</td>
                        <td>{c.degreeLevel}</td>
                        <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>৳{Number(c.annualTuitionBdt).toLocaleString('en-IN')}</td>
                        <td>
                          <a href={c.officialCatalogUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-primary)', fontSize: '12px' }}>
                            {c.officialSourceTitle} ↗
                          </a>
                        </td>
                        <td>
                          <Badge variant={c.isVerified ? 'verified' : 'pending'} size="sm">
                            {c.isVerified ? '✓ Verified' : c.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL: Add Course Catalog */}
      {showAddCatalogModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAddCatalogModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📚 Add Official Course Catalog Entry</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddCatalogModal(false)} aria-label="Close">✕</button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleCreateCatalog} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>University Name</label>
                    <input required type="text" value={newCatalogForm.universityName} onChange={e => setNewCatalogForm(p => ({ ...p, universityName: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Country</label>
                    <select value={newCatalogForm.country} onChange={e => setNewCatalogForm(p => ({ ...p, country: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }}>
                      {['Canada', 'Germany', 'United Kingdom', 'United States', 'Australia', 'Netherlands'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Program Name</label>
                    <input required type="text" value={newCatalogForm.programName} onChange={e => setNewCatalogForm(p => ({ ...p, programName: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Degree Level</label>
                    <select value={newCatalogForm.degreeLevel} onChange={e => setNewCatalogForm(p => ({ ...p, degreeLevel: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }}>
                      {['Bachelor', 'Master', 'PhD', 'Diploma', 'Certificate'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Annual Tuition (Local Currency)</label>
                    <input required type="number" min={0} value={newCatalogForm.annualTuitionLocal} onChange={e => setNewCatalogForm(p => ({ ...p, annualTuitionLocal: Number(e.target.value) }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Currency Code</label>
                    <select value={newCatalogForm.currency} onChange={e => setNewCatalogForm(p => ({ ...p, currency: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }}>
                      {['CAD', 'EUR', 'GBP', 'USD', 'AUD'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Official Catalog URL</label>
                  <input required type="url" placeholder="https://..." value={newCatalogForm.officialCatalogUrl} onChange={e => setNewCatalogForm(p => ({ ...p, officialCatalogUrl: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Source Document Title</label>
                  <input required type="text" placeholder="e.g. University of Toronto 2024-25 Graduate Tuition Schedule" value={newCatalogForm.officialSourceTitle} onChange={e => setNewCatalogForm(p => ({ ...p, officialSourceTitle: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--ink)', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCatalogModal(false)}>Cancel</Button>
                  <Button type="submit" variant="emerald" size="sm" loading={actionLoadingId === 'new-catalog'}>
                    Save & Verify Catalog Entry
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: AGENCY AUDIT DOSSIER */}
      {selectedAgencyDossier && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedAgencyDossier(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🏢 Agency Audit Dossier: {selectedAgencyDossier.name}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedAgencyDossier(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>License Number</span>
                <span className={styles.dossierValue} style={{ fontFamily: 'monospace' }}>
                  {selectedAgencyDossier.licenseNo}
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Office Address</span>
                <span className={styles.dossierValue}>{selectedAgencyDossier.address}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Website</span>
                <span className={styles.dossierValue}>
                  <a
                    href={selectedAgencyDossier.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--blue-primary)', textDecoration: 'underline' }}
                  >
                    {selectedAgencyDossier.website}
                  </a>
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Official Contact</span>
                <span className={styles.dossierValue}>
                  {selectedAgencyDossier.owner?.name} ({selectedAgencyDossier.owner?.phone})
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Placement Track Record</span>
                <span className={styles.dossierValue}>
                  {selectedAgencyDossier.successRate}% visa success · {selectedAgencyDossier.reviewCount} reviews
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>AI Risk Assessment</span>
                <span
                  className={`${styles.riskBadge} ${
                    selectedAgencyDossier.riskScore < 30
                      ? styles.riskLow
                      : selectedAgencyDossier.riskScore < 60
                      ? styles.riskMedium
                      : styles.riskHigh
                  }`}
                >
                  {selectedAgencyDossier.riskScore}/100 Risk Score
                </span>
              </div>

              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Submitted Regulatory Documents
                </strong>
                <div className={styles.docList}>
                  {selectedAgencyDossier.submittedDocs?.map((doc, idx) => (
                    <div key={idx} className={styles.docItem}>
                      <span>📄 {doc.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{doc.size} · Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '0 20px 10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Auditor Findings & Regulatory Decision Rationale:
              </label>
              <input
                type="text"
                value={agencyAuditNote}
                onChange={(e) => setAgencyAuditNote(e.target.value)}
                placeholder="e.g. Validated with Dhaka City Corporation trade register & UGC guidelines."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid var(--ink)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              />
            </div>
            <div className={styles.modalFooter}>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  handleAgencyAction(
                    selectedAgencyDossier.id,
                    'REJECTED',
                    agencyAuditNote || 'Rejected during administrative dossier inspection'
                  )
                }
              >
                Reject License
              </Button>
              <Button
                variant="emerald"
                size="sm"
                onClick={() => handleAgencyAction(selectedAgencyDossier.id, 'VERIFIED', agencyAuditNote || undefined)}
              >
                Approve & Grant Badge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPUTE EVIDENCE TRAIL */}
      {selectedDisputeEvidence && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedDisputeEvidence(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>⚖️ Dispute Evidence Trail: {selectedDisputeEvidence.id}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedDisputeEvidence(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Milestone Disputed</span>
                <span className={styles.dossierValue}>{selectedDisputeEvidence.milestoneName}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Amount in Escrow</span>
                <span className={styles.amount}>{selectedDisputeEvidence.amountFormatted}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Student Claimant</span>
                <span className={styles.dossierValue}>
                  {selectedDisputeEvidence.student.name} ({selectedDisputeEvidence.student.email})
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Respondent Agency</span>
                <span className={styles.dossierValue}>{selectedDisputeEvidence.agency.name}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Target University</span>
                <span className={styles.dossierValue}>
                  {selectedDisputeEvidence.application.targetUniversity} (
                  {selectedDisputeEvidence.application.targetProgram})
                </span>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px', border: '1.5px solid var(--border)', borderRadius: '4px' }}>
                <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                  Student&apos;s Sworn Statement:
                </strong>
                <p style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                  &quot;{selectedDisputeEvidence.reason}&quot;
                </p>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Adjudication Verdict & Evidence Rationale:
                </label>
                <input
                  type="text"
                  value={disputeResolutionNote}
                  onChange={(e) => setDisputeResolutionNote(e.target.value)}
                  placeholder="e.g. Verified university refusal policy; student eligible for 100% reimbursement."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid var(--ink)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ℹ️ Resolution policy: Adjudication takes immediate effect. Funds are returned via Bangladesh
                National Payment Switch or released to the agency escrow bank account.
              </div>
            </div>
            <div className={styles.modalFooter}>
              {selectedDisputeEvidence.status === 'disputed' && (
                <>
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() =>
                      handleResolveDispute(
                        selectedDisputeEvidence.milestoneId,
                        'REFUND',
                        disputeResolutionNote || 'Dispute resolved in favor of student claim'
                      )
                    }
                  >
                    Authorize 100% Refund
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleResolveDispute(
                        selectedDisputeEvidence.milestoneId,
                        'RELEASE',
                        disputeResolutionNote || 'Dispute dismissed; agency verified valid completion'
                      )
                    }
                  >
                    Release to Agency
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedDisputeEvidence(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SCAM AI FORENSICS REPORT */}
      {selectedScamReport && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedScamReport(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🚨 AI Forensic Analysis: {selectedScamReport.id}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedScamReport(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Incident Title</span>
                <span className={styles.dossierValue}>{selectedScamReport.title}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Violation Type</span>
                <span className={styles.dossierValue}>{selectedScamReport.type}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Target Entity</span>
                <span className={styles.dossierValue}>{selectedScamReport.agencyName}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Reported By</span>
                <span className={styles.dossierValue}>
                  {selectedScamReport.studentName} ({selectedScamReport.studentEmail})
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>OCR Anomaly Score</span>
                <span className={`${styles.riskBadge} ${styles.riskHigh}`}>
                  {selectedScamReport.riskScore}/100 Risk Score
                </span>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px', border: '1.5px solid var(--border)', borderRadius: '4px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Detailed Forensic Evidence:
                </strong>
                <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {selectedScamReport.evidenceSummary}
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              {selectedScamReport.status === 'PENDING_REVIEW' && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleScamAlertAction(selectedScamReport.id, 'BAN_AGENCY')}
                  >
                    Permanently Ban Agency
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScamAlertAction(selectedScamReport.id, 'FLAG_AGENCY')}
                  >
                    Post Scam Warning
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedScamReport(null)}>
                Dismiss Dialog
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FEE SUBMISSION DOSSIER */}
      {selectedFeeSubDossier && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedFeeSubDossier(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📋 Fee Package Dossier: {selectedFeeSubDossier.serviceName}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedFeeSubDossier(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Submitting Agency</span>
                <span className={styles.dossierValue}>
                  {selectedFeeSubDossier.agencyName} ({selectedFeeSubDossier.agencyId})
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Target Destination Country</span>
                <span className={styles.dossierValue}>{selectedFeeSubDossier.country}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Service Fee Amount</span>
                <span className={styles.amount}>৳{selectedFeeSubDossier.amountBdt.toLocaleString('en-IN')} BDT</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Milestone Trigger / Payment Schedule</span>
                <span className={styles.dossierValue}>{selectedFeeSubDossier.whenCharged}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Refund Policy Guarantee</span>
                <span
                  className={styles.dossierValue}
                  style={{ color: selectedFeeSubDossier.refundable ? 'var(--emerald)' : '#ef4444' }}
                >
                  {selectedFeeSubDossier.refundable ? '✅ ' : '❌ '}
                  {selectedFeeSubDossier.refundPolicy}
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Verification Status</span>
                <Badge
                  variant={
                    selectedFeeSubDossier.status === 'APPROVED'
                      ? 'verified'
                      : selectedFeeSubDossier.status === 'REJECTED'
                      ? 'danger'
                      : 'pending'
                  }
                  size="sm"
                >
                  {selectedFeeSubDossier.status}
                </Badge>
              </div>

              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Accompanying Proof Documents
                </strong>
                <div className={styles.docList}>
                  {selectedFeeSubDossier.proofDocumentUrls && selectedFeeSubDossier.proofDocumentUrls.length > 0 ? (
                    selectedFeeSubDossier.proofDocumentUrls.map((url, idx) => (
                      <div key={idx} className={styles.docItem}>
                        <span>📄 {url.split('/').pop() || `Document-${idx + 1}.pdf`}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--blue-primary)', textDecoration: 'underline' }}
                        >
                          View Document ↗
                        </a>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                      Standard consultancy agreement on file.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'block',
                    marginBottom: '6px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Admin Review Notes & Feedback to Agency:
                </label>
                <textarea
                  rows={3}
                  value={feeSubFeedback}
                  onChange={(e) => setFeeSubFeedback(e.target.value)}
                  placeholder="Enter statutory compliance feedback, milestone adjustment instructions, or approval notes..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid var(--ink)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              {selectedFeeSubDossier.status === 'PENDING' && (
                <>
                  <Button
                    variant="emerald"
                    size="sm"
                    loading={actionLoadingId === selectedFeeSubDossier.id}
                    onClick={() => handleFeeSubmissionAction(selectedFeeSubDossier.id, 'APPROVED', feeSubFeedback)}
                  >
                    Approve & Publish to Directory
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionLoadingId === selectedFeeSubDossier.id}
                    onClick={() =>
                      handleFeeSubmissionAction(
                        selectedFeeSubDossier.id,
                        'REJECTED',
                        feeSubFeedback || 'Rejected due to non-compliant terms per platform escrow policy.'
                      )
                    }
                  >
                    Reject with Feedback
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedFeeSubDossier(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: USER ACCOUNT & GOVERNANCE DOSSIER */}
      {selectedUserDossier && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedUserDossier(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>👤 User Account & Governance: {selectedUserDossier.name}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedUserDossier(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>User ID</span>
                <span className={styles.dossierValue} style={{ fontFamily: 'monospace' }}>
                  {selectedUserDossier.id}
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Full Name</span>
                <span className={styles.dossierValue}>{selectedUserDossier.name}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Email Address</span>
                <span className={styles.dossierValue}>{selectedUserDossier.email}</span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Registered Phone</span>
                <span className={styles.dossierValue} style={{ fontFamily: 'monospace' }}>
                  {selectedUserDossier.phone}
                </span>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Current Role</span>
                <Badge
                  variant={
                    selectedUserDossier.role === 'ADMIN'
                      ? 'danger'
                      : selectedUserDossier.role === 'AGENCY'
                      ? 'info'
                      : selectedUserDossier.role === 'PARENT'
                      ? 'warning'
                      : 'ai'
                  }
                  size="sm"
                >
                  {selectedUserDossier.role}
                </Badge>
              </div>
              <div className={styles.dossierRow}>
                <span className={styles.dossierLabel}>Account Created</span>
                <span className={styles.dossierValue}>{selectedUserDossier.createdAt}</span>
              </div>

              {/* RBAC Role Modification */}
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  padding: '14px',
                  border: '1.5px solid var(--ink)',
                  borderRadius: '6px',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  🛡️ Manage Role-Based Access Control (RBAC):
                </strong>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={userRoleUpdate || selectedUserDossier.role}
                    onChange={(e) => setUserRoleUpdate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '5px',
                      border: '2px solid var(--ink)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="PARENT">PARENT</option>
                    <option value="AGENCY">AGENCY</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <Button
                    size="sm"
                    variant="emerald"
                    loading={actionLoadingId === selectedUserDossier.id}
                    onClick={() =>
                      handleUpdateUserRole(
                        selectedUserDossier.id,
                        userRoleUpdate || selectedUserDossier.role
                      )
                    }
                  >
                    Update Role
                  </Button>
                </div>
              </div>

              {/* Security & Activity Audit Trail */}
              <div>
                <strong
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  🔒 Security & Authentication Audit Trail:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className={styles.docItem}>
                    <span>Session history is not available in this dossier.</span>
                  </div>
                  <div className={styles.docItem}>
                    <span>✓ Account verification status</span>
                    <span style={{ color: selectedUserDossier.isVerified ? 'var(--emerald)' : 'var(--text-muted)' }}>
                      {selectedUserDossier.isVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  {selectedUserDossier.details?.licenseNo && (
                    <div className={styles.docItem}>
                      <span>📄 Trade License: {selectedUserDossier.details.licenseNo}</span>
                      <span style={{ color: 'var(--emerald)' }}>Active</span>
                    </div>
                  )}
                  {selectedUserDossier.details?.linkCode && (
                    <div className={styles.docItem}>
                      <span>🔗 Parent-Student Link Code: {selectedUserDossier.details.linkCode}</span>
                      <span style={{ color: 'var(--blue-primary)' }}>Linked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              {selectedUserDossier.role?.toUpperCase() === 'AGENCY' && (
                <Button
                  size="sm"
                  variant={selectedUserDossier.isVerified ? 'danger' : 'emerald'}
                  loading={actionLoadingId === selectedUserDossier.id}
                  onClick={() => {
                    handleToggleUserVerify(selectedUserDossier.id, selectedUserDossier.isVerified);
                  }}
                >
                  {selectedUserDossier.isVerified ? 'Revoke Agency Verification' : 'Verify Agency License'}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedUserDossier(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
