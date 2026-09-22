'use client';
import React, { useEffect, useState, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './PaymentsPage.module.css';
import {
  fetchEscrowMilestones,
  payMilestone,
  releaseMilestone,
  disputeMilestone,
  fetchLedgerAudit,
  fetchReceipt,
  MilestoneItem,
  MilestoneSummary,
  LedgerEntryItem,
  LedgerVerification,
  ReceiptItem,
} from '@/lib/escrowClient';

type PaymentProvider = 'SSLCOMMERZ' | 'BKASH' | 'NAGAD';
type ActiveModal = 'pay' | 'release' | 'dispute' | 'receipt' | 'ledger' | null;

const STATUS_BADGE_MAP: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'neutral'> = {
  RELEASED: 'success',
  HELD: 'info',
  DISPUTED: 'danger',
  REFUNDED: 'warning',
  PENDING: 'neutral',
};

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  SSLCOMMERZ: '💳 SSLCommerz (Cards / NetBanking)',
  BKASH: '📱 bKash Merchant Checkout',
  NAGAD: '📱 Nagad Digital Payment',
};

export default function PaymentsPage() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [summary, setSummary] = useState<MilestoneSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('SSLCOMMERZ');
  const [disputeReason, setDisputeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [ledgerData, setLedgerData] = useState<{
    entries: LedgerEntryItem[];
    auditVerification: LedgerVerification;
  } | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const loadMilestones = useCallback(async () => {
    setLoading(true);
    const data = await fetchEscrowMilestones('app-001');
    if (data) {
      setMilestones(data.milestones);
      setSummary(data.summary);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const openModal = (modal: ActiveModal, milestone?: MilestoneItem) => {
    setActionError(null);
    setActionSuccess(null);
    setDisputeReason('');
    setSelectedMilestone(milestone || null);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedMilestone(null);
    setActionError(null);
    setActionSuccess(null);
  };

  const handlePay = async () => {
    if (!selectedMilestone) return;
    setActionLoading(true);
    setActionError(null);
    const result = await payMilestone({
      milestoneId: selectedMilestone.id,
      provider: selectedProvider,
    });
    setActionLoading(false);
    if (result.success) {
      setActionSuccess(`✅ ${selectedMilestone.amountFormatted} successfully deposited into escrow via ${PROVIDER_LABELS[selectedProvider]}.`);
      await loadMilestones();
    } else {
      setActionError(result.error || 'Payment failed. Please try again.');
    }
  };

  const handleRelease = async () => {
    if (!selectedMilestone) return;
    setActionLoading(true);
    setActionError(null);
    const result = await releaseMilestone({
      milestoneId: selectedMilestone.id,
      actorId: 'usr-student-01',
      actorRole: 'STUDENT',
      note: `Student authorized release: ${selectedMilestone.releaseCondition}`,
    });
    setActionLoading(false);
    if (result.success) {
      setActionSuccess(`✅ Funds released to consultancy. Receipt generated: ${result.receipt?.receiptNumber || 'N/A'}`);
      await loadMilestones();
    } else {
      setActionError(result.error || 'Release failed.');
    }
  };

  const handleDispute = async () => {
    if (!selectedMilestone) return;
    if (!disputeReason.trim()) {
      setActionError('Please provide a reason for the dispute.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    const result = await disputeMilestone({
      milestoneId: selectedMilestone.id,
      actorId: 'usr-student-01',
      actorRole: 'STUDENT',
      reason: disputeReason,
    });
    setActionLoading(false);
    if (result.success) {
      setActionSuccess(`🔒 Escrow frozen. Dispute filed. An Ethos AI admin will review within 48 hours.`);
      await loadMilestones();
    } else {
      setActionError(result.error || 'Failed to file dispute.');
    }
  };

  const handleOpenLedger = async () => {
    setActiveModal('ledger');
    const data = await fetchLedgerAudit();
    if (data) setLedgerData(data);
  };

  const handleOpenReceipt = async (receiptId: string) => {
    setActiveModal('receipt');
    const data = await fetchReceipt(receiptId);
    if (data) setReceiptData(data);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Payments &amp; Escrow</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Tamper-proof milestone escrow — funds held by Ethos AI until conditions are verified.
          </p>
        </div>
        {summary && (
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{summary.heldFormatted}</span>
              <span className={styles.summaryLabel}>Held in Escrow</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal} style={{ color: 'var(--emerald)' }}>
                {summary.releasedFormatted}
              </span>
              <span className={styles.summaryLabel}>Released</span>
            </div>
            {summary.disputedPoisha !== '0' && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal} style={{ color: 'var(--red)' }}>
                  {summary.disputedFormatted}
                </span>
                <span className={styles.summaryLabel}>Disputed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Milestone Table */}
      <GlassCard padding="none" className={styles.tableCard}>
        <table className={styles.table} aria-label="Escrow milestone ledger">
          <thead>
            <tr>
              <th scope="col">Milestone</th>
              <th scope="col">Amount</th>
              <th scope="col">Release Condition</th>
              <th scope="col">Status</th>
              <th scope="col">Entries</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  Loading escrow data…
                </td>
              </tr>
            ) : milestones.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  No milestones found.
                </td>
              </tr>
            ) : (
              milestones.map((m) => (
                <tr key={m.id}>
                  <td className={styles.milestoneName}>{m.name}</td>
                  <td className={styles.amount}>{m.amountFormatted}</td>
                  <td className={styles.ref}>{m.releaseCondition}</td>
                  <td>
                    <Badge variant={STATUS_BADGE_MAP[m.status] || 'neutral'} size="sm">
                      {m.status}
                    </Badge>
                  </td>
                  <td className={styles.date}>{m.ledgerCount} entries</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.status === 'PENDING' && (
                      <Button size="sm" variant="emerald" onClick={() => openModal('pay', m)}>
                        Pay Now
                      </Button>
                    )}
                    {m.status === 'HELD' && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => openModal('release', m)}>
                          Release
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => openModal('dispute', m)}>
                          Dispute
                        </Button>
                      </>
                    )}
                    {m.status === 'RELEASED' && m.receipt && (
                      <Button size="sm" variant="ghost" onClick={() => handleOpenReceipt(m.receipt!.id)}>
                        Receipt
                      </Button>
                    )}
                    {m.status === 'DISPUTED' && (
                      <Badge variant="danger" size="sm">Under Review</Badge>
                    )}
                    {m.status === 'REFUNDED' && (
                      <Badge variant="warning" size="sm">Refunded</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* Ledger Audit Button */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button variant="ghost" size="sm" onClick={handleOpenLedger}>
          🔐 View Immutable Ledger &amp; Chain Verification
        </Button>
      </div>

      {/* ── Pay Modal ── */}
      {activeModal === 'pay' && selectedMilestone && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginBottom: 8 }}>💳 Deposit into Escrow</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              <strong>{selectedMilestone.name}</strong> — {selectedMilestone.amountFormatted}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Select payment gateway:</p>
            {(['SSLCOMMERZ', 'BKASH', 'NAGAD'] as PaymentProvider[]).map((p) => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                <input type="radio" name="gateway" value={p} checked={selectedProvider === p} onChange={() => setSelectedProvider(p)} />
                <span style={{ fontSize: 14 }}>{PROVIDER_LABELS[p]}</span>
              </label>
            ))}
            {actionError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{actionError}</p>}
            {actionSuccess && <p style={{ color: 'var(--emerald)', fontSize: 12, marginTop: 8 }}>{actionSuccess}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {!actionSuccess && (
                <Button variant="emerald" loading={actionLoading} onClick={handlePay}>
                  Confirm Payment
                </Button>
              )}
              <Button variant="ghost" onClick={closeModal}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Release Modal ── */}
      {activeModal === 'release' && selectedMilestone && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginBottom: 8 }}>✅ Release Funds to Consultancy</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
              Release <strong>{selectedMilestone.amountFormatted}</strong> for milestone:{' '}
              <strong>{selectedMilestone.name}</strong>
            </p>
            <p style={{ fontSize: 12, background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12 }}>
              Release Condition: {selectedMilestone.releaseCondition}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ⚠️ This action is irreversible. A digital receipt will be generated.
            </p>
            {actionError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{actionError}</p>}
            {actionSuccess && <p style={{ color: 'var(--emerald)', fontSize: 12, marginTop: 8 }}>{actionSuccess}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {!actionSuccess && (
                <Button variant="primary" loading={actionLoading} onClick={handleRelease}>
                  Confirm Release
                </Button>
              )}
              <Button variant="ghost" onClick={closeModal}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dispute Modal ── */}
      {activeModal === 'dispute' && selectedMilestone && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginBottom: 8 }}>🔒 File Escrow Dispute</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
              Freeze <strong>{selectedMilestone.amountFormatted}</strong> — <strong>{selectedMilestone.name}</strong>
            </p>
            <textarea
              placeholder="Describe the reason for the dispute (e.g. 'Offer letter is forged, verified by AI scanner')…"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13,
                background: 'var(--bg-elevated)', border: '2px solid var(--border)', borderRadius: 6,
                color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            {actionError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{actionError}</p>}
            {actionSuccess && <p style={{ color: 'var(--emerald)', fontSize: 12, marginTop: 8 }}>{actionSuccess}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {!actionSuccess && (
                <Button variant="danger" loading={actionLoading} onClick={handleDispute}>
                  File Dispute
                </Button>
              )}
              <Button variant="ghost" onClick={closeModal}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ledger Audit Modal ── */}
      {activeModal === 'ledger' && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: 700, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 4 }}>🔐 Immutable Ledger &amp; Chain Verification</h3>
            {ledgerData ? (
              <>
                <div style={{
                  background: ledgerData.auditVerification.isValid ? 'rgba(0,200,100,0.1)' : 'rgba(220,0,0,0.1)',
                  border: `2px solid ${ledgerData.auditVerification.isValid ? 'var(--emerald)' : 'var(--red)'}`,
                  borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13,
                }}>
                  {ledgerData.auditVerification.isValid ? '✅' : '❌'}{' '}
                  <strong>{ledgerData.auditVerification.isValid ? 'Chain Intact' : 'Tamper Detected'}</strong>{' '}
                  — {ledgerData.auditVerification.verifiedEntries}/{ledgerData.auditVerification.totalEntries} entries verified
                  {ledgerData.auditVerification.details && (
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 11 }}>
                      {ledgerData.auditVerification.details}
                    </p>
                  )}
                </div>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>#</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>Amount</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>Provider</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>TX Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.entries.map((e, i) => (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <Badge size="sm" variant={e.type === 'HOLD' ? 'info' : e.type === 'RELEASE' ? 'success' : e.type === 'DISPUTE_FREEZE' ? 'danger' : 'warning'}>
                            {e.type}
                          </Badge>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{e.amountFormatted}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{e.provider}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)' }}>
                          {e.txHashShort}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading ledger…</p>
            )}
            <div style={{ marginTop: 16 }}>
              <Button variant="ghost" onClick={closeModal}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {activeModal === 'receipt' && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginBottom: 8 }}>🧾 Digital Receipt</h3>
            {receiptData ? (
              <>
                <div style={{
                  background: 'var(--bg-elevated)', border: '2px solid var(--border)',
                  borderRadius: 8, padding: 16, fontSize: 13, marginBottom: 12,
                }}>
                  <p style={{ marginBottom: 6 }}><strong>Receipt #</strong> {receiptData.receipt.receiptNumber}</p>
                  <p style={{ marginBottom: 6 }}><strong>Amount</strong> {receiptData.receipt.amountFormatted}</p>
                  <p style={{ marginBottom: 6 }}><strong>Currency</strong> {receiptData.receipt.currency}</p>
                  <p style={{ marginBottom: 6 }}><strong>Milestone</strong> {receiptData.milestone?.name || '—'}</p>
                  <p style={{ marginBottom: 6 }}><strong>Student</strong> {receiptData.parties?.student?.name || '—'}</p>
                  <p style={{ marginBottom: 6 }}><strong>Agency</strong> {receiptData.parties?.agency?.name || '—'}</p>
                  <p style={{ marginBottom: 6 }}><strong>Generated</strong> {new Date(receiptData.receipt.generatedAt).toLocaleString()}</p>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
                  <p style={{ marginBottom: 4 }}><strong>Verification Stamp</strong></p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Issuer: {receiptData.verificationStamp?.issuer}
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all', color: 'var(--text-muted)' }}>
                    TX Hash: {receiptData.verificationStamp?.hash}
                  </p>
                  <Badge variant="success" size="sm" style={{ marginTop: 8 }}>
                    ✅ Tamper-Proof
                  </Badge>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Loading receipt…</p>
            )}
            <Button variant="ghost" onClick={closeModal}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
};
const modalBox: React.CSSProperties = {
  background: 'var(--bg-card)', border: '3px solid var(--border)', borderRadius: 12,
  padding: 28, width: '100%', maxWidth: 480, boxShadow: '6px 6px 0 var(--border)',
};
