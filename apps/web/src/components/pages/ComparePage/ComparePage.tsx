'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
  getAgenciesByIds,
  DEFAULT_COMPARE_IDS,
  ALL_AGENCIES,
  AgencyDetail,
} from '@/data/agencies';
import styles from './ComparePage.module.css';

const rows = [
  { label: 'Verification', key: 'verified',  render: (v: boolean) => <Badge variant={v ? 'verified' : 'pending'}>{v ? 'Verified' : 'Pending'}</Badge> },
  { label: 'Rating',       key: 'rating',    render: (v: number) => <span className={styles.ratingVal}>{v} ⭐</span> },
  { label: 'Success Rate', key: 'success',   render: (v: number) => <span className={styles.successVal}>{v}%</span> },
  { label: 'Fee Range',    key: 'fee',       render: (v: string) => <span>{v}</span> },
  { label: 'Refund Policy',key: 'refund',    render: (v: string) => <span className={styles.policyText}>{v}</span> },
  { label: 'Response Time',key: 'response',  render: (v: string) => <span className={styles.responseVal}>{v}</span> },
  { label: 'Countries',    key: 'countries', render: (v: string) => <span>{v}</span> },
];

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ethos-lang') as 'en' | 'bn';
      if (saved === 'en' || saved === 'bn') setLang(saved);
    } catch {}
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<'en' | 'bn'>;
      if (customEvent.detail === 'en' || customEvent.detail === 'bn') {
        setLang(customEvent.detail);
      }
    };
    window.addEventListener('ethos-lang-change', handleLangChange);
    return () => window.removeEventListener('ethos-lang-change', handleLangChange);
  }, []);

  // Parse `ids` parameter from URL query (e.g. ?ids=agt-003,agt-004,agt-006)
  const idsParam = searchParams.get('ids') || searchParams.get('agency');
  const selectedIds = useMemo(() => {
    if (!idsParam) return DEFAULT_COMPARE_IDS;
    const items = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    return items.length > 0 ? items : DEFAULT_COMPARE_IDS;
  }, [idsParam]);

  // Dynamically retrieve the agencies chosen by the user
  const agencies: AgencyDetail[] = useMemo(() => {
    return getAgenciesByIds(selectedIds);
  }, [selectedIds]);

  const addAgencyToCompare = (idToAdd: string) => {
    if (!idToAdd || selectedIds.includes(idToAdd)) return;
    const next = [...selectedIds, idToAdd].slice(0, 4);
    router.push(`/compare?ids=${next.join(',')}`);
  };

  // Multi-tier deterministic tie-breaker sorting function:
  // 1. Rating (Overall student score)
  // 2. Visa Success Rate (Hard outcome performance)
  // 3. Review Count (Statistical volume & credibility)
  // 4. Verification Status (Active government license)
  // 5. Refund Safety Window (Days allowed for full refund)
  // 6. Affordability (Lowest initial processing fee)
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

  const bestAgency = sortedAgencies[0] || getAgenciesByIds(DEFAULT_COMPARE_IDS)[0];
  const runnerUp = sortedAgencies[1];

  // True if top contenders share the identical star rating
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

  const removeAgency = (idToRemove: string) => {
    const next = selectedIds.filter(id => id !== idToRemove);
    if (next.length > 0) {
      router.push(`/compare?ids=${next.join(',')}`);
    } else {
      router.push('/directory');
    }
  };

  return (
    <main className={styles.page} style={{ paddingTop: 'var(--topbar-height)' }} suppressHydrationWarning>
      <div className={`${styles.inner} container`}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Agency Comparison</h1>
              <p className={styles.subtitle}>
                Side-by-side comparison of {agencies.length} {agencies.length === 1 ? 'agency' : 'agencies'}
              </p>
            </div>
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                size="sm"
                className={styles.analysisBtn}
                onClick={() => setAnalysisOpen(true)}
                id="btn-agency-analysis"
              >
                📊 Analysis & Top Pick
              </Button>
              <Link href="/directory">
                <Button variant="ghost" size="sm">← Back to Directory</Button>
              </Link>
            </div>
          </div>
        </div>

        <GlassCard padding="none" className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.table} aria-label="Agency comparison table">
              <thead>
                <tr>
                  <th className={styles.rowHeader} scope="col">Feature</th>
                  {agencies.map(a => (
                    <th key={a.id} className={styles.colHeader} scope="col">
                      <div className={styles.agencyHead}>
                        <button
                          type="button"
                          className={styles.removeAgencyBtn}
                          onClick={() => removeAgency(a.id)}
                          title={`Remove ${a.name} from comparison`}
                          aria-label={`Remove ${a.name}`}
                        >
                          ✕
                        </button>
                        <div className={styles.agencyAvatar} aria-hidden="true">{a.name[0]}</div>
                        <div>
                          <div className={styles.agencyName}>{a.name}</div>
                          <Badge variant={a.verified ? 'verified' : 'pending'} size="sm">
                            {a.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className={styles.addCol} scope="col">
                    {agencies.length < 4 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <select
                          className={styles.addSlot}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) addAgencyToCompare(e.target.value);
                          }}
                          style={{ cursor: 'pointer', padding: '10px', fontSize: '13px', border: '2px dashed var(--ink, #14120E)', borderRadius: '8px', background: 'transparent' }}
                        >
                          <option value="">+ Add Agency ({ALL_AGENCIES.length - agencies.length} more)...</option>
                          {ALL_AGENCIES.filter(a => !selectedIds.includes(a.id)).map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} (⭐ {a.rating})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px' }}>Max 4 compared</div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key} className={i % 2 === 0 ? styles.rowEven : ''}>
                    <td className={styles.rowLabel}>{row.label}</td>
                    {agencies.map(a => (
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
                  {agencies.map(a => (
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
        </GlassCard>
      </div>

      {/* ── ANALYSIS & TOP PICK MODAL POPUP ── */}
      {analysisOpen && (
        <div 
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAnalysisOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="analysis-modal-title"
        >
          <div className={styles.modalDialog}>
            {/* Header without icon */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div>
                  <div id="analysis-modal-title" className={styles.modalTitle}>
                    {lang === 'en' ? 'Agency Comparative Analysis & Top Pick' : 'এজেন্সি তুলনামূলক বিশ্লেষণ ও সেরা নির্বাচন'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lang === 'en' ? `Based on ${agencies.length} compared agencies • 100% verified audit` : `${agencies.length}টি তুলনাকৃত এজেন্সির ভিত্তিতে • ১০০% যাচাইকৃত অডিট`}
                  </div>
                </div>
              </div>

              <div className={styles.modalControls}>
                <button
                  type="button"
                  className={styles.langBtn}
                  onClick={() => setLang(l => (l === 'en' ? 'bn' : 'en'))}
                  title="Switch Language"
                  aria-label="Switch Language between English and Bangla"
                >
                  {lang === 'en' ? 'বাংলা' : 'EN'}
                </button>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setAnalysisOpen(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className={styles.modalBody}>
              {/* Tie-Breaker Notification Banner if ratings were identical */}
              {isRatingTie && runnerUp && (
                <div className={styles.tieBreakBanner}>
                  <div>
                    <strong>⚖️ {lang === 'en' ? 'Rating Tie-Breaker Applied:' : 'টাই-ব্রেকার প্রয়োগ করা হয়েছে:'}</strong>{' '}
                    {lang === 'en' ? (
                      <>
                        Both <strong>{bestAgency.name}</strong> and <strong>{runnerUp.name}</strong> share the identical <strong>{bestAgency.rating} ⭐</strong> rating.
                        {' '}<strong>{bestAgency.name}</strong> was ranked #1 due to higher visa success (<strong>{bestAgency.success}%</strong> vs {runnerUp.success}%) and verified student review volume (<strong>{bestAgency.reviews}</strong> vs {runnerUp.reviews} reviews).
                      </>
                    ) : (
                      <>
                        <strong>{bestAgency.name}</strong> এবং <strong>{runnerUp.name}</strong> উভয়ের রেটিং সমান (<strong>{bestAgency.rating} ⭐</strong>)।
                        উচ্চতর ভিসা সফলতার হার (<strong>{bestAgency.success}%</strong> বনাম {runnerUp.success}%) এবং যাচাইকৃত শিক্ষার্থী রিভিউ সংখ্যা (<strong>{bestAgency.reviews}</strong> বনাম {runnerUp.reviews}) বিবেচনায় <strong>{bestAgency.name}</strong>-কে শীর্ষস্থান দেওয়া হয়েছে।
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Overall Best Rated Winner Card */}
              <div className={styles.winnerCard}>
                <div className={styles.winnerRibbon}>
                  {lang === 'en' ? (isRatingTie ? '🏆 #1 Top Pick (Tie-Breaker Winner)' : '🏆 Top Rated Among Selected') : (isRatingTie ? '🏆 #১ শীর্ষ নির্বাচন (টাই-ব্রেকার বিজয়ী)' : '🏆 নির্বাচিত এজেন্সির মধ্যে শীর্ষ রেটিংপ্রাপ্ত')}
                </div>

                <div className={styles.winnerHeader}>
                  <div>
                    <div className={styles.winnerAgencyName}>{bestAgency.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {bestAgency.address} • {bestAgency.licenseNo}
                    </div>
                  </div>
                  <div className={styles.winnerStats}>
                    <div className={styles.statBadge}>
                      ⭐ {bestAgency.rating} / 5.0
                    </div>
                    <div className={`${styles.statBadge} ${styles.statSuccess}`}>
                      {bestAgency.success}% {lang === 'en' ? 'Visa Success' : 'ভিসা সাফল্য'}
                    </div>
                  </div>
                </div>

                {/* Why it is the top pick - Scrollable container */}
                <div className={styles.winnerReasons}>
                  <div className={styles.reasonsTitle}>
                    {lang === 'en' ? 'Key Strengths & Audit Highlights:' : 'প্রধান শক্তি ও অডিট হাইলাইটস:'}
                  </div>
                  {(lang === 'en' ? bestAgency.strengthsEn : bestAgency.strengthsBn).map((strength, sIdx) => (
                    <div key={sIdx} className={styles.reasonItem}>
                      <span className={styles.reasonBullet}>✓</span>
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Leaders Breakdown */}
              <div>
                <div className={styles.sectionTitle}>
                  {lang === 'en' ? 'Category Leaders Breakdown' : 'ক্যাটাগরি ভিত্তিক শীর্ষ এজেন্সি'}
                </div>
                <div className={styles.categoryGrid}>
                  <div className={styles.categoryCard}>
                    <div className={styles.categoryName}>{lang === 'en' ? 'Highest Student Rating' : 'সর্বোচ্চ স্টুডেন্ট রেটিং'}</div>
                    <div className={styles.categoryWinner}>{ratingLeader.name}</div>
                    <div className={styles.categoryScore}>{ratingLeader.rating} / 5.0 ({ratingLeader.reviews} Reviews)</div>
                  </div>

                  <div className={styles.categoryCard}>
                    <div className={styles.categoryName}>{lang === 'en' ? 'Highest Visa Success Rate' : 'সর্বোচ্চ ভিসা সাকসেস'}</div>
                    <div className={styles.categoryWinner}>{successLeader.name}</div>
                    <div className={styles.categoryScore}>{successLeader.success}% Visa Approval</div>
                  </div>

                  <div className={styles.categoryCard}>
                    <div className={styles.categoryName}>{lang === 'en' ? 'Most Affordable Entry' : 'সবচেয়ে সাশ্রয়ী ফি'}</div>
                    <div className={styles.categoryWinner}>{affordableLeader.name}</div>
                    <div className={styles.categoryScore}>{affordableLeader.fee} Starting</div>
                  </div>

                  <div className={styles.categoryCard}>
                    <div className={styles.categoryName}>{lang === 'en' ? 'Safest Refund Window' : 'দীর্ঘতম রিফান্ড সময়'}</div>
                    <div className={styles.categoryWinner}>{refundLeader.name}</div>
                    <div className={styles.categoryScore}>{refundLeader.refund}</div>
                  </div>
                </div>
              </div>

              {/* Verification & Safety Audit */}
              <div>
                <div className={styles.sectionTitle}>
                  {lang === 'en' ? 'Verified Credibility Audit' : 'যাচাইকৃত বিশ্বস্ততা অডিট'}
                </div>
                <div className={styles.auditCard}>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>{lang === 'en' ? 'Trade License & Legal Status' : 'ট্রেড লাইসেন্স ও আইনি স্থিতি'}</span>
                    <span className={`${styles.auditVal} ${styles.verifiedTag}`}>
                      ✓ {bestAgency.verified ? (lang === 'en' ? 'Government Verified (DNCC Active)' : 'সরকারি যাচাইকৃত (ডিএনসিসি সক্রিয়)') : (lang === 'en' ? 'Verification In Progress' : 'যাচাইকরণ প্রক্রিয়াধীন')}
                    </span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>{lang === 'en' ? 'Ethos Milestone Escrow Support' : 'এথোস মাইলস্টোন এসক্রো সাপোর্ট'}</span>
                    <span className={`${styles.auditVal} ${styles.verifiedTag}`}>
                      ✓ {lang === 'en' ? '100% Locked until verified visa' : '১০০% সুরক্ষিত (ভিসা না হওয়া পর্যন্ত টাকা লক)'}
                    </span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>{lang === 'en' ? 'Fee Transparency Index' : 'ফি স্বচ্ছতা সূচক'}</span>
                    <span className={styles.auditVal}>{bestAgency.verified ? '98%' : '72%'} {lang === 'en' ? '(No hidden processing charges)' : '(কোনো গোপন খরচ নেই)'}</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditLabel}>{lang === 'en' ? 'Counselor Background Verification' : 'কাউন্সিলর ব্যাকগ্রাউন্ড অডিট'}</span>
                    <span className={styles.auditVal}>✓ {lang === 'en' ? 'Certified by ICEF / British Council' : 'ICEF / ব্রিটিশ কাউন্সিল সার্টিফাইড'}</span>
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
              <Link href={`/dashboard/payments?agency=${bestAgency.id}`}>
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
