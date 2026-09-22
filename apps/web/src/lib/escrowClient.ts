/**
 * Ethos AI — Escrow API Client
 * Aligned with Module 5.7 & Issue #10 (K-10)
 *
 * Provides typed, error-handled methods for all escrow operations.
 * Consumed by PaymentsPage and other frontend components.
 */

export interface MilestoneSummary {
  heldPoisha: string;
  heldFormatted: string;
  releasedPoisha: string;
  releasedFormatted: string;
  pendingPoisha: string;
  pendingFormatted: string;
  disputedPoisha: string;
  disputedFormatted: string;
  refundedPoisha: string;
  refundedFormatted: string;
}

export interface MilestoneItem {
  id: string;
  applicationId: string;
  name: string;
  orderIndex: number;
  amountPoisha: string;
  amountBdt: number;
  amountFormatted: string;
  releaseCondition: string;
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  dueDate?: string | null;
  ledgerCount: number;
  receipt: ReceiptItem | null;
}

export interface LedgerEntryItem {
  id: string;
  milestoneId: string;
  type: 'HOLD' | 'RELEASE' | 'REFUND' | 'DISPUTE_FREEZE';
  amountPoisha: string;
  amountFormatted: string;
  provider: string;
  providerTxnId: string;
  txHash: string;
  txHashShort: string;
  actorId: string;
  note: string;
  timestamp: string;
}

export interface ReceiptItem {
  id: string;
  ledgerEntryId: string;
  receiptNumber: string;
  amountPoisha: string;
  amountBdt?: number;
  amountFormatted?: string;
  currency: string;
  pdfStorageKey?: string;
  generatedAt: string;
}

export interface LedgerVerification {
  isValid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  tamperedIndex?: number;
  details?: string;
}

// -------------------------------------------------------------------------------

/** Fetch milestones for a given application with summary totals */
export async function fetchEscrowMilestones(applicationId?: string): Promise<{
  summary: MilestoneSummary;
  milestones: MilestoneItem[];
} | null> {
  try {
    const url = applicationId
      ? `/api/escrow/milestones?applicationId=${encodeURIComponent(applicationId)}`
      : '/api/escrow/milestones';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch escrow milestones:', err);
    return null;
  }
}

/** Initiate a payment (hold funds into escrow) for a PENDING milestone */
export async function payMilestone(params: {
  milestoneId: string;
  provider?: 'SSLCOMMERZ' | 'BKASH' | 'NAGAD';
  studentId?: string;
  note?: string;
}): Promise<{ success: boolean; status: string; milestone?: MilestoneItem; ledgerEntry?: LedgerEntryItem; error?: string }> {
  try {
    const res = await fetch('/api/escrow/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, simulateInstantHold: true }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, status: 'ERROR', error: data.error || 'Payment failed' };
    return data;
  } catch (err: any) {
    return { success: false, status: 'ERROR', error: err?.message || 'Network error' };
  }
}

/** Release a HELD milestone — sends funds to the consultancy agency */
export async function releaseMilestone(params: {
  milestoneId: string;
  actorId?: string;
  actorRole?: string;
  note?: string;
}): Promise<{ success: boolean; status: string; milestone?: MilestoneItem; receipt?: ReceiptItem; error?: string }> {
  try {
    const res = await fetch('/api/escrow/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, status: 'ERROR', error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, status: 'ERROR', error: err?.message || 'Network error' };
  }
}

/** Freeze a HELD milestone — raises a dispute */
export async function disputeMilestone(params: {
  milestoneId: string;
  actorId?: string;
  actorRole?: string;
  reason: string;
}): Promise<{ success: boolean; status: string; milestone?: MilestoneItem; error?: string }> {
  try {
    const res = await fetch('/api/escrow/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, status: 'ERROR', error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, status: 'ERROR', error: err?.message || 'Network error' };
  }
}

/** Refund a HELD or DISPUTED milestone back to the student */
export async function refundMilestone(params: {
  milestoneId: string;
  actorId?: string;
  actorRole?: string;
  reason?: string;
}): Promise<{ success: boolean; status: string; milestone?: MilestoneItem; error?: string }> {
  try {
    const res = await fetch('/api/escrow/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, status: 'ERROR', error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, status: 'ERROR', error: err?.message || 'Network error' };
  }
}

/** Fetch the full append-only ledger with cryptographic chain verification */
export async function fetchLedgerAudit(milestoneId?: string): Promise<{
  ledgerCount: number;
  auditVerification: LedgerVerification;
  entries: LedgerEntryItem[];
} | null> {
  try {
    const url = milestoneId
      ? `/api/escrow/ledger?milestoneId=${encodeURIComponent(milestoneId)}`
      : '/api/escrow/ledger';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch ledger audit:', err);
    return null;
  }
}

/** Fetch a specific digital receipt by ID or receipt number */
export async function fetchReceipt(receiptId: string): Promise<{
  receipt: ReceiptItem;
  milestone: { id: string; name: string; condition: string } | null;
  parties: {
    student: { id: string; name: string; email: string; phone: string } | null;
    agency: { id: string; name: string; licenseNo: string } | null;
  };
  verificationStamp: {
    isTamperProof: boolean;
    hash: string;
    verifiedAt: string;
    issuer: string;
  };
} | null> {
  try {
    const res = await fetch(`/api/escrow/receipts/${encodeURIComponent(receiptId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch receipt ${receiptId}:`, err);
    return null;
  }
}
