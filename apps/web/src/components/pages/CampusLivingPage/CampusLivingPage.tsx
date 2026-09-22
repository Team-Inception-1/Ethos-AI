'use client';
import React, { useState, useMemo } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './CampusLivingPage.module.css';
import campusData from '@/data/campusLivingData.json';

type ApartmentType = 'oneBedroom' | 'sharedRoom' | 'studio' | 'twoBedroom';
type CurrencyMode = 'local' | 'bdt';

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
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('local');

  // Filtered universities based on search & region
  const filteredUniversities = useMemo(() => {
    return campusData.filter((u) => {
      const matchesRegion = selectedRegion === 'All' || u.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q) ||
        u.areas.some((a) => a.name.toLowerCase().includes(q));
      return matchesRegion && matchesQuery;
    });
  }, [searchQuery, selectedRegion]);

  // Current active university
  const activeVarsity = useMemo(() => {
    return (
      campusData.find((u) => u.id === selectedVarsityId) ||
      filteredUniversities[0] ||
      campusData[0]
    );
  }, [selectedVarsityId, filteredUniversities]);

  // Current active area
  const activeArea = useMemo(() => {
    return (
      activeVarsity.areas.find((a) => a.id === selectedAreaId) ||
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

  // Cost calculator
  const calculateCosts = (area: typeof activeArea, varsity: typeof activeVarsity) => {
    const rent = (area.rent as any)[aptType] || area.rent.oneBedroom;
    const utilities = withSpouse ? area.utilitiesMonthly.spouse : area.utilitiesMonthly.single;
    const baseFood = area.foodGroceries.cookingAtHome + area.foodGroceries.diningOut;
    const food = withSpouse ? Math.round(baseFood * area.foodGroceries.spouseMultiplier) : baseFood;
    const shopping = withSpouse ? area.shoppingPersonal.spouse : area.shoppingPersonal.single;
    const transit = withSpouse ? area.transportation.spouse : area.transportation.single;
    const health = withSpouse ? area.healthMisc.spouse : area.healthMisc.single;

    const totalLocal = rent + utilities + food + shopping + transit + health;
    const totalBDT = Math.round(totalLocal * varsity.exchangeRateBDT);

    return {
      rent,
      utilities,
      food,
      shopping,
      transit,
      health,
      totalLocal,
      totalBDT,
    };
  };

  const currentCosts = calculateCosts(activeArea, activeVarsity);

  const formatPrice = (val: number) => {
    if (currencyMode === 'bdt') {
      const bdtVal = Math.round(val * activeVarsity.exchangeRateBDT);
      return `৳${bdtVal.toLocaleString('en-IN')}`;
    }
    return `${activeVarsity.currencySymbol}${val.toLocaleString()}`;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Off-Campus Housing &amp; Living Expenses</h1>
          <p className={styles.headerSubtitle}>
            Cannot get a dorm seat? Search your applied university to see real-life apartment rental rates,
            transit passes, and monthly living costs across nearby neighborhoods (for single students and couples).
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
            placeholder="Search any university or city (e.g. MIT, Harvard, Stanford, NYU, U of T, TUM, Oxford, Melbourne)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
          {campusData.slice(0, 7).map((u) => (
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

            {/* Exchange Rate Badge */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              Exchange Rate: 1 {activeVarsity.currency} ≈ ৳{activeVarsity.exchangeRateBDT.toFixed(1)} BDT
            </div>
          </GlassCard>
        </aside>

        {/* Right Content Area: Neighborhood Details */}
        <section>
          {/* Nearby Area Selector Chips */}
          <div className={styles.areaChipsRow}>
            {activeVarsity.areas.map((area) => (
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
              <div>
                <div className={styles.badgesRow}>
                  <Badge variant="info" size="sm">{activeArea.distance} from campus</Badge>
                  <Badge variant="warning" size="sm">{activeArea.walkTime}</Badge>
                  <Badge variant="success" size="sm">Safety: {activeArea.safetyScore} / 10</Badge>
                </div>
                <h2 className={styles.areaName}>{activeArea.name}</h2>
                <p className={styles.areaDesc}>{activeArea.description}</p>
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
              </div>
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

            </div>

            {/* Grocery & Halal Store Information */}
            <div className={styles.groceryBox}>
              <strong>📍 Neighborhood Grocery &amp; Halal Food Access:</strong> {activeArea.groceryOptions}
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
                {activeVarsity.areas.map((area) => {
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

        </section>

      </div>
    </div>
  );
}
