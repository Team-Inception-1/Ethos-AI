'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '@/context/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

interface RoleRestrictedProps {
  allowedRoles: UserRole[];
  featureName: string;
  children: React.ReactNode;
}

export default function RoleRestricted({ allowedRoles, featureName, children }: RoleRestrictedProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/initial mount, pass through or wait for hydration
  if (!mounted) {
    return <>{children}</>;
  }

  const role = user?.role || 'student';

  if (!allowedRoles.includes(role)) {
    if (role === 'admin') {
      return (
        <div style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: '640px', margin: '40px auto' }}>
          <GlassCard padding="lg" style={{ textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              margin: '0 auto 20px',
            }}>
              🛡️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Administrator Boundary
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
              <strong>{featureName}</strong> is reserved exclusively for Student and Parent applicant accounts. Platform administrators oversee institutional compliance, agency audits, data provenance, and escrow disputes via the Governance Panel.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/admin">
                <Button variant="primary">Return to Admin Panel</Button>
              </Link>
              <Link href="/admin#provenance">
                <Button variant="outline">Data Provenance Records</Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      );
    }

    if (role === 'agency') {
      return (
        <div style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: '640px', margin: '40px auto' }}>
          <GlassCard padding="lg" style={{ textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              margin: '0 auto 20px',
            }}>
              🏢
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Agency Portal Boundary
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
              <strong>{featureName}</strong> is designed for student applicants. Consultancies manage their applicant queue, service packages, and publish claimable cost benchmarks through the Agency Dashboard.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/agency/dashboard">
                <Button variant="primary">Go to Agency Dashboard</Button>
              </Link>
              <Link href="/agency/dashboard#applications">
                <Button variant="outline">View Student Queue</Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      );
    }
  }

  return <>{children}</>;
}
