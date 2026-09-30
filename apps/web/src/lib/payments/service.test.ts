import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), lock: vi.fn(), milestoneFind: vi.fn(), milestoneUnique: vi.fn(), milestoneUpdate: vi.fn(),
  attemptFind: vi.fn(), attemptUnique: vi.fn(), attemptCreate: vi.fn(), attemptUpdate: vi.fn(), ledger: vi.fn(), receipt: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }));
import { initiatePayment, reconcilePayment, transitionEscrow } from './service';
const actor = { id: 'student', role: 'STUDENT' as const };
const admin = { id: 'admin', role: 'ADMIN' as const };
const milestone = { id: 'milestone', status: 'PENDING', amountPoisha: BigInt(10000), application: { studentId: 'student' } };
const callback = { provider: 'BKASH' as const, providerTxnId: 'ee30cd3f-25de-433f-917e-a16c6ad5cac9',
  milestoneId: 'milestone', amountPoisha: '10000', currency: 'BDT' as const, status: 'VALID' as const };
const attempt = { id: 'attempt', provider: 'SANDBOX_BKASH', providerTxnId: callback.providerTxnId,
  milestoneId: 'milestone', amountPoisha: BigInt(10000), currency: 'BDT', status: 'INITIATED', expiresAt: new Date(Date.now() + 60000) };
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('ETHOS_PAYMENT_MODE', 'sandbox');
  vi.stubEnv('ETHOS_PAYMENT_SANDBOX_SECRET', 'test-only-payment-secret-at-least-32-characters');
  mocks.transaction.mockImplementation(async callback => callback({ $queryRaw: mocks.lock,
    milestone: { findFirst: mocks.milestoneFind, findUnique: mocks.milestoneUnique, updateMany: mocks.milestoneUpdate },
    paymentAttempt: { findFirst: mocks.attemptFind, findUnique: mocks.attemptUnique, create: mocks.attemptCreate, updateMany: mocks.attemptUpdate },
    ledgerEntry: { create: mocks.ledger }, receipt: { create: mocks.receipt },
  }));
  mocks.milestoneFind.mockResolvedValue(milestone); mocks.milestoneUnique.mockResolvedValue(milestone);
  mocks.attemptUnique.mockResolvedValue(attempt); mocks.attemptFind.mockResolvedValue(null);
  mocks.attemptCreate.mockResolvedValue(attempt); mocks.milestoneUpdate.mockResolvedValue({ count: 1 });
  mocks.attemptUpdate.mockResolvedValue({ count: 1 }); mocks.ledger.mockImplementation(async ({ data }) => data);
  mocks.receipt.mockImplementation(async ({ data }) => data);
});
describe('durable escrow service boundaries', () => {
  it('initiates a durable attempt using the database amount and never holds funds', async () => {
    expect(await initiatePayment('milestone', 'BKASH', actor)).toMatchObject({ status: 'INITIATED', mode: 'sandbox' });
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.attemptCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ amountPoisha: BigInt(10000), provider: 'SANDBOX_BKASH' }) });
    expect(mocks.milestoneUpdate).not.toHaveBeenCalled(); expect(mocks.ledger).not.toHaveBeenCalled();
  });
  it('reuses an active attempt and rejects conflicting providers', async () => {
    mocks.attemptFind.mockResolvedValue(attempt);
    await initiatePayment('milestone', 'BKASH', actor); expect(mocks.attemptCreate).not.toHaveBeenCalled();
    await expect(initiatePayment('milestone', 'NAGAD', actor)).rejects.toMatchObject({ code: 'PAYMENT_ATTEMPT_CONFLICT' });
  });
  it('denies other owners and nonstudent initiators before writing', async () => {
    mocks.milestoneFind.mockResolvedValue(null);
    await expect(initiatePayment('milestone', 'BKASH', actor)).rejects.toMatchObject({ status: 403 });
    expect(mocks.milestoneFind).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'milestone', application: { studentId: 'student' } } }));
    await expect(initiatePayment('milestone', 'BKASH', admin)).rejects.toMatchObject({ status: 403 });
    expect(mocks.attemptCreate).not.toHaveBeenCalled();
  });
  it('reconciles a matching callback into exactly one transactional hold and receipt', async () => {
    expect(await reconcilePayment(callback)).toMatchObject({ status: 'HELD' });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.milestoneUpdate).toHaveBeenCalledWith({ where: { id: 'milestone', status: 'PENDING', amountPoisha: BigInt(10000) }, data: { status: 'HELD' } });
    expect(mocks.ledger).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'HOLD', provider: 'SANDBOX_BKASH', providerTxnId: callback.providerTxnId }) });
    expect(mocks.receipt).toHaveBeenCalledOnce();
  });
  it('treats a duplicate callback as an idempotent no-op', async () => {
    mocks.attemptUnique.mockResolvedValue({ ...attempt, status: 'VALID' });
    expect(await reconcilePayment(callback)).toMatchObject({ success: true, duplicate: true });
    expect(mocks.attemptUpdate).not.toHaveBeenCalled(); expect(mocks.ledger).not.toHaveBeenCalled();
  });
  it('rejects unknown, amount, provider, currency and milestone mismatches', async () => {
    for (const record of [null, { ...attempt, amountPoisha: BigInt(9999) }, { ...attempt, provider: 'SANDBOX_NAGAD' },
      { ...attempt, currency: 'USD' }, { ...attempt, milestoneId: 'other' }]) {
      mocks.attemptUnique.mockResolvedValue(record);
      await expect(reconcilePayment(callback)).rejects.toMatchObject({ code: 'PAYMENT_MISMATCH' });
    }
    expect(mocks.attemptUpdate).not.toHaveBeenCalled(); expect(mocks.ledger).not.toHaveBeenCalled();
  });
  it('rejects expired and conflicting terminal callbacks', async () => {
    mocks.attemptUnique.mockResolvedValue({ ...attempt, expiresAt: new Date(0) });
    await expect(reconcilePayment(callback)).rejects.toMatchObject({ code: 'PAYMENT_CLOSED' });
    mocks.attemptUnique.mockResolvedValue({ ...attempt, status: 'FAILED' });
    await expect(reconcilePayment(callback)).rejects.toMatchObject({ code: 'PAYMENT_CLOSED' });
    expect(mocks.ledger).not.toHaveBeenCalled();
  });
  it('records failed and cancelled attempts without creating held funds', async () => {
    for (const status of ['FAILED', 'CANCELLED'] as const) expect(await reconcilePayment({ ...callback, status })).toMatchObject({ status });
    expect(mocks.milestoneUpdate).not.toHaveBeenCalled(); expect(mocks.ledger).not.toHaveBeenCalled();
  });
  it('does not write a ledger entry after losing a competing state transition', async () => {
    mocks.milestoneFind.mockResolvedValue({ ...milestone, status: 'HELD' });
    mocks.attemptFind.mockResolvedValue({ ...attempt, status: 'VALID' }); mocks.milestoneUpdate.mockResolvedValue({ count: 0 });
    await expect(transitionEscrow('milestone', 'RELEASED', actor)).rejects.toMatchObject({ code: 'ESCROW_CONFLICT' });
    expect(mocks.ledger).not.toHaveBeenCalled(); expect(mocks.receipt).not.toHaveBeenCalled();
  });
  it('requires admin for refunds, matching verified sandbox funding for settlements, and disputed state for admin resolutions', async () => {
    await expect(transitionEscrow('milestone', 'REFUNDED', actor)).rejects.toMatchObject({ status: 403 });
    mocks.milestoneFind.mockResolvedValue({ ...milestone, status: 'HELD' });
    await expect(transitionEscrow('milestone', 'RELEASED', actor)).rejects.toMatchObject({ code: 'SETTLEMENT_DISABLED' });
    await expect(transitionEscrow('milestone', 'REFUNDED', admin, 'resolution', true)).rejects.toMatchObject({ code: 'INVALID_ESCROW_TRANSITION' });
  });
  it('allows owned disputes without enabling live payments', async () => {
    vi.stubEnv('ETHOS_PAYMENT_MODE', 'disabled'); mocks.milestoneFind.mockResolvedValue({ ...milestone, status: 'HELD' });
    expect(await transitionEscrow('milestone', 'DISPUTED', actor, 'Evidence pending')).toMatchObject({ status: 'DISPUTED' });
    expect(mocks.receipt).not.toHaveBeenCalled();
    await expect(transitionEscrow('milestone', 'RELEASED', actor)).rejects.toMatchObject({ status: 503 });
  });
  it('propagates receipt failure out of the same transaction for rollback', async () => {
    mocks.receipt.mockRejectedValue(new Error('receipt failed'));
    await expect(reconcilePayment(callback)).rejects.toThrow('receipt failed');
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});
