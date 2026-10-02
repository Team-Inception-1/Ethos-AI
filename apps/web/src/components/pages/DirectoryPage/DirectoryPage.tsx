'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import styles from './DirectoryPage.module.css';
import { getAgencyRiskScores, type AgencyRiskScore } from '@/lib/aiService';
import { AgencyCardSkeleton } from '@/components/ui/Skeleton';

// SVG Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)', zIndex: 1 }}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const RiskLowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: 4 }}>
    <path d="M12 2L22 20H2L12 2Z" />
  </svg>
);

const RiskMedIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: 4 }}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const RiskHighIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: 4 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

type DirectoryAgency = {
  id: string; name: string; verified: boolean; rating: number; reviews: number;
  countries: string[]; success: number; feeMin: number; feeMax: number;
};
type PublicAgency = {
  id: string; name: string; licenseStatus: string; rating: number; reviewCount: number;
  countriesServed: string[]; successRate: number; feeMinPoisha: string; feeMaxPoisha: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className={styles.stars} aria-label={`Rating: ${rating} out of 5`}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={i <= Math.floor(rating) ? styles.starFilled : styles.starEmpty} width="16" height="16" viewBox="0 0 24 24" fill={i <= Math.floor(rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ))}
      <span className={styles.ratingNum}>{rating}</span>
    </div>
  );
}

const COUNTRY_MAP: Record<string, string[]> = {
  germany: ['DEU'],
  uk: ['GBR', 'IRL'],
  'united kingdom': ['GBR', 'IRL'],
  usa: ['USA'],
  'united states': ['USA'],
  canada: ['CAN'],
  australia: ['AUS'],
  sweden: ['SWE'],
  malaysia: ['MYS'],
};

export default function DirectoryPage() {
  return <Suspense fallback={<p>Loading agency directory…</p>}><DirectoryContent /></Suspense>;
}

function DirectoryContent() {
  const params = useSearchParams();
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy]             = useState('rating');
  const [compare, setCompare]           = useState<string[]>(() => (params.get('compare') ?? '').split(',').filter(Boolean).slice(0, 4));
  const [search, setSearch]             = useState('');
  const [countryCleared, setCountryCleared] = useState(false);
  const countryFilter = countryCleared ? null : params.get('country');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const [riskScores, setRiskScores] = useState<Record<string, AgencyRiskScore> | null>(null);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [agenciesList, setAgenciesList] = useState<DirectoryAgency[]>([]);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/api/agencies');
        if (!response.ok) throw new Error('Directory unavailable');
        const data: { agencies: PublicAgency[] } = await response.json();
        const agencies = data.agencies.map(a => ({
          id: a.id, name: a.name, verified: a.licenseStatus === 'VERIFIED', rating: a.rating,
          reviews: a.reviewCount, countries: a.countriesServed, success: a.successRate,
          feeMin: Number(a.feeMinPoisha) / 100, feeMax: Number(a.feeMaxPoisha) / 100,
        }));
        if (cancelled) return;
        setAgenciesList(agencies);
        setLoading(false);
        // Fetch risk scores from AI microservice — silently fall back if unavailable.
        try {
          const scores = await getAgencyRiskScores(agencies.map(a => a.id));
          if (!cancelled) setRiskScores(scores);
        } catch {
          if (!cancelled) setRiskScores({});
        }
      } catch {
        if (!cancelled) {
          setDirectoryError('The agency directory is temporarily unavailable. Please try again later.');
          setLoading(false);
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = agenciesList
    .filter(a => !verifiedOnly || a.verified)
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    .filter(a => {
      if (countryFilter) {
        const targetCodes = COUNTRY_MAP[countryFilter.toLowerCase()] || [countryFilter.toUpperCase().slice(0, 3)];
        if (!a.countries.some(c => targetCodes.includes(c))) return false;
      }
      if (selectedCountries.length > 0) {
        const anyMatch = selectedCountries.some(name => {
          const codes = COUNTRY_MAP[name.toLowerCase()] || [name.toUpperCase().slice(0, 3)];
          return a.countries.some(c => codes.includes(c));
        });
        if (!anyMatch) return false;
      }
      return true;
    })
    .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : b.success - a.success);

  const toggleCompare = (id: string) => {
    setCompare(c => c.includes(id) ? c.filter(x => x !== id) : c.length < 4 ? [...c, id] : c);
  };

  return (
    <main className={styles.page} style={{ paddingTop: 'var(--topbar-height)' }} suppressHydrationWarning>
      <div className={`${styles.inner} container`}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Verified Agency Directory</h1>
            <p className={styles.subtitle}>{filtered.length} published agencies found</p>
            {countryFilter && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="verified" size="sm">📍 Filtered for: {countryFilter}</Badge>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCleared(true);
                    window.history.replaceState({}, '', '/directory');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  ✖ Clear Filter
                </button>
              </div>
            )}
          </div>
          {compare.length > 1 && (
            <Link href={`/compare?ids=${compare.join(',')}`}>
              <Button variant="emerald" size="lg" glow>Compare {compare.length} Agencies →</Button>
            </Link>
          )}
        </div>

        {directoryError && <p role="alert">{directoryError}</p>}
        {!loading && !directoryError && filtered.length === 0 && <p>No published agencies match your filters.</p>}
        {riskError && (
          <div className={styles.riskErrorToast} role="alert">
            ⚠ {riskError}
          </div>
        )}

        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={styles.filterPanel} aria-label="Filters">
            <h2 className={styles.filterTitle}>Filters</h2>

            {/* Search */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="dir-search">Search</label>
              <div style={{ position: 'relative' }}>
                <SearchIcon />
                <input
                  id="dir-search"
                  type="search"
                  className={styles.filterInput}
                  style={{ paddingLeft: '36px' }}
                  placeholder="Agency name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Verified Only Toggle */}
            <div className={styles.filterGroup}>
              <label className={styles.filterToggleRow} htmlFor="verified-toggle">
                <span className={styles.filterLabel}>Verified Only</span>
                <button
                  id="verified-toggle"
                  role="switch"
                  aria-checked={verifiedOnly}
                  className={`${styles.toggle} ${verifiedOnly ? styles.toggleOn : ''}`}
                  onClick={() => setVerifiedOnly(v => !v)}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </label>
            </div>

            {/* Sort */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="sort-select">Sort By</label>
              <select
                id="sort-select"
                className={styles.filterInput}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="rating">Highest Rating</option>
                <option value="success">Reported Success Rate</option>
              </select>
            </div>

            {/* Country Filter */}
            <div className={styles.filterGroup}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p className={styles.filterLabel}>Country</p>
                {selectedCountries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCountries([])}
                    style={{ background: 'none', border: 'none', color: 'var(--blue-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Reset
                  </button>
                )}
              </div>
              {['Canada', 'UK', 'Australia', 'USA', 'Germany'].map(c => {
                const isChecked = selectedCountries.includes(c);
                return (
                  <label key={c} className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      className={styles.check}
                      checked={isChecked}
                      onChange={() => {
                        setSelectedCountries(prev =>
                          prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                        );
                      }}
                    />
                    {c}
                  </label>
                );
              })}
            </div>
          </aside>

          {/* Agency Grid */}
          <div className={styles.agencyGrid} aria-label="Agency listings" aria-live="polite">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <AgencyCardSkeleton key={i} />
              ))
            ) : (
              filtered.map(a => (
              <div key={a.id} className={styles.agencyCard}>
                {/* Header */}
                <div className={styles.cardTop}>
                  <div className={styles.agencyAvatar} aria-hidden="true">{a.name[0]}</div>
                  <div className={styles.agencyMeta}>
                    <div className={styles.agencyName} title={a.name}>{a.name}</div>
                    <Badge variant={a.verified ? 'verified' : 'pending'} size="sm">
                      {a.verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  {/* Risk Score — live from the AI microservice (Module 5.10) */}
                  {riskScores === null ? (
                    <div className={styles.riskBadgeSkeleton} aria-label="Loading risk score" />
                  ) : (
                    (() => {
                      const score = riskScores[a.id];
                      if (!score || score.flag_count === 0) return <Badge variant="pending" size="sm">{score ? 'Not yet assessed' : 'Risk unavailable'}</Badge>;
                      const risk = score.risk_score;
                      return (
                        <div
                          className={`${styles.riskBadge} ${risk < 30 ? styles.riskLow : risk < 60 ? styles.riskMed : styles.riskHigh}`}
                          title={`Risk score: ${risk}/100`}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          {risk < 30 ? <RiskLowIcon /> : risk < 60 ? <RiskMedIcon /> : <RiskHighIcon />}
                          RISK {risk}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Rating */}
                <div>
                  <StarRating rating={a.rating} />
                  <div className={styles.reviewCount}>{a.reviews} reviews</div>
                </div>

                {/* Countries */}
                <div className={styles.countries} aria-label="Countries served">
                  {a.countries.map(c => (
                    <span key={c} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', background: 'var(--glass-bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                      {c}
                    </span>
                  ))}
                </div>

                {/* Success Bar */}
                <div>
                  <div className={styles.successRow}>
                    <span className={styles.successLabel}>Success Rate</span>
                    <span className={styles.successPct}>{a.success}%</span>
                  </div>
                  <div className={styles.successBar} role="progressbar" aria-valuenow={a.success} aria-valuemin={0} aria-valuemax={100}>
                    <div className={styles.successFill} style={{ width: `${a.success}%` }} />
                  </div>
                </div>

                {/* Fee */}
                <div className={styles.fee}>
                  Avg Fee: ৳{(a.feeMin/1000).toFixed(0)}K – ৳{(a.feeMax/1000).toFixed(0)}K
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  <Link href={`/directory/${a.id}`} style={{ flex: 1 }}>
                    <Button size="md" variant="ghost" fullWidth>View Profile</Button>
                  </Link>
                  <button
                    className={`${styles.compareBtn} ${compare.includes(a.id) ? styles.compareBtnOn : ''}`}
                    onClick={() => toggleCompare(a.id)}
                    aria-pressed={compare.includes(a.id)}
                  >
                    {compare.includes(a.id) ? (
                      <>
                        <CheckIcon />
                        <span style={{ marginLeft: 4 }}>Added</span>
                      </>
                    ) : '+ Compare'}
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      </div>
    </main>
  );
}
