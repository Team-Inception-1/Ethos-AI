import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'For Study-Abroad Agencies | Ethos AI Partner Network',
  description:
    'Join Bangladesh\'s trusted study-abroad network. Verify your consultancy, eliminate fee disputes with escrow milestones, and connect with serious international students.',
};

export default function ForAgenciesPage() {
  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: '100vh',
          paddingTop: 'calc(var(--navbar-height, 70px) + 32px)',
          paddingBottom: '80px',
        }}
        suppressHydrationWarning
      >
        <div className="container" style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', marginBottom: '16px' }}>
              <Badge variant="verified" size="md">
                ⭐ Ethos AI Partner Network
              </Badge>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: '0 0 16px',
              }}
            >
              Grow Your Consultancy with <span className="text-gradient">Verified Trust</span>
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 2vw, 18px)',
                color: 'var(--text-secondary)',
                maxWidth: '680px',
                margin: '0 auto 28px',
                lineHeight: 1.6,
              }}
            >
              Ethos AI is Bangladesh’s first verified education consultancy marketplace.
              Get officially audited, receive pre-funded milestone escrow payments, and connect with 2,400+ students.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register?role=agency">
                <Button size="lg" variant="emerald" glow>
                  Apply for Verification →
                </Button>
              </Link>
              <Link href="/agency/dashboard">
                <Button size="lg" variant="ghost">
                  Access Agency Portal
                </Button>
              </Link>
            </div>
          </div>

          {/* Value Pillars Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '48px',
            }}
          >
            <GlassCard padding="lg" hover>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛡️</div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                Verified Trust Badge
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Legitimate agencies are separated from fraudulent rogue operators. Your government trade license
                and certifications are showcased prominently to prospective applicants and parents.
              </p>
            </GlassCard>

            <GlassCard padding="lg" hover>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                Milestone Escrow Vault
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                No more unpaid processing fees or student payment cancellations. Fees are pre-locked in licensed
                escrow vaults and automatically released to your agency upon offer and visa confirmations.
              </p>
            </GlassCard>

            <GlassCard padding="lg" hover>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                High-Intent Student Pipeline
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Receive verified inquiries from students who have already completed their profile assessment,
                shortlisted their destination countries, and are ready to apply.
              </p>
            </GlassCard>
          </div>

          {/* 4-Step Verification Timeline */}
          <GlassCard padding="lg" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '28px', color: 'var(--text-primary)' }}>
              How Agency Verification Works
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
              }}
            >
              {[
                { step: '01', title: 'Submit Documents', desc: 'Provide DNCC/city trade license, tax ID, and agency address.' },
                { step: '02', title: 'Background Audit', desc: 'AI fraud screening against complaints and consumer rights records.' },
                { step: '03', title: 'Publish Services', desc: 'List your application processing fee schedule and refund terms.' },
                { step: '04', title: 'Verified Badge Active', desc: 'Appear on top of the directory with live milestone escrow support.' },
              ].map((s) => (
                <div
                  key={s.step}
                  style={{
                    background: 'var(--glass-bg-elevated)',
                    border: '2px solid var(--ink)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    boxShadow: '3px 3px 0 0 var(--ink)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#14120E',
                      background: 'var(--yellow)',
                      border: '2px solid var(--ink)',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 10px',
                      width: 'fit-content',
                      marginBottom: '12px',
                    }}
                  >
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Bottom Callout Banner */}
          <GlassCard glow padding="lg" variant="frosted">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                  Ready to Become a Verified Partner?
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '580px' }}>
                  Join top educational consultancies across Dhaka, Chittagong, and Sylhet. Verification takes less than 24 hours.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/register?role=agency">
                  <Button variant="emerald" size="lg">
                    Register Agency →
                  </Button>
                </Link>
                <Link href="/agency/dashboard">
                  <Button variant="ghost" size="lg">
                    Demo Portal
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>

        </div>
      </main>
    </>
  );
}
