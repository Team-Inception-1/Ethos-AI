'use client';
import React, { use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ALL_AGENCIES, AgencyDetail } from '@/data/agencies';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgencyProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const agencyId = resolvedParams.id;

  const agency: AgencyDetail =
    ALL_AGENCIES.find((a) => a.id === agencyId) ||
    ALL_AGENCIES[0];

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height, 70px) + 24px)', paddingBottom: '60px' }} suppressHydrationWarning>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Back link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/directory"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ← Back to Directory
            </Link>
          </div>

          {/* Agency Hero Banner */}
          <GlassCard padding="lg" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--blue-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 800,
                    border: '2px solid var(--ink)',
                    boxShadow: '3px 3px 0 0 var(--ink)',
                    flexShrink: 0,
                  }}
                >
                  {agency.name.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {agency.name}
                    </h1>
                    <Badge variant={agency.verified ? 'verified' : 'pending'} size="md">
                      {agency.verified ? 'Verified License' : 'Under Review'}
                    </Badge>
                  </div>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    📍 {agency.address}
                  </p>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'monospace' }}>
                    Govt License: {agency.licenseNo}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href={`/compare?ids=${agency.id}`}>
                  <Button variant="ghost" size="md">
                    ⚖️ Compare
                  </Button>
                </Link>
                <Link href={`/dashboard/chat?agency=${agency.id}`}>
                  <Button variant="ghost" size="md">
                    💬 Chat
                  </Button>
                </Link>
                <Link href={`/dashboard/applications?apply=${agency.id}`}>
                  <Button variant="emerald" size="md" glow>
                    🛡️ Apply with Escrow
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Quick Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <GlassCard padding="md">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Student Satisfaction
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '4px' }}>
                ⭐ {agency.rating} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {agency.reviews} verified alumni reviews
              </div>
            </GlassCard>

            <GlassCard padding="md">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Visa Success Rate
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-dark)', marginTop: '4px' }}>
                🎯 {agency.success}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Verified embassy filings
              </div>
            </GlassCard>

            <GlassCard padding="md">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Estimated Service Fee
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--amber-dark, #b45309)', marginTop: '4px' }}>
                {agency.fee}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Released stage by stage
              </div>
            </GlassCard>

            <GlassCard padding="md">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Escrow Guarantee
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
                🛡️ {agency.refund}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Refund within {agency.refundDays} days
              </div>
            </GlassCard>
          </div>

          {/* Detailed Info Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Countries Served */}
            <GlassCard padding="lg">
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                🌍 Destination Countries Supported
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {agency.countryCodes.map((code) => (
                  <span
                    key={code}
                    style={{
                      background: 'var(--glass-bg-elevated)',
                      border: '1px solid var(--ink)',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      boxShadow: '2px 2px 0 0 var(--ink)',
                    }}
                  >
                    {code}
                  </span>
                ))}
              </div>
              <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Average inquiry response time: <strong>{agency.response}</strong>
              </p>
            </GlassCard>

            {/* Strengths & Ethos Audit */}
            <GlassCard padding="lg">
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                ✅ Ethos AI Audit & Strengths
              </h2>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
                {agency.strengthsEn.map((str, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    {str}
                  </li>
                ))}
              </ul>
            </GlassCard>

          </div>

          {/* Escrow Protection Notice Banner */}
          <GlassCard glow padding="lg" style={{ marginTop: '24px', background: 'var(--glass-bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  🔒 100% Escrow Milestone Protection
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                  When applying to {agency.name} through Ethos AI, your fees are held safely in a licensed escrow vault.
                  Payments are only released after university offers and visa steps are verified by you.
                </p>
              </div>
              <Link href={`/dashboard/applications?apply=${agency.id}`}>
                <Button variant="emerald" size="md">
                  Start Protected Application →
                </Button>
              </Link>
            </div>
          </GlassCard>

        </div>
      </main>
    </>
  );
}
