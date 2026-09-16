'use client';
import React, { useEffect, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import styles from './DirectoryPage.module.css';
import { getAgencyRiskScores, type AgencyRiskScore } from '@/lib/aiService';

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

// Agency directory listing metadata (name, rating, countries, fees) is not
// yet backed by a real core-API listing endpoint (that's a separate,
// non-AI backend concern) — this stays as representative demo data. The
// `risk` field, however, is fetched LIVE from the AI microservice's
// Module 5.10 scam-alert risk store below (see `aiService.ts`), per
// Issue #25's DoD: "Directory/Agency profile risk badges pull from the
// K-22 scam-alert riskScore instead of static data."
const AGENCIES = [
  { id: 'agt-001', name: 'Global Edu BD',      verified: true,  rating: 4.8, reviews: 234, countries: ['CAN', 'GBR', 'AUS'], success: 94, feeMin: 25000, feeMax: 80000 },
  { id: 'agt-002', name: 'Dream Abroad Ltd',   verified: true,  rating: 4.6, reviews: 187, countries: ['USA', 'DEU', 'NLD'], success: 89, feeMin: 30000, feeMax: 100000 },
  { id: 'agt-003', name: 'EduPath Global',     verified: true,  rating: 4.5, reviews: 103, countries: ['CAN', 'NZL', 'SWE'], success: 91, feeMin: 20000, feeMax: 70000 },
  { id: 'agt-004', name: 'Skyline Consultancy',verified: false, rating: 3.2, reviews: 45,  countries: ['GBR', 'IRL'],        success: 62, feeMin: 15000, feeMax: 60000 },
  { id: 'agt-005', name: 'StudyBridge BD',     verified: true,  rating: 4.7, reviews: 312, countries: ['CAN', 'AUS', 'USA'], success: 96, feeMin: 35000, feeMax: 90000 },
  { id: 'agt-006', name: 'AbraodX Partners',   verified: true,  rating: 4.3, reviews: 78,  countries: ['DEU', 'SWE', 'FIN'], success: 85, feeMin: 22000, feeMax: 65000 },
];

const AGENCY_IDS = AGENCIES.map(a => a.id);

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
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy]             = useState('rating');
  const [compare, setCompare]           = useState<string[]>([]);
  const [search, setSearch]             = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  // Live risk scores from the AI microservice (Module 5.10 / Issue #23),
  // keyed by agency id. `null` = still loading (initial fetch in flight);
  // once resolved this is always a fully-populated map (per-agency fetch
  // failures degrade to a clean 0-score entry inside `getAgencyRiskScores`,
  // never to a missing key) — see `lib/aiService.ts`.
  const [riskScores, setRiskScores] = useState<Record<string, AgencyRiskScore> | null>(null);
  const [riskError, setRiskError]   = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('country');
      if (c) setCountryFilter(c);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAgencyRiskScores(AGENCY_IDS)
      .then(scores => {
        if (!cancelled) setRiskScores(scores);
      })
      .catch(() => {
        if (!cancelled) {
          setRiskError('Could not reach the AI risk service — showing agencies without live risk scores.');
          setRiskScores({}); // stop showing the loading skeleton; badges fall back to 0
        }
      });
    return () => { cancelled = true; };
  }, []);

  const getRisk = (agencyId: string): number => riskScores?.[agencyId]?.risk_score ?? 0;

  const filtered = AGENCIES
    .filter(a => !verifiedOnly || a.verified)
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    .filter(a => {
      if (!countryFilter) return true;
      const targetCodes = COUNTRY_MAP[countryFilter.toLowerCase()] || [countryFilter.toUpperCase().slice(0, 3)];
      return a.countries.some(c => targetCodes.includes(c));
    })
    .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : b.success - a.success);

  const toggleCompare = (id: string) => {
    setCompare(c => c.includes(id) ? c.filter(x => x !== id) : c.length < 4 ? [...c, id] : c);
  };

  return (
    <main className={styles.page} style={{ paddingTop: 'var(--topbar-height)' }}>
      <div className={`${styles.inner} container`}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Verified Agency Directory</h1>
            <p className={styles.subtitle}>{filtered.length} agencies found — all verified by Ethos AI</p>
            {countryFilter && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="verified" size="sm">📍 Filtered for: {countryFilter}</Badge>
                <button
                  type="button"
                  onClick={() => {
                    setCountryFilter(null);
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
                <option value="success">Success Rate</option>
              </select>
            </div>

            {/* Country Filter (skeleton) */}
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Country</p>
              {['Canada', 'UK', 'Australia', 'USA', 'Germany'].map(c => (
                <label key={c} className={styles.checkLabel}>
                  <input type="checkbox" className={styles.check} /> {c}
                </label>
              ))}
            </div>
          </aside>

          {/* Agency Grid */}
          <div className={styles.agencyGrid} aria-label="Agency listings" aria-live="polite">
            {filtered.map(a => (
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
                      const risk = getRisk(a.id);
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
                  <div className={styles.reviewCount}>{a.reviews} verified reviews</div>
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
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
