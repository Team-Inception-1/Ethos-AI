/**
 * Ethos AI — Escrow State Machine & Poisha Currency Engine
 * Aligned with Module 5.7, ETHOS_AI_CONTEXT.md §6 & Issue #10 (K-10)
 *
 * Implements strict finite state transitions, transition invariants,
 * and 64-bit integer Poisha arithmetic to eliminate floating-point drift.
 * (1 BDT = 100 Poisha)
 */

export type MilestoneStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
export type LedgerEntryType = 'HOLD' | 'RELEASE' | 'REFUND' | 'DISPUTE_FREEZE';

/**
 * Finite State Transition Map
 * Maps each current status to allowable target statuses
 */
export const ALLOWED_TRANSITIONS: Record<MilestoneStatus, readonly MilestoneStatus[]> = {
  PENDING: ['HELD'],
  HELD: ['RELEASED', 'DISPUTED', 'REFUNDED'],
  DISPUTED: ['RELEASED', 'REFUNDED'],
  RELEASED: [], // Terminal state
  REFUNDED: [], // Terminal state
};

export class EscrowTransitionError extends Error {
  public currentStatus: MilestoneStatus;
  public targetStatus: MilestoneStatus;

  constructor(currentStatus: MilestoneStatus, targetStatus: MilestoneStatus, reason?: string) {
    const msg = reason || `Illegal escrow transition from '${currentStatus}' to '${targetStatus}'.`;
    super(msg);
    this.name = 'EscrowTransitionError';
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

/**
 * Validates whether a state transition is legal according to the Escrow invariant rules
 */
export function validateEscrowTransition(
  current: MilestoneStatus,
  target: MilestoneStatus,
  actorRole?: string
): { valid: boolean; reason?: string } {
  // Terminal state check
  if (current === 'RELEASED') {
    return {
      valid: false,
      reason: 'Milestone is already in terminal state RELEASED. Funds have been irrevocably settled.',
    };
  }
  if (current === 'REFUNDED') {
    return {
      valid: false,
      reason: 'Milestone is already in terminal state REFUNDED. Funds have been returned to the student.',
    };
  }

  // Same status no-op
  if (current === target) {
    return {
      valid: false,
      reason: `Milestone is already in status '${current}'.`,
    };
  }

  const allowed = ALLOWED_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    if (current === 'PENDING' && target === 'RELEASED') {
      return {
        valid: false,
        reason: 'Cannot release a PENDING milestone. Funds must first be deposited into escrow (status HELD).',
      };
    }
    if (current === 'PENDING' && target === 'REFUNDED') {
      return {
        valid: false,
        reason: 'Cannot refund a PENDING milestone since no funds were held.',
      };
    }
    if (current === 'DISPUTED' && target === 'HELD') {
      return {
        valid: false,
        reason: 'Disputed milestones must be resolved via RELEASE or REFUND, cannot be reverted to unreviewed HELD.',
      };
    }
    return {
      valid: false,
      reason: `Illegal transition from '${current}' to '${target}'. Allowed transitions: [${allowed.join(', ')}].`,
    };
  }

  // Authorization invariant checks
  if (target === 'RELEASED' && current === 'DISPUTED' && actorRole && actorRole !== 'ADMIN' && actorRole !== 'STUDENT') {
    return {
      valid: false,
      reason: 'Only the student or an admin can resolve a disputed milestone in favor of release.',
    };
  }

  return { valid: true };
}

/**
 * Maps a valid milestone transition to its corresponding ledger entry type
 */
export function getLedgerTypeForTransition(from: MilestoneStatus, to: MilestoneStatus): LedgerEntryType {
  if (from === 'PENDING' && to === 'HELD') return 'HOLD';
  if ((from === 'HELD' || from === 'DISPUTED') && to === 'RELEASED') return 'RELEASE';
  if ((from === 'HELD' || from === 'DISPUTED') && to === 'REFUNDED') return 'REFUND';
  if (from === 'HELD' && to === 'DISPUTED') return 'DISPUTE_FREEZE';
  throw new Error(`No ledger entry type defined for transition ${from} -> ${to}`);
}

// -----------------------------------------------------------------------------
// Poisha Integer Currency Utilities (1 BDT = 100 Poisha)
// -----------------------------------------------------------------------------

/**
 * Converts a BDT amount (number or string) to 64-bit integer Poisha (1 BDT = 100 Poisha)
 * Uses strict integer math to avoid 0.1 + 0.2 float imprecision.
 */
export function bdtToPoisha(bdt: number | string): bigint {
  const numStr = String(bdt).trim();
  if (!numStr || isNaN(Number(numStr))) {
    throw new Error(`Invalid BDT currency value: "${bdt}"`);
  }
  const parts = numStr.split('.');
  const wholePart = BigInt(parts[0] || '0');
  let fractionPart = parts[1] || '0';

  if (fractionPart.length > 2) {
    // Round to 2 decimals
    const roundingDigit = Number(fractionPart[2]);
    let twoDec = Number(fractionPart.slice(0, 2));
    if (roundingDigit >= 5) twoDec += 1;
    fractionPart = twoDec.toString().padStart(2, '0');
  } else {
    fractionPart = fractionPart.padEnd(2, '0');
  }

  const sign = wholePart < BigInt(0) ? BigInt(-1) : BigInt(1);
  const absWhole = wholePart < BigInt(0) ? -wholePart : wholePart;
  return sign * (absWhole * BigInt(100) + BigInt(fractionPart));
}

/**
 * Converts an integer Poisha value to a numeric BDT representation
 */
export function poishaToBdt(poisha: bigint | number | string): number {
  const p = BigInt(poisha);
  const sign = p < BigInt(0) ? -1 : 1;
  const absP = p < BigInt(0) ? -p : p;
  const whole = absP / BigInt(100);
  const frac = absP % BigInt(100);
  return sign * (Number(whole) + Number(frac) / 100);
}

/**
 * Formats Poisha into human-readable Bangladeshi Taka (e.g. "৳25,000")
 */
export function formatPoishaToBDT(poisha: bigint | number | string): string {
  try {
    const bdt = poishaToBdt(poisha);
    return '৳' + bdt.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    return '৳0';
  }
}

/**
 * Calculates a platform or escrow release fee in Poisha using integer math
 * Default 1.5% platform fee (150 basis points)
 */
export function calculatePlatformFee(
  amountPoisha: bigint | number | string,
  feeBasisPoints = BigInt(150) // 1.50%
): bigint {
  const p = BigInt(amountPoisha);
  if (p <= BigInt(0)) return BigInt(0);
  return (p * BigInt(feeBasisPoints)) / BigInt(10000);
}
