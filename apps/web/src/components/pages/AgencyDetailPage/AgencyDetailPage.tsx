'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export interface AgencyReview {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerified?: boolean;
  authorName: string;
  createdAt: string;
}

export interface PricingService {
  id: string;
  serviceName: string;
  amountBdt: number;
  whenCharged: string;
  refundable: boolean;
  conditions: string | null;
}

export interface AgencyDetailData {
  id: string;
  name: string;
  licenseNo: string;
  licenseStatus: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  reviews?: AgencyReview[];
  success: number;
  fee: string;
  feeMin: number;
  feeMax: number;
  refund: string;
  refundDays: number;
  response: string;
  countriesServed: string[];
  countryCodes: string[];
  address: string;
  website?: string | null;
  description?: string;
  pricingServices?: PricingService[];
  strengthsEn: string[];
  strengthsBn: string[];
}

export interface AgencyDetailPageProps {
  agencyId: string;
  inDashboard?: boolean;
}

export default function AgencyDetailPage({ agencyId, inDashboard = false }: AgencyDetailPageProps) {
  const [agency, setAgency] = useState<AgencyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!agency) return;
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const res = await fetch(`/api/agencies/${agency.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          text: reviewText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in as a student to submit a review.');
        }
        throw new Error(data.error?.message || 'Failed to submit review.');
      }
      setReviewSuccess('Thank you! Your verified review has been published.');
      if (data.review) {
        setAgency((prev) => {
          if (!prev) return prev;
          const currentReviews = prev.reviews ?? [];
          return {
            ...prev,
            rating: data.agency?.rating ?? prev.rating,
            reviewCount: data.agency?.reviewCount ?? (prev.reviewCount + 1),
            reviews: [data.review, ...currentReviews],
          };
        });
      }
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewTitle('');
        setReviewText('');
        setReviewRating(5);
        setReviewSuccess(null);
      }, 1500);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmittingReview(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadAgency() {
      setLoading(true);
      setNotFound(false);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/agencies/${agencyId}`);
        if (res.status === 404) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to load agency information.');
        }

        const data = await res.json();
        if (!cancelled) {
          if (!data?.agency) {
            setNotFound(true);
          } else {
            setAgency(data.agency);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'An error occurred while loading.');
          setLoading(false);
        }
      }
    }

    void loadAgency();
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  const directoryUrl = inDashboard ? '/dashboard/agency-directory' : '/directory';
  const RootTag = inDashboard ? 'div' : 'main';

  return (
    <>
      {!inDashboard && <Navbar />}
      <RootTag
        style={{
          minHeight: inDashboard ? 'auto' : '100vh',
          paddingTop: inDashboard ? 0 : 'calc(var(--navbar-height, 70px) + 24px)',
          paddingBottom: inDashboard ? '40px' : '60px',
        }}
        suppressHydrationWarning
      >
        <div className={inDashboard ? undefined : 'container'} style={{ maxWidth: '1000px', margin: '0 auto', padding: inDashboard ? 0 : '0 20px' }}>
          {/* Back link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href={directoryUrl}
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
              ← Back to {inDashboard ? 'Agency Directory' : 'Directory'}
            </Link>
          </div>

          {loading ? (
            <GlassCard padding="lg" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Loading Agency Profile...
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                Fetching verified agency credentials and audit metrics from Neon PostgreSQL.
              </p>
            </GlassCard>
          ) : notFound || !agency ? (
            <GlassCard padding="lg" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢❌</div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                Agency Not Found
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '520px', margin: '0 auto 24px' }}>
                The agency with ID <code style={{ background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px' }}>{agencyId}</code> does not exist or has not been approved in the verified directory.
              </p>
              <Link href={directoryUrl}>
                <Button variant="emerald" size="md">
                  Browse Verified Agencies
                </Button>
              </Link>
            </GlassCard>
          ) : errorMessage ? (
            <GlassCard padding="lg" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                Unable to Load Agency
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                {errorMessage}
              </p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </GlassCard>
          ) : (
            <>
              {/* Agency Hero Banner */}
              <GlassCard padding="lg" style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px',
                  }}
                >
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
                    {agency.reviewCount > 0 ? (
                      <>⭐ {agency.rating.toFixed(1)} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/ 5.0</span></>
                    ) : (
                      <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Unrated</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {agency.reviewCount > 0 ? `${agency.reviewCount} verified alumni reviews` : 'No alumni reviews yet'}
                  </div>
                </GlassCard>

                <GlassCard padding="md">
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Visa Success Rate
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-dark)', marginTop: '4px' }}>
                    {agency.reviewCount > 0 && agency.success > 0 ? (
                      <>🎯 {agency.success}%</>
                    ) : (
                      <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Pending</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {agency.reviewCount > 0 && agency.success > 0 ? 'Verified embassy filings' : 'Awaiting first cohort completion'}
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
                    {agency.countryCodes?.map((code) => (
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
                    {agency.strengthsEn?.map((str, idx) => (
                      <li key={idx} style={{ marginBottom: '8px' }}>
                        {str}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>

              {/* Verified Pricing Packages (if available) */}
              {agency.pricingServices && agency.pricingServices.length > 0 && (
                <GlassCard padding="lg" style={{ marginTop: '24px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                    📋 Transparent Milestone Pricing Breakdown
                  </h2>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {agency.pricingServices.map((service) => (
                      <div
                        key={service.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          padding: '12px 16px',
                          background: 'var(--glass-bg)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
                            {service.serviceName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Milestone trigger: {service.whenCharged} • {service.refundable ? '✅ Refundable' : '🔒 Non-refundable after trigger'}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--blue-primary)', fontSize: '16px' }}>
                          ৳{service.amountBdt.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Verified Alumni Reviews Section */}
              <GlassCard padding="lg" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        ⭐ Verified Student Reviews
                      </h2>
                      <Badge variant="verified" size="sm">
                        {agency.reviewCount} {agency.reviewCount === 1 ? 'Review' : 'Reviews'}
                      </Badge>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Authentic feedback from students who processed university applications with {agency.name}.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReviewError(null);
                      setReviewSuccess(null);
                      setShowReviewModal(true);
                    }}
                  >
                    ✍️ Write a Review
                  </Button>
                </div>

                {/* Reviews List / Grid */}
                {agency.reviews && agency.reviews.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {agency.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        style={{
                          background: 'var(--glass-bg)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '15px' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                            ))}
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: '4px', fontSize: '13px' }}>
                              {rev.rating}.0
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {rev.title && (
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {rev.title}
                          </div>
                        )}

                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                          &ldquo;{rev.comment}&rdquo;
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'var(--blue-primary)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '11px',
                              }}
                            >
                              {rev.authorName.charAt(0)}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {rev.authorName}
                            </span>
                          </div>
                          <Badge variant="verified" size="sm">Verified Student</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      background: 'var(--glass-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No student reviews yet
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px' }}>
                      Have you consulted or applied with {agency.name}? Share your verified feedback to help other students choose safely.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setReviewError(null);
                        setReviewSuccess(null);
                        setShowReviewModal(true);
                      }}
                    >
                      Leave the First Review
                    </Button>
                  </div>
                )}
              </GlassCard>

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
            </>
          )}
        </div>

        {/* Write a Review Modal */}
        {showReviewModal && agency && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
            onClick={() => setShowReviewModal(false)}
          >
            <div
              style={{
                background: 'var(--bg-elevated, #ffffff)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px solid var(--border)',
                padding: '28px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    Review {agency.name}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Share your authentic experience with this consultancy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {reviewError && (
                <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'var(--red-light, #fee2e2)', color: 'var(--red, #b91c1c)', fontSize: '13px', marginBottom: '16px' }}>
                  {reviewError}
                </div>
              )}
              {reviewSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'var(--emerald-light, #d1fae5)', color: 'var(--emerald-dark, #065f46)', fontSize: '13px', marginBottom: '16px' }}>
                  {reviewSuccess}
                </div>
              )}

              <form onSubmit={handleSubmitReview} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    Rating <span style={{ color: 'var(--red, #b91c1c)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '28px',
                          cursor: 'pointer',
                          padding: 0,
                          color: star <= reviewRating ? '#f59e0b' : 'var(--border, #d1d5db)',
                          transition: 'transform 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        ★
                      </button>
                    ))}
                    <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '8px' }}>
                      {reviewRating} of 5 stars
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    Headline / Title (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Excellent guidance for Canadian student visa"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    maxLength={120}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    Detailed Feedback <span style={{ color: 'var(--red, #b91c1c)' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your experience with visa guidance, communication, fees, and overall service..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    minLength={10}
                    maxLength={2000}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                    {reviewText.length} / 2000 (minimum 10 characters)
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowReviewModal(false)}
                    disabled={submittingReview}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submittingReview}
                    disabled={submittingReview || reviewText.trim().length < 10}
                  >
                    Submit Verified Review
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </RootTag>
    </>
  );
}
