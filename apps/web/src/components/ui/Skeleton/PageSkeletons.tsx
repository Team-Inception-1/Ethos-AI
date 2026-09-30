'use client';

import React from 'react';
import Skeleton from './Skeleton';
import styles from './Skeleton.module.css';

/* ─────────────────────────────────────────────────────────────
   1. Agency Directory Grid Skeleton
   ───────────────────────────────────────────────────────────── */
export function AgencyCardSkeleton() {
  return (
    <div className={styles.cardSkeleton} aria-hidden="true">
      {/* Header: Avatar, Name, Badge, Risk Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton width={48} height={48} rounded="lg" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width={140} height={18} />
            <Skeleton width={80} height={14} />
          </div>
        </div>
        <Skeleton width={70} height={24} rounded="full" />
      </div>

      {/* Stars & Reviews */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Skeleton width={100} height={16} />
        <Skeleton width={60} height={14} />
      </div>

      {/* Country Pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Skeleton width={50} height={20} rounded="full" />
        <Skeleton width={45} height={20} rounded="full" />
        <Skeleton width={60} height={20} rounded="full" />
      </div>

      {/* Success Rate Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width={75} height={14} />
          <Skeleton width={35} height={14} />
        </div>
        <Skeleton width="100%" height={8} rounded="full" />
      </div>

      {/* Fee Box */}
      <Skeleton width="75%" height={16} />

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <Skeleton width="65%" height={36} rounded="md" />
        <Skeleton width="35%" height={36} rounded="md" />
      </div>
    </div>
  );
}

export function AgencyCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading agency directory"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 'var(--space-6, 24px)',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <AgencyCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. Application List Skeleton
   ───────────────────────────────────────────────────────────── */
export function ApplicationRowSkeleton() {
  return (
    <div className={styles.rowSkeleton} aria-hidden="true">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Skeleton width={48} height={48} rounded="lg" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={240} height={14} />
          <Skeleton width={140} height={12} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton width={110} height={28} rounded="md" />
        <Skeleton width={100} height={32} rounded="md" />
      </div>
    </div>
  );
}

export function ApplicationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading applications" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <ApplicationRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. Application Detail Skeleton
   ───────────────────────────────────────────────────────────── */
export function ApplicationDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading application details" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={280} height={28} />
          <Skeleton width={200} height={16} />
          <Skeleton width={130} height={14} />
        </div>
        <Skeleton width={120} height={32} rounded="md" />
      </div>

      {/* Progress Track Skeleton */}
      <div className={styles.cardSkeleton}>
        <Skeleton width={160} height={18} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '16px 0' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <React.Fragment key={i}>
              <Skeleton width={32} height={32} circle />
              {i < 6 && <Skeleton width="10%" height={4} rounded="full" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs Placeholder */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton width={90} height={34} rounded="md" />
        <Skeleton width={90} height={34} rounded="md" />
        <Skeleton width={90} height={34} rounded="md" />
        <Skeleton width={90} height={34} rounded="md" />
      </div>

      {/* Content Card Skeleton */}
      <div className={styles.cardSkeleton}>
        <Skeleton width={180} height={20} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="100%" height={48} rounded="md" />
          <Skeleton width="100%" height={48} rounded="md" />
          <Skeleton width="100%" height={48} rounded="md" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. Document Vault Skeleton
   ───────────────────────────────────────────────────────────── */
export function DocumentVaultSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading document vault" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width={70} height={34} rounded="md" />
          <Skeleton width={95} height={34} rounded="md" />
          <Skeleton width={90} height={34} rounded="md" />
          <Skeleton width={80} height={34} rounded="md" />
        </div>
        <Skeleton width={200} height={34} rounded="md" />
      </div>

      {/* Document Items Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.rowSkeleton}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Skeleton width={40} height={40} rounded="md" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton width={220} height={16} />
                <Skeleton width={140} height={12} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Skeleton width={80} height={24} rounded="full" />
              <Skeleton width={90} height={32} rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. Payments & Escrow Skeleton
   ───────────────────────────────────────────────────────────── */
export function PaymentsEscrowSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading escrow status" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.cardSkeleton} style={{ padding: '16px' }}>
            <Skeleton width={110} height={14} />
            <Skeleton width={150} height={28} />
            <Skeleton width={130} height={12} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton width={130} height={36} rounded="md" />
        <Skeleton width={130} height={36} rounded="md" />
      </div>

      {/* Milestone List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.rowSkeleton}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton width={220} height={18} />
              <Skeleton width={320} height={14} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Skeleton width={90} height={20} />
              <Skeleton width={80} height={26} rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. Student Dashboard Stats & App Skeleton
   ───────────────────────────────────────────────────────────── */
export function DashboardStatsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.cardSkeleton} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width={120} height={14} />
              <Skeleton width={28} height={28} circle />
            </div>
            <Skeleton width={80} height={32} />
            <Skeleton width={140} height={12} />
          </div>
        ))}
      </div>

      {/* Recent Application Card */}
      <div className={styles.cardSkeleton}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={220} height={20} />
          <Skeleton width={90} height={24} rounded="md" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Skeleton width={44} height={44} rounded="lg" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width={160} height={16} />
            <Skeleton width={240} height={14} />
          </div>
        </div>
        <Skeleton width="100%" height={12} rounded="full" style={{ marginTop: '12px' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. Chat Workspace Skeleton
   ───────────────────────────────────────────────────────────── */
export function ChatWorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading conversations"
      style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', minHeight: '400px' }}
    >
      {/* Left Thread List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.cardSkeleton} style={{ padding: '12px' }}>
            <Skeleton width={120} height={15} />
            <Skeleton width={160} height={12} />
            <Skeleton width="90%" height={11} />
          </div>
        ))}
      </div>

      {/* Right Conversation Window */}
      <div className={styles.cardSkeleton} style={{ height: '420px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <Skeleton width={38} height={38} circle />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width={140} height={16} />
            <Skeleton width={90} height={12} />
          </div>
        </div>

        {/* Message Bubbles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
          <Skeleton width="55%" height={42} rounded="lg" style={{ alignSelf: 'flex-start' }} />
          <Skeleton width="65%" height={48} rounded="lg" style={{ alignSelf: 'flex-end' }} />
          <Skeleton width="45%" height={38} rounded="lg" style={{ alignSelf: 'flex-start' }} />
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Skeleton width="85%" height={40} rounded="md" />
          <Skeleton width="15%" height={40} rounded="md" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. Admin Table Skeleton
   ───────────────────────────────────────────────────────────── */
export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading administrative records" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls / Filter Bar Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <Skeleton width={260} height={36} rounded="md" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width={70} height={36} rounded="md" />
          <Skeleton width={80} height={36} rounded="md" />
          <Skeleton width={80} height={36} rounded="md" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className={styles.cardSkeleton} style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header Row */}
        <div className={styles.tableRowSkeleton} style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--ink)' }}>
          <Skeleton width={140} height={16} />
          <Skeleton width={110} height={16} />
          <Skeleton width={90} height={16} />
          <Skeleton width={110} height={16} />
          <Skeleton width={90} height={16} />
        </div>

        {/* Table Body Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={styles.tableRowSkeleton}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Skeleton width="70%" height={15} />
              <Skeleton width="40%" height={12} />
            </div>
            <div style={{ flex: 1 }}><Skeleton width={80} height={14} /></div>
            <div style={{ flex: 1 }}><Skeleton width={70} height={14} /></div>
            <div style={{ flex: 1 }}><Skeleton width={75} height={22} rounded="full" /></div>
            <div style={{ flex: 1, display: 'flex', gap: '6px' }}>
              <Skeleton width={60} height={28} rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   9. Community Feed Skeleton
   ───────────────────────────────────────────────────────────── */
export function CommunityFeedSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading community discussions" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hub Tabs */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Skeleton width={90} height={36} rounded="md" />
        <Skeleton width={90} height={36} rounded="md" />
        <Skeleton width={90} height={36} rounded="md" />
        <Skeleton width={90} height={36} rounded="md" />
      </div>

      {/* Discussion Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.cardSkeleton}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width={42} height={42} circle />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton width={150} height={16} />
                <Skeleton width={100} height={12} />
              </div>
            </div>
            <Skeleton width="80%" height={20} />
            <Skeleton width="100%" height={14} />
            <Skeleton width="60%" height={14} />
            <div style={{ display: 'flex', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <Skeleton width={60} height={16} />
              <Skeleton width={70} height={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
