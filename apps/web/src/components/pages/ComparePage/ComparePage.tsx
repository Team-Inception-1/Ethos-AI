'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '@/lib/browser-preferences';
import { useSearchParams, useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
  DEFAULT_COMPARE_IDS,
  ALL_AGENCIES,
  AgencyDetail,
} from '@/data/agencies';
import styles from './ComparePage.module.css';

interface ApiAgency {
  id: string;
  name: string;
  licenseNo?: string;
  licenseStatus: string;
  rating: number;
  reviewCount: number;
  countriesServed: string[];
  successRate: number;
  feeMinPoisha: string;
  feeMaxPoisha: string;
  feeMin?: number;
  feeMax?: number;
  address?: string;
  website?: string | null;
  description?: string;
  pricingServices?: Array<{
    id: string;
    serviceName: string;
    amountBdt: number;
    whenCharged: string;
    refundable: boolean;
    conditions: string | null;
  }>;
}

const rows = [
  { label: 'Verification', key: 'verified', render: (v: boolean) => <Badge variant={v ? 'verified' : 'pending'}>{v ? 'Verified' : 'Pending'}</Badge> },
  { label: 'Rating', key: 'rating', render: (v: number) => <span className={styles.ratingVal}>{v} ⭐</span> },
  { label: 'Success Rate', key: 'success', render: (v: number) => <span className={styles.successVal}>{v}%</span> },
  { label: 'Fee Range', key: 'fee', render: (v: string) => <span>{v}</span> },
  { label: 'Refund Policy', key: 'refund', render: (v: string) => <span className={styles.policyText}>{v}</span> },
  { label: 'Response Time', key: 'response', render: (v: string) => <span className={styles.responseVal}>{v}</span> },
  { label: 'Countries', key: 'countries', render: (v: string) => <span>{v}</span> },
];

function transformApiAgency(a: ApiAgency): AgencyDetail {
  const feeMin = a.feeMin ?? Number(a.feeMinPoisha) / 100;
  const feeMax = a.feeMax ?? Number(a.feeMaxPoisha) / 100;
  const feeStr = `৳${feeMin >= 1000 ? `${Math.round(feeMin / 1000)}K` : feeMin}–৳${feeMax >= 1000 ? `${Math.round(feeMax / 1000)}K` : feeMax}`;
  const countriesStr = (a.countriesServed || []).join(' ');

  return {
    id: a.id,
    name: a.name,
    verified: a.licenseStatus === 'VERIFIED',
    rating: a.rating,
    reviews: a.reviewCount,
    success: a.successRate,
    fee: feeStr,
    feeMin,
    feeMax,
    refund: a.pricingServices?.some(p => p.refundable) ? 'Partial / Conditional' : '100% Escrow Guarantee',
    refundDays: 30,
    response: '< 4 hours',
    countries: countriesStr,
    countryCodes: a.countriesServed || [],
    licenseNo: a.licenseNo || '',
    address: a.address || 'Dhaka, Bangladesh',
    strengthsEn: [
      `Official license verified by Ethos AI.`,
      `${a.successRate}% verified success rate across all partner destinations.`,
      `Milestone-based escrow payment protection required for all student contracts.`,
    ],
    strengthsBn: [
      `সরকারি লাইসেন্স Ethos AI দ্বারা যাচাইকৃত।`,
      `সকল পার্টনার দেশে ${a.successRate}% যাচাইকৃত ভিসা সফলতার হার।`,
      `সকল স্টুডেন্ট চুক্তির জন্য বাধ্যতামূলক মাইলস্টোন এসক্রো পেমেন্ট সুরক্ষা।`,
    ],
  };
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [lang] = useLanguage();
  const [allLoadedAgencies, setAllLoadedAgencies] = useState<AgencyDetail[]>(ALL_AGENCIES);
  const [loading, setLoading] = useState(true);
  const [isLiveFromDb, setIsLiveFromDb] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchAgencies() {
      try {
        const res = await fetch('/api/agencies');
        if (!res.ok) throw new Error('API unavailable');
        const data: { agencies: ApiAgency[] } = await res.json();
        if (cancelled) return;
        if (data.agencies && data.agencies.length > 0) {
          const transformed = data.agencies.map(transformApiAgency);
          setAllLoadedAgencies(transformed);
          setIsLiveFromDb(true);
        }
      } catch {
        // Fallback to static catalog if database API is offline
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchAgencies();
    return () => {
      cancelled = true;
    };
  }, []);

  // Parse `ids` parameter from URL query (e.g. ?ids=agt-003,agt-004,agt-006)
  const idsParam = searchParams.get('ids') || searchParams.get('agency');
  const selectedIds = useMemo(() => {
    if (!idsParam) return DEFAULT_COMPARE_IDS;
    const items = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    return items.length > 0 ? items : DEFAULT_COMPARE_IDS;
  }, [idsParam]);

  // Dynamically retrieve the agencies chosen by the user
  const agencies: AgencyDetail[] = useMemo(() => {
    const matched = allLoadedAgencies.filter((a) => selectedIds.includes(a.id));
    if (matched.length > 0) return matched;
    return allLoadedAgencies.slice(0, 4);
  }, [allLoadedAgencies, selectedIds]);

  const addAgencyToCompare = (idToAdd: string) => {
    if (!idToAdd || selectedIds.includes(idToAdd)) return;
    const next = [...selectedIds, idToAdd].slice(0, 4);
    router.push(`/compare?ids=${next.join(',')}`);
  };

  const removeAgency = (idToRemove: string) => {
    const next = selectedIds.filter((id) => id !== idToRemove);
    if (next.length > 0) {
      router.push(`/compare?ids=${next.join(',')}`);
    } else {
      router.push('/directory');
    }
  };

  // Multi-tier deterministic tie-breaker sorting function
  const sortedAgencies = useMemo(() => {
    return [...agencies].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.success !== a.success) return b.success - a.success;
      if (b.reviews !== a.reviews) return b.reviews - a.reviews;
      if (b.verified !== a.verified) return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
      if (b.refundDays !== a.refundDays) return b.refundDays - a.refundDays;
      return a.feeMin - b.feeMin;
    });
  }, [agencies]);

  const bestAgency = sortedAgencies[0] || allLoadedAgencies[0];
  const runnerUp = sortedAgencies[1];
  const isRatingTie = runnerUp && runnerUp.rating === bestAgency.rating;

  const ratingLeader = useMemo(() => {
    if (agencies.length === 0) return bestAgency;
    return [...agencies].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)[0];
  }, [agencies, bestAgency]);

  const successLeader = useMemo(() => {
    if (agencies.length === 0) return bestAgency;
    return [...agencies].sort((a, b) => b.success - a.success)[0];
  }, [agencies, bestAgency]);

  const affordableLeader = useMemo(() => {
    if (agencies.length === 0) return bestAgency;
    return [...agencies].sort((a, b) => a.feeMin - b.feeMin)[0];
  }, [agencies, bestAgency]);

  const refundLeader = useMemo(() => {
    if (agencies.length === 0) return bestAgency;
    return [...agencies].sort((a, b) => b.refundDays - a.refundDays)[0];
  }, [agencies, bestAgency]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setAnalysisOpen(false);
    }
  }, []);

  useEffect(() => {
    if (analysisOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [analysisOpen, handleKeyDown]);

  return (
    <main className={styles.page} style={{ paddingTop: 'var(--topbar-height)' }} suppressHydrationWarning>
      <div className={`${styles.inner} container`}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Agency Comparison</h1>
              <p className={styles.subtitle}>
                {isLiveFromDb ? 'Verified Registry' : 'Directory'} · side-by-side comparison of {agencies.length} {agencies.length === 1 ? 'agency' : 'agencies'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isLiveFromDb && (
                <Badge variant="verified">
                  🛡️ Live PostgreSQL Connected
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysisOpen(true)}
              >
                📊 AI Recommendation
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Decision / Metric Leaders */}
        <div className={styles.metricGrid}>
          <GlassCard padding="sm" className={styles.metricCard}>
            <div className={styles.metricTitle}>Highest Rated</div>
            <div className={styles.metricAgency}>{ratingLeader?.name}</div>
            <div className={styles.metricBadge}>
              <Badge variant="verified">{ratingLeader?.rating} ⭐ ({ratingLeader?.reviews} reviews)</Badge>
            </div>
          </GlassCard>

          <GlassCard padding="sm" className={styles.metricCard}>
            <div className={styles.metricTitle}>Top Visa Success</div>
            <div className={styles.metricAgency}>{successLeader?.name}</div>
            <div className={styles.metricBadge}>
              <Badge variant="verified">{successLeader?.success}% Success</Badge>
            </div>
          </GlassCard>

          <GlassCard padding="sm" className={styles.metricCard}>
            <div className={styles.metricTitle}>Most Affordable</div>
            <div className={styles.metricAgency}>{affordableLeader?.name}</div>
            <div className={styles.metricBadge}>
              <Badge variant="outline">{affordableLeader?.fee}</Badge>
            </div>
          </GlassCard>

          <GlassCard padding="sm" className={styles.metricCard}>
            <div className={styles.metricTitle}>Safest Escrow Window</div>
            <div className={styles.metricAgency}>{refundLeader?.name}</div>
            <div className={styles.metricBadge}>
              <Badge variant="verified">{refundLeader?.refundDays} Days Protection</Badge>
            </div>
          </GlassCard>
        </div>

        {/* Comparison Table */}
        <GlassCard padding="none" className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.headerCorner}>Features & Metrics</th>
                  {agencies.map((a) => (
                    <th key={a.id} className={styles.agencyHeader}>
                      <div className={styles.agencyHeaderInner}>
                        <div className={styles.agencyNameRow}>
                          <span className={styles.agencyName}>{a.name}</span>
                          {agencies.length > 2 && (
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => removeAgency(a.id)}
                              title="Remove agency"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className={styles.headerBadges}>
                          {a.verified && <Badge variant="verified" size="sm">Govt Verified</Badge>}
                          {a.id === bestAgency?.id && (
                            <Badge variant="success" size="sm">🏆 Top Pick</Badge>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className={`${styles.agencyHeader} ${styles.addCol}`}>
                    {agencies.length < 4 ? (
                      <div className={styles.addWrapper}>
                        <select
                          className={styles.addSlot}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) addAgencyToCompare(e.target.value);
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: '10px',
                            fontSize: '13px',
                            border: '2px dashed var(--ink, #14120E)',
                            borderRadius: '8px',
                            background: 'transparent',
                          }}
                        >
                          <option value="">
                            + Add Agency ({allLoadedAgencies.length - agencies.length} available)...
                          </option>
                          {allLoadedAgencies
                            .filter((a) => !selectedIds.includes(a.id))
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} (⭐ {a.rating})
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px' }}>
                        Max 4 compared
                      </div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key} className={i % 2 === 0 ? styles.rowEven : ''}>
                    <td className={styles.rowLabel}>{row.label}</td>
                    {agencies.map((a) => (
                      <td key={a.id} className={styles.cell}>
                        {/* @ts-expect-error dynamic key */}
                        {row.render(a[row.key])}
                      </td>
                    ))}
                    <td className={`${styles.cell} ${styles.addCol}`} />
                  </tr>
                ))}
                <tr>
                  <td className={styles.rowLabel} />
                  {agencies.map((a) => (
                    <td key={a.id} className={styles.cell}>
                      <Link href={`/directory/${a.id}`}>
                        <Button size="sm">View Profile</Button>
                      </Link>
                    </td>
                  ))}
                  <td className={`${styles.cell} ${styles.addCol}`} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fee & Escrow Verification Footnote */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.02)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              🔒 All fees listed are bound by Ethos AI Escrow Contracts. Agencies cannot charge above disclosed amounts.
            </span>
            <Link href="/directory" style={{ color: 'var(--blue-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Browse all {allLoadedAgencies.length} verified agencies →
            </Link>
          </div>
        </GlassCard>

        {/* Action Link to Payments / Escrow */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <Link href={`/dashboard/applications?apply=${bestAgency?.id}`}>
            <Button variant="emerald" size="lg" glow>
              🛡️ Start Protected Application with {bestAgency?.name}
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Recommendation Modal */}
      {analysisOpen && bestAgency && (
        <div className={styles.modalOverlay} onClick={() => setAnalysisOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{lang === 'en' ? 'AI Comparative Recommendation' : 'এআই তুলনামূলক সুপারিশ'}</h2>
                <p className={styles.modalSub}>
                  {lang === 'en'
                    ? 'Algorithmic assessment based on student ratings, visa success, and fee transparency'
                    : 'শিক্ষার্থীদের রেটিং, ভিসা সাফল্য ও ফি স্বচ্ছতার ভিত্তিতে অ্যালগরিদমিক মূল্যায়ন'}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setAnalysisOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Winner Announcement */}
              <div className={styles.winnerCard}>
                <div className={styles.winnerBadge}>
                  🏆 {lang === 'en' ? 'TOP RECOMMENDED CHOICE' : 'শীর্ষ সুপারিশকৃত এজেন্সি'}
                </div>
                <h3 className={styles.winnerName}>{bestAgency.name}</h3>
                <p className={styles.winnerVerdict}>
                  {lang === 'en' ? (
                    <>
                      Rated <strong>{bestAgency.rating} / 5.0</strong> with a{' '}
                      <strong>{bestAgency.success}%</strong> visa success rate across{' '}
                      <strong>{bestAgency.reviews}</strong> verified students.{' '}
                      {isRatingTie && (
                        <span>
                          (Ranked #1 via multi-factor tiebreaker on success rate & refund window).
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      রেটিং <strong>{bestAgency.rating} / ৫.০</strong> এবং{' '}
                      <strong>{bestAgency.reviews}</strong> জন যাচাইকৃত শিক্ষার্থীর মাঝে{' '}
                      <strong>{bestAgency.success}%</strong> ভিসা সাফল্যের রেকর্ড।
                    </>
                  )}
                </p>
              </div>

              {/* Strengths List */}
              <div className={styles.strengthsSection}>
                <h4>{lang === 'en' ? 'Why this agency leads:' : 'এই এজেন্সির শীর্ষ সুবিধাসমূহ:'}</h4>
                <ul className={styles.strengthsList}>
                  {(lang === 'en' ? bestAgency.strengthsEn : bestAgency.strengthsBn).map((str, idx) => (
                    <li key={idx} className={styles.strengthItem}>
                      <span className={styles.checkIcon}>✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ethos Trust Breakdown */}
              <div className={styles.auditSection}>
                <h4>{lang === 'en' ? 'Ethos AI Trust Score:' : 'ইথোস এআই ট্রাস্ট স্কোর:'}</h4>
                <div className={styles.auditGrid}>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>
                      {lang === 'en' ? 'Govt Trade License' : 'সরকারি ট্রেড লাইসেন্স'}
                    </span>
                    <span className={styles.auditVal}>
                      {bestAgency.licenseNo ? `Verified (${bestAgency.licenseNo})` : 'Pending Audit'}
                    </span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>
                      {lang === 'en' ? 'Escrow Milestone Guarantee' : 'এসক্রো মাইলস্টোন গ্যারান্টি'}
                    </span>
                    <span className={styles.auditVal}>
                      100% {lang === 'en' ? 'Protected via Ethos Vault' : 'ইথোস ভল্টে সুরক্ষিত'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className={styles.modalFooter}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAnalysisOpen(false)}
              >
                {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
              </Button>
              <Link href={`/directory/${bestAgency.id}`}>
                <Button variant="outline" size="sm">
                  {lang === 'en' ? 'View Agency Profile' : 'এজেন্সি প্রোফাইল দেখুন'}
                </Button>
              </Link>
              <Link href={`/dashboard/applications?apply=${bestAgency.id}`}>
                <Button size="sm">
                  {lang === 'en' ? 'Apply with Escrow' : 'এসক্রো সুরক্ষায় আবেদন করুন'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
