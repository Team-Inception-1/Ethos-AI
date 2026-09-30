'use client';
import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './PaymentsPage.module.css';

interface MilestoneItem {
  id: string;
  applicationId: string;
  name: string;
  orderIndex: number;
  amountPoisha: string;
  releaseCondition: string;
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  targetUniversity?: string;
  agencyName?: string;
  ledgerCount?: number;
}

interface LedgerItem {
  id: string;
  milestoneId: string;
  type: 'HOLD' | 'RELEASE' | 'REFUND' | 'DISPUTE_FREEZE';
  amountPoisha: string;
  provider: string;
  providerTxnId: string;
  txHash: string;
  actorId: string;
  note: string;
  timestamp: string;
}

interface ReceiptItem {
  id: string;
  ledgerEntryId: string;
  receiptNumber: string;
  amountPoisha: string;
  currency: string;
  pdfStorageKey: string;
  generatedAt: string;
}

const statusVariant = (s: string) => {
  const norm = s.toLowerCase();
  if (norm === 'released') return 'success';
  if (norm === 'held') return 'info';
  if (norm === 'disputed') return 'danger';
  return 'neutral';
};

export default function PaymentsPage() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [summary, setSummary] = useState({ held: 0, released: 0, pending: 0 });
  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [activeTab, setActiveTab] = useState<'milestones' | 'ledger'>('milestones');
  const [loading, setLoading] = useState(true);

  // Modals
  const [payModalItem, setPayModalItem] = useState<MilestoneItem | null>(null);
  const [payProvider, setPayProvider] = useState<'BKASH' | 'NAGAD' | 'SSLCOMMERZ'>('BKASH');
  const [isProcessing, setIsProcessing] = useState(false);

  const [releaseModalItem, setReleaseModalItem] = useState<MilestoneItem | null>(null);
  const [releaseNote, setReleaseNote] = useState('');

  const [disputeModalItem, setDisputeModalItem] = useState<MilestoneItem | null>(null);
  const [disputeReason, setDisputeReason] = useState('Agency demanded unverified extra processing fees');

  const [activeReceipt, setActiveReceipt] = useState<{ receipt: ReceiptItem; milestone?: MilestoneItem; ledger?: LedgerItem } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchEscrow = async () => {
    try {
      const res = await fetch('/api/payments/escrow');
      if (res.ok) {
        const data = await res.json();
        setMilestones(data.milestones || []);
        setSummary({ held: Number(data.summary?.heldPoisha ?? 0) / 100,
          released: Number(data.summary?.releasedPoisha ?? 0) / 100, pending: Number(data.summary?.pendingPoisha ?? 0) / 100 });
        setLedgerEntries(data.ledgerEntries || []);
        setReceipts(data.receipts || []);
        setLoadError(null);
      } else setLoadError('Could not load payment records. Please sign in and retry.');
    } catch {
      setLoadError('Could not reach the payment service. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { void fetchEscrow(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDeposit = async () => {
    if (!payModalItem) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments/escrow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deposit',
          milestoneId: payModalItem.id,
          provider: payProvider,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Sandbox payment initiated. No money has been moved; the milestone remains pending until confirmation.');
        setPayModalItem(null);
        await fetchEscrow();
      } else showToast(data.error?.message ?? 'Payment initiation failed.');
    } catch {
      alert('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    if (!releaseModalItem) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments/escrow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'release',
          milestoneId: releaseModalItem.id,
          note: releaseNote || 'Milestone verified and authorized for release',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Sandbox release recorded. Receipt ${data.receipt?.receiptNumber ?? ''}. No real money was transferred.`);
        setReleaseModalItem(null);
        await fetchEscrow();
        if (data.receipt) {
          setActiveReceipt({
            receipt: data.receipt,
            milestone: releaseModalItem,
            ledger: data.ledgerEntry,
          });
        }
      } else showToast(data.error?.message ?? 'Release failed.');
    } catch {
      alert('Release action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeModalItem) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments/escrow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispute',
          milestoneId: disputeModalItem.id,
          reason: disputeReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Milestone marked disputed and frozen pending review.');
        setDisputeModalItem(null);
        await fetchEscrow();
      } else showToast(data.error?.message ?? 'Dispute failed.');
    } catch {
      alert('Dispute action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const openReceiptForMilestone = (m: MilestoneItem) => {
    const ledger = ledgerEntries.find((l) => l.milestoneId === m.id && l.type === 'RELEASE');
    const receipt = receipts.find((r) => r.ledgerEntryId === ledger?.id);
    if (!receipt) { showToast('No recorded receipt is available for this milestone.'); return; }
    setActiveReceipt({ receipt, milestone: m, ledger });
  };

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  return (
    <div className={styles.page}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: 'var(--emerald)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '3px 3px 0 0 var(--ink)',
            fontWeight: 700,
            fontSize: '13px',
            zIndex: 10000,
            border: '2px solid var(--ink)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header & Stats */}
      <div className={styles.header}>
        <div>
          <h1>Milestone Payments & Escrow</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Review milestone records. Live payments are unavailable; enabled sandbox transactions do not move real money.
          </p>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryVal} style={{ color: 'var(--blue-primary)' }}>
              ৳{summary.held.toLocaleString()}
            </span>
            <span className={styles.summaryLabel}>Held in Escrow</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryVal} style={{ color: 'var(--emerald)' }}>
              ৳{summary.released.toLocaleString()}
            </span>
            <span className={styles.summaryLabel}>Released to Agencies</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryVal} style={{ color: 'var(--amber)' }}>
              ৳{summary.pending.toLocaleString()}
            </span>
            <span className={styles.summaryLabel}>Pending Deposit</span>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className={styles.tabBar} role="tablist" aria-label="Escrow views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'milestones'}
          onClick={() => setActiveTab('milestones')}
          className={`${styles.modeTab} ${activeTab === 'milestones' ? styles.modeTabActive : ''}`}
        >
          Active Milestones ({milestones.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ledger'}
          onClick={() => setActiveTab('ledger')}
          className={`${styles.modeTab} ${activeTab === 'ledger' ? styles.modeTabActive : ''}`}
        >
          Ledger Records ({ledgerEntries.length})
        </button>
      </div>

      {/* Main Content */}
      {loadError ? <p role="alert">{loadError} <button onClick={() => void fetchEscrow()}>Retry</button></p> : loading ? (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
          Loading escrow status…
        </div>
      ) : activeTab === 'milestones' ? (
        <GlassCard padding="none" className={styles.tableCard}>
          <table className={styles.table} aria-label="Payment ledger">
            <thead>
              <tr>
                <th scope="col">Milestone & Condition</th>
                <th scope="col">Application</th>
                <th scope="col">Amount</th>
                <th scope="col">Escrow Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const amountBDT = Number(m.amountPoisha) / 100;
                return (
                  <tr key={m.id}>
                    <td>
                      <div className={styles.milestoneName}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Release Criterion: {m.releaseCondition}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{m.targetUniversity || 'Application'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.agencyName || ''}</div>
                    </td>
                    <td className={styles.amount}>৳{amountBDT.toLocaleString()}</td>
                    <td>
                      <Badge variant={statusVariant(m.status)} size="sm">
                        {m.status === 'HELD' ? '🔒 HELD IN ESCROW' : m.status}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {m.status === 'PENDING' && (
                          <Button size="sm" variant="emerald" glow onClick={() => setPayModalItem(m)}>
                            Initiate Payment
                          </Button>
                        )}
                        {m.status === 'HELD' && (
                          <>
                            <Button size="sm" variant="emerald" onClick={() => setReleaseModalItem(m)}>
                              Release Payment
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setDisputeModalItem(m)}>
                              Dispute
                            </Button>
                          </>
                        )}
                        {m.status === 'RELEASED' && (
                          <Button size="sm" variant="ghost" onClick={() => openReceiptForMilestone(m)}>
                            📄 View Receipt
                          </Button>
                        )}
                        {m.status === 'DISPUTED' && (
                          <span style={{ fontSize: '12px', color: 'var(--rose)', fontWeight: 700 }}>
                            Under Arbitration
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        /* Immutable Ledger View */
        <GlassCard padding="none" className={styles.tableCard}>
          <table className={styles.table} aria-label="Cryptographic ledger entries">
            <thead>
              <tr>
                <th scope="col">Entry ID</th>
                <th scope="col">Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Provider & Txn</th>
                <th scope="col">Cryptographic SHA-256 Hash</th>
                <th scope="col">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{l.id}</td>
                  <td>
                    <Badge variant={l.type === 'RELEASE' ? 'success' : l.type === 'HOLD' ? 'info' : 'danger'} size="sm">
                      {l.type}
                    </Badge>
                  </td>
                  <td className={styles.amount}>৳{(Number(l.amountPoisha) / 100).toLocaleString()}</td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>{l.provider}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.providerTxnId}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--blue-primary)', wordBreak: 'break-all', maxWidth: '200px' }}>
                    {l.txHash}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(l.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Pay into Escrow Modal */}
      {payModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setPayModalItem(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2.5px solid var(--ink)',
              boxShadow: '6px 6px 0 0 var(--ink)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Initiate Sandbox Payment</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Sandbox payments simulate a deposit without moving real money. This action only starts a pending payment.
            </p>

            <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Milestone</div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{payModalItem.name}</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--blue-primary)', marginTop: '4px' }}>
                ৳{(Number(payModalItem.amountPoisha) / 100).toLocaleString()} BDT
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Select Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {(['BKASH', 'NAGAD', 'SSLCOMMERZ'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPayProvider(p)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: payProvider === p ? '2px solid var(--blue-primary)' : '1.5px solid var(--border)',
                      background: payProvider === p ? 'rgba(79, 142, 247, 0.1)' : 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {p === 'BKASH' ? 'bKash 📱' : p === 'NAGAD' ? 'Nagad ⚡' : 'SSLCommerz 💳'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button size="sm" variant="outline" onClick={() => setPayModalItem(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button size="sm" variant="emerald" glow onClick={handleDeposit} disabled={isProcessing}>
                {isProcessing ? 'Initiating…' : 'Initiate Sandbox Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Release Confirmation Modal */}
      {releaseModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setReleaseModalItem(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2.5px solid var(--ink)',
              boxShadow: '6px 6px 0 0 var(--ink)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>✓ Authorize Escrow Release</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              By releasing this milestone, you confirm that the agency has successfully verified the condition:
            </p>

            <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800 }}>{releaseModalItem.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--emerald)', fontWeight: 700, marginTop: '2px' }}>
                ✓ Condition: {releaseModalItem.releaseCondition}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, marginTop: '6px' }}>
                Release Amount: ৳{(Number(releaseModalItem.amountPoisha) / 100).toLocaleString()} BDT
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Approval Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verified official offer letter received"
                value={releaseNote}
                onChange={(e) => setReleaseNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button size="sm" variant="outline" onClick={() => setReleaseModalItem(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button size="sm" variant="emerald" glow onClick={handleRelease} disabled={isProcessing}>
                {isProcessing ? 'Releasing Funds…' : 'Confirm & Release Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setDisputeModalItem(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2.5px solid var(--ink)',
              boxShadow: '6px 6px 0 0 var(--ink)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px' }}>
              ⚠️ Freeze Milestone in Escrow
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              This will freeze the ৳{(Number(disputeModalItem.amountPoisha) / 100).toLocaleString()} BDT held in escrow. Neither party can withdraw funds until the Ethos AI dispute resolution panel completes its audit.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Reason for Dispute
              </label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              >
                <option value="Agency demanded unverified extra processing fees">
                  Agency demanded unverified extra processing fees
                </option>
                <option value="Document fraud suspected on university letter">
                  Document fraud suspected on university letter
                </option>
                <option value="Agency failed to meet application portal deadline">
                  Agency failed to meet application portal deadline
                </option>
                <option value="Visa rejected and refund not processed per contract">
                  Visa rejected and refund not processed per contract
                </option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button size="sm" variant="outline" onClick={() => setDisputeModalItem(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleDispute} disabled={isProcessing}>
                {isProcessing ? 'Freezing Funds…' : 'Freeze in Escrow'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {activeReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setActiveReceipt(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2.5px solid var(--ink)',
              boxShadow: '6px 6px 0 0 var(--ink)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Ethos AI Digital Receipt</h3>
                <span style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 700 }}>Recorded ledger receipt</span>
              </div>
              <Badge variant="neutral">{activeReceipt.receipt.receiptNumber.startsWith('ETHOS-SANDBOX-') ? 'SANDBOX RECEIPT' : 'RECEIPT'}</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div><strong>Receipt Number:</strong> <code>{activeReceipt.receipt.receiptNumber}</code></div>
              <div><strong>Milestone Name:</strong> {activeReceipt.milestone?.name || 'Milestone Verification'}</div>
              <div><strong>Amount Paid:</strong> ৳{(Number(activeReceipt.receipt.amountPoisha) / 100).toLocaleString()} {activeReceipt.receipt.currency}</div>
              <div><strong>Date & Time:</strong> {formatDate(activeReceipt.receipt.generatedAt)}</div>
              <div><strong>Ledger Tx Hash:</strong> <code style={{ fontSize: '11px', color: 'var(--blue-primary)', wordBreak: 'break-all' }}>{activeReceipt.ledger?.txHash || 'Unavailable'}</code></div>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Sandbox receipts document simulated activity and are not proof of a bank transfer.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <Button size="sm" variant="outline" onClick={() => setActiveReceipt(null)}>
                Close
              </Button>
              <Button size="sm" variant="emerald" onClick={() => window.print()}>
                Print / Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
