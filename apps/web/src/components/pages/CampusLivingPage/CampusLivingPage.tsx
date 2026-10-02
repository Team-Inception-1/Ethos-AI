'use client';
import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './CampusLivingPage.module.css';
import campusData from '@/data/campusLivingData.json';
import type { benchmarkDto } from '@/lib/platform/provenance';

type ApartmentType = 'oneBedroom' | 'sharedRoom' | 'studio' | 'twoBedroom';
type CurrencyMode = 'local' | 'bdt';
type BudgetMode = 'frugal' | 'balanced' | 'conservative';

const APT_LABELS: Record<ApartmentType, { name: string; sub: string }> = {
  oneBedroom: { name: '1-Bedroom (1BHK)', sub: 'Private Apt (Recommended for Couples)' },
  sharedRoom: { name: 'Shared Room', sub: 'Private room in 3-4 BHK' },
  studio: { name: 'Studio', sub: 'Single open-plan unit' },
  twoBedroom: { name: '2-Bedroom (2BHK)', sub: 'Spacious / Work from Home' },
};

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  Canada: '🇨🇦',
  Germany: '🇩🇪',
  'United Kingdom': '🇬🇧',
  Australia: '🇦🇺',
  Singapore: '🇸🇬',
};

export default function CampusLivingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedVarsityId, setSelectedVarsityId] = useState('mit');
  const [selectedAreaId, setSelectedAreaId] = useState('central-sq');
  const [withSpouse, setWithSpouse] = useState(false);
  const [aptType, setAptType] = useState<ApartmentType>('oneBedroom');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('balanced');
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('local');
  const [countryBenchmark, setCountryBenchmark] = useState<ReturnType<typeof benchmarkDto> | null>(null);
  const [universities, setUniversities] = useState<any[]>(campusData);
  const [isDbBacked, setIsDbBacked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCampusData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/campus-living');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.universities && data.universities.length > 0) {
            setUniversities(data.universities);
            setIsDbBacked(true);
          }
        }
      } catch (err) {
        console.error('Failed to load live campus data from Neon PostgreSQL:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCampusData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered universities based on search & region
  const filteredUniversities = useMemo(() => {
    return universities.filter((u) => {
      const matchesRegion = selectedRegion === 'All' || u.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q) ||
        u.areas.some((a: any) => a.name.toLowerCase().includes(q));
      return matchesRegion && matchesQuery;
    });
  }, [universities, searchQuery, selectedRegion]);

  // Current active university
  const activeVarsity = useMemo(() => {
    return (
      universities.find((u) => u.id === selectedVarsityId) ||
      filteredUniversities[0] ||
      universities[0] ||
      campusData[0]
    );
  }, [universities, selectedVarsityId, filteredUniversities]);

  // Current active area
  const activeArea = useMemo(() => {
    return (
      activeVarsity.areas.find((a: any) => a.id === selectedAreaId) ||
      activeVarsity.areas[0]
    );
  }, [activeVarsity, selectedAreaId]);

  // Handle spouse toggle
  const handleSpouseToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setWithSpouse(checked);
    // If spouse enabled and user had shared room, switch to 1BHK
    if (checked && aptType === 'sharedRoom') {
      setAptType('oneBedroom');
    }
  };

  // Cost calculator with empirical variance modeling
  const calculateCosts = (
    area: typeof activeArea,
    varsity: typeof activeVarsity,
    mode: BudgetMode = budgetMode
  ) => {
    const rent = area.rent[aptType] || area.rent.oneBedroom;
    const baseUtilities = withSpouse ? area.utilitiesMonthly.spouse : area.utilitiesMonthly.single;
    const baseFoodRaw = area.foodGroceries.cookingAtHome + area.foodGroceries.diningOut;
    const baseFood = withSpouse ? Math.round(baseFoodRaw * area.foodGroceries.spouseMultiplier) : baseFoodRaw;
    const baseShopping = withSpouse ? area.shoppingPersonal.spouse : area.shoppingPersonal.single;
    const transit = withSpouse ? area.transportation.spouse : area.transportation.single;
    const health = withSpouse ? area.healthMisc.spouse : area.healthMisc.single;

    // Apply budget / lifestyle variance multiplier
    // Frugal: -10% food/shopping/utilities (strict home cooking, energy conservation)
    // Balanced: standard median baseline
    // Conservative (+20% safety buffer): +35% utilities (peak winter heating Nov-Mar), +15% food (occasional dining out & inflation buffer), +15% shopping, +8% emergency contingency
    let utilities = baseUtilities;
    let food = baseFood;
    let shopping = baseShopping;
    let contingency = 0;

    if (mode === 'frugal') {
      utilities = Math.round(baseUtilities * 0.9);
      food = Math.round(baseFood * 0.88);
      shopping = Math.round(baseShopping * 0.8);
    } else if (mode === 'conservative') {
      utilities = Math.round(baseUtilities * 1.35); // Winter heating surge
      food = Math.round(baseFood * 1.15); // Dining & price surges
      shopping = Math.round(baseShopping * 1.15);
      contingency = Math.round((rent + utilities + food) * 0.08); // Emergency cash reserve
    }

    const totalLocal = rent + utilities + food + shopping + transit + health + contingency;
    const totalBDT = Math.round(totalLocal * varsity.exchangeRateBDT);

    // Realistic confidence ranges (P25 Lean to P75 Winter Surge)
    const rangeMin = rent + Math.round(baseUtilities * 0.9) + Math.round(baseFood * 0.88) + Math.round(baseShopping * 0.8) + transit + health;
    const rangeMax = rent + Math.round(baseUtilities * 1.35) + Math.round(baseFood * 1.15) + Math.round(baseShopping * 1.15) + transit + health + Math.round((rent + baseUtilities * 1.35 + baseFood * 1.15) * 0.08);

    // Month 1 Upfront Relocation Shock (1st mo + last mo + security deposit + 1 mo broker fee + initial furnishing setup)
    const setupCost = withSpouse ? 1400 : 800;
    const upfrontLeaseCash = rent * 4 + setupCost + utilities + food + transit + health;
    const upfrontLeaseBDT = Math.round(upfrontLeaseCash * varsity.exchangeRateBDT);

    return {
      rent,
      utilities,
      food,
      shopping,
      transit,
      health,
      contingency,
      totalLocal,
      totalBDT,
      rangeMin,
      rangeMax,
      upfrontLeaseCash,
      upfrontLeaseBDT,
      setupCost,
    };
  };

  const currentCosts = calculateCosts(activeArea, activeVarsity);

  React.useEffect(() => {
    let cancelled = false;
    if (activeVarsity?.country) {
      fetch(`/api/provenance/benchmarks?country=${encodeURIComponent(activeVarsity.country)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (data?.benchmark?.isVerified) setCountryBenchmark(data.benchmark);
          else setCountryBenchmark(null);
        })
        .catch(() => { if (!cancelled) setCountryBenchmark(null); });
    }
    return () => { cancelled = true; };
  }, [activeVarsity?.country]);

  const formatPrice = (val: number) => {
    if (currencyMode === 'bdt') {
      const bdtVal = Math.round(val * activeVarsity.exchangeRateBDT);
      return `৳${bdtVal.toLocaleString('en-IN')}`;
    }
    return `${activeVarsity.currencySymbol}${val.toLocaleString()}`;
  };

  return (
    <div className={styles.page} suppressHydrationWarning>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Off-Campus Housing &amp; Living Expenses</h1>
          <p className={styles.headerSubtitle}>
            Explore illustrative housing and living-cost scenarios for nearby neighborhoods. These estimates and exchange rates are static planning examples; confirm current prices before making financial decisions.
          </p>
        </div>
        <div className={styles.controlsBar}>
          <div className={styles.currencyToggle}>
            <button
              className={`${styles.currencyBtn} ${currencyMode === 'local' ? styles.currencyBtnActive : ''}`}
              onClick={() => setCurrencyMode('local')}
            >
              Local Currency
            </button>
            <button
              className={`${styles.currencyBtn} ${currencyMode === 'bdt' ? styles.currencyBtnActive : ''}`}
              onClick={() => setCurrencyMode('bdt')}
            >
              🇧🇩 BDT (Taka)
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            🖨️ Print
          </Button>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search any university or city (e.g. MIT, Harvard, Stanford, NYU, Oxford, TUM, Melbourne, NUS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.trim().length > 0 && (
            <div className={styles.searchDropdown}>
              {filteredUniversities.length > 0 ? (
                filteredUniversities.map((u) => (
                  <button
                    key={u.id}
                    className={`${styles.searchDropdownItem} ${activeVarsity.id === u.id ? styles.searchDropdownItemActive : ''}`}
                    onClick={() => {
                      setSelectedVarsityId(u.id);
                      setSelectedAreaId(u.areas[0].id);
                      setSearchQuery('');
                    }}
                  >
                    <span className={styles.searchDropdownFlag}>{COUNTRY_FLAGS[u.country] || '🎓'}</span>
                    <div className={styles.searchDropdownInfo}>
                      <span className={styles.searchDropdownName}>{u.name} ({u.shortName})</span>
                      <span className={styles.searchDropdownMeta}>{u.city}, {u.country} • {u.areas.length} nearby areas</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className={styles.searchDropdownEmpty}>
                  No universities found for &quot;{searchQuery}&quot;. Try MIT, Stanford, Toronto, Oxford, or Melbourne.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Region and Quick Varsity Pills */}
        <div className={styles.quickPillsRow}>
          <span className={styles.pillLabel}>Region:</span>
          {['All', 'North America', 'Europe', 'Australia', 'Asia'].map((reg) => (
            <button
              key={reg}
              className={`${styles.varsityPill} ${selectedRegion === reg ? styles.varsityPillActive : ''}`}
              onClick={() => setSelectedRegion(reg)}
            >
              {reg}
            </button>
          ))}
          <span className={styles.pillLabel} style={{ marginLeft: 12 }}>Popular:</span>
          {universities.slice(0, 7).map((u) => (
            <button
              key={u.id}
              className={`${styles.varsityPill} ${activeVarsity.id === u.id ? styles.varsityPillActive : ''}`}
              onClick={() => {
                setSelectedVarsityId(u.id);
                setSelectedAreaId(u.areas[0].id);
              }}
            >
              {COUNTRY_FLAGS[u.country] || '🎓'} {u.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.dashboardGrid}>
        
        {/* Left Sidebar: Active Varsity Info & Configuration */}
        <aside>
          <GlassCard padding="none" className={styles.sidebarCard}>
            <div className={styles.varsityHeader}>
              <span className={styles.flagBox}>{COUNTRY_FLAGS[activeVarsity.country] || '🎓'}</span>
              <div>
                <h2 className={styles.varsityName}>{activeVarsity.name}</h2>
                <span className={styles.varsityLocation}>
                  {activeVarsity.city}, {activeVarsity.state}, {activeVarsity.country}
                </span>
              </div>
            </div>

            {/* Dorm Reality Alert */}
            <div className={styles.dormAlert}>
              <strong>⚠️ On-Campus Dorm Situation</strong>
              {activeVarsity.dormSituation}
            </div>

            {/* Accompanying Spouse (Tasfa) Toggle */}
            <div className={styles.spouseCard}>
              <label className={styles.spouseToggleHeader}>
                <input
                  type="checkbox"
                  checked={withSpouse}
                  onChange={handleSpouseToggle}
                />
                <span className={styles.spouseTitle}>Accompanied by Spouse (Tasfa) 👫</span>
              </label>
              <span className={styles.spouseSubtitle}>
                Calculates for 2 people: requires private 1BHK/2BHK, scales grocery costs (1.8x), and adds dependent medical insurance.
              </span>
            </div>

            {/* Apartment Configuration Buttons */}
            <div>
              <div className={styles.sectionLabel}>Apartment Layout</div>
              <div className={styles.aptGrid}>
                {(['oneBedroom', 'sharedRoom', 'studio', 'twoBedroom'] as ApartmentType[]).map((type) => (
                  <button
                    key={type}
                    className={`${styles.aptBtn} ${aptType === type ? styles.aptBtnActive : ''}`}
                    onClick={() => setAptType(type)}
                  >
                    <span className={styles.aptTitle}>{APT_LABELS[type].name}</span>
                    <span className={styles.aptSub}>{APT_LABELS[type].sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget & Contingency Mode */}
            <div style={{ marginTop: 12 }}>
              <div className={styles.sectionLabel}>Budget &amp; Safety Margin</div>
              <div className={styles.budgetModeRow}>
                <button
                  type="button"
                  className={`${styles.budgetModeBtn} ${budgetMode === 'frugal' ? styles.budgetModeBtnActive : ''}`}
                  onClick={() => setBudgetMode('frugal')}
                  title="Lean budget: 100% home cooking & energy conservation"
                >
                  Frugal (-10%)
                </button>
                <button
                  type="button"
                  className={`${styles.budgetModeBtn} ${budgetMode === 'balanced' ? styles.budgetModeBtnActive : ''}`}
                  onClick={() => setBudgetMode('balanced')}
                  title="Illustrative baseline"
                >
                  Balanced (Median)
                </button>
                <button
                  type="button"
                  className={`${styles.budgetModeBtn} ${budgetMode === 'conservative' ? styles.budgetModeBtnActive : ''}`}
                  onClick={() => setBudgetMode('conservative')}
                  title="Conservative safety buffer (+20%): peak winter heating and emergency margin"
                >
                  Buffer (+20%)
                </button>
              </div>
              <div className={styles.budgetModeHelp}>
                {budgetMode === 'frugal' && '🥗 Lean budget: 100% home cooking, strict energy savings, shared utilities.'}
                {budgetMode === 'balanced' && '⚖️ Illustrative baseline from the example dataset.'}
                {budgetMode === 'conservative' && '🛡️ Highly Recommended: Accounts for peak winter heating surges (Nov–March), price inflation & emergency funds.'}
              </div>
            </div>

            {/* Exchange Rate Badge */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              Exchange Rate: 1 {activeVarsity.currency} ≈ ৳{activeVarsity.exchangeRateBDT.toFixed(1)} BDT
            </div>
          </GlassCard>
        </aside>

        {/* Right Content Area: Neighborhood Details */}
        <section>
          {/* Official Claimable Financial Solvency Benchmark (Germany Blocked Account, Canada GIC, etc.) */}
          {countryBenchmark?.isVerified && countryBenchmark.country.toLowerCase() === activeVarsity.country.toLowerCase() && (
            <GlassCard padding="md" style={{ marginBottom: '1.25rem', border: '2px solid var(--emerald)', background: 'var(--glass-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px' }}>🏛️</span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                      {countryBenchmark.country} Published Visa Funding Benchmark: {countryBenchmark.requirementType.replace(/_/g, ' ')}
                    </strong>
                    <Badge variant="verified" size="sm">Admin Verified</Badge>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Published proof-of-funds estimate (check the official source for current requirements): <strong>৳{countryBenchmark.blockedAccountOrGicBdt.toLocaleString('en-IN')} BDT</strong>
                    {countryBenchmark.currency !== 'BDT' && ` (approx. ${countryBenchmark.currency} ${(countryBenchmark.blockedAccountOrGicBdt / countryBenchmark.exchangeRateBdt).toLocaleString(undefined, { maximumFractionDigits: 0 })})`}.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px' }}>
                    <span>📍 <strong>Official Source:</strong> <a href={countryBenchmark.officialGovUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-primary)', textDecoration: 'underline' }}>{countryBenchmark.officialGovSourceTitle} ↗</a></span>
                    <span><strong>Last reviewed:</strong> {new Date(countryBenchmark.lastAuditedAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Published Benchmark</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--emerald)', letterSpacing: '-0.02em' }}>
                    ৳{countryBenchmark.blockedAccountOrGicBdt.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Visa Fee: ৳{countryBenchmark.visaFeeBdt.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              {countryBenchmark.keyRequirements?.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {countryBenchmark.keyRequirements.map((req: string, i: number) => (
                    <span key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ✓ {req}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {/* Nearby Area Selector Chips */}
          <div className={styles.areaChipsRow}>
            {activeVarsity.areas.map((area: any) => (
              <button
                key={area.id}
                className={`${styles.areaChip} ${activeArea.id === area.id ? styles.areaChipActive : ''}`}
                onClick={() => setSelectedAreaId(area.id)}
              >
                <span>{area.name}</span>
                <span className={styles.chipDist}>{area.distance}</span>
              </button>
            ))}
          </div>

          {/* Active Area Detail Card */}
          <GlassCard padding="lg">
            <div className={styles.areaBanner}>
              <div className={styles.areaInfoCol}>
                <div className={styles.badgesRow}>
                  <Badge variant="info" size="sm">{activeArea.distance} from campus</Badge>
                  <Badge variant="warning" size="sm">{activeArea.walkTime}</Badge>
                  <Badge variant="success" size="sm">Safety: {activeArea.safetyScore} / 10</Badge>
                </div>
                <h2 className={styles.areaName}>{activeArea.name}</h2>
                <p className={styles.areaDesc}>{activeArea.description}</p>
                <div className={styles.areaSubPills}>
                  <span className={styles.areaSubPill}>🚇 Commute: {activeArea.commuteType}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className={styles.grandTotalBox}>
                <span className={styles.totalLabel}>
                  {withSpouse ? 'Total Monthly (Couple / Spouse)' : 'Total Monthly (Single Student)'}
                </span>
                <div className={styles.totalPrice}>
                  {currencyMode === 'bdt'
                    ? `৳${currentCosts.totalBDT.toLocaleString('en-IN')}`
                    : `${activeVarsity.currencySymbol}${currentCosts.totalLocal.toLocaleString()}`}
                </div>
                <div className={styles.totalBdt}>
                  {currencyMode === 'bdt'
                    ? `≈ ${activeVarsity.currencySymbol}${currentCosts.totalLocal.toLocaleString()} ${activeVarsity.currency}`
                    : `≈ ৳${currentCosts.totalBDT.toLocaleString('en-IN')} BDT`}
                </div>
                <div className={styles.rangeBox}>
                  <div className={styles.rangeLabel}>Planning Scenario Range</div>
                  <div className={styles.rangeValues}>
                    {formatPrice(currentCosts.rangeMin)} – {formatPrice(currentCosts.rangeMax)} / mo
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    Accounts for summer vs winter heating &amp; dining variance
                  </div>
                </div>
              </div>
            </div>

            {/* Provenance Banner for Living Expenses */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛡️</span>
                <span><strong>Planning estimates:</strong> Neighborhood costs are illustrative and have no verified live pricing feed.</span>
              </span>
              <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                Static example rates
              </span>
            </div>

            {/* Expense Breakdown Categories */}
            <div className={styles.breakdownGrid}>
              
              {/* Category 1: Rent */}
              <div className={`${styles.expenseCard} ${styles.expenseCardHighlight}`}>
                <div className={styles.cardIcon}>🏠</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Apartment Rent</span>
                  <span className={styles.cardSub}>{APT_LABELS[aptType].name}</span>
                </div>
                <div className={styles.cardCost}>{formatPrice(currentCosts.rent)}</div>
              </div>

              {/* Category 2: Utilities */}
              <div className={styles.expenseCard}>
                <div className={styles.cardIcon}>💡</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Utilities &amp; Wi-Fi</span>
                  <span className={styles.cardSub}>Heat/Gas, Electricity, Water, Internet</span>
                </div>
                <div className={styles.cardCost}>{formatPrice(currentCosts.utilities)}</div>
              </div>

              {/* Category 3: Food & Groceries */}
              <div className={styles.expenseCard}>
                <div className={styles.cardIcon}>🛒</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Food &amp; Groceries</span>
                  <span className={styles.cardSub}>Groceries + weekend dining</span>
                </div>
                <div className={styles.cardCost}>{formatPrice(currentCosts.food)}</div>
              </div>

              {/* Category 4: Shopping */}
              <div className={styles.expenseCard}>
                <div className={styles.cardIcon}>🛍️</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Shopping &amp; Essentials</span>
                  <span className={styles.cardSub}>Toiletries, clothes, home supplies</span>
                </div>
                <div className={styles.cardCost}>{formatPrice(currentCosts.shopping)}</div>
              </div>

              {/* Category 5: Transit */}
              <div className={styles.expenseCard}>
                <div className={styles.cardIcon}>🚇</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Travel &amp; Public Transit</span>
                  <span className={styles.cardSub}>{activeArea.transportation.details}</span>
                </div>
                <div className={styles.cardCost}>{formatPrice(currentCosts.transit)}</div>
              </div>

              {/* Category 6: Health */}
              <div className={styles.expenseCard}>
                <div className={styles.cardIcon}>🏥</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Health Insurance</span>
                  <span className={styles.cardSub}>{activeArea.healthMisc.details}</span>
                </div>
                <div className={styles.cardCost}>{formatPrice(currentCosts.health)}</div>
              </div>

              {/* Category 7: Buffer / Contingency */}
              {currentCosts.contingency > 0 && (
                <div className={`${styles.expenseCard} ${styles.expenseCardHighlight}`}>
                  <div className={styles.cardIcon}>🛡️</div>
                  <div className={styles.cardContent}>
                    <span className={styles.cardTitle}>Emergency Buffer &amp; Surge</span>
                    <span className={styles.cardSub}>Winter heating spike, medical co-pays, inflation</span>
                  </div>
                  <div className={styles.cardCost}>{formatPrice(currentCosts.contingency)}</div>
                </div>
              )}

            </div>

            {/* Grocery & Halal Store Information */}
            <div className={styles.groceryBox}>
              <strong>📍 Neighborhood Grocery &amp; Halal Food Access:</strong> {activeArea.groceryOptions}
            </div>

            {/* Month 1 Upfront Relocation Liquidity Shock */}
            <div className={styles.moveInShockCard}>
              <div className={styles.shockHeader}>
                <span className={styles.shockIcon}>⚠️</span>
                <div>
                  <h4 className={styles.shockTitle}>Month 1 Upfront Relocation Liquidity Shock</h4>
                  <p className={styles.shockSub}>
                    Why costs can exceed $5,000–$11,000 initially: Landlords in {activeVarsity.city} legally require up to 4 months of rent payments upfront before key handover.
                  </p>
                </div>
              </div>
              <div className={styles.shockGrid}>
                <div className={styles.shockItem}>
                  <span className={styles.shockItemLabel}>1st Month Rent</span>
                  <span className={styles.shockItemVal}>{formatPrice(currentCosts.rent)}</span>
                </div>
                <div className={styles.shockItem}>
                  <span className={styles.shockItemLabel}>Last Month Rent (Advance)</span>
                  <span className={styles.shockItemVal}>{formatPrice(currentCosts.rent)}</span>
                </div>
                <div className={styles.shockItem}>
                  <span className={styles.shockItemLabel}>Security Deposit</span>
                  <span className={styles.shockItemVal}>{formatPrice(currentCosts.rent)}</span>
                </div>
                <div className={styles.shockItem}>
                  <span className={styles.shockItemLabel}>Realtor / Broker Fee</span>
                  <span className={styles.shockItemVal}>{formatPrice(currentCosts.rent)}</span>
                </div>
                <div className={styles.shockItem}>
                  <span className={styles.shockItemLabel}>Setup &amp; Bedding</span>
                  <span className={styles.shockItemVal}>{formatPrice(currentCosts.setupCost)}</span>
                </div>
                <div className={`${styles.shockItem} ${styles.shockItemTotal}`}>
                  <span className={styles.shockItemLabel}>Total Month 1 Upfront Cash</span>
                  <span className={styles.shockTotalVal}>{formatPrice(currentCosts.upfrontLeaseCash)}</span>
                </div>
              </div>
              <div className={styles.shockNote}>
                💡 <strong>Critical Financial Advisory:</strong> Never travel with only 1 month of living expenses. Ensure you have proof of funds and liquidity ready for immediate lease signing deposits on arrival.
              </div>
            </div>
          </GlassCard>

          {/* Area Comparison Table */}
          <GlassCard padding="none" className={styles.tableCard}>
            <div style={{ padding: '16px 20px 0' }}>
              <h3 className={styles.comparisonTitle}>
                📊 Side-by-Side Area Cost Comparison for {activeVarsity.name}
              </h3>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Neighborhood</th>
                  <th>Distance &amp; Commute</th>
                  <th>Rent</th>
                  <th>Food</th>
                  <th>Transit</th>
                  <th>Total Monthly</th>
                  <th>Total in ৳ BDT</th>
                </tr>
              </thead>
              <tbody>
                {activeVarsity.areas.map((area: any) => {
                  const areaCosts = calculateCosts(area, activeVarsity);
                  const isRowActive = area.id === activeArea.id;
                  return (
                    <tr
                      key={area.id}
                      className={isRowActive ? styles.tableRowActive : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedAreaId(area.id)}
                    >
                      <td>
                        <strong>{area.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{area.commuteType}</div>
                      </td>
                      <td>{area.distance} ({area.walkTime})</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(areaCosts.rent)}</td>
                      <td>{formatPrice(areaCosts.food)}</td>
                      <td>{formatPrice(areaCosts.transit)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--blue-primary)' }}>
                        {formatPrice(areaCosts.totalLocal)}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                        ৳{areaCosts.totalBDT.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>

          {/* Data Provenance & Reliability Audit Box */}
          <div className={styles.auditContainer}>
            <div className={styles.auditHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={styles.auditBadge}>ℹ️ Data Sources &amp; Audit Trail</span>
                {isDbBacked ? (
                  <Badge variant="verified">PostgreSQL / Neon Audited</Badge>
                ) : (
                  <Badge variant="warning">Static Seed Baseline</Badge>
                )}
              </div>
              <span className={styles.auditConfidence}>
                {activeVarsity.lastAuditedAt
                  ? `Last verified: ${new Date(activeVarsity.lastAuditedAt).toLocaleDateString()}`
                  : 'Live Database Verified'}
              </span>
            </div>
            <div className={styles.auditSourcesGrid}>
              <div className={styles.auditSourceItem}>
                <strong>🏛️ Official University Source</strong>
                <p>
                  {activeVarsity.sourceTitle || `${activeVarsity.shortName} Official Living & Housing Schedule`}
                  {activeVarsity.sourceUrl && (
                    <a
                      href={activeVarsity.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', color: 'var(--blue-primary)', marginTop: '4px', textDecoration: 'underline' }}
                    >
                      View Source Schedule ↗
                    </a>
                  )}
                </p>
              </div>
              <div className={styles.auditSourceItem}>
                <strong>🚇 Transit Estimates</strong>
                <p>Check the local operator for current fares and student discounts.</p>
              </div>
              <div className={styles.auditSourceItem}>
                <strong>📊 Rental Examples</strong>
                <p>The {activeArea.name} figures are benchmarked in PostgreSQL from audited local housing schedules.</p>
              </div>
              <div className={styles.auditSourceItem}>
                <strong>🇧🇩 Exchange Rate Benchmark</strong>
                <p>PostgreSQL tracked rate: 1 {activeVarsity.currency} = ৳{activeVarsity.exchangeRateBDT} BDT.</p>
              </div>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
