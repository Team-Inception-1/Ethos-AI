import { createHash, randomUUID } from 'node:crypto';
import { Prisma, type MilestoneStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { AuthenticatedUser } from '@/lib/auth/authorization';
import { getLedgerTypeForTransition, validateEscrowTransition } from '@/lib/escrowStateMachine';
import { PaymentError } from './errors';
import { requireSandbox, type Gateway, type SandboxCallback } from './sandbox';

type Actor = Pick<AuthenticatedUser, 'id' | 'role'>;

async function ownedMilestone(tx: Prisma.TransactionClient, id: string, actor: Actor, admin = false) {
  if (actor.role !== 'STUDENT' && !(admin && actor.role === 'ADMIN')) {
    throw new PaymentError('FORBIDDEN', 'You are not authorized to perform this action.', 403);
  }
  const milestone = await tx.milestone.findFirst({ where: {
    id, ...(admin && actor.role === 'ADMIN' ? {} : { application: { studentId: actor.id } }),
  }, include: { application: { select: { studentId: true } } } });
  if (!milestone) throw new PaymentError('FORBIDDEN', 'You are not authorized to perform this action.', 403);
  return milestone;
}

export async function initiatePayment(milestoneId: string, gateway: Gateway, actor: Actor) {
  requireSandbox();
  return prisma.$transaction(async tx => {
    await ownedMilestone(tx, milestoneId, actor);
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${milestoneId} FOR UPDATE`;
    const milestone = await ownedMilestone(tx, milestoneId, actor);
    if (milestone.status !== 'PENDING' || milestone.amountPoisha <= BigInt(0)) {
      throw new PaymentError('INVALID_PAYMENT_STATE', 'Only a pending milestone with a positive amount can be paid.');
    }
    // The row lock serializes retries without discarding failed/expired history.
    const existing = await tx.paymentAttempt.findFirst({ where: {
      milestoneId, status: 'INITIATED', expiresAt: { gt: new Date() },
    }, orderBy: { createdAt: 'desc' } });
    const attempt = existing ?? await tx.paymentAttempt.create({ data: {
        milestoneId, provider: `SANDBOX_${gateway}`, providerTxnId: randomUUID(),
        amountPoisha: milestone.amountPoisha, currency: 'BDT',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    } });
    if (attempt.status !== 'INITIATED' || attempt.expiresAt <= new Date() ||
        attempt.provider !== `SANDBOX_${gateway}` || attempt.amountPoisha !== milestone.amountPoisha || attempt.currency !== 'BDT') {
      throw new PaymentError('PAYMENT_ATTEMPT_CONFLICT', 'This milestone already has a different or closed payment attempt.');
    }
    return { success: true, status: 'INITIATED', mode: 'sandbox', payment: {
      provider: gateway, providerTxnId: attempt.providerTxnId, milestoneId,
      amountPoisha: attempt.amountPoisha, currency: attempt.currency, expiresAt: attempt.expiresAt,
    } };
  });
}

async function recordTransition(tx: Prisma.TransactionClient, milestone: {
  id: string; status: MilestoneStatus; amountPoisha: bigint;
}, target: MilestoneStatus, actorId: string, provider: string, providerTxnId: string, note?: string) {
  const validation = validateEscrowTransition(milestone.status, target);
  if (!validation.valid) throw new PaymentError('INVALID_ESCROW_TRANSITION', validation.reason!);
  // A competing release/refund/callback can read the same old state, but exactly
  // one can win this conditional update. All accompanying writes roll back on loss.
  const changed = await tx.milestone.updateMany({ where: {
    id: milestone.id, status: milestone.status, amountPoisha: milestone.amountPoisha,
  }, data: { status: target } });
  if (changed.count !== 1) throw new PaymentError('ESCROW_CONFLICT', 'The escrow state changed. Refresh and retry.');
  const id = randomUUID();
  const timestamp = new Date();
  const type = getLedgerTypeForTransition(milestone.status, target);
  const txHash = createHash('sha256').update(JSON.stringify({ id, milestoneId: milestone.id, type,
    amountPoisha: milestone.amountPoisha.toString(), provider, providerTxnId, actorId, note: note ?? null,
    timestamp: timestamp.toISOString(),
  })).digest('hex');
  const ledgerEntry = await tx.ledgerEntry.create({ data: {
    id, milestoneId: milestone.id, type, amountPoisha: milestone.amountPoisha,
    provider, providerTxnId, actorId, note, timestamp, txHash,
  } });
  const receipt = target === 'DISPUTED' ? null : await tx.receipt.create({ data: {
    ledgerEntryId: id, receiptNumber: `ETHOS-SANDBOX-${id}`, amountPoisha: milestone.amountPoisha, currency: 'BDT',
  } });
  return { milestone: { ...milestone, status: target }, ledgerEntry, receipt };
}

export async function reconcilePayment(callback: SandboxCallback) {
  requireSandbox();
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${callback.milestoneId} FOR UPDATE`;
    const attempt = await tx.paymentAttempt.findUnique({ where: { providerTxnId: callback.providerTxnId } });
    if (!attempt || attempt.milestoneId !== callback.milestoneId ||
        attempt.provider !== `SANDBOX_${callback.provider}` || attempt.amountPoisha !== BigInt(callback.amountPoisha) ||
        attempt.currency !== callback.currency) {
      throw new PaymentError('PAYMENT_MISMATCH', 'The callback does not match an initiated payment.');
    }
    if (attempt.status === callback.status) return { success: true, duplicate: true, status: attempt.status };
    if (attempt.status !== 'INITIATED' || attempt.expiresAt <= new Date()) {
      throw new PaymentError('PAYMENT_CLOSED', 'The payment attempt is closed or expired.');
    }
    const changed = await tx.paymentAttempt.updateMany({ where: { id: attempt.id, status: 'INITIATED' },
      data: { status: callback.status } });
    if (changed.count !== 1) {
      const latest = await tx.paymentAttempt.findUnique({ where: { id: attempt.id } });
      if (latest?.status === callback.status) return { success: true, duplicate: true, status: latest.status };
      throw new PaymentError('PAYMENT_CONFLICT', 'The payment has already been reconciled.');
    }
    if (callback.status !== 'VALID') return { success: true, status: callback.status };
    const milestone = await tx.milestone.findUnique({ where: { id: attempt.milestoneId },
      include: { application: { select: { studentId: true } } } });
    if (!milestone || milestone.status !== 'PENDING' || milestone.amountPoisha !== attempt.amountPoisha) {
      throw new PaymentError('PAYMENT_MISMATCH', 'The milestone no longer matches this payment.');
    }
    const result = await recordTransition(tx, milestone, 'HELD', milestone.application.studentId,
      attempt.provider, attempt.providerTxnId, 'Verified sandbox payment callback');
    return { success: true, status: 'HELD', mode: 'sandbox', ...result };
  });
}

export async function transitionEscrow(milestoneId: string, target: 'RELEASED' | 'REFUNDED' | 'DISPUTED', actor: Actor, note?: string, disputeOnly = false) {
  if (target === 'REFUNDED' && actor.role !== 'ADMIN') throw new PaymentError('FORBIDDEN', 'Only an admin can approve refunds.', 403);
  if (target !== 'DISPUTED') requireSandbox();
  return prisma.$transaction(async tx => {
    const milestone = await ownedMilestone(tx, milestoneId, actor, target !== 'DISPUTED');
    if (disputeOnly && milestone.status !== 'DISPUTED') throw new PaymentError('INVALID_ESCROW_TRANSITION', 'Only a disputed milestone can be resolved.');
    let provider = 'ESCROW_VAULT';
    let providerTxnId: string = randomUUID();
    if (target !== 'DISPUTED') {
      const attempt = await tx.paymentAttempt.findFirst({ where: { milestoneId, status: 'VALID' }, orderBy: { createdAt: 'desc' } });
      if (!attempt || attempt.status !== 'VALID' || !/^SANDBOX_(SSLCOMMERZ|BKASH|NAGAD)$/.test(attempt.provider) ||
          attempt.amountPoisha !== milestone.amountPoisha || attempt.currency !== 'BDT') {
        throw new PaymentError('SETTLEMENT_DISABLED', 'Verified sandbox funding is required. Live settlement is not configured.', 503);
      }
      provider = attempt.provider;
      providerTxnId = attempt.providerTxnId;
    }
    const result = await recordTransition(tx, milestone, target, actor.id, provider, providerTxnId, note);
    return { success: true, status: target, ...(target === 'DISPUTED' ? {} : { mode: 'sandbox' }), ...result };
  });
}
