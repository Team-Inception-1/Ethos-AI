import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export const metadata: Metadata = {
  title: 'Terms of Service | Ethos AI',
  description: 'Ethos AI platform terms of service, milestone escrow rules, and consultancy dispute arbitration framework.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '840px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ marginBottom: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '12px' }}>
            <Button size="sm" variant="outline">← Back to Home</Button>
          </Link>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Terms of Service & Escrow Governance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Last updated: October 2026 • Governing platform usage, milestone payments, and agency verification.
          </p>
        </div>

        <GlassCard padding="lg">
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6, fontSize: '15px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>1. Milestone Escrow Protection</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Funds deposited by students into milestone vaults are held securely and released sequentially. Agencies cannot claim payment upfront without fulfilling agreed admission or visa documentation criteria.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>2. Verified Consultancy Standards</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Consultancies listed on Ethos AI must maintain valid Ministry of Education / trade registrations. Any agency issuing falsified admission letters, altered documents, or undisclosed fees faces immediate suspension and forfeiture of disputed escrows.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>3. Dispute Resolution & Arbitration</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                If an agency fails to fulfill a milestone release condition or imposes unverified fees, students or guardians may freeze the milestone into dispute status. The Ethos AI arbitration panel reviews audit logs and uploaded evidence to issue binding releases or refunds.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>4. Cryptographic Ledger & Audit Trails</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                All milestone transactions produce tamper-evident SHA-256 ledger entries and digital receipts with unique receipt identifiers. These records provide verifiable proof of payment.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>5. Legal Inquiries & Governance</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                For dispute arbitration or legal notices, contact our compliance office at{' '}
                <a href="mailto:governance@ethosai.edu.bd" style={{ color: 'var(--blue-primary)', fontWeight: 700 }}>
                  governance@ethosai.edu.bd
                </a>.
              </p>
            </div>
          </section>
        </GlassCard>
      </main>
    </>
  );
}
