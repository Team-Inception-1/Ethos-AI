import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export const metadata: Metadata = {
  title: 'Privacy Policy | Ethos AI',
  description: 'Ethos AI data privacy, document encryption, and student consumer protection commitments.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '840px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ marginBottom: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '12px' }}>
            <Button size="sm" variant="outline">← Back to Home</Button>
          </Link>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Ethos AI Privacy Policy
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Last updated: October 2026 • Effective for all Bangladeshi students, guardians, and verified partner consultancies.
          </p>
        </div>

        <GlassCard padding="lg">
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6, fontSize: '15px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>1. Student Data Protection & Sovereign Vaults</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Ethos AI collects academic transcripts, test scores, passports, and university acceptance letters solely for admission verification, fraud scanning, and agency milestone tracking. Documents stored in our private storage vault are access-controlled by relationship authorization guards.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>2. Role-Based Visibility (Students, Guardians & Agencies)</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Student records are visible only to the verified student, their linked guardian/parent accounts, and the specific agency managing their application. Unlinked agencies cannot inspect or harvest applicant information.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>3. AI Fraud Analysis & Text Extraction</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Offer letters uploaded for fraud analysis are processed through our isolated FastAPI microservice. Files are scanned for layout tampering, forged seals, and unverified domains without sharing your documents with public AI training sets.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>4. Financial Transaction Information</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Ethos AI records milestone payment hashes, receipt identifiers, and gateway transaction IDs on an immutable ledger. We do not store raw payment credentials (bKash/Nagad PINs or credit card CVVs).
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>5. Contact & Data Inquiries</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                For data access, export, or deletion inquiries, contact our governance team at{' '}
                <a href="mailto:privacy@ethosai.edu.bd" style={{ color: 'var(--blue-primary)', fontWeight: 700 }}>
                  privacy@ethosai.edu.bd
                </a>.
              </p>
            </div>
          </section>
        </GlassCard>
      </main>
    </>
  );
}
